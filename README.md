# BSU Chat - Bakı Dövlət Universiteti Tələbə Chat Platforması

## 🗄️ Database (Davamlı Məlumat Saxlama)

**SQLite File-Based Database** istifadə edilir - server yenilənəndə məlumatlar silinmir.

### Saxlanan Məlumatlar
- **İstifadəçilər**: ad-soyad, email, telefon, fakültə, dərəcə, kurs, profil şəkli, status
- **Adminlər**: istifadəçi adı, şifrə (hash), rol (super/admin)
- **Əngəllənmələr**: hansı istifadəçi kimi əngəlləyib
- **Şikayətlər**: hər istifadəçinin şikayət sayı
- **Ayarlar**: qaydalar, günün mövzusu, filtr sözləri, mesaj silinmə müddəti

### Mesajlar (In-Memory)
- **Qrup mesajları** və **şəxsi mesajlar** in-memory saxlanır
- Server restart edildikdə mesajlar silinir
- Mesaj silinmə müddəti admin panelindən idarə olunur

### Database Faylı
- **Yer**: `/home/user/webapp/data/bsu_chat.db`
- **.gitignore**: `data/*.db*` (database faylları git-ə commit olunmur)
- **Backup**: layihəni backup edərkən database daxildir

### Render.com Production
- Render.com-da database saxlanılır (file-based)
- Server restart edildikdə məlumatlar qalır
- Session üçün production-da Redis/MongoDB tövsiyə olunur

---

## 📱 Layihə haqqında

**BSU Chat** Bakı Dövlət Universiteti tələbələri üçün hazırlanmış real-time mesajlaşma platformasıdır. 16 fakültənin hər biri üçün ayrıca chat otaqları, şəxsi mesajlaşma, admin paneli və s. funksiyalar daxildir.

## ✨ Əsas Xüsusiyyətlər

### 👥 İstifadəçi Funksiyaları
- ✅ @bsu.edu.az email ilə qeydiyyat
- ✅ +994 telefon nömrəsi ilə qeydiyyat
- ✅ 16 sualdan 3-ü random şəkildə doğrulama (minimum 2 düzgün cavab)
- ✅ 16 fakültə üçün ayrı chat otaqları
- ✅ Real-time qrup mesajlaşma
- ✅ Şəxsi mesajlaşma
- ✅ Profil redaktəsi (ad, soyad, fakültə, kurs, dərəcə)
- ✅ Profil şəkli yükləmə
- ✅ İstifadəçiləri əngəlləmə
- ✅ İstifadəçiləri şikayət etmə
- ✅ Qaydalar bölməsi
- ✅ Günün mövzusu

### 🛡️ Admin Funksiyaları
- ✅ Təhlükəli hesablar (16+ şikayət)
- ✅ Filtr sözləri idarəetməsi
- ✅ Qaydaları redaktə etmə
- ✅ Günün mövzusunu dəyişmə
- ✅ Bütün istifadəçiləri görüntüləmə və idarə etmə
- ✅ İstifadəçiləri aktiv/deaktiv etmə
- ✅ Mesaj avtomatik silinmə vaxtını ayarlama (qrup və şəxsi)
- ✅ Super admin: alt adminlər yaratma/silmə

## 🔧 Texnologiyalar

- **Backend**: Node.js, Express.js
- **Real-time**: Socket.IO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Session**: Express Session
- **File Upload**: Express FileUpload
- **Security**: bcryptjs, sanitize-html

## 🚀 Quraşdırma və İstifadə

### 🌐 Live Demo

**Sandbox URL**: https://3000-iotb3g0x0iszp1m517mt3-2e77fc33.sandbox.novita.ai

**GitHub Repository**: https://github.com/buyyy0930-lgtm/bsuuuuuuuuuuuuuuuu

### Lokal Development

```bash
# Dependencies yükləyin
npm install

# Serveri başladın
npm start

# və ya PM2 ilə
pm2 start ecosystem.config.cjs

# Server http://localhost:3000 ünvanında işləyəcək
```

### 📁 Layihə Strukturu

```
webapp/
├── server.js              # Əsas server faylı
├── package.json           # Dependencies
├── ecosystem.config.cjs   # PM2 konfiqurasiya
├── public/                # Frontend faylları
│   ├── index.html         # Giriş/Qeydiyyat səhifəsi
│   ├── chat.html          # Chat səhifəsi
│   ├── admin.html         # Admin paneli
│   ├── css/
│   │   └── style.css      # Əsas CSS
│   └── js/
│       ├── auth.js        # Giriş/Qeydiyyat məntiqləri
│       ├── chat.js        # Chat məntiqləri
│       └── admin.js       # Admin paneli məntiqləri
└── uploads/               # Profil şəkilləri

```

