const router = require('express').Router();

const proposalController = require('../controllers/proposalController');
const middlewares = require('../middlewares');

router.get('/', proposalController.getProposals);
router.get('/:id', proposalController.getProposal);
router.get('/categories', proposalController.getProposalsCategories);
router.get('/category/:category', proposalController.getProposalByCategory);

router.use(middlewares.checkLogin);

router.post('/draft', proposalController.sendProposalAsDraft);
router.post('/:id/support', proposalController.addSupporter);

router.use(middlewares.restrictAdmins);

router.post('/', proposalController.createProposal);
router.delete('/:id', proposalController.deleteProposal);

router.get('/draft', proposalController.getDraftProposals);
router.post('/draft/:id/accept', proposalController.approveDraftProposal);
router.delete('/draft/:id', proposalController.deleteDraftProposal);

module.exports = router;
