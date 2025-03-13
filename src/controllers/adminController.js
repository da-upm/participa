const sanitizeHtml = require('sanitize-html');
const fs = require('node:fs');
const ObjectId = require('mongoose').Types.ObjectId;

const { BadRequestError, NotFoundError, InternalServerError } = require('../errors');

const Proposal = require('../models/proposal');
const User = require('../models/user');
const Question = require('../models/question');

const helpers = require('../helpers');
const Parameter = require('../models/parameter');

const Candidate = require('../models/candidate');
const TimelineSection = require('../models/timelineSection')


const getProposals = async (req, res, next) => {
    try {
        const categories = await helpers.retrieveCategories();

        const searchQuery = helpers.normalizeString(req.query.search || '');
        const categoriesQuery = Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories];
        const filteredCategories = categoriesQuery.filter(category => categories.hasOwnProperty(category));

        // Construir la consulta
        const query = {
            isDraft: true
        };

        // Si hay categorías en filteredCategories, agregarlas a la consulta
        if (filteredCategories.length > 0) {
            query.categories = { $in: filteredCategories };
        }

        // Buscar todos los documentos, luego filtrar manualmente
        const rawProposals = await Proposal.find(query).sort({ updatedAt: -1 });

        // Normalizar los títulos y descripciones antes de hacer la comparación
        const filteredProposals = rawProposals.filter(p => {
            const normalizedTitle = helpers.normalizeString(p.title.toLowerCase());
            const normalizedDescription = helpers.normalizeString(p.description.toLowerCase());

            return (
                normalizedTitle.includes(searchQuery.toLowerCase()) ||
                normalizedDescription.includes(searchQuery.toLowerCase())
            );
        });

        // Obtener supporters usando async/await
        const proposals = await Promise.all(
            filteredProposals.map(async (p) => {
                return {
                    ...p.toObject(),
                    supporters: await p.getSupportersCount(),
                    support: await p.getSupport(),
                    affiliations: await p.getAffiliationList(),
                    centres: await p.getCentreList()
                };
            })
        );

        res.status(200).render('fragments/admin/proposalRows', { layout: false, proposals, categories });
    } catch (error) {
        console.error("Error admin/getProposals:", error);
        return next(new InternalServerError("Ha ocurrido un error al realizar la búsqueda."));
    }
}

const getProposal = async (req, res, next) => {
    try {
        const proposal = await Proposal.findById(new ObjectId(req.params.id));
        proposal.supporters = await proposal.getSupportersCount();
        proposal.affiliations = await proposal.getAffiliationList();
        proposal.centres = await proposal.getCentreList();

        res.status(200).render('fragments/admin/proposalDetailModal', { layout: false, proposal });
    } catch (error) {
        console.error("Error admin/getProposals:", error);
        return next(new InternalServerError("Ha ocurrido un error al realizar la búsqueda."));
    }
}

const getProposalForm = async (req, res, next) => {
    try {
        const { proposalIds } = req.query;

        // Busca las propuestas que coincidan con los IDs proporcionados
        const draftProposals = await Proposal.find({ _id: { $in: proposalIds } });

        // Renderiza la vista del modal con las propuestas y categorías encontradas
        res.status(200).render('fragments/proposalDraftModal', {
            layout: false,
            draftProposals,
            admin: true
        });

    } catch (error) {
        console.error("Error admin/getProposalForm:", error);
        return next(new InternalServerError("Ha ocurrido un error al obtener el formulario."));
    }
};

