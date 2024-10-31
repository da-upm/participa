const sanitizeHtml = require('sanitize-html');
const ObjectId = require('mongoose').Types.ObjectId;

const { BadRequestError, NotFoundError, InternalServerError } = require('../errors');

const Proposal = require('../models/proposal');
const User = require('../models/user');

const helpers = require('../helpers');


const getProposals = async (req, res, next) => {
    try {
        const categories = await helpers.retrieveCategories();

        const searchQuery = helpers.normalizeString(req.query.search) || '';
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

        const categories = await helpers.retrieveCategories();

        // Renderiza la vista del modal con las propuestas y categorías encontradas
        res.status(200).render('fragments/proposalDraftModal', {
            layout: false,
            categories,
            draftProposals
        });

    } catch (error) {
        console.error("Error admin/getProposalForm:", error);
        return next(new InternalServerError("Ha ocurrido un error al obtener el formulario."));
    }
};

const sendProposal = async (req, res, next) => {
    try {
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

        // Busca las propuestas que coincidan con los IDs proporcionados
        const draftProposals = await Proposal.find({ _id: { $in: proposalIds } });

        const sanitizedDescription = sanitizeHtml(req.body.description, {
            allowedTags: ['b', 'i', 'u', 'ul', 'ol', 'li'],
            allowedAttributes: {}
        });

        const categories = await helpers.retrieveCategories();

        const fileteredCategories = req.body.categories.filter(category => categories.hasOwnProperty(category));

        if (fileteredCategories.length < 1) {
            console.error('Error en sendProposalAsDraft:');
            console.error(`El usuario ${req.session.user.id} ha intentado enviar una propuesta sin categorías o con categorías inválidas: ${req.body.categories}.`)
            return next(new BadRequestError("La propuesta debe contener al menos una categoría de las disponibles."));
        }

        const proposalData = {
            title: sanitizeHtml(req.body.title, { allowedTags: [], allowedAttributes: {} }),
            description: sanitizedDescription,
            categories: fileteredCategories,
            isDraft: false,
            usersDrafting: draftProposals.reduce((authors, draft) => authors.concat(draft.usersDrafting), []),
            olderVersions: draftProposals,
        }
        for (const user of proposalData.usersDrafting) {
            const userDocument = await User.findById(user);
            userDocument.supportedProposals.push(newProposal);
            try {
                await userDocument.save();
            } catch (error) {
                return next(new InternalServerError("Ha ocurrido un error al guardar la propuesta al usuario."));
            }
            // Enviar notificación
            helpers.sendDraftApprovedMail(userDocument.email, `Tu propuesta "${newProposal.title}" ha sido aceptada.`);
        }

        const newProposal = new Proposal(proposalData);
        newProposal.save();

    } catch (error) {
        console.error('Error en proposal/sendProposalAsDraft: ' + error.message);
        return next(new InternalServerError("Ha ocurrido un error al enviar la propuesta."));
    }
}

module.exports = {
    getProposals,
    getProposal,
    getProposalForm,
    sendProposal
}