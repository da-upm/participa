const sanitizeHtml = require('sanitize-html');
const ObjectId = require('mongoose').Types.ObjectId;

const { BadRequestError, NotFoundError, InternalServerError } = require('../errors');

const Proposal = require('../models/proposal');
const User = require('../models/user');

const helpers = require('../helpers');


const getProposals = async (req, res, next) => {
    try {
        const categories = await helpers.retrieveCategories();

        const searchQuery = helpers.normalizeString(req.query.search  || '');
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
        const rawProposals = await Proposal.find(query);

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

            req.toastr.success(`Propuesta "${newProposal.title}" enviada correctamente`);
            return res.status(200).render('fragments/toastr', { layout: false, req: req });
        }

    } catch (error) {
        console.error('Error en admin/sendProposal: ' + error.message);
        return next(new InternalServerError("Ha ocurrido un error al enviar la propuesta."));
    }
}

module.exports = {
    getProposals,
    getProposal,
    getProposalForm,
    sendProposal
}