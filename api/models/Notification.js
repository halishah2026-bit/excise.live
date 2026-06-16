const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['stolen', 'noncustom', 'info'], default: 'info' },
  targetRoles: [{ type: String, enum: ['superadmin', 'admin', 'user'], required: true }],
  meta: { type: mongoose.Schema.Types.Mixed },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
