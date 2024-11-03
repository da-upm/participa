const router = require('express').Router();

const proposalController = require('../controllers/proposalController');
const middlewares = require('../middlewares');

router.get('/', proposalController.getProposals);
router.get('/:id([a-f,0-9]{24})', proposalController.getProposal);

router.use(middlewares.checkLogin);

router.get('/draft-form', proposalController.getDraftForm);
router.post('/draft', proposalController.sendProposalAsDraft);
router.post('/:id([a-f,0-9]{24})/support', proposalController.addSupporter);
router.delete('/:id([a-f,0-9]{24})/support', proposalController.removeSupporter);

module.exports = router;
