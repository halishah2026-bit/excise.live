const express = require('express');
const router = express.Router();
const User = require('../models/User');
const VehicleRecord = require('../models/VehicleRecord');
const SearchLog = require('../models/SearchLog');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

const isSuperAdmin = (user) => user?.role === 'superadmin';

const visibleUserScope = (user) => {
  if (isSuperAdmin(user)) return {};
  return { role: 'user', createdBy: user._id };
};

const ownUserIdsForAdmin = async (user) => {
  if (isSuperAdmin(user)) return null;
  return User.find(visibleUserScope(user)).distinct('_id');
};

const canManageUser = (actor, targetUser) => {
  if (!targetUser) return false;
  if (isSuperAdmin(actor)) return true;
  return targetUser.role === 'user' && String(targetUser.createdBy || '') === String(actor._id);
};

const sanitizeUserUpdate = (body, actor, targetUser) => {
  const { password, createdBy, searchCount, lastLogin, _id, ...updateData } = body;
  if (!isSuperAdmin(actor)) {
    delete updateData.role;
    return updateData;
  }

  if (updateData.role) {
    if (targetUser.role === 'superadmin' && updateData.role !== 'superadmin') {
      throw new Error('Super Admin role cannot be changed');
    }
    if (targetUser.role !== 'superadmin' && !['user', 'admin'].includes(updateData.role)) {
      throw new Error('Super Admin role cannot be assigned from portal');
    }
  }
  return updateData;
};

// Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const userScope = visibleUserScope(req.user);
    const ownUserIds = await ownUserIdsForAdmin(req.user);
    const logScope = ownUserIds ? { userId: { $in: ownUserIds } } : {};
    const [totalUsers, activeUsers, totalVehicles, totalSearches, recentLogs] = await Promise.all([
      User.countDocuments({ ...userScope, role: 'user' }),
      User.countDocuments({ ...userScope, role: 'user', isActive: true }),
      VehicleRecord.countDocuments(),
      SearchLog.countDocuments(logScope),
      SearchLog.find(logScope).sort({ createdAt: -1 }).limit(10).populate('userId', 'name email'),
    ]);

    const [notificationsTotal, unreadNotifications] = await Promise.all([
      Notification.countDocuments({ targetRoles: req.user.role }),
      Notification.countDocuments({ targetRoles: req.user.role, isRead: false }),
    ]);

    const serviceStats = await SearchLog.aggregate([
      ...(Object.keys(logScope).length ? [{ $match: logScope }] : []),
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalVehicles,
        totalSearches,
        notificationsTotal,
        unreadNotifications,
        serviceStats,
        recentLogs,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User Management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};
    Object.assign(query, visibleUserScope(req.user));

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    if (req.body.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Super Admin cannot be created from portal' });
    }
    if (!isSuperAdmin(req.user) && req.body.role && req.body.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can create admin users' });
    }
    const role = isSuperAdmin(req.user) && ['user', 'admin'].includes(req.body.role) ? req.body.role : 'user';
    const payload = { ...req.body, role, createdBy: req.user._id };
    const user = await User.create(payload);
    const sanitized = await User.findById(user._id).select('-password');
    res.status(201).json({ success: true, user: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (!canManageUser(req.user, existingUser)) {
      return res.status(403).json({ success: false, message: 'You can only manage users assigned to you' });
    }

    const updateData = sanitizeUserUpdate(req.body, req.user, existingUser);

    if (existingUser.role === 'superadmin' && updateData.isActive === false) {
      return res.status(400).json({ success: false, message: 'Super Admin cannot be deactivated' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!canManageUser(req.user, user)) {
      return res.status(403).json({ success: false, message: 'You can only delete users assigned to you' });
    }
    if (String(user._id) === String(req.user._id) || user.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'This account cannot be deleted' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!canManageUser(req.user, user)) {
      return res.status(403).json({ success: false, message: 'You can only manage users assigned to you' });
    }
    if (String(user._id) === String(req.user._id) || user.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'This account cannot be deactivated' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    const sanitized = await User.findById(user._id).select('-password');
    res.json({ success: true, user: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Vehicle Records Management
router.get('/vehicles', async (req, res) => {
  try {
    const { page = 1, limit = 20, province = '', search = '' } = req.query;
    const query = {};
    if (province) query.province = province;
    if (search) query.$or = [
      { registrationNo: { $regex: search, $options: 'i' } },
      { ownerName: { $regex: search, $options: 'i' } },
      { chassisNo: { $regex: search, $options: 'i' } },
    ];
    const vehicles = await VehicleRecord.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await VehicleRecord.countDocuments(query);
    res.json({ success: true, vehicles, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const vehicle = await VehicleRecord.create(req.body);
    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await VehicleRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    await VehicleRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Vehicle record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Search Logs
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, service = '' } = req.query;
    const query = service ? { service } : {};
    const ownUserIds = await ownUserIdsForAdmin(req.user);
    if (ownUserIds) query.userId = { $in: ownUserIds };
    const logs = await SearchLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate('userId', 'name email');
    const total = await SearchLog.countDocuments(query);
    res.json({ success: true, logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 25, unread } = req.query;
    const query = { targetRoles: req.user.role };
    if (unread === 'true') query.isRead = false;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Notification.countDocuments(query);
    res.json({ success: true, notifications, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
