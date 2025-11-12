// Данные приложения
let cart = [];
let balance = 0;

// Цены для разных размеров
const sizePrices = {
    '0.2': 0,    // базовая цена
    '0.3': 20,   // +20 руб к базовой
    '0.4': 40    // +40 руб к базовой
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // НЕ загружаем корзину из localStorage - всегда начинаем с пустой
    // loadCart(); // УДАЛИТЬ ЭТУ СТРОКУ
    
    // Вместо этого всегда начинаем с пустой корзины
    clearCartOnLoad();
    
    setupTabListeners();
    updateCartDisplay();
});

// Очистка корзины при загрузке
function clearCartOnLoad() {
    cart = [];
    // Также очищаем localStorage чтобы не накапливались старые данные
    localStorage.removeItem('mountainBrewCart');
}

// Настройка переключения вкладок
function setupTabListeners() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Убрать активный класс у всех кнопок и панелей
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Добавить активный класс текущим элементам
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Функция добавления в корзину с учетом размера
function addToCartWithSize(button) {
    const menuItem = button.closest('.menu-item');
    const baseName = menuItem.getAttribute('data-name');
    const basePrice = parseInt(menuItem.getAttribute('data-base-price'));
    const desc = menuItem.getAttribute('data-desc');
    
    // Находим выбранный размер
    const sizeInput = menuItem.querySelector('input[type="radio"]:checked');
    const size = sizeInput ? sizeInput.value : '0.2';
    
    // Вычисляем итоговую цену
    const sizePremium = sizePrices[size] || 0;
    const finalPrice = basePrice + sizePremium;
    
    // Формируем полное название с размером
    const fullName = `${baseName} (${size}л)`;
    
    addToCart(fullName, finalPrice, desc, size);
    
    // Анимация добавления
    button.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    setTimeout(() => {
        button.style.background = 'linear-gradient(135deg, #D2691E, #8B4513)';
    }, 300);
}

// Функции корзины
function addToCart(name, price, desc, size) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: price,
            desc: desc,
            size: size,
            quantity: 1
        });
    }
    
    // Сохраняем корзину только на время сессии
    saveCartSession();
    updateCartDisplay();
    showNotification(`✅ Добавлено: ${name}`);
}

function removeFromCart(index) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    saveCartSession();
    updateCartDisplay();
    showNotification(`🗑️ Удалено: ${itemName}`);
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        saveCartSession();
        updateCartDisplay();
    }
}

function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Очистить всю корзину?')) {
        cart = [];
        saveCartSession();
        updateCartDisplay();
        showNotification('🛒 Корзина очищена');
    }
}

// Обновление отображения корзины
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');
    const balanceElement = document.getElementById('balance');
    const cartCount = document.getElementById('cart-count');
    
    cartItems.innerHTML = '';
    let total = 0;
    let itemCount = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #7f8c8d;">
                <div style="font-size: 48px; margin-bottom: 20px;">🛒</div>
                <h3 style="margin-bottom: 10px; color: #5D4037;">Корзина пуста</h3>
                <p>Добавьте что-нибудь из меню</p>
            </div>
        `;
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            itemCount += item.quantity;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-desc">${item.desc}</div>
                    <div class="cart-item-quantity">${item.price} ₽ × ${item.quantity}</div>
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-price">${itemTotal} ₽</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
                </div>
            `;
            cartItems.appendChild(itemElement);
        });
    }
    
    totalPrice.textContent = total + ' ₽';
    balanceElement.textContent = total;
    cartCount.textContent = itemCount;
}

// WhatsApp заказ - ВАЖНО: ЗАМЕНИТЕ НОМЕР ТЕЛЕФОНА!
function sendToWhatsApp() {
    if (cart.length === 0) {
        showNotification('🛒 Корзина пуста!');
        return;
    }
    
    let message = '☕ *ЗАКАЗ ИЗ MOUNTAIN BREW COFFEE HOUSE*\n\n';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        message += `• ${item.name} × ${item.quantity} = ${itemTotal} ₽\n`;
        message += `  _${item.desc}_\n\n`;
        total += itemTotal;
    });
    
    message += `💰 *ИТОГО: ${total} ₽*`;
    message += `\n\n📱 *Заказ через приложение Mountain Brew*`;
    message += `\n⏰ *Время заказа:* ${new Date().toLocaleString()}`;
    
    // 🔧 ЗАМЕНИТЕ ЭТОТ НОМЕР НА НОМЕР ВАШЕЙ КОФЕЙНИ
    const phoneNumber = '79054507888'; 
    
    // Кодируем сообщение для URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Открываем в новом окне
    window.open(whatsappUrl, '_blank');
    
    // ОЧИЩАЕМ КОРЗИНУ ПОСЛЕ ОТПРАВКИ ЗАКАЗА
    setTimeout(() => {
        cart = [];
        saveCartSession();
        updateCartDisplay();
        showNotification('📤 Заказ отправлен в WhatsApp! Корзина очищена.');
    }, 1000);
}

// Самовывоз
function pickupOrder() {
    if (cart.length === 0) {
        showNotification('🛒 Корзина пуста!');
        return;
    }
    
    let message = '🏃 *ЗАКАЗ НА САМОВЫВОЗ*\n\n';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        message += `• ${item.name} × ${item.quantity} = ${itemTotal} ₽\n`;
        total += itemTotal;
    });
    
    message += `\n💰 *ИТОГО: ${total} ₽*`;
    message += `\n\n📍 *Самовывоз у стойки*`;
    message += `\n⏰ *Время:* ${new Date().toLocaleString()}`;
    
    showNotification('🏃 Заказ готовится! Подойдите к стойке');
    
    // ОЧИЩАЕМ КОРЗИНУ ПОСЛЕ ОФОРМЛЕНИЯ САМОВЫВОЗА
    setTimeout(() => {
        cart = [];
        saveCartSession();
        updateCartDisplay();
    }, 2000);
}

// Уведомления
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Сохранение корзины только на время сессии (не обязательно, но для удобства)
function saveCartSession() {
    // Можно сохранять в sessionStorage вместо localStorage
    // sessionStorage очищается при закрытии вкладки
    sessionStorage.setItem('mountainBrewCart', JSON.stringify(cart));
}

// Загрузка корзины из sessionStorage (если нужна в рамках одной сессии)
function loadCartSession() {
    const savedCart = sessionStorage.getItem('mountainBrewCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}