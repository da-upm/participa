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
            const aHasCommitment = a.commitment !== null;
            const bHasCommitment = b.commitment !== null;

            // First sort by support
            if (aSupported !== bSupported) return bSupported - aSupported;
            
            // Then sort by commitment existence
            if (aHasCommitment !== bHasCommitment) return bHasCommitment - aHasCommitment;
            
            // Finally sort by update date (already sorted from the query)
            return 0;
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

const saveCommitment = async (req, res, next) => {
    try {
        if (!req.body.content || req.body.content.replace(/<\/?[^>]+(>|$)/g, "").trim() === "") {
            console.error('Error en saveCommitment:');
            console.error(`El candidato ${req.session.user.id} ha intentado enviar un compromiso sin contenido.`)
            return next(new BadRequestError("El compromiso debe constar de un texto."));
        }

        const sanitizedContent = sanitizeHtml(req.body.content, {
            allowedTags: ['p', 'br', 'b', 'i', 'u', 'ul', 'ol', 'li'],
            allowedAttributes: {}
        });

        const proposal = await Proposal.findById(new ObjectId(req.params.id));
        if (!proposal) {
            console.error('Error en commitment/saveCommitment:');
            console.error(`El candidato ${req.session.user.id} ha intentado enviar un compromiso a una propuesta inexistente.`);
            return next(new NotFoundError("La propuesta no existe."));
        }

        const commitment = await Commitment.findOne({
            proposalId: proposal._id,
            candidateUsername: req.session.candidate.username
        });

        if (commitment) {
            commitment.content = sanitizedContent;
            await commitment.save();
        } else {
            const newCommitment = new Commitment({
                proposalId: proposal._id,
                candidateUsername: req.session.candidate.username,
                content: sanitizedContent
            });
            await newCommitment.save();
        }

        req.toastr.success(`Se han guardado los cambios.`);
        return res.status(200).render('fragments/toastr', { layout: false, req: req });
    } catch (error) {
        console.error('Error en commitment/saveCommitment: ' + error.message);
        req.toastr.error("Ha ocurrido un error al enviar el compromiso.", "Error al enviar el compromiso");
        return next(new InternalServerError("Ha ocurrido un error al enviar el compromiso."));
    }
}

const deleteCommitment = async (req, res, next) => {
    const commitment = await Commitment.findOne({
        proposalId: req.params.id,
        candidateUsername: req.session.candidate.username
    });

    if (!commitment) {
        console.error('Error en commitment/deleteCommitment:');
        console.error(`El candidato ${req.session.user.id} ha intentado eliminar un compromiso inexistente.`);
        return next(new NotFoundError("El compromiso no existe."));
    }

    await commitment.deleteOne();
    req.toastr.success(`Se ha eliminado el compromiso.`);
    return res.status(200).render('fragments/toastr', { layout: false, req: req });
}

module.exports = {
    getProposals,
    getProposal,
    saveCommitment,
    deleteCommitment
};