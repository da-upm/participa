/* eslint-disable max-len */
const User = require('../models/user');

const helpers = require('../helpers');

const { BadRequestError, NotFoundError, InternalServerError } = require('../errors');

const registerUser = async (userInfo) => {

		const affiliationCodes = await helpers.retrieveAffiliationCodes();

		if (!userInfo.upmClassifCode && userInfo.employeeType.length === 1 && userInfo.employeeType[0] === '-') {
			throw new BadRequestError("No es posible iniciar sesión con cuentas institucionales.");
		}

		const user = new User({
			name: userInfo.name,
			username: userInfo.preferred_username,
			email: userInfo.email,
			UPMClassifCodes: userInfo.upmClassifCode,
			affiliation:
			(() => {
				const restrictedSchool = helpers.retrieveSchoolRestricted();

				let employeeTypes = [];

			if (restrictedSchool) {
				const affiliations = userInfo.upmClassifCode.filter(code => code.startsWith('CentroPerfil:'));
				if (affiliations && affiliations.length > 0) {
					for (const affiliation of affiliations) {
						const schoolCode = affiliation.split(':')[1];
						if (
							restrictedSchool.toString() === schoolCode ||
							(restrictedSchool < 10 && 
							 (schoolCode === restrictedSchool.toString() || 
							  schoolCode === "0" + restrictedSchool.toString()))
						) {
							employeeTypes.append(affiliation.split(':')[2]);
						}
					}
				}

			} else employeeTypes = userInfo.employeeType;

				let affiliation = 'none'; // Default to 'none' if no match is found

				if (employeeTypes.some(type => affiliationCodes.pdi.includes(type))) {
					affiliation = 'pdi';
				} else if (employeeTypes.some(type => affiliationCodes.student.includes(type))) {
					affiliation = 'student';
				} else if (employeeTypes.some(type => affiliationCodes.ptgas.includes(type))) {
					affiliation = 'ptgas';
				}

				return affiliation;
			})(),
			centre: userInfo.upmCentre,
			isAdmin: false
		});

		await user.save();

		return user;

};

module.exports.handleLogin = async (req, res, next) => {
	try {
		const registeredUser = await User.findOne({username: req.session.userInfo.preferred_username});

		let savedUser;
		if (registeredUser) savedUser = registeredUser;
		else savedUser = await registerUser(req.session.userInfo);

		if (!savedUser) return res.status(500).json({ message: 'Error al acceder a los datos del usuario.' });

		req.session.user = savedUser;

		return next();
	} catch (error) {
		console.error('Error en login/handleLogin: ' + error.message);
		if (error instanceof BadRequestError) return next(new BadRequestError(error.message));
        return next(new InternalServerError("Ha ocurrido un error al recuperar el usuario."));
	}
};
