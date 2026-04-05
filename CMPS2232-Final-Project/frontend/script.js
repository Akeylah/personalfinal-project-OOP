// script.js - Complete UI interactions, cart, orders, admin + modern UX
const API_BASE = "http://localhost:3000/api";
let currentUser = null;

// ---------- helpers ----------
function setStatus(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
    el.style.color = isError ? "#e74c3c" : "#a3e4a3";
    setTimeout(() => {
      if (document.getElementById(elementId) === el) el.style.color = "";
    }, 3000);
  }
}

function updateCurrentUserDisplay() {
  const box = document.getElementById("currentUserInfo");
  if (!currentUser) {
    box.innerHTML = `<i class="fas fa-user-circle"></i> <span>Not signed in</span>`;
    document.getElementById("adminSection").style.display = "none";
    return;
  }
  box.innerHTML = `<i class="fas fa-user-check"></i> <span>${currentUser.username} (${currentUser.role}) · ${currentUser.email}</span>`;
  if (currentUser.role === "admin") {
    document.getElementById("adminSection").style.display = "block";
  } else {
    document.getElementById("adminSection").style.display = "none";
  }
}

async function safeFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

// show delivery toast dynamic
function showDeliveryEstimate() {
  const toast = document.getElementById("deliveryToast");
  const now = new Date();
  let eta = new Date(now.getTime() + 25 * 60000);
  const etaStr = eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("etaText").innerText = etaStr;
  toast.style.display = "flex";
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.style.display = "none", 500);
  }, 3800);
}