const sendProposal = async (req, res, next) => {
    try {
        // Comprobar y sanitizar los datos de entrada
        if (!req.body.title || req.body.title.trim() === "") {
            console.error('Error en sendProposalAsDraft:');
            console.error(`El usuario ${req.session.user.id} ha intentado enviar una propuesta sin título.`)
            return next(new BadRequestError("La propuesta debe contener un título."));
        }

        if (!req.body.description || req.body.description.trim() === "") {
            console.error('Error en sendProposalAsDraft:');
            console.error(`El usuario ${req.session.user.id} ha intentado enviar una propuesta sin descripción.`)
            return next(new BadRequestError("La propuesta debe contener una descripción."));
        }

        const sanitizedDescription = sanitizeHtml(req.body.description, {
            allowedTags: ['p', 'br', 'b', 'i', 'u', 'ul', 'ol', 'li'],
            allowedAttributes: {}
        });

        const categories = await helpers.retrieveCategories();

        const receivedCategories = typeof req.body.categories === 'object' ? req.body.categories : [req.body.categories]

        const filteredCategories = receivedCategories.filter(category => categories.hasOwnProperty(category));

        if (filteredCategories.length < 1) {
            console.error('Error en sendProposalAsDraft:');
            console.error(`El usuario ${req.session.user.id} ha intentado enviar una propuesta sin categorías o con categorías inválidas: ${req.body.categories}.`)
            return next(new BadRequestError("La propuesta debe contener al menos una categoría de las disponibles."));
        }

        // Busca las propuestas que coincidan con los IDs proporcionados
        const draftProposals = await Proposal.find({ _id: { $in: req.body.draftIds } });

        // Recopilar todas las versiones anteriores de las propuestas de borrador
        const olderVersions = draftProposals.reduce((versions, draft) => {
            if (draft.olderVersions && draft.olderVersions.length > 0) {
                versions.push(...draft.olderVersions.map(version => {
                    const { olderVersions, ...rest } = version.toObject ? version.toObject() : version;
                    return rest;
                }));
            }
            const { olderVersions, ...rest } = draft.toObject();
            versions.push(rest);
            return versions;
        }, []);

        const proposalData = {
            title: sanitizeHtml(req.body.title, { allowedTags: [], allowedAttributes: {} }),
            description: sanitizedDescription,
            categories: filteredCategories,
            isDraft: false,
            usersDrafting: draftProposals.reduce((authors, draft) => authors.concat(draft.usersDrafting), []),
            olderVersions: olderVersions,
        }

        const newProposal = new Proposal(proposalData);
        newProposal.save();

        // Eliminar las propuestas de borrador
        for (const draft of draftProposals) {
            await Proposal.findByIdAndDelete(draft._id);
        }

        for (const user of proposalData.usersDrafting) {
            const userDocument = await User.findById(user);
            userDocument.supportedProposals.push(newProposal._id.toString());

            try {
                await userDocument.save();
            } catch (error) {
                return next(new InternalServerError("Ha ocurrido un error al guardar la propuesta al usuario."));
            }

            // Enviar notificación
            const emailTemplate = 'emails/draftApproved';
            const emailData = {
                name: userDocument.name,
                proposal: newProposal
            };

            const emailHtml = await new Promise((resolve, reject) => {
                res.render(emailTemplate, { ...emailData, layout: false }, (err, html) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(html);
                    }
                });
            });

            try {
                helpers.sendDraftApprovedMail(userDocument.email, emailHtml);
            } catch (error) {
                console.error('Error en proposal/sendProposal: ' + error.message)
                req.toastr.error("Ha ocurrido un error al enviar el correo de confirmación..");
            }

            req.toastr.success(`Propuesta "${newProposal.title}" enviada correctamente.`);
            return res.status(200).render('fragments/toastr', { layout: false, req: req });
        }

    } catch (error) {
        console.error('Error en admin/sendProposal: ' + error.message);
        return next(new InternalServerError("Ha ocurrido un error al enviar la propuesta."));
    }
}

const getRejectForm = async (req, res, next) => {
    try {
        const proposal = await Proposal.findById(new ObjectId(req.query.proposalIds));
        proposal.affiliations = await proposal.getAffiliationList();
        proposal.centres = await proposal.getCentreList();

        const proponent = await User.findById(proposal.usersDrafting[0]);

        res.status(200).render('fragments/admin/proposalRejectForm', { layout: false, proposal, proponent });
    } catch (error) {
        console.error("Error admin/getRejectForm:", error);
        return next(new InternalServerError("Ha ocurrido un error al obtener el formulario."));
    }
};

