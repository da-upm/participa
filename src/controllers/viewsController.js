const Proposal = require('../models/proposal');
const User = require('../models/user');
const Candidate = require('../models/candidate');
const Question = require('../models/question');

const helpers = require('../helpers');

const { NotFoundError, InternalServerError } = require('../errors');

const getIndex = async (req, res, next) => {
    try {
        const publishedProposals = await Proposal.countDocuments({ isDraft: false });
                
        res.status(200).render('index', { page:'index', publishedProposals });
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

const getQuestions = async (req, res, next) => {
    const user = req.session.user;
    res.render('questions');
};

const getCommitments = async (req, res, next) => {
    const user = req.session.user;
    const candidate = req.session.candidate;

    res.status(200).render('commitments', { page: 'commitments', candidate})
}

const getCandidateCommitments = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate || !candidate.signedCommitmentsDoc) {
            return next(new NotFoundError('Compromisos no encontrados.'));
        }
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Compromisos ${candidate.name}.pdf`);
        res.send(candidate.signedCommitmentsDoc);
    } catch (error) {
        console.error(error)
        return next(new InternalServerError('Error al obtener los compromisos del candidato.'));
    }
}

const getAdmin = async (req, res, next) => {
    try {
        const rawProposals = await Proposal.find({ isDraft: true }).sort({ updatedAt: -1 });
        const questions = await Question.find().sort({ timestamp: -1 });
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

        const affiliations = await helpers.retrieveAffiliations();
        
        res.status(200).render('admin', { proposals, questions, affiliations });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }}

// Función para obtener las estadísticas: número total de usuarios, número total de propuestas, número de propuestas borrador, número de propuestas publicadas, propuesta con más apoyos, número máximo de apoyos, número medio de apoyos, número de propuestas por centro, número de propuestas por afiliación.
const getStats = async (_, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProposals = await Proposal.countDocuments();
        const draftProposals = await Proposal.countDocuments({ isDraft: true });
        const publishedProposals = await Proposal.countDocuments({ isDraft: false });

        const proposals = await Proposal.find();
        const proposalWithMostSupport = proposals.length ? await proposals.reduce(async (maxPromise, proposal) => {
            const max = await maxPromise;
            const supporters = await proposal.getSupportersCount();
            return supporters > max.supporters ? { proposal, supporters } : max;
        }, Promise.resolve({ proposal: proposals[0], supporters: await proposals[0].getSupportersCount() })) : null;
        const maxSupport = proposalWithMostSupport ? proposalWithMostSupport.supporters : 0;
        const averageSupport = proposals.length ? (await Promise.all(proposals.map(p => p.getSupportersCount()))).reduce((sum, supporters) => sum + supporters, 0) / proposals.length : 0;

        // proposalsByCentre es un objecto que contiene un mapa de los centros y el número total de propuestas que han sido creadas por cada centro.
        const proposalsByCentre = await proposals.reduce(async (accPromise, proposal) => {
            const acc = await accPromise;
            const centres = await proposal.getCentreList();
            centres.forEach(centre => {
                acc[centre] = acc[centre] ? acc[centre] + 1 : 1;
            });
            return acc;
        }, Promise.resolve({}));

        // proposalsByAffiliation es un objecto que contiene un mapa de las afiliaciones y el número total de propuestas que han sido creadas por cada afiliación.
        const proposalsByAffiliation = await proposals.reduce(async (accPromise, proposal) => {
            const acc = await accPromise;
            const affiliations = await proposal.getAffiliationList();
            affiliations.forEach(affiliation => {
                acc[affiliation] = acc[affiliation] ? acc[affiliation] + 1 : 1;
            });
            return acc;
        }, Promise.resolve({}));

        res.status(200).render('stats', {
            totalUsers,
            totalProposals,
            draftProposals,
            publishedProposals,
            proposalWithMostSupport: proposalWithMostSupport ? proposalWithMostSupport.proposal : null,
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
    getCommitments,
    getCandidateCommitments,
    getAdmin,
    getStats,
    getQuestions
}