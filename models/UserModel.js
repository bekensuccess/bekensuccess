const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    isAdmin: Boolean,
    password: String,
    creationDate: Date,
    updateDate: Date,
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel