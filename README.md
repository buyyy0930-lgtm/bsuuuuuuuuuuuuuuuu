# BSU Chat - Bakı Dövlət Universiteti Tələbə Chat Platforması

## 📋 Layihə haqqında

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

- Bu layihə in-memory database istifadə edir (development üçün)
- Production-da real database (MongoDB, PostgreSQL və s.) istifadə edilməlidir
- Render.com-da deploy üçün hazırdır
- PM2 ilə process management

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
