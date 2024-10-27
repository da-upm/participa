const router = require('express').Router();

const viewsController = require('../controllers/viewsController');
const middlewares = require('../middlewares');

router.get('/', viewsController.getIndex);
router.get('/error', (req, res, next) => res.status(500).render('error'));


router.get('/admin', middlewares.checkLogin, middlewares.restrictAdmins, viewsController.getAdmin);

module.exports = router;
