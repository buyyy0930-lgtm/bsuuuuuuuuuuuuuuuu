// Tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        showTab(targetTab);
    });
});

function showTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Load faculties
async function loadFaculties() {
    try {
        const response = await fetch('/api/faculties');
        const data = await response.json();
        
        const select = document.querySelector('[name="faculty"]');
        data.faculties.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty;
            option.textContent = faculty;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Fakültələr yüklənmədi:', error);
    }
}

loadFaculties();

// Phone input formatting
const phoneInput = document.querySelector('[name="phone"]');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) value = value.slice(0, 9);
        e.target.value = value;
    });
}

// Verification Modal
const verificationModal = document.getElementById('verification-modal');
const modalClose = document.querySelector('.modal-close');
let verificationQuestions = [];
let registerFormData = {};

document.getElementById('start-verification').addEventListener('click', async () => {
    // Collect form data
    const form = document.getElementById('register-form');
    const formData = new FormData(form);
    
    const phone = '+994' + formData.get('phone');
    const emailUsername = formData.get('email-username');
    const email = emailUsername + '@bsu.edu.az';
    const password = formData.get('password');
    const fullname = formData.get('fullname');
    const faculty = formData.get('faculty');
    const degree = formData.get('degree');
    const course = formData.get('course');
    
    // Validate
    if (!formData.get('phone') || formData.get('phone').length !== 9) {
        showError('Telefon nömrəsi 9 rəqəm olmalıdır');
        return;
    }
    
    if (!emailUsername || !email.includes('@')) {
        showError('Email düzgün formatda deyil');
        return;
    }
    
    if (!password || password.length < 6) {
        showError('Şifrə ən azı 6 simvol olmalıdır');
        return;
    }
    
    if (!fullname || !faculty || !degree || !course) {
        showError('Bütün sahələri doldurun');
        return;
    }
    
    // Save form data
    registerFormData = { phone, email, password, fullname, faculty, degree, course };
    
    // Load verification questions
    try {
        const response = await fetch('/api/verification-questions');
        const data = await response.json();
        verificationQuestions = data.questions;
        
        // Display questions
        const questionsContainer = document.getElementById('verification-questions');
        questionsContainer.innerHTML = '';
        
        data.questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'verification-question';
            questionDiv.innerHTML = `
                <label>${index + 1}. ${q.q}</label>
                <div class="verification-options">
                    ${q.options.map(opt => `
                        <label class="verification-option">
                            <input type="radio" name="question-${index}" value="${opt}" required>
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            questionsContainer.appendChild(questionDiv);
        });
        
        verificationModal.classList.add('active');
    } catch (error) {
        showError('Doğrulama sualları yüklənmədi');
    }
});

modalClose.addEventListener('click', () => {
    verificationModal.classList.remove('active');
});

verificationModal.addEventListener('click', (e) => {
    if (e.target === verificationModal) {
        verificationModal.classList.remove('active');
    }
});

// Verification form submit
document.getElementById('verification-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const answers = [];
    verificationQuestions.forEach((q, index) => {
        const selectedOption = document.querySelector(`input[name="question-${index}"]:checked`);
        if (selectedOption) {
            answers.push({
                question: q.q,
                answer: selectedOption.value
            });
        }
    });
    
    if (answers.length !== 3) {
        showError('Bütün sualları cavablandırın');
        return;
    }
    
    // Submit registration
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...registerFormData, answers })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Qeydiyyat uğurla tamamlandı! İndi daxil ola bilərsiniz.');
            verificationModal.classList.remove('active');
            document.getElementById('register-form').reset();
            showTab('login');
        } else {
            showError(data.error || 'Qeydiyyat uğursuz oldu');
        }
    } catch (error) {
        showError('Server xətası');
    }
});

// Login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userEmail', data.user.email);
            window.location.href = '/chat';
        } else {
            showError(data.error || 'Giriş uğursuz oldu');
        }
    } catch (error) {
        showError('Server xətası');
    }
});

// Admin login form
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminRole', data.role);
            window.location.href = '/admin';
        } else {
            showError(data.error || 'Giriş uğursuz oldu');
        }
    } catch (error) {
        showError('Server xətası');
    }
});

// Utility functions
function showError(message) {
    // Remove existing messages
    document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(errorDiv, activeTab.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    // Remove existing messages
    document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(successDiv, activeTab.firstChild);
    
    setTimeout(() => successDiv.remove(), 5000);
}
