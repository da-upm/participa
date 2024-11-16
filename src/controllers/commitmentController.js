const sanitizeHtml = require('sanitize-html');
const ObjectId = require('mongoose').Types.ObjectId;

const { BadRequestError, NotFoundError, InternalServerError } = require('../errors');

const Proposal = require('../models/proposal');
const User = require('../models/user');
const Commitment = require('../models/commitment');

const helpers = require('../helpers');

const getProposals = async (req, res, next) => {
    const user = req.session.user;
    const candidate = req.session.candidate;

    try {
        const rawProposals = await Proposal.find({ isDraft: false }).sort({ updatedAt: -1 });
        const proposals = await Promise.all(
            rawProposals.map(async (p) => {
                const isSupported = user.supportedProposals.includes(p._id);
                const hasCommitment = await Commitment.exists({ 
                    proposalId: p._id, 
                    candidateUsername: candidate.username 
                });

                return {
                    ...p.toObject(),
                    supporters: await p.getSupportersCount(),
                    support: await p.getSupport(),
                    affiliations: await p.getAffiliationList(),
                    centres: await p.getCentreList(),
                    candidatesSupporters: await p.getCandidatesSupporters(),
                    selected: isSupported || hasCommitment
                };
            })
        );

        const sortedProposals = proposals.sort((a, b) => {
            const aSupported = user.supportedProposals.includes(a._id);
            const bSupported = user.supportedProposals.includes(b._id);
            if (aSupported !== bSupported) return bSupported - aSupported;
            return b.selected - a.selected;
        });

        res.render('fragments/commitments/proposalRows', { layout: false, proposals: sortedProposals });
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Se muere aquí"));
    }
};

module.exports = {
    getProposals
};