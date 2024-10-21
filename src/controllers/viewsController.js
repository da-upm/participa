const Proposal = require('../models/proposal');
const User = require('../models/user');

const getIndex = async (req, res, next) => {
    try {
        const rawProposals = await Proposal.find({ isDraft: false });
        const proposals = await Promise.all(
            rawProposals.map(async (p) => {
                return {
                    ...p.toObject(),
                    supporters: await p.getSupportersCount()
                };
            })
        );
        res.status(200).render('index', { proposals })
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const getAdmin = async (req, res, next) => {
    res.status(200).render('admin');
}

module.exports = {
    getIndex,
    getAdmin
}