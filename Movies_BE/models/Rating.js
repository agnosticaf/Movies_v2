var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ratingSchema = new mongoose.Schema({
  rating: { type: Number, min: 1, max: 5 ,required: true},
  rated_by: { type: Schema.Types.ObjectId, ref: 'Member',required: true },
  video_rated: { type: Schema.Types.ObjectId, ref: 'Video',required: true },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rating', ratingSchema);
