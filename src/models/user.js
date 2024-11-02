const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    UPMClassifCodes: {
        type: [String],
        required: true,
    },
    affiliation: {
        type: String,
        enum: ['student', 'pdi', 'ptgas', 'none'],
        required: true,
    },
    centre: {
        type: [Number],
        required: true
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
        type: [mongoose.Types.ObjectId],
        default: [],
        required: true,
    },
},
    {
        timestamps: true
    });

module.exports = mongoose.model('User', userSchema);