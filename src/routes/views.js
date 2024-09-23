const router = require('express').Router();

router.get('/', (req, res, next) => {
    res.render('index');
});

router.get('/admin', (req, res, next) => {
    res.render('admin');
});

module.exports = router;
