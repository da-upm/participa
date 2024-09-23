const router = require('express').Router();

const proposalController = require('../controllers/proposalController');

router.post('/', proposalController.createProposal);
router.get('/', proposalController.getProposals);
router.delete('/:id', proposalController.deleteProposal);
router.get('/category/:category', proposalController.getProposalByCategory);
router.get('/categories', proposalController.getProposalsCategories);

module.exports = router;