const rejectProposal = async (req, res, next) => {
    try {
        const proposal = await Proposal.findById(new ObjectId(req.params.id));
        const proponent = await User.findById(proposal.usersDrafting[0]);

        if (!req.query.reason || req.query.reason.trim() === "") {
            console.error('Error en rejectProposal:');
            console.error(`El usuario ${req.session.user.id} ha intentado rechazar una propuesta sin motivo.`)
            return next(new BadRequestError("El rechazo debe contener un motivo."));
        }

        const sanitizedReason = sanitizeHtml(req.query.reason, {
            allowedTags: ['p', 'br', 'b', 'i', 'u', 'ul', 'ol', 'li'],
            allowedAttributes: {}
        });


        // Enviar notificación
        const emailTemplate = 'emails/draftRejected';
        const emailData = {
            name: proponent.name,
            proposal: proposal,
            reason: sanitizedReason
        };

        const emailHtml = await new Promise((resolve, reject) => {
            res.render(emailTemplate, { ...emailData, layout: false }, (err, html) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(html);
                }
            });
        });

        helpers.sendDraftRejectedMail(proponent.email, emailHtml);

        await Proposal.findByIdAndDelete(proposal._id);

        req.toastr.success(`Propuesta rechazada correctamente.`);
        return res.status(200).render('fragments/toastr', { layout: false, req: req });
    } catch (error) {
        console.error("Error admin/rejectProposal:", error);
        return next(new InternalServerError("Ha ocurrido un error al rechazar la propuesta."));
    }
}

const deleteQuestions = async (req, res, next) => {
    try {
        const { questionIds } = req.query;
        console.log(questionIds);
        if (!questionIds || questionIds.length === 0) {
            return next(new BadRequestError('No se han proporcionado IDs de preguntas para eliminar.'));
        }
        await Question.deleteMany({ _id: { $in: questionIds } });

        // Recargar solo las filas de la tabla de preguntas después de la eliminación
        const questions = await Question.find().sort({ timestamp: -1 });
        res.status(200).render('fragments/admin/questionRows', { layout: false, questions });
    } catch (error) {
        console.error('Error en question/deleteQuestions: ' + error.message);
        return next(new InternalServerError('Error al eliminar las preguntas.'));
    }
};


const changeFeatureFlag = async (req, res, next) => {
    try {
        const feature = req.params.feature;
        const value = req.method === 'PUT';

        const parameter = await Parameter.findOne();

        if (!parameter) {
            return next(new InternalServerError('No se ha encontrado el documento de parámetros.'));
        }
        
        if (parameter.featureFlags[feature] === undefined) {
            return next(new BadRequestError('La característica solicitada no existe.'));
        }

        if (parameter.featureFlags[feature] === value) {
            req.toastr.warning(`La característica solicitada ya está ${value ? 'activada' : 'desactivada'}.`);
            return res.status(409).render('fragments/toastr', { layout: false, req: req });
        }

        parameter.featureFlags[feature] = value;
        parameter.markModified('featureFlags');
        await parameter.save();

        req.toastr.success(`Característica "${feature}" actualizada correctamente.`);
        res.setHeader(
			'Hx-Refresh',
			`true`
		);
        return res.status(200).render('fragments/admin/featureRow', { layout: false, flag: feature, featureValue: value })
    } catch (error) {
        console.error('Error en admin/changeFeatureFlag: ' + error.message);
        req.toastr.error('Error al cambiar el estado de la característica.');
        return next(new InternalServerError('Error al cambiar el estado de la característica.'));
    }
};

