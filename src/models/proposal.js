const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    supporters: {
        type: Number,
        default: 0
    },
    categories: {
        type: [String],
        required: true,
    },
    candidatesSupporters: {
        type: [String],
        default: []
    },
    isDraft: {
        type: Boolean,
        default: true
    },
    usersDrafting: {
        type: [String],
        default: []
    },
});

module.exports = mongoose.model('Proposal', proposalSchema);