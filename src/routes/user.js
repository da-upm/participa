const router = require('express').Router();

const userController = require('../controllers/user');

router.get('/:id', userController.getUser);
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;