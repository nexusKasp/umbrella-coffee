class AuthService {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('umbrellaCoffeeUsers')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('umbrellaCoffeeCurrentUser')) || null;
    }

    register({ name, email, phone, password }) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { success: false, message: 'Введите корректный email' };
        }
        if (this.users.some(user => user.email === email)) {
            return { success: false, message: 'Пользователь с таким email уже существует' };
        }
        if (!/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone)) {
            return { success: false, message: 'Введите корректный телефон в формате 8(XXX)XXX-XX-XX' };
        }
        if (this.users.some(user => user.phone === phone)) {
            return { success: false, message: 'Пользователь с таким телефоном уже существует' };
        }
        if (password.length < 6) {
            return { success: false, message: 'Пароль должен содержать минимум 6 символов' };
        }
        if (!name || name.length < 2) {
            return { success: false, message: 'Имя должно содержать минимум 2 символа' };
        }

        const newUser = { 
            id: Date.now().toString(),
            name,
            email,
            phone,
            password,
            createdAt: new Date().toISOString(),
            cart: []
        };

        this.users.push(newUser);
        localStorage.setItem('umbrellaCoffeeUsers', JSON.stringify(this.users));
        
        return { success: true, user: newUser };
    }

    login(identifier, password) {
        const user = this.users.find(user => user.email === identifier || user.phone === identifier);
        
        if (!user) {
            return { success: false, message: 'Пользователь с таким email или телефоном не найден' };
        }

        if (user.password !== password) {
            return { success: false, message: 'Неверный пароль' };
        }

        this.currentUser = user;
        localStorage.setItem('umbrellaCoffeeCurrentUser', JSON.stringify(user));
        
        return { success: true, user };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('umbrellaCoffeeCurrentUser');
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

if (!window.authService) {
    window.authService = new AuthService();
}

function updateAuthUI() {
    const loginBtns = document.querySelectorAll('.login-btn');
    const cartLinks = document.querySelectorAll('.cart-link');
    const userNavItems = document.querySelectorAll('.nav-user');

    if (window.authService.isAuthenticated()) {
        loginBtns.forEach(btn => {
            btn.textContent = 'ВЫЙТИ';
            btn.onclick = (e) => {
                e.preventDefault();
                window.authService.logout();
                updateAuthUI();
                window.location.reload();
            };
        });

        cartLinks.forEach(link => link.style.display = 'flex');

        if (!document.querySelector('.nav-user')) {
            const navList = document.querySelector('.nav__list');
            if (navList) {
                const userLi = document.createElement('li');
                userLi.className = 'nav-user';
                userLi.innerHTML = `
                    <div class="user-dropdown">
                        <span class="user-email">${window.authService.currentUser.email || window.authService.currentUser.phone}</span>
                        <div class="dropdown-content">
                            <a href="#" class="logout-link">Выйти</a>
                        </div>
                    </div>
                `;
                navList.appendChild(userLi);
            }
        }
    } else {
        loginBtns.forEach(btn => {
            btn.textContent = 'ВОЙТИ';
            btn.onclick = (e) => {
                e.preventDefault();
                document.getElementById('loginModal').style.display = 'flex';
            };
        });

        cartLinks.forEach(link => link.style.display = 'none');

        const userLi = document.querySelector('.nav-user');
        if (userLi) userLi.remove();
    }
}

function validateInput(input, errorElement, validationFn, errorMessage) {
    const value = input.value.trim();
    const isValid = validationFn(value);
    input.classList.toggle('valid', isValid);
    input.classList.toggle('invalid', !isValid);
    if (!isValid && value) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
    } else {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
    return isValid;
}

function formatPhoneInput(input) {
    if (!input) {
        console.warn('Phone input element not found, skipping formatPhoneInput');
        return;
    }

    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        console.log('Raw input (after removing non-digits):', value);

        // Ограничиваем до 11 цифр (первая 8 и еще 10)
        if (value.length > 11) {
            value = value.slice(0, 11);
            console.log('Trimmed to 11 digits:', value);
        }

        // Если первая цифра не 8, заменяем на 8
        if (value && value[0] !== '8') {
            value = '8' + value.slice(0, 10); // Оставляем максимум 10 цифр после 8
            console.log('Forced start with 8:', value);
        }

        let formatted = '';
        let digitCount = value.length;

        if (digitCount >= 1) formatted += value[0]; // 8
        if (digitCount >= 2) formatted += '(';
        if (digitCount >= 2) formatted += value.slice(1, 4); // XXX
        if (digitCount >= 5) formatted += ')';
        if (digitCount >= 5) formatted += value.slice(4, 7); // XXX
        if (digitCount >= 8) formatted += '-';
        if (digitCount >= 8) formatted += value.slice(7, 9); // XX
        if (digitCount >= 10) formatted += '-';
        if (digitCount >= 10) formatted += value.slice(9, 11); // XX

        console.log('Formatted output:', formatted);
        console.log('Digit count:', digitCount);

        e.target.value = formatted;
    });

    input.addEventListener('keydown', function(e) {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
        if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
            e.preventDefault();
            console.log('Blocked key:', e.key);
        }
    });

    // Добавляем валидацию при потере фокуса
    input.addEventListener('blur', function(e) {
        const value = e.target.value;
        if (value && !/^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(value)) {
            const errorElement = input.nextElementSibling;
            if (errorElement && errorElement.classList.contains('error-message')) {
                errorElement.textContent = 'Введите телефон в формате 8(XXX)XXX-XX-XX';
                errorElement.classList.add('show');
                input.classList.add('invalid');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTabs = document.querySelectorAll('#loginModal .auth-tab');

    function toggleLoginTab(tabType) {
        const emailField = document.querySelector('#loginModal .email-field');
        const phoneField = document.querySelector('#loginModal .phone-field');
        const loginEmail = document.getElementById('loginEmail');
        const loginPhone = document.getElementById('loginPhone');

        if (emailField && phoneField && loginEmail && loginPhone) {
            emailField.style.display = tabType === 'email' ? 'block' : 'none';
            phoneField.style.display = tabType === 'phone' ? 'block' : 'none';
            loginEmail.required = tabType === 'email';
            loginPhone.required = tabType === 'phone';
            loginEmail.value = tabType === 'phone' ? '' : loginEmail.value;
            loginPhone.value = tabType === 'email' ? '' : loginPhone.value;
        }
    }

    loginTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            loginTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            toggleLoginTab(tab.dataset.tab);
        });
    });

    if (loginForm) {
        const loginEmail = document.getElementById('loginEmail');
        const loginPhone = document.getElementById('loginPhone');
        const loginPassword = document.getElementById('loginPassword');
        const loginEmailError = document.getElementById('loginEmailError');
        const loginPhoneError = document.getElementById('loginPhoneError');
        const loginPasswordError = document.getElementById('loginPasswordError');

        formatPhoneInput(loginPhone);

        const validateLoginForm = () => {
            const tab = document.querySelector('#loginModal .auth-tab.active')?.dataset.tab;
            const isEmailValid = tab === 'email' && loginEmail && loginEmailError 
                ? validateInput(loginEmail, loginEmailError, value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Введите корректный email') 
                : true;
            const isPhoneValid = tab === 'phone' && loginPhone && loginPhoneError 
                ? validateInput(loginPhone, loginPhoneError, value => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(value), 'Введите телефон в формате 8(XXX)XXX-XX-XX') 
                : true;
            const isPasswordValid = loginPassword && loginPasswordError 
                ? validateInput(loginPassword, loginPasswordError, value => value.length >= 6, 'Пароль должен содержать минимум 6 символов') 
                : false;
            const submitBtn = loginForm.querySelector('.btn-auth');
            if (submitBtn) {
                if ((isEmailValid || isPhoneValid) && isPasswordValid) {
                    submitBtn.classList.add('valid');
                } else {
                    submitBtn.classList.remove('valid');
                }
            }
        };

        if (loginEmail) loginEmail.addEventListener('input', validateLoginForm);
        if (loginPhone) loginPhone.addEventListener('input', validateLoginForm);
        if (loginPassword) loginPassword.addEventListener('input', validateLoginForm);
        loginTabs.forEach(tab => tab.addEventListener('click', validateLoginForm));

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const tab = document.querySelector('#loginModal .auth-tab.active')?.dataset.tab;
            const identifier = tab === 'email' ? loginEmail?.value : loginPhone?.value;
            const password = loginPassword?.value;

            if (!identifier || !password) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            const result = window.authService.login(identifier, password);
            if (result.success) {
                document.getElementById('loginModal').style.display = 'none';
                updateAuthUI();
                window.location.reload();
            } else {
                alert(result.message);
            }
        });
    }

    if (registerForm) {
        const registerName = document.getElementById('registerName');
        const registerEmail = document.getElementById('registerEmail');
        const registerPhone = document.getElementById('registerPhone');
        const registerPassword = document.getElementById('registerPassword');
        const registerConfirmPassword = document.getElementById('registerConfirmPassword');
        const registerNameError = document.getElementById('registerNameError');
        const registerEmailError = document.getElementById('registerEmailError');
        const registerPhoneError = document.getElementById('registerPhoneError');
        const registerPasswordError = document.getElementById('registerPasswordError');
        const registerConfirmPasswordError = document.getElementById('registerConfirmPasswordError');

        formatPhoneInput(registerPhone);

        const validateRegisterForm = () => {
            const isNameValid = registerName && registerNameError 
                ? validateInput(registerName, registerNameError, value => value.length >= 2, 'Имя должно содержать минимум 2 символа') 
                : true;
            const isEmailValid = registerEmail && registerEmailError 
                ? validateInput(registerEmail, registerEmailError, value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Введите корректный email') 
                : true;
            const isPhoneValid = registerPhone && registerPhoneError 
                ? validateInput(registerPhone, registerPhoneError, value => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(value), 'Введите телефон в формате 8(XXX)XXX-XX-XX') 
                : true;
            const isPasswordValid = registerPassword && registerPasswordError 
                ? validateInput(registerPassword, registerPasswordError, value => value.length >= 6, 'Пароль должен содержать минимум 6 символов') 
                : false;
            const isConfirmPasswordValid = registerConfirmPassword && registerConfirmPasswordError 
                ? validateInput(registerConfirmPassword, registerConfirmPasswordError, value => value === registerPassword?.value, 'Пароли не совпадают') 
                : false;
            const submitBtn = registerForm.querySelector('.btn-auth');
            if (submitBtn) {
                if (isNameValid && isEmailValid && isPhoneValid && isPasswordValid && isConfirmPasswordValid) {
                    submitBtn.classList.add('valid');
                } else {
                    submitBtn.classList.remove('valid');
                }
            }
        };

        if (registerName) registerName.addEventListener('input', validateRegisterForm);
        if (registerEmail) registerEmail.addEventListener('input', validateRegisterForm);
        if (registerPhone) registerPhone.addEventListener('input', validateRegisterForm);
        if (registerPassword) registerPassword.addEventListener('input', validateRegisterForm);
        if (registerConfirmPassword) registerConfirmPassword.addEventListener('input', validateRegisterForm);

        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = registerName?.value;
            const email = registerEmail?.value;
            const phone = registerPhone?.value;
            const password = registerPassword?.value;
            const confirmPassword = registerConfirmPassword?.value;

            if (!name || !email || !phone || !password || !confirmPassword) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            if (password !== confirmPassword) {
                if (registerConfirmPasswordError) {
                    registerConfirmPasswordError.textContent = 'Пароли не совпадают';
                    registerConfirmPasswordError.classList.add('show');
                    registerConfirmPasswordError.classList.add('invalid');
                }
                return;
            }

            const result = window.authService.register({ name, email, phone, password });
            if (result.success) {
                window.authService.login(email, password);
                document.getElementById('registerModal').style.display = 'none';
                updateAuthUI();
                window.location.reload();
            } else {
                alert(result.message);
            }
        });
    }

    document.querySelectorAll('.register-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('registerModal').style.display = 'flex';
        });
    });

    document.querySelectorAll('.modal__close').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        });
    });

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('logout-link')) {
            e.preventDefault();
            window.authService.logout();
            updateAuthUI();
            window.location.reload();
        }
    });
});