const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({}, {
    strict: false,
});


module.exports = mongoose.model('Result', resultSchema);