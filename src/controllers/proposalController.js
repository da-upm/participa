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
        res.status(200).render('fragments/proposalDetailModal', {layout: false, proposal});
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
        const proposal = await Proposal
            .findById(new ObjectId(proposalId))
            .select('supporters');
        
        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        const user = req.session.user

        if (user.supportedProposals.includes(proposal.id)) {
            return res.status(409).json({ message: 'User already supports this proposal' });
        }
        proposal.supporters += 1;
        user.supportedProposals.push(proposal.id);
        await proposal.save();
        await user.save();
        res.status(200).render('fragments/supportingButton', {layout: false, proposal});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const removeSupporter = async (req, res) => {
    try {
        const proposalId = req.params.id;
        const proposal = await Proposal
            .findById(new ObjectId(proposalId))
            .select('supporters');
        
        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        const user = req.session.user

        if (!user.supportedProposals.includes(proposal.id)) {
            return res.status(409).json({ message: 'User does not support this proposal' });
        }
        proposal.supporters -= 1;
        user.supportedProposals.pop(proposal.id);
        await proposal.save();
        await user.save();
        res.status(200).render('fragments/supportButton', {layout: false, proposal});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const sendProposalAsDraft = async (req, res) => {
    try {
        const proposalData = req.body;
        proposalData.isDraft = true;
        proposalData.usersDrafting = [req.query.userId];
        const newProposal = new proposal(proposalData);
        newProposal.save();
    } catch (error) {
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
        const proposalId = req.params.id;
        const proposal = await proposal.findById(proposalId)
        proposal.isDraft = undefined;
        const usersDrafting = proposal.usersDrafting;
        usersDrafting.forEach(async (userId) => {
            const user = await user.findById(userId);
            user.supportedProposals.push(proposalId);
            user.save();
        });
        proposal.usersDrafting = undefined;
        proposal.save();
        res.status(200).json({ message: 'Draft proposal approved' });
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
    sendProposalAsDraft,
    getDraftProposals,
    deleteDraftProposal,
    approveDraftProposal
}