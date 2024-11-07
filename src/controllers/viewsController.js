const Proposal = require('../models/proposal');
const User = require('../models/user');

const helpers = require('../helpers');

const getIndex = async (req, res, next) => {
    try {
        const rawProposals = await Proposal.find({ isDraft: false }).sort({ updatedAt: -1 });
        const proposals = await Promise.all(
            rawProposals.map(async (p) => {
                return {
                    ...p.toObject(),
                    supporters: await p.getSupportersCount(),
                    support: await p.getSupport(),
                    affiliations: await p.getAffiliationList(),
                    centres: await p.getCentreList()
                };
            })
        );
                
        res.status(200).render('index', { proposals, page:'index' })
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const getProcess = async (req, res, next) => {
        res.status(200).render('process', {page:'process'})
}

const getDates = async (req, res, next) => {
    res.status(200).render('dates', {page: 'dates'})
}

const getCandidates = async (req, res, next) => {
    res.status(200).render('candidates', {page: 'candidates'})
}

const getAdmin = async (req, res, next) => {
    try {
        const rawProposals = await Proposal.find({ isDraft: true }).sort({ updatedAt: -1 });
        const proposals = await Promise.all(
            rawProposals.map(async (p) => {
                return {
                    ...p.toObject(),
                    supporters: await p.getSupportersCount(),
                    affiliations: await p.getAffiliationList(),
                    centres: await p.getCentreList()
                };
            })
        );
        
        res.status(200).render('admin', { proposals })
    } catch (error) {
        res.status(404).json({ message: error.message });
    }}

// Función para obtener las estadísticas: número total de usuarios, número total de propuestas, número de propuestas borrador, número de propuestas publicadas, propuesta con más apoyos, número máximo de apoyos, número medio de apoyos, número de propuestas por centro, número de propuestas por afiliación.

const getStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProposals = await Proposal.countDocuments();
        const draftProposals = await Proposal.countDocuments({ isDraft: true });
        const publishedProposals = await Proposal.countDocuments({ isDraft: false });

        const proposals = await Proposal.find();
        const proposalWithMostSupport = proposals.reduce((max, proposal) => proposal.supporters > max.supporters ? proposal : max, proposals[0]);
        const maxSupport = proposalWithMostSupport ? proposalWithMostSupport.supporters : 0;
        const averageSupport = proposals.length ? proposals.reduce((sum, proposal) => sum + proposal.supporters, 0) / proposals.length : 0;

        const proposalsByCentre = await Proposal.aggregate([
            { $group: { _id: "$centre", count: { $sum: 1 } } }
        ]);

        const proposalsByAffiliation = await Proposal.aggregate([
            { $group: { _id: "$affiliation", count: { $sum: 1 } } }
        ]);

        res.status(200).render('stats', {
            totalUsers,
            totalProposals,
            draftProposals,
            publishedProposals,
            proposalWithMostSupport,
            maxSupport,
            averageSupport,
            proposalsByCentre,
            proposalsByAffiliation
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

module.exports = {
    getIndex,
    getProcess,
    getDates,
    getCandidates,
    getAdmin,
    getStats
}