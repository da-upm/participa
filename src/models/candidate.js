const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    name: {
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
    surrogateUsers: {
        type: [String],
        default: [],
        required: true,
    },
},
    {
        timestamps: true
    });

module.exports = mongoose.model('Candidate', candidateSchema);