const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    prompt: String,
    creationDate: Date,
    type: String,



    isAnswer: Boolean
});

const HistoryModel = mongoose.model("History", historySchema);

module.exports = HistoryModel;