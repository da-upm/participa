const nodemailer = require('nodemailer');

const config = require('./config.json');

const Parameter = require('./models/parameter');

// Función para eliminar acentos
module.exports.normalizeString = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


// Get all categories so it is not necessary to retrieve them for every controller.
module.exports.retrieveCategories = async () => {
    const result = await Parameter.findOne({ categories: { $exists: true } });
    return result.categories;
}

// Get all affiliation codes so it is not necessary to retrieve them for every controller.
module.exports.retrieveAffiliationCodes = async () => {
    const result = await Parameter.findOne({ affiliationCodes: { $exists: true } });
    return result.affiliationCodes;
}

const smtpTransport = nodemailer.createTransport({
	host: config.email.host,
	port: config.email.port,
	tls: {
		secure: config.email.ssl, // Use `true` for port 465, `false` for all other ports
		requireTLS: true,
	},
	auth: {
		user: config.email.user,
		pass: config.email.password,
	},
});

module.exports.sendDraftApprovedMail = async (to, htmlBody) => {
	const mailOptions = {
		from: `Delegación de Alumnos UPM <${config.email.user}>`,
		to,
		subject: 'Tu propuesta se ha publicado',
		html: htmlBody,
	};
	try {
		await smtpTransport.sendMail(mailOptions);
	} catch (error) {
		throw new Error(`Error al enviar email: ${error.message}`);
	}
};
