const user = require('../models/user');

const getUser = async (req, res) => {
    const userFound = await user.findById(req.params.id);
    if (!userFound) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(userFound);
};

const getUsers = async (req, res) => {
    const users = await user.find();
    res.status(200).json(users);
};

const createUser = async (req, res) => {
    const newUser = new user(req.body);
    await newUser.save();
    res.status(201).json(newUser);
};

const deleteUser = async (req, res) => {
    await user.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted' });
};

module.exports = {
    getUser,
    getUsers,
    createUser,
    deleteUser,
};