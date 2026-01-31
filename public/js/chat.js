// Check authentication
const userId = localStorage.getItem('userId');
if (!userId) {
    window.location.href = '/';
}

// Socket.IO connection with optimization
const socket = io({
    transports: ['websocket', 'polling'],
    upgrade: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

// Global variables
let currentUser = null;
let currentFaculty = null;
let currentChatUser = null;
let faculties = [];

// Performance optimization: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance optimization: Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data;
            document.getElementById('user-info').textContent = 
                `${data.fullname} - ${data.faculty} - ${data.degree} - ${data.course}-ci kurs`;
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Profil yüklənmədi:', error);
        window.location.href = '/';
    }
}

// Load faculties
async function loadFaculties() {
    try {
        const response = await fetch('/api/faculties');
        const data = await response.json();
        faculties = data.faculties;
        
        const grid = document.getElementById('faculty-grid');
        grid.innerHTML = '';
        
        faculties.forEach(faculty => {
            const card = document.createElement('div');
            card.className = 'faculty-card';
            card.onclick = () => joinFaculty(faculty);
            
            card.innerHTML = `
                <div class="faculty-icon">👥</div>
                <div class="faculty-name">${faculty}</div>
                <div class="faculty-info">
                    <span>💬 Chat otağı</span>
                </div>
            `;
            
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Fakültələr yüklənmədi:', error);
    }
}

// Load daily topic
async function loadDailyTopic() {
    try {
        const response = await fetch('/api/daily-topic');
        const data = await response.json();
        document.getElementById('daily-topic').textContent = data.topic;
    } catch (error) {
        console.error('Günün mövzusu yüklənmədi:', error);
    }
}

// Join faculty chat
function joinFaculty(faculty) {
    currentFaculty = faculty;
    
    document.getElementById('faculty-rooms-view').classList.add('hidden');
    document.getElementById('chat-room-view').classList.remove('hidden');
    document.getElementById('chat-room-title').textContent = faculty;
    
    // Clear messages
    document.getElementById('chat-messages').innerHTML = '';
    
    // Join socket room
    socket.emit('join-faculty', { userId, faculty });
}

// Back to faculties
function backToFaculties() {
    currentFaculty = null;
    document.getElementById('chat-room-view').classList.add('hidden');
    document.getElementById('faculty-rooms-view').classList.remove('hidden');
}

// Send message
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message || !currentFaculty) return;
    
    socket.emit('send-faculty-message', {
        userId,
        faculty: currentFaculty,
        message
    });
    
    input.value = '';
    input.style.height = 'auto';
}

