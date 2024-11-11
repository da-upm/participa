const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    affiliation: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('Question', questionSchema);