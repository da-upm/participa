const Proposal = require('../models/proposal');
const User = require('../models/user');

const helpers = require('../helpers');

const getIndex = async (req, res, next) => {
    try {
        const rawProposals = await Proposal.find({ isDraft: false });
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
        const rawProposals = await Proposal.find({ isDraft: true });
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

module.exports = {
    getIndex,
    getProcess,
    getDates,
    getCandidates,
    getAdmin
}