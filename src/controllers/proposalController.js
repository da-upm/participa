const Proposal = require('../models/proposal');
const User = require('../models/user');

const ObjectId = require('mongoose').Types.ObjectId;

const createProposal = async (req, res) => {
    try {
        const newProposal = new Proposal(req.body);
        await newProposal.save();
        res.status(201).json(newProposal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const getProposals = async (req, res) => {
    try {
        const proposals = await Proposal.find();
        res.status(200).json(proposals);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const getProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findById(new ObjectId(req.params.id));
        proposal.supporters = await proposal.getSupportersCount();

        res.status(200).render('fragments/proposalDetailModal', { layout: false, proposal });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const deleteProposal = async (req, res) => {
    try {
        await proposal.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Proposal deleted' });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const getProposalByCategory = async (req, res) => {
    try {
        const proposals = await proposal.find({ categories: req.params.category });
        res.status(200).json(proposals);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const getProposalsCategories = async (req, res) => {
    try {
        const categories = await proposal.distinct('categories');
        res.status(200).json(categories);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const addSupporter = async (req, res) => {
    try {
        const proposalId = req.params.id;
        const rawProposal = await Proposal
            .findById(new ObjectId(proposalId));
        if (!rawProposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        const user = req.session.user

        if (user.supportedProposals.includes(rawProposal.id)) {
            return res.status(409).json({ message: 'User already supports this proposal' });
        }

        user.supportedProposals.push(rawProposal.id);
        await user.save();

        const proposal = {
            ...rawProposal.toObject(),
            supporters: await rawProposal.getSupportersCount()
        }

        res.locals.user = req.session.user;
        res.status(200).render('fragments/proposalCard', { layout: false, proposal });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const removeSupporter = async (req, res) => {
    try {
        const proposalId = req.params.id;
        const rawProposal = await Proposal
            .findById(new ObjectId(proposalId));
        if (!rawProposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        const user = req.session.user

        if (!user.supportedProposals.includes(rawProposal.id)) {
            return res.status(409).json({ message: 'User does not support this proposal' });
        }

        user.supportedProposals.splice(user.supportedProposals.indexOf(new ObjectId(rawProposal.id)), 1);
        await rawProposal.save();
        await user.save();

        const proposal = {
            ...rawProposal.toObject(),
            supporters: await rawProposal.getSupportersCount()
        }

        res.locals.user = req.session.user;
        res.status(200).render('fragments/proposalCard', { layout: false, proposal });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getDraftForm = (req, res) => {
    res.status(200).render('fragments/proposalDraftModal', { layout: false });
}

const sendProposalAsDraft = async (req, res) => {
    console.log(req.body);
    try {
        const proposalData = {
            title: req.body.title,
            description: req.body.description,
            categories: req.body.categories,
            isDraft: true,
            usersDrafting: req.session.user.id,
        }

        const newProposal = new Proposal(proposalData);
        newProposal.save();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const getDraftProposals = async (req, res) => {
    try {
        const proposals = await proposal.find({ isDraft: true });
        res.status(200).json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const deleteDraftProposal = async (req, res) => {
    try {
        await proposal.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Draft proposal deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const approveDraftProposal = async (req, res) => {
    try {
        let userProposing = new Set();
        let deleteProposals = req.body.deleteProposals;
         for (let proposalId of deleteProposals) {
            const proposal = await proposal.findById(proposalId);
            userProposing.add(proposal.usersDrafting);
            await proposal.findByIdAndDelete(proposalId);
        }
        const newProposal = new proposal(req.body);
        newProposal.isDraft = false;
        newProposal.usersDrafting = userProposing;
        await newProposal.save();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createProposal,
    getProposals,
    getProposal,
    deleteProposal,
    getProposalByCategory,
    getProposalsCategories,
    addSupporter,
    removeSupporter,
    getDraftForm,
    sendProposalAsDraft,
    getDraftProposals,
    deleteDraftProposal,
    approveDraftProposal
}