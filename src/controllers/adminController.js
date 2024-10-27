const sanitizeHtml = require('sanitize-html');

const Proposal = require('../models/proposal');
const User = require('../models/user');

const helpers = require('../helpers');

const ObjectId = require('mongoose').Types.ObjectId;

// Función para eliminar acentos
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const getProposals = async (req, res) => {
    const searchQuery = normalizeString(req.query.search) || '';
    const filterCategories = req.query.categories || [];

    // Construir la consulta
    const query = {
        isDraft: true
    };

    // Si hay categorías en filterCategories, agregarlas a la consulta
    if (filterCategories.length > 0) {
        query.categories = { $in: filterCategories };
    }

    try {
        // Buscar todos los documentos, luego filtrar manualmente
        const rawProposals = await Proposal.find(query);

        // Normalizar los títulos y descripciones antes de hacer la comparación
        const filteredProposals = rawProposals.filter(p => {
            const normalizedTitle = normalizeString(p.title.toLowerCase());
            const normalizedDescription = normalizeString(p.description.toLowerCase());

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

        const categories = await helpers.retrieveCategories();
        if (categories === null) res.status(500).redirect('/error');

        res.status(200).render('fragments/admin/proposalRows', { layout: false, proposals, categories });
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        res.status(404).json({ message: error.message });
    }
}

const getProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findById(new ObjectId(req.params.id));
        proposal.supporters = await proposal.getSupportersCount();

        res.status(200).render('fragments/admin/proposalDetailModal', { layout: false, proposal });
    } catch (error) {
        console.error(`No se encuentra propuesta ${proposalId} para el usuario ${req.session.user.id}.`)
        req.toastr.error("Propuesta no encontrada.");
        res.status(404).render('fragments/toastr', { layout: false, req: req });
    }
}

const getProposalForm = async (req, res) => {
    const categories = await helpers.retrieveCategories();
    if (categories === null) res.status(500).redirect('/error');

    res.status(200).render('fragments/proposalDraftModal', { layout: false, categories });
}

const sendProposal = async (req, res) => {
    const sanitizedDescription = sanitizeHtml(req.body.description, {
        allowedTags: ['b', 'i', 'u', 'ul', 'ol', 'li'],
        allowedAttributes: {}
    });

    try {
        const proposalData = {
            title: sanitizeHtml(req.body.title, { allowedTags: [], allowedAttributes: {} }),
            description: sanitizedDescription,
            categories: req.body.categories,
            isDraft: false,
            usersDrafting: req.session.user.id,
        }

        const newProposal = new Proposal(proposalData);
        newProposal.save();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getProposals,
    getProposal,
    getProposalForm,
    sendProposal
}