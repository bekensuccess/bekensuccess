const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    imageFirst: String,
    imageSecond: String,
    imageThree: String,
    name: {
        kz: String,
        en: String
    },
    description: {
        kz: String,
        en: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ItemModel = mongoose.model('Items', itemSchema);

module.exports = ItemModel;