const router = require('express').Router();

const proposalController = require('../controllers/proposalController');
const middlewares = require('../middlewares');

router.get('/', proposalController.getProposals);
router.get('/:id([a-f,0-9]{24})', proposalController.getProposal);

router.use(middlewares.checkLogin);

router.get('/draft-form', middlewares.checkSchoolRestriction, proposalController.getDraftForm);
router.post('/draft', middlewares.checkSchoolRestriction, proposalController.sendProposalAsDraft);
router.post('/:id([a-f,0-9]{24})/support', middlewares.checkSchoolRestriction, proposalController.addSupporter);
router.delete('/:id([a-f,0-9]{24})/support', middlewares.checkSchoolRestriction, proposalController.removeSupporter);

module.exports = router;