## 👤 Admin Girişi

**Super Admin:**
- İstifadəçi adı: `ursamajor`
- Şifrə: `ursa618`

## 📊 Fakültələr

1. Mexanika-riyaziyyat fakültəsi
2. Tətbiqi riyaziyyat və kibernetika fakültəsi
3. Fizika fakültəsi
4. Kimya fakültəsi
5. Biologiya fakültəsi
6. Ekologiya və torpaqşünaslıq fakültəsi
7. Coğrafiya fakültəsi
8. Geologiya fakültəsi
9. Filologiya fakültəsi
10. Tarix fakültəsi
11. Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi
12. Hüquq fakültəsi
13. Jurnalistika fakültəsi
14. İnformasiya və sənəd menecmenti fakültəsi
15. Şərqşünaslıq fakültəsi
16. Sosial elmlər və psixologiya fakültəsi

## 🔒 Təhlükəsizlik

- Bütün şifrələr bcrypt ilə hash-lənir
- Session-based authentication
- HTML injection-dan qorunma
- File upload limitləri (5MB)
- Email və telefon validasiyası
- Doğrulama sualları sistemi

## 📝 Qeydlər

- ✅ **SQLite file-based database** istifadə edilir (production-ready)
- ✅ İstifadəçi məlumatları, adminlər, əngəllənmələr və s. davamlı saxlanır
- ✅ Mesajlar in-memory (server restart edildikdə silinir)
- ✅ Render.com-da deploy üçün hazırdır
- ✅ PM2 ilə process management
- 🔄 Session üçün production-da Redis/MongoDB tövsiyə olunur

## 🛠️ Texniki Detallar

### Backend
- **Node.js + Express**: Server framework
- **Socket.IO**: Real-time mesajlaşma
- **better-sqlite3**: SQLite database (file-based, persistent)
- **bcryptjs**: Şifrə hash-ləmə
- **sanitize-html**: XSS protection
- **compression**: Response sıxışdırma (gzip)

### Frontend
- **HTML/CSS/JavaScript**: Vanilla JS (framework yoxdur)
- **Socket.IO Client**: Real-time bağlantı
- **TailwindCSS CDN**: Styling
- **Font Awesome**: İkonlar

### Database Structure
- **users**: İstifadəçi məlumatları (id, email, phone, fullname, faculty, degree, course, avatar, status, created_at)
- **admins**: Admin hesabları (username, password hash, role)
- **blocked_users**: Əngəllənmələr (user_id -> blocked_user_id)
- **user_reports**: Şikayətlər (user_id -> report_count)
- **settings**: Sistem ayarları (rules, dailyTopic, bannedWords, messageExpiry və s.)

### Mesaj Silinmə
- **Qrup mesajları**: Admin panelindən dəqiqə/saat seçilir (default: 1440 dəqiqə = 24 saat)
- **Şəxsi mesajlar**: Ayrıca ayarlanır (default: 2880 dəqiqə = 48 saat)
- **Cleanup**: Hər dəqiqə avtomatik yoxlanır və köhnə mesajlar silinir

### Session
- **Development**: express-session (in-memory) - server restart edildikdə sessionlar silinir
- **Production**: MongoDB/Redis session store tövsiyə olunur

### Port və Environment
- **PORT**: `process.env.PORT || 3000`
- **Database**: `data/bsu_chat.db` (SQLite file)

## 🌐 Deployment (Render.com)

1. GitHub repository yaradın və kodu push edin
2. Render.com-da yeni Web Service yaradın
3. Repository-ni bağlayın
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Deploy edin

## 🎯 Xüsusiyyətlər

- ✅ Responsive dizayn (mobil və desktop)
- ✅ Real-time mesajlaşma
- ✅ Auto-scroll mesajlar
- ✅ Mesaj filtrasiyası
- ✅ Avtomatik mesaj silinmə
- ✅ Profil idarəetməsi
- ✅ Admin paneli
- ✅ İstifadəçi əngəlləmə və şikayət sistemi

## 📄 Lisenziya

MIT License

## 🤝 İrtibat

Bakı Dövlət Universiteti - BSU Chat Development Team

---

**Qeyd**: Bu layihə Bakı Dövlət Universiteti tələbələri üçün xüsusi olaraq hazırlanmışdır. Yalnız @bsu.edu.az email sonluqları ilə qeydiyyat mümkündür.
