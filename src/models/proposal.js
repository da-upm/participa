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

// Definir una función en el esquema para obtener el grado de apoyo de una propuesta en función de un ranking de votos.
// Las propuestas con el mayor número de votos estarán categorizadas como "high", las siguientes como "medium" y las restantes como "low".
proposalSchema.methods.getSupport = async function () {
    const proposals = await mongoose.model('Proposal').find();
    const proposalVotes = await Promise.all(proposals.map(async (proposal) => {
        const supporters = await proposal.getSupportersCount();
        return { proposalId: proposal._id, supporters };
    }));

    proposalVotes.sort((a, b) => b.supporters - a.supporters);

    const totalProposals = proposalVotes.length;
    const highThreshold = Math.ceil(totalProposals * 0.33);
    const mediumThreshold = Math.ceil(totalProposals * 0.66);

    const rank = proposalVotes.findIndex(p => p.proposalId.toString() === this._id.toString()) + 1;

    if (rank <= highThreshold) {
        return 'high';
    } else if (rank <= mediumThreshold) {
        return 'medium';
    } else {
        return 'low';
    }
};

// Definir una función en el esquema para obtener la lista de parámetros "affiliation" de los usuarios en "usersDrafting".
proposalSchema.methods.getAffiliationList = async function () {
    const users = await mongoose.model('User').find({
        _id: { $in: this.usersDrafting }
    });
    const affiliations = users.flatMap(user => user.affiliation);
    return [...new Set(affiliations)];
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