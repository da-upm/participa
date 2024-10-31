const nodemailer = require('nodemailer');

const config = require('./config.json');

const Parameter = require('./models/parameter');

// Función para eliminar acentos
module.exports.normalizeString = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


// Get all categories so it is not necessary to retrieve them for every view.
module.exports.retrieveCategories = async () => {
    const result = await Parameter.findOne({ categories: { $exists: true } });
    return result.categories;
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
	try {
		const mailOptions = {
			from: `Delegación de Alumnos UPM <${config.email.user}>`,
			to,
			subject: 'Tu propuesta se ha publicado',
			html: htmlBody,
		};
		await smtpTransport.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
};
