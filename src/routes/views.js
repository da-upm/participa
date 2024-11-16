const router = require('express').Router();

const viewsController = require('../controllers/viewsController');
const middlewares = require('../middlewares');

router.get('/', viewsController.getIndex);
router.get('/process', viewsController.getProcess);
router.get('/dates', viewsController.getDates);
router.get('/candidates', viewsController.getCandidates);
router.get('/error', (req, res, next) => res.status(500).render('error'));
router.get('/questions', middlewares.checkLogin, viewsController.getQuestions);
router.get('/commitments', middlewares.checkLogin, middlewares.checkCandidate, viewsController.getCommitments);


router.get('/admin', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getAdmin);
router.get('/stats', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getStats);


module.exports = router;
