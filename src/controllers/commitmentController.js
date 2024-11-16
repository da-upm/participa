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
                const commitment = await Commitment.findOne({
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
                    supported: isSupported,
                    commitment: commitment ? commitment.content : null
                };
            })
        );

        const sortedProposals = proposals.sort((a, b) => {
            const aSupported = user.supportedProposals.includes(a._id);
            const bSupported = user.supportedProposals.includes(b._id);
            if (aSupported !== bSupported) return bSupported - aSupported;
            return b.supported - a.supported;
        });

        res.render('fragments/commitments/proposalRows', { layout: false, proposals: sortedProposals });
    } catch (error) {
        console.error(error);
        return next(new InternalServerError("Ha ocurrido un error al cargar las propuestas."));
    }
};

const getProposal = async (req, res, next) => {
    try {
        const user = req.session.user;
        const candidate = req.session.candidate;


        const proposal = await Proposal.findById(new ObjectId(req.params.id));
        proposal.supporters = await proposal.getSupportersCount();
        proposal.affiliations = await proposal.getAffiliationList();
        proposal.centres = await proposal.getCentreList();
        const commitment = await Commitment.findOne({
            proposalId: proposal._id,
            candidateUsername: candidate.username
        });
        proposal.support = await proposal.getSupport();
        proposal.candidatesSupporters = await proposal.getCandidatesSupporters();
        proposal.supported = user.supportedProposals.includes(proposal._id);
        proposal.commitment = commitment ? commitment.content : null;
        
        res.status(200).render('fragments/commitments/proposalCommitmentForm', { layout: false, proposal });
    } catch (error) {
        console.error("Error commitment/getProposals:", error);
        return next(new InternalServerError("Ha ocurrido un error al recuperar la propuesta."));
    }
}

module.exports = {
    getProposals,
    getProposal
};