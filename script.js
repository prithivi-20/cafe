// --- SHOPPING CART CRUD OPERATIONS ---

// Application State
let cart = [];

// DOM Elements
const cartModal = document.getElementById('cart-modal');
const cartIcon = document.getElementById('cart-icon');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPriceEl = document.getElementById('cart-total-price');
const cartCountEl = document.getElementById('cart-count');

// Initialize Cart
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to load existing cart from LocalStorage (Persistent Read)
    const storedCart = localStorage.getItem('cafeCart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
        updateCartUI();
    }

    // Attach event listeners to all "Buy" buttons in the menu
    const menuBuyButtons = document.querySelectorAll('.buy');
    menuBuyButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            // Traverse DOM to get item details
            const itemElement = e.target.closest('.item');
            const name = itemElement.querySelector('h3').innerText;
            const priceText = itemElement.querySelector('.price').innerText;
            const price = parseFloat(priceText.replace('₹', '').trim());

            // [CREATE/UPDATE] Add to Cart
            addToCart(index, name, price);
            showPlusAnimation(e);
        });
    });

    // Attach event listeners to "Offer" buy buttons
    const offerBuyButtons = document.querySelectorAll('.order h5');
    offerBuyButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            const offerElement = e.target.closest('.offer-card');
            const name = offerElement.querySelector('h3').innerText;
            const price = 100; // Default price for offer items
            
            // Generate a unique ID for offers to not clash with menu items
            const offerId = 'offer-' + index;

            // [CREATE/UPDATE] Add to Cart
            addToCart(offerId, name, price);
            showPlusAnimation(e);
        });
    });
});

// [CREATE] Add Item to Cart
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        // [UPDATE] Increment quantity if already exists
        existingItem.quantity += 1;
    } else {
        // [CREATE] Add new item
        cart.push({ id, name, price, quantity: 1 });
    }
    saveCart();
    updateCartUI();
}

// [READ] Update Cart User Interface
function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;

        const itemEl = document.createElement('div');
        itemEl.classList.add('cart-item');
        // Determine whether id is string to pass properly to functions
        const idArg = typeof item.id === 'string' ? `'${item.id}'` : item.id;
        itemEl.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹${item.price} x ${item.quantity}</p>
            </div>
            <div class="cart-qty-controls">
                <!-- [UPDATE] Decrease Quantity -->
                <button class="cart-qty-btn" onclick="updateQuantity(${idArg}, -1)">-</button>
                <span>${item.quantity}</span>
                <!-- [UPDATE] Increase Quantity -->
                <button class="cart-qty-btn" onclick="updateQuantity(${idArg}, 1)">+</button>
                <!-- [DELETE] Remove Item -->
                <button class="remove-btn" onclick="removeFromCart(${idArg})">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartTotalPriceEl.innerText = total;
    cartCountEl.innerText = count;
}

// [UPDATE] Change Item Quantity
function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id); // [DELETE] if quantity is 0
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

// [DELETE] Remove Item from Cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

// Helper: Save to LocalStorage
function saveCart() {
    localStorage.setItem('cafeCart', JSON.stringify(cart));
}

// UI Event Listeners for Modal
const checkoutBtn = document.getElementById('checkout-btn');
const addressContainer = document.getElementById('address-container');
const placeOrderBtn = document.getElementById('place-order-btn');
const deliveryAddressInput = document.getElementById('delivery-address');

// Custom Alert System
const customAlert = document.getElementById('custom-alert');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertClose = document.getElementById('custom-alert-close');
let alertCloseCallback = null;

function showCustomAlert(message, callback = null) {
    if (customAlert && customAlertMessage) {
        customAlertMessage.innerText = message;
        customAlert.style.display = 'flex';
        alertCloseCallback = callback;
    } else {
        alert(message);
        if (callback) callback();
    }
}

if (customAlertClose) {
    customAlertClose.addEventListener('click', () => {
        customAlert.style.display = 'none';
        if (alertCloseCallback) alertCloseCallback();
    });
}

function resetCheckoutUI() {
    if(addressContainer && checkoutBtn && deliveryAddressInput) {
        addressContainer.style.display = 'none';
        checkoutBtn.style.display = 'block';
        deliveryAddressInput.value = '';
    }
}

cartIcon.addEventListener('click', (e) => {
    e.preventDefault();
    cartModal.style.display = 'block';
});

closeCartBtn.addEventListener('click', () => {
    cartModal.style.display = 'none';
    resetCheckoutUI();
});

window.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.style.display = 'none';
        resetCheckoutUI();
    }
});

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showCustomAlert('Your cart is empty!');
            return;
        }
        addressContainer.style.display = 'block';
        checkoutBtn.style.display = 'none';
        
        // Ensure the online payment restriction is applied
        const onlineRadio = document.getElementById('online');
        const codRadio = document.getElementById('cod');
        if (onlineRadio && codRadio) {
            // Remove previous listeners to avoid duplicates if checkout clicked multiple times
            const newOnlineRadio = onlineRadio.cloneNode(true);
            onlineRadio.parentNode.replaceChild(newOnlineRadio, onlineRadio);
            
            newOnlineRadio.addEventListener('click', () => {
                showCustomAlert('Online payment is not available right now. Please select Cash on Delivery.', () => {
                    codRadio.checked = true;
                });
            });
        }
    });
}

if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
        const address = deliveryAddressInput.value.trim();
        if (!address) {
            showCustomAlert('Please enter a delivery address.');
            return;
        }
        
        const paymentMethodRadio = document.querySelector('input[name="payment-method"]:checked');
        const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : 'Cash on Delivery';
        
        showCustomAlert(`Order Placed Successfully!\nDelivery to:\n${address}\nPayment Method: ${paymentMethod}`);
        
        // Clear cart and reset UI
        cart = [];
        saveCart();
        updateCartUI();
        
        cartModal.style.display = 'none';
        resetCheckoutUI();
        
        // Reset to default
        const codRadio = document.getElementById('cod');
        if (codRadio) codRadio.checked = true;
    });
}

// Animation helper for adding to cart
function showPlusAnimation(e) {
    const plusIcon = document.createElement('span');
    plusIcon.innerText = '+1';
    plusIcon.classList.add('plus-animation');
    
    // Position it at the mouse click location
    plusIcon.style.left = `${e.clientX}px`;
    plusIcon.style.top = `${e.clientY - 20}px`;
    
    document.body.appendChild(plusIcon);
    
    // Remove after animation completes
    setTimeout(() => {
        plusIcon.remove();
    }, 1000);
}
