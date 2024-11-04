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

// Definir una función en el esquema para obtener el grado de apoyo de una propuesta en función de los usuarios que la apoyan con respecto al total de usuarios.
// Se definirán los grados de apoyo "low", "medium" y "high" en función de los porcentajes 0-25, 25-50 y 50-100 respectivamente.
proposalSchema.methods.getSupport = async function () {
    const totalUsers = await mongoose.model('User').countDocuments();
    const supporters = await this.getSupportersCount();
    const percentage = totalUsers === 0 ? 0 : (supporters / totalUsers) * 100;
    if (percentage === 0 || percentage <= 25) {
        return 'low';
    } else if (percentage <= 50) {
        return 'medium';
    } else {
        return 'high';
    }
};

// Definir una función en el esquema para obtener la lista de parámetros "affiliation" de los usuarios en "usersDrafting".
proposalSchema.methods.getAffiliationList = async function () {
    const users = await mongoose.model('User').find({
        _id: { $in: this.usersDrafting }
    });
    return users.map(user => user.affiliation);
};

// Definir una función en el esquema para obtener la lista de parámetros "centre" no repetidos de los usuarios en "usersDrafting".
proposalSchema.methods.getCentreList = async function () {
    const users = await mongoose.model('User').find({
        _id: { $in: this.usersDrafting }
    });
    const centres = users.flatMap(user => user.centre);
    return [...new Set(centres)];
};

module.exports = mongoose.model('Proposal', proposalSchema);