const changeColors = async (req, res, next) => {
    try {
        const { primaryColor, secondaryColor, primaryButtonColor, secondaryButtonColor } = req.body;

        if (!primaryColor || !secondaryColor || !primaryButtonColor|| !secondaryButtonColor) {
            return next(new BadRequestError('Se deben proporcionar todos los colores.'));
        }

        if (!/^#[0-9A-F]{6}$/i.test(primaryColor) || !/^#[0-9A-F]{6}$/i.test(secondaryColor) || !/^#[0-9A-F]{6}$/i.test(primaryButtonColor) || !/^#[0-9A-F]{6}$/i.test(secondaryButtonColor)) {
            return next(new BadRequestError('Los colores proporcionados no son válidos.'));
        }

        try {
            const parameter = await Parameter.findOne();
            if (!parameter) {
                return next(new InternalServerError('No se ha encontrado el documento de parámetros.'));
            }

            parameter.colors.primary = primaryColor;
            parameter.colors.secondary = secondaryColor;
            parameter.colors.primaryButton = primaryButtonColor;
            parameter.colors.secondaryButton = secondaryButtonColor;
          
            parameter.markModified('colors');
            await parameter.save();
        } catch (error) {
            return next(new InternalServerError('Error al guardar los colores en la base de datos.'));
        }

        res.locals.colors = { primary: primaryColor, secondary: secondaryColor, primaryButton: primaryButtonColor, secondaryButton: secondaryButtonColor };


        req.toastr.success('Colores de la página actualizados correctamente.');
        res.setHeader(
            'Hx-Refresh',
            `true`
        );
        return res.status(200).render('fragments/toastr', { layout: false, req: req });
    } catch (error) {
        console.error('Error en admin/changeColors: ' + error.message);
        req.toastr.error('Error al cambiar los colores de la página.');
        return next(new InternalServerError('Error al cambiar los colores de la página.'))
    }
}

const changeText = async (req, res, next) => {
    try {
        const currentParameter = await Parameter.findOne();
        if (!currentParameter) {
            return next(new InternalServerError('No se ha encontrado el documento de parámetros.'));
        }

        const texts = {
            pageTitle: req.body.pageTitle,
            headerTitle: req.body.headerTitle,
            headerSubtitle: req.body.headerSubtitle,
            delegationName: req.body.delegationName,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            web: req.body.web,
            emailElections: req.body.emailElections,
            socialMedia: []
        };

        // 3. Validar campos requeridos
        for (const key in texts) {
            if (!texts[key] && key !== 'socialMedia') {
                req.toastr.warning(`El campo "${key}" no puede estar vacío.`);
                return res.status(400).render('fragments/toastr', { layout: false, req: req });
            }
        }

        // 4. Procesar redes sociales
        if (req.body.socialMedia) {
            const socialMediaArray = Array.isArray(req.body.socialMedia) ? 
                req.body.socialMedia : [req.body.socialMedia];

            texts.socialMedia = socialMediaArray
                .filter(media => media.link && media.icon && media.name)
                .map(media => {
                    if (!/^https?:\/\/.+\..+/.test(media.link)) {
                        throw new BadRequestError('Las URLs de las redes sociales no son válidas.');
                    }
                    return {
                        icon: media.icon,
                        name: media.name,
                        link: media.link
                    };
                });
        }

        const newParameter = new Parameter({
            ...currentParameter.toObject(),
            text: texts
        });

        await Parameter.findByIdAndDelete(currentParameter._id);

        const savedParameter = await newParameter.save();

        if (!savedParameter) {
            req.toastr.error('Error al guardar los textos en la base de datos.');
            return next(new InternalServerError('Error al guardar los textos en la base de datos.'));
        }

        res.locals.texts = texts;
        req.toastr.success('Textos de la página actualizados correctamente.');
        res.setHeader('HX-Refresh', 'true');
        return res.status(200).render('fragments/toastr', { layout: false, req: req });

    } catch (error) {
        console.error('Error en admin/changeText:', error);
        req.toastr.error('Error al guardar los textos en la base de datos.');
        return next(new InternalServerError('Error al guardar los textos en la base de datos.'));
    }
};

