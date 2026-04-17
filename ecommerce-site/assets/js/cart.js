const API_URL = '/api';

let productsData = [];
let localCart = [];

function getLocalCart() {
    try {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
}

function saveLocalCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = localCart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = count;
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

function getProductInfo(productId) {
    return productsData.find(p => String(p.id) === String(productId));
}

function calculateSubtotal() {
    return localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function removeFromCart(productId) {
    localCart = localCart.filter(item => String(item.product_id) !== String(productId));
    saveLocalCart(localCart);
    updateCartCount();
    renderCart();
}

function updateQuantity(productId, quantity) {
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }
    const item = localCart.find(item => String(item.product_id) === String(productId));
    if (item) {
        item.quantity = quantity;
        saveLocalCart(localCart);
        renderCart();
    }
}

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (response.ok) {
            const data = await response.json();
            productsData = data.data?.products || [];
            return;
        }
    } catch (e) {
        console.log('API failed, trying products.json');
    }
    
    try {
        const res = await fetch('data/products.json');
        if (res.ok) productsData = await res.json();
    } catch (e) {
        console.error('Failed to load products:', e);
    }
}

async function fetchCartFromAPI() {
    try {
        const response = await fetch(`${API_URL}/cart`, { 
            credentials: 'include' 
        });
        if (response.ok) {
            const data = await response.json();
            return data.data || [];
        }
    } catch (e) {
        console.log('API cart fetch failed, using localStorage');
    }
    return null;
}

async function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const taxEl = document.getElementById('cart-tax');
    const summaryEl = document.querySelector('.cart-summary');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!cartItems) return;
    
    localCart = getLocalCart();
    
    if (localCart.length === 0) {
        cartItems.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        if (summaryEl) summaryEl.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (summaryEl) summaryEl.style.display = 'block';
    
    await fetchProducts();
    
    let subtotal = 0;
    let html = '';
    
    for (const item of localCart) {
        const product = getProductInfo(item.product_id);
        const displayPrice = item.price || (product?.price || 0);
        const itemTotal = displayPrice * item.quantity;
        subtotal += itemTotal;
        
        const image = item.image || (product?.image_url || product?.image || 'assets/images/logo.png');
        
        html += `
            <div class="cart-item">
                <img src="${image}" alt="${item.name || product?.name || 'Product'}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name || product?.name || 'Product'}</h4>
                    <p class="cart-item-price">$${displayPrice.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button onclick="updateQuantity('${item.product_id}', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.product_id}', ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.product_id}')">&times;</button>
            </div>
        `;
    }
    
    cartItems.innerHTML = html;
    
    const tax = subtotal * 0.10;
    const total = subtotal + tax;
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

async function initCart() {
    localCart = getLocalCart();
    updateCartCount();
    await renderCart();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
} else {
    initCart();
}