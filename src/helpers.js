const nodemailer = require('nodemailer');

const fs = require('node:fs');

const config = require('./config.json');

const Parameter = require('./models/parameter');
const TimelineSection = require('./models/timelineSection');

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

module.exports.retrieveAffiliations = async () => {
    const result = await Parameter.findOne({ affiliations: { $exists: true } });
    return result.affiliations;
}

module.exports.retrieveCentres = async () => {
    const result = await Parameter.findOne({ centres: { $exists: true } });
    return result.centres;
}

module.exports.retrieveFeatureFlags = async () => {
    const result = await Parameter.findOne({ featureFlags: { $exists: true } });
    return result.featureFlags;
};

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
	const textParams = await Parameter.findOne({ text: { $exists: true } });
	const delegationName = textParams?.text?.delegationName || 'Delegación de Alumnos';

	const mailOptions = {
		from: `${delegationName} <${config.email.user}>`,
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

module.exports.sendDraftRejectedMail = async (to, htmlBody) => {
	const textParams = await Parameter.findOne({ text: { $exists: true } });
	const delegationName = textParams?.text?.delegationName || 'Delegación de Alumnos';

	const mailOptions = {
		from: `${delegationName} <${config.email.user}>`,
		to,
		subject: 'Tu propuesta ha sido rechazada',
		html: htmlBody
	};
	try {
		await smtpTransport.sendMail(mailOptions);
	} catch (error) {
		throw new Error(`Error al enviar email: ${error.message}`);
	}
};

module.exports.getFeatureFlag = async (feature) => {
    try {
        const result = await Parameter.findOne({ featureFlags: { $exists: true } });
		return result.featureFlags[feature];
    } catch (error) {
        console.error('Error getting feature flag:', error);
        return undefined;
    }
};

module.exports.retrieveColors = async () => {
	try {
		const result = await Parameter.findOne({ colors: { $exists: true } });
		return result.colors;
	} catch (error) {
		console.error('Error getting colors:', error);
		return undefined;
	}
}

module.exports.retrieveTexts = async () => {
	try {
		const result = await Parameter.findOne({ text: { $exists: true } });
		return result.text;
	} catch (error) {
		console.error('Error getting text:', error);
		return undefined;
	}
}

module.exports.retrieveTimelineSections = async (req, res, next) => {
		try {
			const result = await TimelineSection.find().sort({ order: 1 });
        	return result;
		} catch (error) {
			console.error('Error getting timeline:', error);
			return undefined;
		}
};
