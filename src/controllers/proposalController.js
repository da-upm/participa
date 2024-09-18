const mongoose = require('mongoose');

const proposalSchema = require('../models/proposalSchema');

const Proposal = mongoose.model('Proposal', proposalSchema);