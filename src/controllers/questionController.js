const Question = require('../models/question');

const { BadRequestError, NotFoundError, InternalServerError } = require('../errors');

const User = require('../models/user');

const getQuestions = async (req, res, next) => {
    try {
        const questions = await Question.find().sort({ timestamp: -1 });
        res.json(questions);
    } catch (error) {
        console.error('Error en question/getQuestions: ' + error.message);
        return next(new InternalServerError('Error al obtener las preguntas.'));
    }
}

const addQuestion = async (req, res, next) => {
    try {
        const { question, timestamp } = req.body;
        console.log(question);
        console.log(timestamp);
        const userId = req.session.user.id;
        
        if (!question || question.trim() === '') {
            return next(new BadRequestError('El cuerpo de la pregunta es obligatorio.'));
        }

        const affiliationObject = await User.findById(userId).select('affiliation');
        
        const affiliation = affiliationObject.affiliation;

        if (affiliation === null) {
            return next(new NotFoundError('Usuario no encontrado.'));
        }
        
        const questionObject = new Question({ question, affiliation, timestamp });
        await questionObject.save();

        req.toastr.success('Pregunta enviada con éxito', 'Pregunta enviada')
        res.status(200).render('fragments/toastr', { layout: false, req: req })
    } catch (error) {
        req.toastr.error("Ha ocurrido un error al enviar la pregunta.", "Error al enviar la pregunta");
        return next(new InternalServerError('Error al añadir la pregunta.'));
    }
}

const deleteQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;

        const question = await Question.findById(id);

        if (question === null) {
            return next(new NotFoundError('Pregunta no encontrada.'));
        }

        await question.remove();

        res.status(204).send();
    }
    catch (error) {
        console.error('Error en question/deleteQuestion: ' + error.message);
        return next(new InternalServerError('Error al eliminar la pregunta.'));
    }
}

module.exports = {
    getQuestions,
    addQuestion,
    deleteQuestion
};