const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    net_worth: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    nationality: { type: String, required: true },
    occupation: { type: [String], required: true },
    height: { type: Number, required: true },
    birthday: { type: Date, required: true }
});

const CelebrityModel = mongoose.model('Celebrity', schema);

module.exports = CelebrityModel