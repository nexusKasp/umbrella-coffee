class Cart {
    constructor() {
        this.items = [];
        this.authService = null;
        this.cartCounterElements = document.querySelectorAll('.cart-counter');
        this.initializeCart();
    }

    initializeCart() {
        // Ждем, пока authService не станет доступным
        const waitForAuthService = () => {
            if (window.authService && typeof window.authService.isAuthenticated === 'function') {
                this.authService = window.authService;
                this.items = this.loadCart();
                this.updateCartCounter();
            } else {
                console.warn('authService еще не готов, ждем...');
                setTimeout(waitForAuthService, 100);
            }
        };
        waitForAuthService();
    }

    loadCart() {
        try {
            // Проверяем, доступен ли authService
            if (!this.authService || typeof this.authService.isAuthenticated !== 'function') {
                console.warn('authService не определен, загружаем гостевую корзину');
                const cartData = localStorage.getItem('umbrellaCoffeeGuestCart');
                if (!cartData) return [];
                let cart;
                try {
                    cart = JSON.parse(cartData);
                } catch (parseError) {
                    console.error('Ошибка парсинга umbrellaCoffeeGuestCart:', parseError);
                    localStorage.removeItem('umbrellaCoffeeGuestCart');
                    return [];
                }
                return Array.isArray(cart) ? cart : [];
            }

            if (this.authService.isAuthenticated()) {
                const userData = localStorage.getItem('umbrellaCoffeeCurrentUser');
                if (!userData) {
                    console.log('Пользователь не найден в localStorage, возвращаем пустую корзину');
                    return [];
                }
                let user;
                try {
                    user = JSON.parse(userData);
                } catch (parseError) {
                    console.error('Ошибка парсинга umbrellaCoffeeCurrentUser:', parseError);
                    localStorage.removeItem('umbrellaCoffeeCurrentUser');
                    return [];
                }
                return Array.isArray(user.cart) ? user.cart : [];
            } else {
                const cartData = localStorage.getItem('umbrellaCoffeeGuestCart');
                if (!cartData) return [];
                let cart;
                try {
                    cart = JSON.parse(cartData);
                } catch (parseError) {
                    console.error('Ошибка парсинга umbrellaCoffeeGuestCart:', parseError);
                    localStorage.removeItem('umbrellaCoffeeGuestCart');
                    return [];
                }
                return Array.isArray(cart) ? cart : [];
            }
        } catch (error) {
            console.error('Критическая ошибка в loadCart:', error);
            return [];
        }
    }

    saveCart() {
        try {
            console.log('Сохранение корзины начато. Текущие элементы:', this.items);

            // Проверяем доступность authService
            if (!this.authService || typeof this.authService.isAuthenticated !== 'function') {
                console.warn('authService не определен, сохраняем как гостевую корзину');
                localStorage.setItem('umbrellaCoffeeGuestCart', JSON.stringify(this.items));
                console.log('Гостевая корзина сохранена:', this.items);
                return;
            }

            if (this.authService.isAuthenticated()) {
                console.log('Пользователь аутентифицирован, сохраняем корзину в профиль пользователя');
                let users = [];
                const usersData = localStorage.getItem('umbrellaCoffeeUsers');
                if (usersData) {
                    try {
                        users = JSON.parse(usersData);
                        if (!Array.isArray(users)) {
                            console.warn('Данные в umbrellaCoffeeUsers не являются массивом, сбрасываем');
                            users = [];
                        }
                    } catch (parseError) {
                        console.error('Ошибка парсинга umbrellaCoffeeUsers:', parseError);
                        users = [];
                        localStorage.setItem('umbrellaCoffeeUsers', JSON.stringify(users));
                    }
                }

                const currentUser = this.authService.getCurrentUser();
                if (!currentUser || !currentUser.id) {
                    console.error('Текущий пользователь недоступен или не имеет id:', currentUser);
                    localStorage.setItem('umbrellaCoffeeGuestCart', JSON.stringify(this.items));
                    console.log('Сохранено как гостевая корзина из-за ошибки с текущим пользователем');
                    return;
                }

                console.log('Текущий пользователь:', currentUser);
                const updatedUsers = users.map(user => 
                    user.id === currentUser.id ? { ...user, cart: this.items } : user
                );

                const userExists = updatedUsers.some(user => user.id === currentUser.id);
                if (!userExists) {
                    console.log('Пользователь не найден в списке, добавляем его');
                    updatedUsers.push({ ...currentUser, cart: this.items });
                }

                localStorage.setItem('umbrellaCoffeeUsers', JSON.stringify(updatedUsers));
                console.log('Пользователи обновлены в localStorage:', updatedUsers);

                const updatedUser = updatedUsers.find(u => u.id === currentUser.id);
                if (updatedUser) {
                    localStorage.setItem('umbrellaCoffeeCurrentUser', JSON.stringify(updatedUser));
                    console.log('Текущий пользователь обновлен в localStorage:', updatedUser);
                } else {
                    console.warn('Не удалось найти обновленного пользователя в списке');
                }
            } else {
                console.log('Пользователь не аутентифицирован, сохраняем гостевую корзину');
                localStorage.setItem('umbrellaCoffeeGuestCart', JSON.stringify(this.items));
                console.log('Гостевая корзина сохранена:', this.items);
            }
        } catch (error) {
            console.error('Ошибка сохранения корзины:', error);
            // В случае ошибки пытаемся сохранить как гостевую корзину
            try {
                localStorage.setItem('umbrellaCoffeeGuestCart', JSON.stringify(this.items));
                console.log('Сохранено как гостевая корзина после ошибки:', this.items);
            } catch (fallbackError) {
                console.error('Не удалось сохранить даже гостевую корзину:', fallbackError);
            }
        }
    }

    addItem(productId, productName, productPrice, productImage, deliveryOption) {
        try {
            if (!this.authService || typeof this.authService.isAuthenticated !== 'function') {
                console.warn('authService не определен');
                this.showAuthNotification();
                return false;
            }

            if (!this.authService.isAuthenticated()) {
                this.showAuthNotification();
                return false;
            }

            const existingItem = this.items.find(item => item.id === productId && item.delivery === deliveryOption);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    id: productId,
                    name: productName,
                    price: parseFloat(productPrice) || 0,
                    image: productImage || '/Umbrella/img/default-product.png',
                    quantity: 1,
                    delivery: deliveryOption
                });
            }
            this.saveCart();
            this.updateCartCounter();
            this.updateCartPreview();
            return true;
        } catch (error) {
            console.error('Ошибка добавления товара:', error);
            return false;
        }
    }

    removeItem(productId, deliveryOption) {
        this.items = this.items.filter(item => !(item.id === productId && item.delivery === deliveryOption));
        this.saveCart();
        this.updateCartCounter();
        this.updateCartPreview();
    }

    increaseQuantity(productId, deliveryOption) {
        const item = this.items.find(item => item.id === productId && item.delivery === deliveryOption);
        if (item) {
            item.quantity += 1;
            this.saveCart();
            this.updateCartCounter();
            this.updateCartPreview();
        }
    }

    decreaseQuantity(productId, deliveryOption) {
        const item = this.items.find(item => item.id === productId && item.delivery === deliveryOption);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            this.saveCart();
            this.updateCartCounter();
            this.updateCartPreview();
        } else if (item && item.quantity === 1) {
            this.removeItem(productId, deliveryOption);
        }
    }

    updateCartCounter() {
        try {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            this.cartCounterElements.forEach(el => {
                el.textContent = totalItems;
                el.style.display = totalItems > 0 ? 'flex' : 'none';
            });
        } catch (error) {
            console.error('Ошибка обновления счетчика корзины:', error);
        }
    }

    updateCartPreview() {
        try {
            const container = document.getElementById('cartItemsContainer');
            const totalPriceElement = document.getElementById('cartTotalPrice');
            if (!container || !totalPriceElement) return;

            container.innerHTML = '';
            if (this.items.length === 0) {
                container.innerHTML = '<p>Корзина пуста</p>';
                totalPriceElement.textContent = '0 ₽';
                return;
            }

            let totalPrice = 0;
            this.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price} ₽</div>
                        <div class="cart-item-delivery">${item.delivery === 'takeaway' ? 'С СОБОЙ' : 'ДОСТАВКА'}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="cart-item-quantity-btn decrease" data-id="${item.id}" data-delivery="${item.delivery}">−</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="cart-item-quantity-btn increase" data-id="${item.id}" data-delivery="${item.delivery}">+</button>
                        <button class="cart-item-remove" data-id="${item.id}" data-delivery="${item.delivery}">×</button>
                    </div>
                `;
                container.appendChild(itemElement);
                totalPrice += item.price * item.quantity;
            });
            totalPriceElement.textContent = `${totalPrice.toFixed(2)} ₽`;
            this.setupCartButtons();
        } catch (error) {
            console.error('Ошибка обновления превью корзины:', error);
        }
    }

    showAuthNotification() {
        const toast = document.getElementById('toastNotification');
        if (toast) {
            toast.textContent = 'Для добавления товаров в корзину необходимо авторизоваться';
            toast.classList.add('show', 'toast-error');
            setTimeout(() => toast.classList.remove('show', 'toast-error'), 3000);
        }
        document.getElementById('loginModal').style.display = 'flex';
    }

    setupCartButtons() {
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.getAttribute('data-id');
                const deliveryOption = btn.getAttribute('data-delivery');
                if (productId && deliveryOption) {
                    this.removeItem(productId, deliveryOption);
                }
            });
        });

        document.querySelectorAll('.cart-item-quantity-btn.increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.getAttribute('data-id');
                const deliveryOption = btn.getAttribute('data-delivery');
                if (productId && deliveryOption) {
                    this.increaseQuantity(productId, deliveryOption);
                }
            });
        });

        document.querySelectorAll('.cart-item-quantity-btn.decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.getAttribute('data-id');
                const deliveryOption = btn.getAttribute('data-delivery');
                if (productId && deliveryOption) {
                    this.decreaseQuantity(productId, deliveryOption);
                }
            });
        });
    }

    getItems() {
        return this.items;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const cart = new Cart();

    document.querySelectorAll('.product-card__btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = btn.getAttribute('data-product-id');
            const productName = btn.getAttribute('data-product-name');
            const productPrice = btn.getAttribute('data-product-price');
            const productImage = btn.getAttribute('data-product-image');
            const deliveryOption = document.querySelector('.delivery-option.active').getAttribute('data-delivery');
            if (productId && productName && productPrice && deliveryOption) {
                const added = cart.addItem(productId, productName, productPrice, productImage, deliveryOption);
                if (added) {
                    btn.textContent = 'ДОБАВЛЕНО!';
                    btn.style.backgroundColor = '#4CAF50';
                    setTimeout(() => {
                        btn.textContent = 'В КОРЗИНУ';
                        btn.style.backgroundColor = '';
                    }, 2000);
                }
            } else {
                console.error('Недостаточно данных о товаре или способе доставки');
            }
        });
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = btn.getAttribute('data-id');
            const deliveryOption = btn.getAttribute('data-delivery');
            if (productId && deliveryOption) {
                cart.removeItem(productId, deliveryOption);
            }
        });
    });

    const checkoutButton = document.querySelector('.btn--checkout');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (cart.getItems().length === 0) {
                alert('Ваша корзина пуста!');
                return;
            }
            window.location.href = 'delivery.html';
        });
    }

    const cartLinks = document.querySelectorAll('.cart-link');
    cartLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const cartPreview = document.getElementById('cartPreview');
            if (cartPreview) {
                cartPreview.style.display = cartPreview.style.display === 'block' ? 'none' : 'block';
                if (cartPreview.style.display === 'block') {
                    cart.updateCartPreview();
                }
            }
        });
    });

    const cartPreviewClose = document.querySelector('.cart-preview__close');
    if (cartPreviewClose) {
        cartPreviewClose.addEventListener('click', function(e) {
            e.preventDefault();
            const cartPreview = document.getElementById('cartPreview');
            if (cartPreview) {
                cartPreview.style.display = 'none';
            }
        });
    }
});