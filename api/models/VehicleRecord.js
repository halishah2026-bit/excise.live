const mongoose = require('mongoose');

const vehicleRecordSchema = new mongoose.Schema({
  province: {
    type: String,
    enum: ['punjab', 'islamabad', 'sindh', 'kpk', 'ajk', 'balochistan', 'stolen', 'noncustom'],
    required: true
  },
  registrationNo: { type: String, trim: true, uppercase: true },
  cnic: { type: String, trim: true },
  chassisNo: { type: String, trim: true, uppercase: true },
  engineNo: { type: String, trim: true, uppercase: true },
  district: { type: String, trim: true },
  ownerName: { type: String, trim: true },
  ownerCnic: { type: String, trim: true },
  ownerAddress: { type: String, trim: true },
  ownerPhone: { type: String, trim: true },
  vehicleMake: { type: String, trim: true },
  vehicleModel: { type: String, trim: true },
  vehicleColor: { type: String, trim: true },
  vehicleYear: { type: String, trim: true },
  vehicleType: { type: String, trim: true },
  engineCapacity: { type: String, trim: true },
  fuelType: { type: String, trim: true },
  tokenTax: { type: String, trim: true },
  fitnessExpiry: { type: String, trim: true },
  routePermit: { type: String, trim: true },
  isStolen: { type: Boolean, default: false },
  isNonCustom: { type: Boolean, default: false },
  stolenDate: { type: String, trim: true },
  stolenFrom: { type: String, trim: true },
  customsDuty: { type: String, trim: true },
  status: { type: String, default: 'active', enum: ['active', 'stolen', 'noncustom', 'cancelled'] },
  additionalInfo: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('VehicleRecord', vehicleRecordSchema);
