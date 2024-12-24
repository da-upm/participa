const sanitizeHtml = require('sanitize-html');
const fs = require('node:fs');
const ObjectId = require('mongoose').Types.ObjectId;

const { BadRequestError, NotFoundError, InternalServerError } = require('../errors');

const Proposal = require('../models/proposal');
const User = require('../models/user');
const Question = require('../models/question');

const helpers = require('../helpers');
const Parameter = require('../models/parameter');


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
        const { primaryColor, secondaryColor } = req.body;

        if (!primaryColor || !secondaryColor) {
            return next(new BadRequestError('Se deben proporcionar ambos colores.'));
        }

        if (!/^#[0-9A-F]{6}$/i.test(primaryColor) || !/^#[0-9A-F]{6}$/i.test(secondaryColor)) {
            return next(new BadRequestError('Los colores proporcionados no son válidos.'));
        }

        const fileDir = 'src/templates/static/styles/styles.css';

        const file = fs.readFileSync(fileDir, 'utf8');
        
        const newFile = file.replace(/--primary-color: #\w+;/, `--primary-color: ${primaryColor};`);
        const newFile2 = newFile.replace(/--secondary-color: #\w+;/, `--secondary-color: ${secondaryColor};`);

        fs.writeFileSync(fileDir, newFile2);

        req.toastr.success('Colores de la página actualizados correctamente.');
        res.setHeader(
            'Hx-Refresh',
            `true`
        );
        return res.status(200).render('fragments/toastr', { layout: false, req: req });
    } catch (error) {
        console.error('Error en admin/setColorsOfPage: ' + error.message);
        req.toastr.error('Error al cambiar los colores de la página.');
        return next(new InternalServerError('Error al cambiar los colores de la página.'))
    }
}

module.exports = {
    getProposals,
    getProposal,
    getProposalForm,
    sendProposal,
    getRejectForm,
    rejectProposal,
    deleteQuestions,
    changeFeatureFlag,
    changeColors
};