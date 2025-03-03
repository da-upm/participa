const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    surname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    imageURL: {
        type: String,
        required: true,
    },
    surrogateUsers: {
        type: [String],
        default: [],
        required: true,
    },
    unsignedCommitmentsDoc: {
        type: Buffer,
        required: false
    },
    signedCommitmentsDoc: {
        type: Buffer,
        required: false
    },
    socialMedia: [{
        icon: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    details: {
        "Antigüedad en la UPM": String,
        "Estudios": String,
        "Centro": String,
        "Departamento": String,
        "Área de Conocimiento": String,
        "Categoría Docente": String
    },
    programUrl: {
        type: String,
        required: false
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model('Candidate', candidateSchema);