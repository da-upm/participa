const router = require('express').Router();

const adminController = require('../controllers/adminController');
const middlewares = require('../middlewares');

router.use(middlewares.checkLogin);
router.use(middlewares.restrictAdmins);

router.get('/proposals', adminController.getProposals);
router.get('/proposals/:id([a-f,0-9]{24})', adminController.getProposal);

router.get('/draft-form', adminController.getProposalForm);
router.post('/proposals', adminController.sendProposal);

router.get('/reject-form', adminController.getRejectForm);
router.delete('/proposals/:id([a-f,0-9]{24})', adminController.rejectProposal);

router.delete('/questions', adminController.deleteQuestions);

router.put('/features/:feature', adminController.changeFeatureFlag);
router.delete('/features/:feature', adminController.changeFeatureFlag);


module.exports = router;