const changeCandidate = async (req, res, next) => {
    try {
        const candidateId = req.body._id;
        if (!candidateId) {
            return next(new BadRequestError('No se ha proporcionado el ID del candidato.'));
        }

        const updateData = {
            name: sanitizeHtml(req.body.name || 'Nombre', { allowedTags: [], allowedAttributes: {} }),
            surname: sanitizeHtml(req.body.surname || 'Apellidos', { allowedTags: [], allowedAttributes: {} }),
            email: sanitizeHtml(req.body.email || '', { allowedTags: [], allowedAttributes: {} }),
            username: sanitizeHtml(req.body.username || '', { allowedTags: [], allowedAttributes: {} }),
            imageURL: sanitizeHtml(req.body.imageURL || './img/Default.png', { allowedTags: [], allowedAttributes: {} }),
            surrogateUsers: Array.isArray(req.body.surrogateUsers) ? req.body.surrogateUsers : [],
            programUrl: sanitizeHtml(req.body.programUrl || '', { allowedTags: [], allowedAttributes: {} }),
            details: {
                "Antigüedad en la UPM": sanitizeHtml(req.body.details?.["Antigüedad en la UPM"] || '', { allowedTags: [], allowedAttributes: {} }),
                "Estudios": sanitizeHtml(req.body.details?.["Estudios"] || '', { allowedTags: [], allowedAttributes: {} }),
                "Centro": sanitizeHtml(req.body.details?.["Centro"] || '', { allowedTags: [], allowedAttributes: {} }),
                "Departamento": sanitizeHtml(req.body.details?.["Departamento"] || '', { allowedTags: [], allowedAttributes: {} }),
                "Área de Conocimiento": sanitizeHtml(req.body.details?.["Área de Conocimiento"] || '', { allowedTags: [], allowedAttributes: {} }),
                "Categoría Docente": sanitizeHtml(req.body.details?.["Categoría Docente"] || '', { allowedTags: [], allowedAttributes: {} })
            }
        };

        // Handle social media array
        if (req.body.socialMedia) {
            updateData.socialMedia = Array.isArray(req.body.socialMedia) ? 
                req.body.socialMedia.map(media => ({
                    icon: sanitizeHtml(media.icon || '', { allowedTags: [], allowedAttributes: {} }),
                    url: sanitizeHtml(media.url || '', { allowedTags: [], allowedAttributes: {} })
                })) : [];
        }

        const updatedCandidate = await Candidate.findByIdAndUpdate(
            candidateId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedCandidate) {
            return next(new NotFoundError('No se ha encontrado el candidato.'));
        }

        req.toastr.success(`Candidato "${updatedCandidate.name}" actualizado correctamente.`);
        return res.status(200).render('fragments/admin/candidateForms/candidateForm', {
            candidate: updatedCandidate,
            layout: false
        });

    } catch (error) {
        console.error('Error en changeCandidate:', error);
        return next(new InternalServerError('Error al actualizar el candidato.'));
    }
};

const createNewCandidate = async (req, res, next) => {
    try {
        const newCandidate = new Candidate({
            name: "Nuevo Candidato",
            surname: "Apellidos",
            email: "email@email.com",
            username: "nombredeusuario",
            imageURL: "./img/Default.png",
            surrogateUsers: [],
            socialMedia: [],
            details: {
                "Antigüedad en la UPM": "",
                "Estudios": "",
                "Centro": "",
                "Departamento": "",
                "Área de Conocimiento": "",
                "Categoría Docente": ""
            },
            programUrl: ""
        });

        const savedCandidate = await newCandidate.save();

        if (!savedCandidate) {
            return next(new InternalServerError('Error al guardar el candidato en la base de datos'));
        }
        return res.render('fragments/admin/candidateForms/candidateForm', {
            candidate: savedCandidate,
            layout: false,
        });
    } catch (error) {
        console.error('Error en createNewCandidate:', error);
        return next(new InternalServerError('Error al crear el nuevo candidato'));
    }
};