// Display faculty message (optimized)
function displayFacultyMessage(msg) {
    const messagesContainer = document.getElementById('chat-messages');
    
    // Əngəlləmə yoxlaması - client-side
    const currentUserBlockedList = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
    if (currentUserBlockedList.includes(msg.userId)) {
        return; // Əngəllənmiş istifadəçinin mesajını göstərmə
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.userId = msg.userId;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    if (msg.avatar) {
        const img = document.createElement('img');
        img.src = msg.avatar;
        img.alt = 'Avatar';
        img.loading = 'lazy'; // Lazy load images
        avatarDiv.appendChild(img);
    } else {
        avatarDiv.textContent = msg.fullname.charAt(0).toUpperCase();
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    headerDiv.innerHTML = `
        <span class="message-author">${msg.fullname}</span>
        <span class="message-info">${msg.faculty} • ${msg.degree} • ${msg.course}-ci kurs</span>
        <span class="message-time">${msg.time}</span>
    `;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = `
        <p class="message-text">${escapeHtml(msg.message)}</p>
        ${msg.userId !== userId ? `
            <div class="message-actions">
                <button class="message-menu-btn" onclick="toggleMessageMenu(event, '${msg.userId}', '${msg.fullname}')">⋮</button>
                <div class="message-menu">
                    <div class="message-menu-item" onclick="openPrivateChat('${msg.userId}', '${msg.fullname}')">
                        💬 Şəxsi mesaj
                    </div>
                    <div class="message-menu-item danger" onclick="blockUser('${msg.userId}')">
                        🚫 Əngəllə
                    </div>
                    <div class="message-menu-item danger" onclick="reportUser('${msg.userId}')">
                        ⚠️ Şikayət et
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(bubbleDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    fragment.appendChild(messageDiv);
    messagesContainer.appendChild(fragment);
    
    // Throttled smooth auto scroll
    throttledScroll(messagesContainer);
}

// Throttled scroll function
const throttledScroll = throttle((container) => {
    requestAnimationFrame(() => {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    });
}, 100);

// Toggle message menu
function toggleMessageMenu(event, userId, fullname) {
    event.stopPropagation();
    
    const menu = event.target.nextElementSibling;
    
    // Close other menus
    document.querySelectorAll('.message-menu').forEach(m => {
        if (m !== menu) m.classList.remove('active');
    });
    
    menu.classList.toggle('active');
}

// Toggle private message menu
function togglePrivateMessageMenu(event, userId) {
    event.stopPropagation();
    
    const menu = event.target.nextElementSibling;
    
    // Close other menus
    document.querySelectorAll('.message-menu').forEach(m => {
        if (m !== menu) m.classList.remove('active');
    });
    
    menu.classList.toggle('active');
}

// Close menus on outside click
document.addEventListener('click', () => {
    document.querySelectorAll('.message-menu').forEach(m => m.classList.remove('active'));
});

// Open private chat
function openPrivateChat(otherUserId, otherUserName) {
    currentChatUser = { id: otherUserId, name: otherUserName };
    
    document.getElementById('chat-room-view').classList.add('hidden');
    document.getElementById('private-chat-view').classList.remove('hidden');
    document.getElementById('private-chat-title').textContent = `💬 ${otherUserName}`;
    
    // Clear messages
    document.getElementById('private-messages').innerHTML = '';
    
    // Join private chat room
    socket.emit('join-private-chat', { userId, otherUserId });
}

// Back to group chat
function backToGroupChat() {
    currentChatUser = null;
    document.getElementById('private-chat-view').classList.add('hidden');
    document.getElementById('chat-room-view').classList.remove('hidden');
}

// Send private message
function sendPrivateMessage() {
    const input = document.getElementById('private-message-input');
    const message = input.value.trim();
    
    if (!message || !currentChatUser) return;
    
    socket.emit('send-private-message', {
        userId,
        otherUserId: currentChatUser.id,
        message
    });
    
    input.value = '';
    input.style.height = 'auto';
}

// Display private message (optimized)
function displayPrivateMessage(msg) {
    const messagesContainer = document.getElementById('private-messages');
    
    // Əngəlləmə yoxlaması
    const currentUserBlockedList = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
    if (currentUserBlockedList.includes(msg.senderId)) {
        return; // Əngəllənmiş istifadəçinin mesajını göstərmə
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.senderId = msg.senderId;
    
    const isSent = msg.senderId === userId;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    if (msg.senderAvatar) {
        const img = document.createElement('img');
        img.src = msg.senderAvatar;
        img.alt = 'Avatar';
        img.loading = 'lazy'; // Lazy load images
        avatarDiv.appendChild(img);
    } else {
        avatarDiv.textContent = msg.senderName.charAt(0).toUpperCase();
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';
    headerDiv.innerHTML = `
        <span class="message-author">${isSent ? 'Siz' : msg.senderName}</span>
        <span class="message-time">${msg.time}</span>
    `;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = `
        <p class="message-text">${escapeHtml(msg.message)}</p>
        ${!isSent ? `
            <div class="message-actions">
                <button class="message-menu-btn" onclick="togglePrivateMessageMenu(event, '${msg.senderId}')">⋮</button>
                <div class="message-menu">
                    <div class="message-menu-item danger" onclick="blockUser('${msg.senderId}')">
                        🚫 Əngəllə
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(bubbleDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    fragment.appendChild(messageDiv);
    messagesContainer.appendChild(fragment);
    
    // Throttled smooth auto scroll
    throttledScroll(messagesContainer);
}

// Block user
function blockUser(targetUserId) {
    if (confirm('Bu istifadəçini əngəlləmək istədiyinizə əminsiniz?')) {
        socket.emit('block-user', { userId, targetUserId });
        
        // localStorage-da saxla
        const blockedList = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
        if (!blockedList.includes(targetUserId)) {
            blockedList.push(targetUserId);
            localStorage.setItem('blockedUsers', JSON.stringify(blockedList));
        }
        
        alert('İstifadəçi əngəlləndi');
        
        // Hide messages from blocked user
        document.querySelectorAll(`[data-user-id="${targetUserId}"], [data-sender-id="${targetUserId}"]`).forEach(msg => {
            msg.style.display = 'none';
        });
        
        // Close private chat if active
        if (currentChatUser && currentChatUser.id === targetUserId) {
            backToGroupChat();
        }
    }
}

// Report user
function reportUser(targetUserId) {
    if (confirm('Bu istifadəçi haqqında şikayət göndərmək istədiyinizə əminsiniz?')) {
        socket.emit('report-user', { userId, targetUserId });
        alert('Şikayət göndərildi');
    }
}

// Logout
function logout() {
    if (confirm('Çıxmaq istədiyinizə əminsiniz?')) {
        fetch('/api/logout', { method: 'POST' })
            .then(() => {
                localStorage.clear();
                window.location.href = '/';
            });
    }
}

// Rules modal
function showRulesModal() {
    fetch('/api/rules')
        .then(res => res.json())
        .then(data => {
            document.getElementById('rules-content').innerHTML = `<p style="white-space: pre-wrap;">${escapeHtml(data.rules)}</p>`;
            document.getElementById('rules-modal').classList.add('active');
        });
}

function closeRulesModal() {
    document.getElementById('rules-modal').classList.remove('active');
}

// Profile modal
async function showProfileModal() {
    try {
        // Load faculties for select
        const facultiesResponse = await fetch('/api/faculties');
        const facultiesData = await facultiesResponse.json();
        
        const facultySelect = document.getElementById('edit-faculty');
        facultySelect.innerHTML = '';
        facultiesData.faculties.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty;
            option.textContent = faculty;
            facultySelect.appendChild(option);
        });
        
        // Load current profile
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data;
            
            // Set avatar
            const avatarLarge = document.getElementById('profile-avatar-large');
            if (data.avatar) {
                avatarLarge.innerHTML = `<img src="${data.avatar}" alt="Avatar">`;
            } else {
                avatarLarge.textContent = data.fullname.charAt(0).toUpperCase();
            }
            
            // Set profile info
            document.getElementById('profile-fullname').textContent = data.fullname;
            document.getElementById('profile-faculty').textContent = `${data.faculty} • ${data.degree} • ${data.course}-ci kurs`;
            
            // Set form values
            document.getElementById('edit-fullname').value = data.fullname;
            document.getElementById('edit-faculty').value = data.faculty;
            document.getElementById('edit-degree').value = data.degree;
            document.getElementById('edit-course').value = data.course;
            
            document.getElementById('profile-modal').classList.add('active');
        }
    } catch (error) {
        console.error('Profil yüklənmədi:', error);
    }
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

// Upload avatar
async function uploadAvatar() {
    const fileInput = document.getElementById('avatar-file-input');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Şəkil 5MB-dan böyük ola bilməz');
        return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const response = await fetch('/api/user/upload-avatar', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.avatar = data.avatar;
            document.getElementById('profile-avatar-large').innerHTML = `<img src="${data.avatar}" alt="Avatar">`;
            alert('Profil şəkli yükləndi');
        } else {
            alert(data.error || 'Yükləmə uğursuz oldu');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Update profile
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updateData = {
        fullname: formData.get('fullname'),
        faculty: formData.get('faculty'),
        degree: formData.get('degree'),
        course: formData.get('course')
    };
    
    try {
        const response = await fetch('/api/user/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            document.getElementById('user-info').textContent = 
                `${data.user.fullname} - ${data.user.faculty} - ${data.user.degree} - ${data.user.course}-ci kurs`;
            alert('Profil yeniləndi');
            closeProfileModal();
        } else {
            alert(data.error || 'Yeniləmə uğursuz oldu');
        }
    } catch (error) {
        alert('Server xətası');
    }
});

// Socket.IO event listeners
socket.on('faculty-messages', (data) => {
    data.messages.forEach(msg => displayFacultyMessage(msg));
});

socket.on('new-faculty-message', (msg) => {
    displayFacultyMessage(msg);
});

socket.on('private-messages', (data) => {
    data.messages.forEach(msg => displayPrivateMessage(msg));
});

socket.on('new-private-message', (msg) => {
    displayPrivateMessage(msg);
});

socket.on('daily-topic-updated', (data) => {
    document.getElementById('daily-topic').textContent = data.topic;
});

socket.on('error', (data) => {
    alert(data.message);
});

// Auto-resize textarea
document.getElementById('message-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

document.getElementById('private-message-input').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Enter to send
document.getElementById('message-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

document.getElementById('private-message-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendPrivateMessage();
    }
});

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
loadUserProfile();
loadFaculties();
loadDailyTopic();

// Close modals on outside click
document.getElementById('rules-modal').addEventListener('click', function(e) {
    if (e.target === this) closeRulesModal();
});

document.getElementById('profile-modal').addEventListener('click', function(e) {
    if (e.target === this) closeProfileModal();
});
