const router = require('express').Router();

const proposalController = require('../controllers/proposalController');
const middlewares = require('../middlewares');

router.use(middlewares.checkLogin);

router.get('/', proposalController.getProposals);
router.post('/draft', proposalController.sendProposalAsDraft);
router.get('/draft', proposalController.getDraftProposals);
router.get('/category/:category', proposalController.getProposalByCategory);
router.get('/categories', proposalController.getProposalsCategories);

router.post('/', proposalController.createProposal);
router.delete('/:id', proposalController.deleteProposal);
router.post('/:id/support', proposalController.addSupporter);
router.delete('/draft/:id', proposalController.deleteDraftProposal);
router.post('/draft/:id/accept', proposalController.approveDraftProposal);

module.exports = router;
