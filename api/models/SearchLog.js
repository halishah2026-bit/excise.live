const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  service: { type: String, required: true },
  searchType: { type: String },
  searchQuery: { type: String },
  resultFound: { type: Boolean, default: false },
  resultData: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
}, { timestamps: true });

module.exports = mongoose.model('SearchLog', searchLogSchema);
