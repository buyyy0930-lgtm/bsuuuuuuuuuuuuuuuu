const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const bcrypt = require('bcryptjs');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  createParentPath: true
}));

app.use(session({
  secret: 'bsu-chat-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 saat
    httpOnly: true
  }
}));

// In-memory verilənlər bazası (Render.com üçün - production-da real DB istifadə edin)
const database = {
  users: [],
  admins: [
    { username: 'ursamajor', password: bcrypt.hashSync('ursa618', 10), role: 'super' }
  ],
  messages: {}, // faculty -> messages[]
  privateMessages: {}, // userId1_userId2 -> messages[]
  blockedUsers: {}, // userId -> [blockedUserId1, ...]
  reports: {}, // userId -> reportCount
  rules: 'BSU Chat qaydalarına xoş gəlmisiniz!',
  dailyTopic: 'Bugün fakültənizlə bağlı fikirlərini paylaş!',
  bannedWords: ['spam', 'reklam'],
  messageExpiry: {
    group: 24, // saatlarla
    private: 48
  }
};

// Fakültələr
const FACULTIES = [
  'Mexanika-riyaziyyat fakültəsi',
  'Tətbiqi riyaziyyat və kibernetika fakültəsi',
  'Fizika fakültəsi',
  'Kimya fakültəsi',
  'Biologiya fakültəsi',
  'Ekologiya və torpaqşünaslıq fakültəsi',
  'Coğrafiya fakültəsi',
  'Geologiya fakültəsi',
  'Filologiya fakültəsi',
  'Tarix fakültəsi',
  'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi',
  'Hüquq fakültəsi',
  'Jurnalistika fakültəsi',
  'İnformasiya və sənəd menecmenti fakültəsi',
  'Şərqşünaslıq fakültəsi',
  'Sosial elmlər və psixologiya fakültəsi'
];

// Doğrulama sualları
const VERIFICATION_QUESTIONS = [
  { q: 'Mexanika-riyaziyyat fakültəsi hansı korpusda yerləşir?', a: '3' },
  { q: 'Tətbiqi riyaziyyat və kibernetika fakültəsi hansı korpusda yerləşir?', a: '3' },
  { q: 'Fizika fakültəsi hansı korpusda yerləşir?', a: 'əsas' },
  { q: 'Kimya fakültəsi hansı korpusda yerləşir?', a: 'əsas' },
  { q: 'Biologiya fakültəsi hansı korpusda yerləşir?', a: 'əsas' },
  { q: 'Ekologiya və torpaqşünaslıq fakültəsi hansı korpusda yerləşir?', a: 'əsas' },
  { q: 'Coğrafiya fakültəsi hansı korpusda yerləşir?', a: 'əsas' },
  { q: 'Geologiya fakültəsi hansı korpusda yerləşir?', a: 'əsas' },
  { q: 'Filologiya fakültəsi hansı korpusda yerləşir?', a: '1' },
  { q: 'Tarix fakültəsi hansı korpusda yerləşir?', a: '3' },
  { q: 'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi hansı korpusda yerləşir?', a: '1' },
  { q: 'Hüquq fakültəsi hansı korpusda yerləşir?', a: '1' },
  { q: 'Jurnalistika fakültəsi hansı korpusda yerləşir?', a: '2' },
  { q: 'İnformasiya və sənəd menecmenti fakültəsi hansı korpusda yerləşir?', a: '2' },
  { q: 'Şərqşünaslıq fakültəsi hansı korpusda yerləşir?', a: '2' },
  { q: 'Sosial elmlər və psixologiya fakültəsi hansı korpusda yerləşir?', a: '2' }
];

