/* eslint-disable max-len */
//const { models } = require('../models');
const user = require('../models/user');

const pdiCodes = ['D', 'M', 'Q', 'U', 'P', 'C', 'R', 'B'];
const studentCodes = ['A', 'W'];
const pasCodes = ['F', 'L'];

const registerUser = async (userInfo) => {


	try {
		const newUser = new user({
			name: userInfo.name,
			username: userInfo.preferred_username,
			email: userInfo.email,
			isAdmin: false
		})

		newUser.UPMClasifCodes = userInfo.upmClassifCode
		await newUser.save();

		return newUser;
	} catch (error) {
		console.log(error);
		return null;
	}
};

module.exports.handleLogin = async (req, res, next) => {
	try {
		const registeredUser = await user.findOne({username: req.session.userInfo.preferred_username});

		let savedUser;
		if (registeredUser) savedUser = registeredUser;
		else savedUser = await registerUser(req.session.userInfo);

		if (!savedUser) return res.status(500).json({ message: 'Error al acceder a los datos del usuario.' });

		req.session.user = savedUser;

		return next();
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: 'Error al recuperar el usuario.' });
	}
};
