// Cart logic with backend API
const API_URL = '/api';

let cart = [];
let coupon = null;

function getCart() {
    try {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function getProductInfo(productId) {
    return productsData.find(p => String(p.id) === String(productId));
}

function getPriceForQuantity(productId, quantity) {
    const product = getProductInfo(productId);
    if (!product) return null;
    return {
        price: Number(product.price),
    };
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = count;
}

async function addToCart(productId, name, price, quantity = 1, image = '') {
    cart = getCart();
    const existing = cart.find(item => String(item.product_id) === String(productId));
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ product_id: productId, name, price, quantity, image });
    }
    saveCart(cart);
    updateCartCount();
    showToast(`${name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => String(item.product_id) !== String(productId));
    saveCart(cart);
    updateCartCount();
    renderCart();
}

function updateQuantity(productId, quantity) {
    const item = cart.find(item => String(item.product_id) === String(productId));
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart(cart);
        renderCart();
    }
}

function clearCart() {
    cart = [];
    saveCart(cart);
    coupon = null;
    updateCartCount();
}

function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function applyCoupon(code) {
    if (coupon) return { valid: false, message: 'Coupon already applied' };
    coupon = { code, discount: 0 };
    return { valid: true, discount: 0 };
}

function getDiscount() {
    return coupon ? coupon.discount : 0;
}

function getTotal() {
    return calculateSubtotal() - getDiscount();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!cartItems) return;
    
    cart = getCart();
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (totalEl) totalEl.textContent = '$0.00';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    
    await fetchProductsForCart();
    
    let html = '';
    let subtotal = 0;
    
    for (const item of cart) {
        const product = getProductInfo(item.product_id);
        const displayPrice = item.price;
        const itemTotal = displayPrice * item.quantity;
        subtotal += itemTotal;
        
        html += `
            <div class="cart-item">
                <img src="${item.image || (product?.image || 'assets/images/products/placeholder.jpg')}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">$${displayPrice.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button onclick="updateQuantity('${item.product_id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.product_id}', ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.product_id}')">&times;</button>
            </div>
        `;
    }
    
    cartItems.innerHTML = html;
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
}

async function fetchProductsForCart() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (response.ok) {
            const data = await response.json();
            productsData = data.data?.products || [];
        }
    } catch (e) {
        try {
            const res = await fetch('data/products.json');
            if (res.ok) productsData = await res.json();
        } catch (e) {}
    }
}

let productsData = [];

async function initCart() {
    await fetchProductsForCart();
    updateCartCount();
    renderCart();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
} else {
    initCart();
}
