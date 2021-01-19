var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var videoSchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    trim: true
  },
  uploaded_by: { type: Schema.Types.ObjectId, ref: 'Member',required: true },
  ratings: [{ type: Schema.Types.ObjectId, ref: 'Rating' }],
  updated_at: { type: Date, default: Date.now },

},{usePushEach: true});


module.exports = mongoose.model('Video', videoSchema);
