// Check admin authentication
const adminRole = localStorage.getItem('adminRole');
if (!adminRole) {
    window.location.href = '/';
}

// Show super admin features if applicable
if (adminRole === 'super') {
    document.getElementById('admin-management-card').style.display = 'block';
}

// Navigation functions
function showDashboard() {
    hideAllSections();
    document.getElementById('admin-dashboard').style.display = 'grid';
}

function hideAllSections() {
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('dangerous-accounts-section').classList.add('hidden');
    document.getElementById('filter-words-section').classList.add('hidden');
    document.getElementById('rules-editor-section').classList.add('hidden');
    document.getElementById('daily-topic-section').classList.add('hidden');
    document.getElementById('all-users-section').classList.add('hidden');
    document.getElementById('message-expiry-section').classList.add('hidden');
    document.getElementById('admin-management-section').classList.add('hidden');
}

// Dangerous Accounts
async function showDangerousAccounts() {
    hideAllSections();
    document.getElementById('dangerous-accounts-section').classList.remove('hidden');
    
    try {
        const response = await fetch('/api/admin/reported-users');
        const data = await response.json();
        
        const tbody = document.getElementById('dangerous-users-tbody');
        tbody.innerHTML = '';
        
        if (data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Təhlükəli hesab yoxdur</td></tr>';
            return;
        }
        
        data.users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.fullname}</td>
                <td>${user.email}</td>
                <td>${user.faculty}</td>
                <td style="font-weight: 700; color: #dc3545;">${user.reportCount}</td>
                <td>
                    <span class="status-badge ${user.status}">${user.status === 'active' ? 'Aktiv' : 'Deaktiv'}</span>
                </td>
                <td>
                    <button class="toggle-status-btn ${user.status === 'active' ? 'deactivate' : 'activate'}" 
                            onclick="toggleUserStatus('${user.id}', '${user.status}')">
                        ${user.status === 'active' ? 'Deaktiv et' : 'Aktiv et'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Hesablar yüklənmədi:', error);
    }
}

// Filter Words
async function showFilterWords() {
    hideAllSections();
    document.getElementById('filter-words-section').classList.remove('hidden');
    
    try {
        const response = await fetch('/api/admin/filter-words');
        const data = await response.json();
        document.getElementById('filter-words-input').value = data.words;
    } catch (error) {
        console.error('Filtr sözləri yüklənmədi:', error);
    }
}

