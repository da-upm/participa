const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({}, {
    strict: false
});


module.exports = mongoose.model('Parameter', parameterSchema);