// ---------- AUTH ----------
document.getElementById("signupBtn").addEventListener("click", async () => {
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const role = document.getElementById("signupRole").value;
  if (!username || !email || !password) {
    setStatus("authStatus", "Please fill all fields", true);
    return;
  }
  try {
    const data = await safeFetch(`${API_BASE}/auth/signup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role })
    });
    setStatus("authStatus", `✨ Welcome ${data.user.username}! Signup successful.`);
    document.getElementById("signupUsername").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";
  } catch (error) {
    setStatus("authStatus", `Signup error: ${error.message}`, true);
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  if (!username || !password) {
    setStatus("authStatus", "Enter username & password", true);
    return;
  }
  try {
    const data = await safeFetch(`${API_BASE}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    currentUser = data.user;
    updateCurrentUserDisplay();
    setStatus("authStatus", `Logged in as ${currentUser.username} 🍽️`);
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    loadCart();      // refresh cart after login
    loadMyOrders();
    if (currentUser.role === "admin") loadAllOrders();
  } catch (error) {
    setStatus("authStatus", `Login failed: ${error.message}`, true);
  }
});

// ---------- MENU (reference design + mock nutritions) ----------
document.getElementById("loadMenuBtn").addEventListener("click", loadMenu);
async function loadMenu() {
  const container = document.getElementById("menuContainer");
  container.innerHTML = `<div class="skeleton-card"><i class="fas fa-spinner fa-pulse"></i> Loading burgers & fries...</div>`;
  try {
    let items = await safeFetch(`${API_BASE}/menu`);
    if (!items.length) {
      container.innerHTML = `<div class="empty">No items — add some via backend 🍔</div>`;
      return;
    }
    container.innerHTML = items.map(item => {
      const mockKcal = (item.price * 45 + 120).toFixed(0);
      const mockProtein = (item.price * 2.5).toFixed(1);
      return `
        <div class="menu-item">
          <div style="display:flex; justify-content:space-between;">
            <h3>${escapeHtml(item.name)}</h3>
            <span class="item-price">$${Number(item.price).toFixed(2)}</span>
          </div>
          <p>${item.description || "Indulge in our succulent patty filled with real beef & cheese."}</p>
          <div class="nutrition-tag">
            <span>🔥 ${mockKcal} kcal</span> 
            <span>🥩 ${mockProtein}g protein</span>
            <span>🍟 12g fats</span>
          </div>
          <div class="item-actions">
            <input type="number" min="1" value="1" id="qty-${item.item_id}" />
            <button onclick="addToCart(${item.item_id})"><i class="fas fa-cart-plus"></i> Add</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    container.innerHTML = `<div class="empty">⚠️ Failed load menu: ${err.message}</div>`;
  }
}

window.addToCart = async function(itemId) {
  if (!currentUser) { alert("Please login first 🧑‍🍳"); return; }
  const qtyInput = document.getElementById(`qty-${itemId}`);
  const quantity = Number(qtyInput?.value || 1);
  try {
    await safeFetch(`${API_BASE}/orders/cart/add`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.user_id, item_id: itemId, quantity })
    });
    loadCart();
    showMiniToast("Added to bag!", "#2ecc71");
  } catch (error) {
    alert(`Add failed: ${error.message}`);
  }
};

async function loadCart() {
  const container = document.getElementById("cartContainer");
  if (!currentUser) { container.innerHTML = `<div class="empty">🔐 Login to see cart</div>`; return; }
  container.innerHTML = `<div><i class="fas fa-spinner fa-pulse"></i> loading cart...</div>`;
  try {
    const data = await safeFetch(`${API_BASE}/orders/cart/${currentUser.user_id}`);
    if (!data.items.length) {
      container.innerHTML = `<div class="empty">🛒 Your cart is empty — add some treats!</div>`;
      return;
    }
    container.innerHTML = data.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${escapeHtml(item.name)}</h4>
          <small>$${Number(item.price).toFixed(2)} x ${item.quantity}</small>
        </div>
        <div class="cart-item-actions">
          <button onclick="removeFromCart(${item.cart_item_id})"><i class="fas fa-trash-alt"></i> Remove</button>
          <span style="margin-left: 8px;">$${Number(item.subtotal).toFixed(2)}</span>
        </div>
      </div>
    `).join("");
    container.innerHTML += `<div class="total-box">Total: $${Number(data.total).toFixed(2)}</div>`;
  } catch (error) {
    container.innerHTML = `<div class="empty">Failed load cart</div>`;
  }
}

window.removeFromCart = async (cartItemId) => {
  try {
    await safeFetch(`${API_BASE}/orders/cart/item/${cartItemId}`, { method: "DELETE" });
    loadCart();
  } catch (error) { alert("Remove error"); }
};

document.getElementById("loadCartBtn").addEventListener("click", loadCart);

// ---------- PLACE ORDER with delivery animation ----------
document.getElementById("placeOrderBtn").addEventListener("click", async () => {
  if (!currentUser) { setStatus("orderStatus", "Please login first", true); return; }
  const orderTypeRadio = document.querySelector('input[name="orderTypeRadio"]:checked').value;
  const address = document.getElementById("deliveryAddress").value.trim();
  const payload = {
    user_id: currentUser.user_id,
    order_type: orderTypeRadio,
    payment_method: orderTypeRadio === "delivery" ? "cash_on_delivery" : "pickup_payment"
  };
  if (orderTypeRadio === "delivery") {
    if (!address) { setStatus("orderStatus", "Delivery address required", true); return; }
    payload.address = address;
  }
  try {
    const data = await safeFetch(`${API_BASE}/orders/create`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setStatus("orderStatus", `✅ Order #${data.order_id} placed! Total $${Number(data.total_price).toFixed(2)}`);
    if (orderTypeRadio === "delivery") showDeliveryEstimate();
    loadCart();
    loadMyOrders();
    document.getElementById("deliveryAddress").value = "";
  } catch (error) {
    setStatus("orderStatus", `Order error: ${error.message}`, true);
  }
});

// MY ORDERS
document.getElementById("loadMyOrdersBtn").addEventListener("click", loadMyOrders);
async function loadMyOrders() {
  const container = document.getElementById("myOrdersContainer");
  if (!currentUser) { container.innerHTML = `<div class="empty">Login to see orders</div>`; return; }
  container.innerHTML = `<i class="fas fa-spinner fa-pulse"></i> loading...`;
  try {
    const orders = await safeFetch(`${API_BASE}/orders/user/${currentUser.user_id}`);
    if (!orders.length) { container.innerHTML = `<div class="empty">No past orders 🍽️</div>`; return; }
    container.innerHTML = orders.map(order => `
      <div class="order-item">
        <div><strong>#${order.order_id}</strong> · ${order.order_type} · <span style="color:#fe5f1e;">${order.status}</span></div>
        <div>$${Number(order.total_price).toFixed(2)} · ${new Date(order.created_at).toLocaleDateString()}</div>
      </div>
    `).join("");
  } catch (error) { container.innerHTML = `<div class="empty">Error loading orders</div>`; }
}

// ---------- ADMIN ----------
async function loadAllOrders() {
  const container = document.getElementById("adminOrdersContainer");
  if (!currentUser || currentUser.role !== "admin") { container.innerHTML = `<div>Admin access only</div>`; return; }
  container.innerHTML = `<i class="fas fa-spinner fa-pulse"></i> fetching orders...`;
  try {
    const orders = await safeFetch(`${API_BASE}/admin/orders`);
    if (!orders.length) { container.innerHTML = `<div>No orders in system</div>`; return; }
    container.innerHTML = orders.map(order => `
      <div class="admin-order-item">
        <strong>Order #${order.order_id}</strong> - ${order.username} (${order.order_type})<br/>
        Status: ${order.status} | Total: $${Number(order.total_price).toFixed(2)}
      </div>
    `).join("");
  } catch (error) { container.innerHTML = `<div>Failed admin fetch</div>`; }
}
document.getElementById("loadAllOrdersBtn").addEventListener("click", loadAllOrders);

document.getElementById("updateOrderStatusBtn").addEventListener("click", async () => {
  if (!currentUser || currentUser.role !== "admin") { setStatus("adminStatus", "Admin only", true); return; }
  const orderId = document.getElementById("adminOrderId").value.trim();
  const status = document.getElementById("adminOrderStatus").value;
  if (!orderId) { setStatus("adminStatus", "Order ID required", true); return; }
  try {
    const data = await safeFetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setStatus("adminStatus", data.message);
    loadAllOrders();
  } catch (error) { setStatus("adminStatus", `Update fail: ${error.message}`, true); }
});

function showMiniToast(msg, color) {
  const toast = document.getElementById("deliveryToast");
  document.getElementById("etaText").innerText = msg;
  toast.style.borderLeftColor = color || "#2ecc71";
  toast.style.display = "flex";
  setTimeout(() => toast.style.display = "none", 1800);
}

function escapeHtml(str) { 
  if(!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// initial load: if user not logged in, menu can be preloaded, but not cart
loadMenu();
updateCurrentUserDisplay();