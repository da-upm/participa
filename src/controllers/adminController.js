const sanitizeHtml = require('sanitize-html');

const Proposal = require('../models/proposal');
const User = require('../models/user');

const ObjectId = require('mongoose').Types.ObjectId;

const getProposals = async (req, res) => {
    try {
        const rawProposals = await Proposal.find({ isDraft: true });
        const proposals = await Promise.all(
            rawProposals.map(async (p) => {
                return {
                    ...p.toObject(),
                    supporters: await p.getSupportersCount()
                };
            })
        );
        res.status(200).render('admin', { proposals })
    } catch (error) {
        console.error(`No se encuentran propuestas ${proposalId} para el usuario ${req.session.user.id}.`)
        req.toastr.error("No se han encontrado propuestas.");
        res.status(404).render('fragments/toastr', { layout: false, req: req });
    }
}

const getProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findById(new ObjectId(req.params.id));
        proposal.supporters = await proposal.getSupportersCount();

        res.status(200).render('fragments/admin/proposalDetailModal', { layout: false, proposal });
    } catch (error) {
        console.error(`No se encuentra propuesta ${proposalId} para el usuario ${req.session.user.id}.`)
        req.toastr.error("Propuesta no encontrada.");
        res.status(404).render('fragments/toastr', { layout: false, req: req });
    }
}

module.exports = {
    getProposals,
    getProposal
}