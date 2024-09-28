const router = require('express').Router();

const proposalController = require('../controllers/proposalController');
const middlewares = require('../middlewares');

router.get('/', proposalController.getProposals);
router.get('/:id([a-f,0-9]{24})', proposalController.getProposal);
router.get('/categories', proposalController.getProposalsCategories);
router.get('/category/:category', proposalController.getProposalByCategory);

router.use(middlewares.checkLogin);

router.get('/draft-form', proposalController.getDraftForm);
router.post('/draft', proposalController.sendProposalAsDraft);
router.post('/:id([a-f,0-9]{24})/support', proposalController.addSupporter);
router.delete('/:id([a-f,0-9]{24})/support', proposalController.removeSupporter);

router.use(middlewares.restrictAdmins);

router.post('/draft/:id([a-f,0-9]{24})/accept', proposalController.approveDraftProposal);
router.delete('/draft/:id([a-f,0-9]{24})', proposalController.deleteDraftProposal);
router.get('/draft', proposalController.getDraftProposals);

router.post('/', proposalController.createProposal);
router.delete('/:id([a-f,0-9]{24})', proposalController.deleteProposal);

module.exports = router;
