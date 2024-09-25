const proposal = require('../models/proposal');
const user = require('../models/user');

const getIndex = async (req, res, next) => {
    try {
        const proposals = await proposal.find();
        res.status(200).render('index', {proposals})
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

module.exports = {
    getIndex
}