// Helper functions to work with database
const { dbHelpers } = require('./database');

// Get all users
function getAllUsers() {
  const users = dbHelpers.getAllUsers.all();
  return users.map(u => {
    const reportResult = dbHelpers.getReportCount.get(u.id);
    return {
      ...u,
      reportCount: reportResult ? reportResult.report_count : 0
    };
  });
}

// Get user by ID
function getUserById(userId) {
  return dbHelpers.getUserById.get(userId);
}

// Update user status
function updateUserStatus(userId, status) {
  dbHelpers.updateUserStatus.run(status, userId);
}

// Get blocked users for a user
function getBlockedUsersForUser(userId) {
  const blocked = dbHelpers.getBlockedUsers.all(userId);
  return blocked.map(b => b.blocked_user_id);
}

// Block a user
function blockUser(userId, targetUserId) {
  dbHelpers.blockUser.run(userId, targetUserId);
}

// Report a user
function reportUser(targetUserId) {
  dbHelpers.incrementReport.run(targetUserId);
}

// Get report count
function getReportCount(userId) {
  const result = dbHelpers.getReportCount.get(userId);
  return result ? result.report_count : 0;
}

// Get users with 16+ reports
function getReportedUsers() {
  const allReports = dbHelpers.getAllReports.all();
  const reported = allReports.filter(r => r.report_count >= 16);
  
  return reported.map(r => {
    const user = getUserById(r.user_id);
    if (user) {
      const { password, ...userData } = user;
      return { ...userData, reportCount: r.report_count };
    }
    return null;
  }).filter(u => u !== null);
}

// Settings helpers
function getSetting(key) {
  const result = dbHelpers.getSetting.get(key);
  return result ? result.value : null;
}

function setSetting(key, value) {
  dbHelpers.setSetting.run(key, value);
}

function getRules() {
  return getSetting('rules') || 'BSU Chat qaydalarına xoş gəlmisiniz!';
}

function setRules(rules) {
  setSetting('rules', rules);
}

function getDailyTopic() {
  return getSetting('dailyTopic') || 'Bugün fakültənizlə bağlı fikirlərini paylaş!';
}

function setDailyTopic(topic) {
  setSetting('dailyTopic', topic);
}

function getBannedWords() {
  const words = getSetting('bannedWords') || '';
  return words.split(',').map(w => w.trim()).filter(w => w);
}

function setBannedWords(words) {
  setSetting('bannedWords', words);
}

function getMessageExpiry() {
  return {
    groupMinutes: parseInt(getSetting('groupExpiryMinutes')) || 1440,
    groupUnit: getSetting('groupExpiryUnit') || 'hours',
    groupHours: Math.floor((parseInt(getSetting('groupExpiryMinutes')) || 1440) / 60),
    privateMinutes: parseInt(getSetting('privateExpiryMinutes')) || 2880,
    privateUnit: getSetting('privateExpiryUnit') || 'hours',
    privateHours: Math.floor((parseInt(getSetting('privateExpiryMinutes')) || 2880) / 60)
  };
}

function setMessageExpiry(groupMinutes, groupUnit, privateMinutes, privateUnit) {
  setSetting('groupExpiryMinutes', groupMinutes.toString());
  setSetting('groupExpiryUnit', groupUnit);
  setSetting('privateExpiryMinutes', privateMinutes.toString());
  setSetting('privateExpiryUnit', privateUnit);
}

// Admin helpers
function getAllAdmins() {
  return dbHelpers.getAllAdmins.all();
}

function createAdmin(username, hashedPassword, role) {
  dbHelpers.createAdmin.run(username, hashedPassword, role);
}

function deleteAdmin(username) {
  dbHelpers.deleteAdmin.run(username);
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getBlockedUsersForUser,
  blockUser,
  reportUser,
  getReportCount,
  getReportedUsers,
  getRules,
  setRules,
  getDailyTopic,
  setDailyTopic,
  getBannedWords,
  setBannedWords,
  getMessageExpiry,
  setMessageExpiry,
  getAllAdmins,
  createAdmin,
  deleteAdmin
};
