const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    UPMClasifCodes: {
        type: [String],
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
    isAdmin: {
        type: Boolean,
    },
    supportedProposals: {
        type: [String],
        default: [],
        required: true,
    },
});

module.exports = mongoose.model('User', userSchema);