async function saveFilterWords() {
    const words = document.getElementById('filter-words-input').value;
    
    try {
        const response = await fetch('/api/admin/filter-words/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words })
        });
        
        if (response.ok) {
            alert('Filtr sözləri yeniləndi');
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Rules Editor
async function showRulesEditor() {
    hideAllSections();
    document.getElementById('rules-editor-section').classList.remove('hidden');
    
    try {
        const response = await fetch('/api/rules');
        const data = await response.json();
        document.getElementById('rules-input').value = data.rules;
    } catch (error) {
        console.error('Qaydalar yüklənmədi:', error);
    }
}

async function saveRules() {
    const rules = document.getElementById('rules-input').value;
    
    try {
        const response = await fetch('/api/admin/rules/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rules })
        });
        
        if (response.ok) {
            alert('Qaydalar yeniləndi');
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Daily Topic
async function showDailyTopicEditor() {
    hideAllSections();
    document.getElementById('daily-topic-section').classList.remove('hidden');
    
    try {
        const response = await fetch('/api/daily-topic');
        const data = await response.json();
        document.getElementById('daily-topic-input').value = data.topic;
    } catch (error) {
        console.error('Günün mövzusu yüklənmədi:', error);
    }
}

async function saveDailyTopic() {
    const topic = document.getElementById('daily-topic-input').value;
    
    try {
        const response = await fetch('/api/admin/daily-topic/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic })
        });
        
        if (response.ok) {
            alert('Günün mövzusu yeniləndi');
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// All Users
async function showAllUsers() {
    hideAllSections();
    document.getElementById('all-users-section').classList.remove('hidden');
    
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        document.getElementById('total-users').textContent = data.total;
        
        const tbody = document.getElementById('all-users-tbody');
        tbody.innerHTML = '';
        
        data.users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.fullname}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${user.faculty}</td>
                <td>${user.degree}</td>
                <td>${user.course}</td>
                <td>${user.reportCount || 0}</td>
                <td>
                    <span class="status-badge ${user.status}">${user.status === 'active' ? 'Aktiv' : 'Deaktiv'}</span>
                </td>
                <td>
                    <button class="toggle-status-btn ${user.status === 'active' ? 'deactivate' : 'activate'}" 
                            onclick="toggleUserStatus('${user.id}', '${user.status}')">
                        ${user.status === 'active' ? 'Deaktiv et' : 'Aktiv et'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('İstifadəçilər yüklənmədi:', error);
    }
}

// Toggle user status
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const confirmMsg = newStatus === 'banned' 
        ? 'Bu istifadəçini deaktiv etmək istədiyinizə əminsiniz?' 
        : 'Bu istifadəçini aktiv etmək istədiyinizə əminsiniz?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
        const response = await fetch('/api/admin/user/toggle-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, status: newStatus })
        });
        
        if (response.ok) {
            alert('Status dəyişdirildi');
            // Reload current view
            if (!document.getElementById('all-users-section').classList.contains('hidden')) {
                showAllUsers();
            } else if (!document.getElementById('dangerous-accounts-section').classList.contains('hidden')) {
                showDangerousAccounts();
            }
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Message Expiry
async function showMessageExpiry() {
    hideAllSections();
    document.getElementById('message-expiry-section').classList.remove('hidden');
    
    try {
        const response = await fetch('/api/admin/message-expiry');
        const data = await response.json();
        
        document.getElementById('group-expiry-input').value = data.group;
        document.getElementById('private-expiry-input').value = data.private;
    } catch (error) {
        console.error('Mesaj müddəti yüklənmədi:', error);
    }
}

async function saveMessageExpiry() {
    const groupHours = document.getElementById('group-expiry-input').value;
    const privateHours = document.getElementById('private-expiry-input').value;
    
    try {
        const response = await fetch('/api/admin/message-expiry/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupHours, privateHours })
        });
        
        if (response.ok) {
            alert('Mesaj silinmə müddəti yeniləndi');
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Admin Management (Super Admin Only)
async function showAdminManagement() {
    if (adminRole !== 'super') {
        alert('Bu səlahiyyət yalnız super admin üçündür');
        return;
    }
    
    hideAllSections();
    document.getElementById('admin-management-section').classList.remove('hidden');
    
    try {
        const response = await fetch('/api/admin/admins');
        const data = await response.json();
        
        const tbody = document.getElementById('admins-tbody');
        tbody.innerHTML = '';
        
        data.admins.forEach(admin => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${admin.username}</td>
                <td><span style="font-weight: 600; color: ${admin.role === 'super' ? '#dc3545' : '#4285f4'};">${admin.role === 'super' ? 'Super Admin' : 'Admin'}</span></td>
                <td>
                    ${admin.role !== 'super' ? `
                        <button class="toggle-status-btn deactivate" onclick="deleteAdmin('${admin.username}')">Sil</button>
                    ` : '<span style="color: #999;">Silinə bilməz</span>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Adminlər yüklənmədi:', error);
    }
}

// Create admin form
document.getElementById('create-admin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('new-admin-username').value;
    const password = document.getElementById('new-admin-password').value;
    
    try {
        const response = await fetch('/api/admin/create-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Yeni admin yaradıldı');
            document.getElementById('create-admin-form').reset();
            showAdminManagement();
        } else {
            alert(data.error || 'Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
});

// Delete admin
async function deleteAdmin(username) {
    if (!confirm(`${username} adminini silmək istədiyinizə əminsiniz?`)) return;
    
    try {
        const response = await fetch('/api/admin/delete-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        
        if (response.ok) {
            alert('Admin silindi');
            showAdminManagement();
        } else {
            alert('Xəta baş verdi');
        }
    } catch (error) {
        alert('Server xətası');
    }
}

// Logout
function adminLogout() {
    if (confirm('Çıxmaq istədiyinizə əminsiniz?')) {
        fetch('/api/logout', { method: 'POST' })
            .then(() => {
                localStorage.clear();
                window.location.href = '/';
            });
    }
}
