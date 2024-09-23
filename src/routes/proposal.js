const router = require('express').Router();

const proposalController = require('../controllers/proposalController');

router.post('/', proposalController.createProposal);
router.get('/', proposalController.getProposals);
router.delete('/:id', proposalController.deleteProposal);
router.get('/category/:category', proposalController.getProposalByCategory);
router.get('/categories', proposalController.getProposalsCategories);
router.post('/:id/support', proposalController.addSupporter);
router.post('/draft', proposalController.sendProposalAsDraft);
router.get('/draft', proposalController.getDraftProposals);
router.delete('/draft/:id', proposalController.deleteDraftProposal);
router.post('/draft/:id/accept', proposalController.approveDraftProposal);

module.exports = router;
