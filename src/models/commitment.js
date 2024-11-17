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

// Agregar índice compuesto único
commitmentSchema.index({ proposalId: 1, candidateUsername: 1 }, { unique: true });

module.exports = mongoose.model('Commitment', commitmentSchema);