// Yardımçı funksiyalar
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getRandomQuestions(count = 3) {
  const shuffled = [...VERIFICATION_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function sanitizeMessage(message) {
  return sanitizeHtml(message, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

function filterMessage(message, bannedWords) {
  let filtered = message;
  bannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
}

function getBakuTime() {
  return new Date().toLocaleString('az-AZ', { 
    timeZone: 'Asia/Baku',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Mesaj avtomatik silinmə
setInterval(() => {
  const now = Date.now();
  
  // Qrup mesajlarını sil
  const groupExpiry = database.messageExpiry.group * 60 * 60 * 1000;
  Object.keys(database.messages).forEach(faculty => {
    database.messages[faculty] = database.messages[faculty].filter(msg => {
      return (now - msg.timestamp) < groupExpiry;
    });
  });
  
  // Şəxsi mesajları sil
  const privateExpiry = database.messageExpiry.private * 60 * 60 * 1000;
  Object.keys(database.privateMessages).forEach(key => {
    database.privateMessages[key] = database.privateMessages[key].filter(msg => {
      return (now - msg.timestamp) < privateExpiry;
    });
  });
}, 60000); // Hər dəqiqə yoxla

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    const { phone, email, password, fullname, faculty, degree, course, answers } = req.body;
    
    // Validasiya
    if (!phone || !phone.startsWith('+994') || phone.length !== 13) {
      return res.status(400).json({ error: 'Telefon nömrəsi düzgün formatda deyil (+994xxxxxxxxx)' });
    }
    
    if (!email || !email.endsWith('@bsu.edu.az')) {
      return res.status(400).json({ error: 'Email @bsu.edu.az ilə bitməlidir' });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Şifrə ən azı 6 simvol olmalıdır' });
    }
    
    if (!FACULTIES.includes(faculty)) {
      return res.status(400).json({ error: 'Fakültə düzgün seçilməyib' });
    }
    
    // Təkrar yoxlama
    const existingUser = database.users.find(u => u.email === email || u.phone === phone);
    if (existingUser) {
      if (existingUser.status === 'banned') {
        return res.status(403).json({ error: 'Bu hesab deaktiv edilib' });
      }
      return res.status(400).json({ error: 'Bu email və ya telefon artıq qeydiyyatdan keçib' });
    }
    
    // Doğrulama yoxlaması (minimum 2/3 düzgün cavab)
    let correctCount = 0;
    answers.forEach(answer => {
      const question = VERIFICATION_QUESTIONS.find(q => q.q === answer.question);
      if (question && question.a === answer.answer) {
        correctCount++;
      }
    });
    
    if (correctCount < 2) {
      return res.status(400).json({ error: 'Doğrulama uğursuz - minimum 2 sual düzgün cavablanmalıdır' });
    }
    
    // İstifadəçini yarat
    const userId = generateUserId();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: userId,
      phone,
      email,
      password: hashedPassword,
      fullname,
      faculty,
      degree,
      course: parseInt(course),
      avatar: null,
      status: 'active',
      createdAt: getBakuTime()
    };
    
    database.users.push(newUser);
    database.reports[userId] = 0;
    database.blockedUsers[userId] = [];
    
    res.json({ success: true, message: 'Qeydiyyat uğurla tamamlandı' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = database.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }
    
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Hesabınız deaktiv edilib' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }
    
    req.session.userId = user.id;
    req.session.userType = 'user';
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = database.admins.find(a => a.username === username);
    
    if (!admin) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }
    
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }
    
    req.session.adminUsername = admin.username;
    req.session.adminRole = admin.role;
    req.session.userType = 'admin';
    
    res.json({ success: true, role: admin.role });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server xətası' });
  }
});

app.get('/api/verification-questions', (req, res) => {
  const questions = getRandomQuestions(3);
  res.json({ questions: questions.map(q => ({ q: q.q, options: ['1', '2', '3', 'əsas'] })) });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş tələb olunur' });
  }
  
  const user = database.users.find(u => u.id === req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post('/api/user/update-profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş tələb olunur' });
  }
  
  const user = database.users.find(u => u.id === req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
  }
  
  const { fullname, faculty, degree, course } = req.body;
  
  if (fullname) user.fullname = fullname;
  if (faculty && FACULTIES.includes(faculty)) user.faculty = faculty;
  if (degree) user.degree = degree;
  if (course) user.course = parseInt(course);
  
  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, user: userWithoutPassword });
});

