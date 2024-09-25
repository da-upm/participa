const router = require('express').Router();

const viewsController = require('../controllers/viewsController');
const middlewares = require('../middlewares');

router.get('/', viewsController.getIndex);

router.get('/admin', (req, res, next) => {
    res.render('admin');
});

module.exports = router;
