const router = require('express').Router();

const commitmentController = require('../controllers/commitmentController');
const middlewares = require('../middlewares');

router.use(middlewares.checkLogin);
router.use(middlewares.checkCandidate);

router.get('/proposals', commitmentController.getProposals);
router.get('/proposals/:id([a-f,0-9]{24})', commitmentController.getProposal);

//router.get('/draft-form', adminController.getProposalForm);
//router.post('/proposals', adminController.sendProposal);
//
//router.get('/reject-form', adminController.getRejectForm);
//router.delete('/proposals/:id([a-f,0-9]{24})', adminController.rejectProposal);
//
//router.delete('/questions', adminController.deleteQuestions);

module.exports = router;