const deleteCandidate = async (req, res, next) => {
    try {
        const candidateId = req.query._id;
        if (!candidateId) {
            return next(new BadRequestError('No se ha proporcionado el ID del candidato.'));
        }

        const deletedCandidate = await Candidate.findByIdAndDelete(candidateId);

        if (!deletedCandidate) {
            return next(new NotFoundError('No se ha encontrado el candidato.'));
        }

        req.toastr.success(`Candidato "${deletedCandidate.name}" eliminado correctamente.`);
        return res.status(200).send('');

    } catch (error) {
        console.error('Error en deleteCandidate:', error);
        return next(new InternalServerError('Error al eliminar el candidato.'));
    }
};

const createTimelineSection = async (req, res, next) => {
    try {
        const newSection = new TimelineSection({
            dateRange: 'Fecha',
            title: 'Título',
            content: 'Contenido',
            order: 0,
            buttons: []
        });

        const savedSection = await newSection.save();
        if (!savedSection) {
            return next(new InternalServerError('Error al guardar la sección.'));
        }
        req.toastr.success('Sección creada correctamente.');
        return res.render('fragments/admin/timelineSectionForm', {
            Section: savedSection,
            layout: false,
        });
    } catch (error) {
        console.error("Error in createTimelineSection:", error);
        return next(new InternalServerError('Error al crear la sección.'));
    }
};

const changeTimelineSection = async (req, res, next) => {
    try {
        const sectionId = req.body._id;
        if (!sectionId) {
            return next(new BadRequestError('No se ha proporcionado el ID de la sección.'));
        }

        const updateData = {
            dateRange: req.body.dateRange,
            title: req.body.title,
            content: req.body.content.replace(/&nbsp;/g, ' '),
            order: req.body.order
        };

        console.log('Request body:', req.body);

        if (req.body.buttons) {
            let buttons = Array.isArray(req.body.buttons)
              ? req.body.buttons
              : Object.values(req.body.buttons);
            
            buttons = buttons.filter(btn => btn.text && btn.url);
            
            updateData.buttons = buttons;
        } else {
            updateData.buttons = [];
        }

        const updatedSection = await TimelineSection.findByIdAndUpdate(
            sectionId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedSection) {
            return next(new NotFoundError('Sección no encontrada.'));
        }
        req.toastr.success('Sección actualizada correctamente.');
        return res.status(200).render('fragments/admin/timelineSectionForm', {
            Section: updatedSection,
            layout: false,
        });

    } catch (error) {
        console.error("Error in updateTimelineSection:", error);
        return next(new InternalServerError('Error al actualizar la sección.'));
    }
};

const deleteTimelineSection = async (req, res, next) => {
    try {
        const sectionId = req.query._id;
        if (!sectionId) {
            return next(new BadRequestError('No se ha proporcionado el ID de la sección.'));
        }

        const deletedSection = await TimelineSection.findByIdAndDelete(sectionId);
        if (!deletedSection) {
            return next(new NotFoundError('Sección no encontrada.'));
        }
        req.toastr.success('Sección eliminada correctamente.');
        return res.status(200).send('');
    } catch (error) {
        console.error("Error in deleteTimelineSection:", error);
        return next(new InternalServerError('Error al eliminar la sección.'));
    }
};

const getTimelinePreview = async (req, res, next)=> {
    try {
        const timelineSections = await TimelineSection.find().sort({ order: 1 });
        return res.render('fragments/admin/timelinePreview', {
            candidate: timelineSections,
            layout: false,
        });
    } catch (error) {
        console.error("Error in getTimelinePreview:", error);
        return next(new InternalServerError('Error al obtener la vista previa de la línea de tiempo.'));
    }
};

module.exports = {
    getProposals,
    getProposal,
    getProposalForm,
    sendProposal,
    getRejectForm,
    rejectProposal,
    deleteQuestions,
    changeFeatureFlag,
    changeColors,
    changeText,
    changeCandidate,
    createNewCandidate,
    deleteCandidate,
    createTimelineSection,
    changeTimelineSection,
    deleteTimelineSection,
    getTimelinePreview
};