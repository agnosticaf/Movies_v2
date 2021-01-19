var mongoose = require('mongoose');

var ChatSchema = new mongoose.Schema({
  username: String,
    password: String,
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', ChatSchema);
