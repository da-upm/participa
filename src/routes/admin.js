const router = require('express').Router();

const adminController = require('../controllers/adminController');
const middlewares = require('../middlewares');

router.use(middlewares.checkLogin);
router.use(middlewares.restrictAdmins);

router.get('/proposals', adminController.getProposals);
router.get('/proposals/:id([a-f,0-9]{24})', adminController.getProposal);

router.get('/proposal-form', adminController.getProposalForm);
router.post('/proposals', adminController.sendProposal);

module.exports = router;