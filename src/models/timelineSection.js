const mongoose = require('mongoose');


const timelineSectionSchema = new mongoose.Schema({
    dateRange: { type: String, required: true }, // e.g. "3 OCT 2024" or "8 - 21 OCT 2024"
    title: { type: String, required: true },
    content: { type: String, required: true },
    buttons: [{
        text: { type: String, required: true },
        url: { type: String, required: true }
    }],
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('TimelineSection', timelineSectionSchema);