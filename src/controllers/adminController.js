const sanitizeHtml = require('sanitize-html');
const ObjectId = require('mongoose').Types.ObjectId;

const { BadRequestError, NotFoundError, InternalServerError } = require('../errors');

const Proposal = require('../models/proposal');
const User = require('../models/user');

const helpers = require('../helpers');


const getProposals = async (req, res, next) => {
    try {
        const categories = await helpers.retrieveCategories();

        const searchQuery = helpers.normalizeString(req.query.search) || '';
        const categoriesQuery = Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories];
        const filteredCategories = categoriesQuery.filter(category => categories.hasOwnProperty(category));

        // Construir la consulta
        const query = {
            isDraft: true
        };

        // Si hay categorías en filteredCategories, agregarlas a la consulta
        if (filteredCategories.length > 0) {
            query.categories = { $in: filteredCategories };
        }

        // Buscar todos los documentos, luego filtrar manualmente
        const rawProposals = await Proposal.find(query);

        // Normalizar los títulos y descripciones antes de hacer la comparación
        const filteredProposals = rawProposals.filter(p => {
            const normalizedTitle = helpers.normalizeString(p.title.toLowerCase());
            const normalizedDescription = helpers.normalizeString(p.description.toLowerCase());

            return (
                normalizedTitle.includes(searchQuery.toLowerCase()) ||
                normalizedDescription.includes(searchQuery.toLowerCase())
            );
        });

        // Obtener supporters usando async/await
        const proposals = await Promise.all(
            filteredProposals.map(async (p) => {
                return {
                    ...p.toObject(),
                    supporters: await p.getSupportersCount(),
                };
            })
        );

        res.status(200).render('fragments/admin/proposalRows', { layout: false, proposals, categories });
    } catch (error) {
        console.error("Error admin/getProposals:", error);
        return next(new InternalServerError("Ha ocurrido un error al realizar la búsqueda."));
    }
}

const getProposal = async (req, res, next) => {
    try {
        const proposal = await Proposal.findById(new ObjectId(req.params.id));
        proposal.supporters = await proposal.getSupportersCount();

        const categories = await helpers.retrieveCategories();

        res.status(200).render('fragments/admin/proposalDetailModal', { layout: false, proposal, categories });
    } catch (error) {
        console.error("Error admin/getProposals:", error);
        return next(new InternalServerError("Ha ocurrido un error al realizar la búsqueda."));
    }
}

const getProposalForm = async (req, res, next) => {
    try {
        const { proposalIds } = req.query;

        // Busca las propuestas que coincidan con los IDs proporcionados
        const draftProposals = await Proposal.find({ _id: { $in: proposalIds } });

        const categories = await helpers.retrieveCategories();

        // Renderiza la vista del modal con las propuestas y categorías encontradas
        res.status(200).render('fragments/proposalDraftModal', {
            layout: false,
            categories,
            draftProposals,
            admin: true
        });

    } catch (error) {
        console.error("Error admin/getProposalForm:", error);
        return next(new InternalServerError("Ha ocurrido un error al obtener el formulario."));
    }
};

const sendProposal = async (req, res, next) => {
    try {
        if (!req.body.title || req.body.title.trim() === "") {
            console.error('Error en sendProposalAsDraft:');
            console.error(`El usuario ${req.session.user.id} ha intentado enviar una propuesta sin título.`)
            return next(new BadRequestError("La propuesta debe contener un título."));
        }

        if (!req.body.description || req.body.description.trim() === "") {
            console.error('Error en sendProposalAsDraft:');
            console.error(`El usuario ${req.session.user.id} ha intentado enviar una propuesta sin descripción.`)
            return next(new BadRequestError("La propuesta debe contener una descripción."));
        }

        // Busca las propuestas que coincidan con los IDs proporcionados
        const draftProposals = await Proposal.find({ _id: { $in: req.body.draftIds } });

        const sanitizedDescription = sanitizeHtml(req.body.description, {
            allowedTags: ['b', 'i', 'u', 'ul', 'ol', 'li'],
            allowedAttributes: {}
        });

        const categories = await helpers.retrieveCategories();

        const receivedCategories = typeof req.body.categories === 'object' ? req.body.categories : [req.body.categories]

        const filteredCategories = receivedCategories.filter(category => categories.hasOwnProperty(category));

        if (filteredCategories.length < 1) {
            console.error('Error en sendProposalAsDraft:');
            console.error(`El usuario ${req.session.user.id} ha intentado enviar una propuesta sin categorías o con categorías inválidas: ${req.body.categories}.`)
            return next(new BadRequestError("La propuesta debe contener al menos una categoría de las disponibles."));
        }

        const proposalData = {
            title: sanitizeHtml(req.body.title, { allowedTags: [], allowedAttributes: {} }),
            description: sanitizedDescription,
            categories: filteredCategories,
            isDraft: false,
            usersDrafting: draftProposals.reduce((authors, draft) => authors.concat(draft.usersDrafting), []),
            olderVersions: draftProposals,
        }

        const newProposal = new Proposal(proposalData);
        newProposal.save();

        for (const user of proposalData.usersDrafting) {
            const userDocument = await User.findById(user);
            userDocument.supportedProposals.push(newProposal._id.toString());
            try {
                await userDocument.save();
            } catch (error) {
                return next(new InternalServerError("Ha ocurrido un error al guardar la propuesta al usuario."));
            }
            // Enviar notificación
            helpers.sendDraftApprovedMail(userDocument.email, `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Confirmación de Propuesta Aceptada</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            color: #333;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            padding: 20px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        }
                        .header {
                            text-align: center;
                            padding: 20px;
                            background-color: #0072c6;
                            color: #ffffff;
                        }
                        .header h1 {
                            margin: 0;
                        }
                        .content {
                            padding: 20px;
                        }
                        .footer {
                            text-align: center;
                            padding: 20px;
                            background-color: #0072c6;
                            color: #ffffff;
                        }
                        .footer img {
                            max-width: 200px;
                            margin-top: 10px;
                        }
                        .button {
                            display: inline-block;
                            padding: 10px 20px;
                            margin-top: 20px;
                            background-color: #0072c6;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                        .button:hover {
                            background-color: #005b9a;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>¡Propuesta Aceptada!</h1>
                        </div>
                        <div class="content">
                            <p>Estimado/a ${userDocument.name},</p>
                            <p>Nos complace informarte que tu propuesta ha sido <strong>aceptada</strong>. Agradecemos tu interés y participación en el proceso, y estamos emocionados de trabajar en conjunto para llevarla a cabo.</p>
                            <p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
                        </div>
                        <div class="footer">
                            <p>Atentamente,<br>Delegación de Alumnos UPM</p>
                            <img src="" alt="Delegación de Alumnos">
                        </div>
                    </div>
                </body>
                </html>`
            );

            req.toastr.success("Propuesta enviada correctamente.", `¡Propuesta ${newProposal.title} enviada!`);
            return res.status(200).render('fragments/toastr', { layout: false, req: req });
        }

    } catch (error) {
        console.error('Error en proposal/sendProposal: ' + error.message);
        req.toastr.error("Ha ocurrido un error al enviar la propuesta.", "Error al enviar la propuesta");
        return res.status(500).render('fragments/toastr', { layout: false, req: req }).next(new InternalServerError("Ha ocurrido un error al enviar la propuesta."));
    }
}

module.exports = {
    getProposals,
    getProposal,
    getProposalForm,
    sendProposal
}