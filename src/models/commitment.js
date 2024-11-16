const mongoose = require('mongoose');

const commitmentSchema = new mongoose.Schema({
    proposalId: {
        type: String,
        required: true,
    },
    candidateUsername: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model('Commitment', commitmentSchema);