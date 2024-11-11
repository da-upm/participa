const router = require('express').Router();
const middlewares = require('../middlewares');
const questionController = require('../controllers/questionController');

router.get('/', questionController.getQuestions);

router.use(middlewares.checkLogin);

router.post('/', questionController.addQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;