app.post('/api/user/upload-avatar', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş tələb olunur' });
  }
  
  if (!req.files || !req.files.avatar) {
    return res.status(400).json({ error: 'Şəkil yüklənmədi' });
  }
  
  const user = database.users.find(u => u.id === req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
  }
  
  const avatar = req.files.avatar;
  const ext = path.extname(avatar.name);
  const filename = `avatar_${req.session.userId}_${Date.now()}${ext}`;
  const uploadPath = path.join(__dirname, 'uploads', filename);
  
  await avatar.mv(uploadPath);
  user.avatar = `/uploads/${filename}`;
  
  res.json({ success: true, avatar: user.avatar });
});

app.get('/api/faculties', (req, res) => {
  res.json({ faculties: FACULTIES });
});

app.get('/api/rules', (req, res) => {
  res.json({ rules: database.rules });
});

app.get('/api/daily-topic', (req, res) => {
  res.json({ topic: database.dailyTopic });
});

// Admin API Routes
function requireAdmin(req, res, next) {
  if (!req.session.adminUsername || req.session.userType !== 'admin') {
    return res.status(403).json({ error: 'Admin girişi tələb olunur' });
  }
  next();
}

function requireSuperAdmin(req, res, next) {
  if (req.session.adminRole !== 'super') {
    return res.status(403).json({ error: 'Super admin səlahiyyəti tələb olunur' });
  }
  next();
}

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const usersWithoutPasswords = database.users.map(u => {
    const { password: _, ...userData } = u;
    return { ...userData, reportCount: database.reports[u.id] || 0 };
  });
  res.json({ users: usersWithoutPasswords, total: usersWithoutPasswords.length });
});

app.post('/api/admin/user/toggle-status', requireAdmin, (req, res) => {
  const { userId, status } = req.body;
  
  const user = database.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
  }
  
  user.status = status;
  res.json({ success: true });
});

app.post('/api/admin/rules/update', requireAdmin, (req, res) => {
  const { rules } = req.body;
  database.rules = rules;
  res.json({ success: true });
});

app.post('/api/admin/daily-topic/update', requireAdmin, (req, res) => {
  const { topic } = req.body;
  database.dailyTopic = topic;
  io.emit('daily-topic-updated', { topic });
  res.json({ success: true });
});

app.post('/api/admin/filter-words/update', requireAdmin, (req, res) => {
  const { words } = req.body;
  database.bannedWords = words.split(',').map(w => w.trim()).filter(w => w);
  res.json({ success: true });
});

app.get('/api/admin/filter-words', requireAdmin, (req, res) => {
  res.json({ words: database.bannedWords.join(', ') });
});

app.get('/api/admin/reported-users', requireAdmin, (req, res) => {
  const reported = database.users
    .filter(u => database.reports[u.id] >= 16)
    .map(u => {
      const { password: _, ...userData } = u;
      return { ...userData, reportCount: database.reports[u.id] };
    });
  res.json({ users: reported });
});

app.post('/api/admin/message-expiry/update', requireAdmin, (req, res) => {
  const { groupHours, privateHours } = req.body;
  database.messageExpiry.group = parseInt(groupHours) || 24;
  database.messageExpiry.private = parseInt(privateHours) || 48;
  res.json({ success: true });
});

app.get('/api/admin/message-expiry', requireAdmin, (req, res) => {
  res.json(database.messageExpiry);
});

