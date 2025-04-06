const router = require('express').Router();

const viewsController = require('../controllers/viewsController');
const middlewares = require('../middlewares');

router.get('/', viewsController.getIndex);
router.get('/process', middlewares.checkFeatureEnabled('process'), viewsController.getProcess);
router.get('/timeline', middlewares.checkFeatureEnabled('timeline'), viewsController.getTimeline);
router.get('/candidates', middlewares.checkFeatureEnabled('candidates'), viewsController.getCandidates);
router.get('/results', middlewares.checkFeatureEnabled('results'), viewsController.getResults);
router.get('/error', (req, res, next) => res.status(500).render('error'));
router.get('/questions', middlewares.checkLogin, middlewares.checkFeatureEnabled('questions'), middlewares.checkSchoolRestriction, viewsController.getQuestions);
router.get('/commitments', middlewares.checkLogin, middlewares.checkCandidate, viewsController.getCommitments);

router.get('/nav-menu', middlewares.requireHtmx, viewsController.getNavMenu);

router.get('/commitments/:id([a-f,0-9]{24})', viewsController.getCandidateCommitments);

router.get('/admin', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getAdmin);
router.get('/stats', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getStats);
router.get('/aesthetics', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getAesthetics);
router.get('/candidatesAdmin', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getCandidatesAdmin);
router.get('/proposalsAdmin', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getProposalsAdmin);
router.get('/timelineAdmin', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getTimelineAdmin);

module.exports = router;
