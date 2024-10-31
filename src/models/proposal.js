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
        required: true,
        default: true
    },
    usersDrafting: {
        type: [String],
        default: []
    },
    olderVersions: {
        type: [Object],
        default: []
    }
},
    {
        timestamps: true
    });

// Definir una función en el esquema para obtener el número de supporters
proposalSchema.methods.getSupportersCount = async function () {
    const count = await mongoose.model('User').countDocuments({
        supportedProposals: this._id
    });
    return count;
};

module.exports = mongoose.model('Proposal', proposalSchema);