app.post('/api/admin/create-admin', requireAdmin, requireSuperAdmin, async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
  }
  
  const exists = database.admins.find(a => a.username === username);
  if (exists) {
    return res.status(400).json({ error: 'Bu istifadəçi adı artıq mövcuddur' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  database.admins.push({ username, password: hashedPassword, role: 'admin' });
  
  res.json({ success: true });
});

app.post('/api/admin/delete-admin', requireAdmin, requireSuperAdmin, (req, res) => {
  const { username } = req.body;
  
  if (username === 'ursamajor') {
    return res.status(400).json({ error: 'Super admin silinə bilməz' });
  }
  
  database.admins = database.admins.filter(a => a.username !== username);
  res.json({ success: true });
});

app.get('/api/admin/admins', requireAdmin, requireSuperAdmin, (req, res) => {
  const admins = database.admins.map(a => ({ username: a.username, role: a.role }));
  res.json({ admins });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-faculty', ({ userId, faculty }) => {
    const user = database.users.find(u => u.id === userId);
    if (!user || user.status !== 'active') {
      socket.emit('error', { message: 'İstifadəçi tapılmadı və ya deaktivdir' });
      return;
    }
    
    socket.userId = userId;
    socket.faculty = faculty;
    socket.join(faculty);
    
    // Fakültə mesajlarını göndər
    if (!database.messages[faculty]) {
      database.messages[faculty] = [];
    }
    socket.emit('faculty-messages', { messages: database.messages[faculty] });
  });
  
  socket.on('send-faculty-message', ({ userId, faculty, message }) => {
    const user = database.users.find(u => u.id === userId);
    if (!user || user.status !== 'active') return;
    
    if (!database.messages[faculty]) {
      database.messages[faculty] = [];
    }
    
    const filteredMessage = filterMessage(sanitizeMessage(message), database.bannedWords);
    
    const messageData = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      fullname: user.fullname,
      faculty: user.faculty,
      degree: user.degree,
      course: user.course,
      avatar: user.avatar,
      message: filteredMessage,
      timestamp: Date.now(),
      time: getBakuTime()
    };
    
    database.messages[faculty].push(messageData);
    
    // Fakültəyə mesajı göndər (real-time)
    io.to(faculty).emit('new-faculty-message', messageData);
  });
  
  socket.on('join-private-chat', ({ userId, otherUserId }) => {
    const user = database.users.find(u => u.id === userId);
    const otherUser = database.users.find(u => u.id === otherUserId);
    
    if (!user || !otherUser) return;
    
    const chatId = [userId, otherUserId].sort().join('_');
    socket.join(chatId);
    
    if (!database.privateMessages[chatId]) {
      database.privateMessages[chatId] = [];
    }
    
    socket.emit('private-messages', { messages: database.privateMessages[chatId] });
  });
  
  socket.on('send-private-message', ({ userId, otherUserId, message }) => {
    const user = database.users.find(u => u.id === userId);
    const otherUser = database.users.find(u => u.id === otherUserId);
    
    if (!user || !otherUser || user.status !== 'active') return;
    
    // Əngəllənmə yoxlaması
    const otherBlockedList = database.blockedUsers[otherUserId] || [];
    if (otherBlockedList.includes(userId)) {
      socket.emit('error', { message: 'Bu istifadəçi sizi əngəlləyib' });
      return;
    }
    
    const chatId = [userId, otherUserId].sort().join('_');
    
    if (!database.privateMessages[chatId]) {
      database.privateMessages[chatId] = [];
    }
    
    const filteredMessage = filterMessage(sanitizeMessage(message), database.bannedWords);
    
    const messageData = {
      id: 'pmsg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      senderId: userId,
      receiverId: otherUserId,
      senderName: user.fullname,
      senderAvatar: user.avatar,
      message: filteredMessage,
      timestamp: Date.now(),
      time: getBakuTime()
    };
    
    database.privateMessages[chatId].push(messageData);
    io.to(chatId).emit('new-private-message', messageData);
  });
  
  socket.on('block-user', ({ userId, targetUserId }) => {
    if (!database.blockedUsers[userId]) {
      database.blockedUsers[userId] = [];
    }
    
    if (!database.blockedUsers[userId].includes(targetUserId)) {
      database.blockedUsers[userId].push(targetUserId);
    }
    
    socket.emit('user-blocked', { targetUserId });
  });
  
  socket.on('report-user', ({ userId, targetUserId }) => {
    if (!database.reports[targetUserId]) {
      database.reports[targetUserId] = 0;
    }
    
    database.reports[targetUserId]++;
    socket.emit('user-reported', { targetUserId });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// HTML səhifələri
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Server başlat
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BSU Chat Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Network: http://0.0.0.0:${PORT}`);
});
