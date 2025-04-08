const Proposal = require('../models/proposal');
const User = require('../models/user');
const Candidate = require('../models/candidate');
const Question = require('../models/question');
const Result = require('../models/result');


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

const getTimeline = async (req, res, next) => {
    res.status(200).render('timeline', {page: 'timelineSections'})
}

const getCandidates = async (req, res, next) => {
    res.status(200).render('candidates', {page: 'candidates'})
}

const getResults = async (req, res, next) => {
    const weighings = await helpers.retrieveWeighings();
    const results = await Result.find();
    const showTotalResults = await helpers.retrieveShowTotalResults();

    const transformedResults = results.reduce((acc, result) => {
        // Initialize if not exists
        ['groupA', 'groupB', 'groupC', 'groupD'].forEach(group => {
            if (!acc[group]) acc[group] = {};
            acc[group][result.name] = result.votes[group];
        });
        
        // Calculate weighted total based on percentage of votes in each group
        if (!acc.total) acc.total = {};
        if (req.session.user?.isAdmin || showTotalResults) {
            acc.total[result.name] = Number(['groupA', 'groupB', 'groupC', 'groupD'].reduce((sum, group) => {
            // Calculate total votes in this group
            const groupTotal = results.reduce((total, r) => total + r.votes[group], 0);
            // Calculate percentage of votes for this candidate in this group
            const percentage = groupTotal > 0 ? (result.votes[group] / groupTotal) * 100 : 0;
            // Add weighted percentage to sum
            return sum + (percentage * weighings[group]);
            }, 0).toFixed(2));
        } else {
            acc.total[result.name] = 0;
        }
        
        return acc;
    }, {});

    const colors = {};
    const hexToRgb = hex => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${r},${g},${b})`;
    };

    results.forEach(result => {
        colors[result.name] = hexToRgb(result.color);
    });
    
    res.status(200).render('results', {page: 'results', results: transformedResults, resultColors: colors})
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
        res.status(200).render('admin/adminDashboard');
}

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

        res.status(200).render('admin/stats', {
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

// Obtener las featureFlags de la base de datos, y renderizar la vista nav-menu con las flags.
// Aqui nav-menu se usa como fragment, por lo que se renderiza sin layout. Es necesario para en caso de desactivar una featureFlag,
// se actualice la vista sin necesidad de recargar la página.

const getNavMenu = async (req, res, next) => {
    try {
        const featureFlags = await helpers.retrieveFeatureFlags();
        res.status(200).render('nav-menu', { layout: false, featureFlags });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const getAesthetics = async (req, res, next) => {
    try {
        let featureFlags = await helpers.retrieveFeatureFlags();
        let colors = await helpers.retrieveColors();
        res.status(200).render('admin/aesthetics', { page: 'aesthetics', featureFlags, colors });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const getProposalsAdmin = async (req, res, next) => {
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
        
        res.status(200).render('admin/proposalsAdmin', { proposals, questions, affiliations });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const getCandidatesAdmin = async (req, res, next) => {
    res.status(200).render('admin/candidatesAdmin', {page: 'candidates'})
}


const getResultsAdmin = async (req, res, next) => {
    const results = await Result.find();

    res.status(200).render('admin/resultsAdmin', {page: 'results', results})
}

const getTimelineAdmin = async (req, res, next) => {
    res.status(200).render('admin/timelineAdmin', {page: 'timelineSections'})
}

const getProposalsRanking = async (req, res, next) => {
    try {
        // Obtener todas las propuestas que no son borradores
        const rawProposals = await Proposal.find({ isDraft: false }).sort({ updatedAt: -1 });
        
        // Enriquecer cada propuesta con información de soporte
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
        
        // Ordenar las propuestas por número de apoyos (de mayor a menor)
        const sortedProposals = proposals.sort((a, b) => b.supporters - a.supporters);
        
        res.status(200).render('admin/proposalsRanking', { 
            proposals: sortedProposals,
            title: 'Ranking de Propuestas'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getIndex,
    getProcess,
    getTimeline,
    getCandidates,
    getResults,
    getCommitments,
    getCandidateCommitments,
    getAdmin,
    getStats,
    getQuestions,
    getNavMenu,
    getAesthetics,
    getProposalsAdmin,
    getCandidatesAdmin,
    getTimelineAdmin,
    getProposalsRanking,
    getResultsAdmin
}