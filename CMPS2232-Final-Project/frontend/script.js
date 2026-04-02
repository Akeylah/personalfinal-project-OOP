const API_BASE = "http://localhost:3000/api";

let currentUser = null;

// ------------------------------
// Utility helpers
// ------------------------------
function setStatus(elementId, message) {
  document.getElementById(elementId).textContent = message;
}

function updateCurrentUserDisplay() {
  const box = document.getElementById("currentUserInfo");

  if (!currentUser) {
    box.textContent = "No user logged in.";
    return;
  }

  box.innerHTML = `
    <strong>User ID:</strong> ${currentUser.user_id}<br>
    <strong>Username:</strong> ${currentUser.username}<br>
    <strong>Email:</strong> ${currentUser.email}<br>
    <strong>Role:</strong> ${currentUser.role}
  `;
}

async function safeFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// ------------------------------
// AUTH
// ------------------------------
document.getElementById("signupBtn").addEventListener("click", async () => {
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const role = document.getElementById("signupRole").value;

  try {
    const data = await safeFetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, email, password, role })
    });

    setStatus("authStatus", `Signup successful: ${data.user.username} (${data.user.role})`);
  } catch (error) {
    setStatus("authStatus", `Signup error: ${error.message}`);
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const data = await safeFetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    currentUser = data.user;
    updateCurrentUserDisplay();
    setStatus("authStatus", `Login successful: ${data.user.username}`);
  } catch (error) {
    setStatus("authStatus", `Login error: ${error.message}`);
  }
});

// ------------------------------
// MENU
// ------------------------------
document.getElementById("loadMenuBtn").addEventListener("click", loadMenu);

async function loadMenu() {
  const container = document.getElementById("menuContainer");
  container.innerHTML = "<p>Loading menu...</p>";

  try {
    const items = await safeFetch(`${API_BASE}/menu`);

    if (!items.length) {
      container.innerHTML = `<p class="empty">No menu items found.</p>`;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="menu-item">
        <h3>${item.name}</h3>
        <p><strong>ID:</strong> ${item.item_id}</p>
        <p><strong>Description:</strong> ${item.description || "No description"}</p>
        <p><strong>Category:</strong> ${item.category || "N/A"}</p>
        <p><strong>Price:</strong> $${Number(item.price).toFixed(2)}</p>

        <div class="item-actions">
          <input type="number" min="1" value="1" id="qty-${item.item_id}" />
          <button onclick="addToCart(${item.item_id})">Add to Cart</button>
        </div>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = `<p class="empty">Failed to load menu: ${error.message}</p>`;
  }
}

// ------------------------------
// CART
// ------------------------------
async function addToCart(itemId) {
  if (!currentUser) {
    alert("Please log in first.");
    return;
  }

  const qtyInput = document.getElementById(`qty-${itemId}`);
  const quantity = Number(qtyInput.value);

  try {
    const data = await safeFetch(`${API_BASE}/orders/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: currentUser.user_id,
        item_id: itemId,
        quantity
      })
    });

    alert(data.message);
    loadCart();
  } catch (error) {
    alert(`Add to cart failed: ${error.message}`);
  }
}

document.getElementById("loadCartBtn").addEventListener("click", loadCart);

async function loadCart() {
  const container = document.getElementById("cartContainer");

  if (!currentUser) {
    container.innerHTML = `<p class="empty">Please log in first.</p>`;
    return;
  }

  container.innerHTML = "<p>Loading cart...</p>";

  try {
    const data = await safeFetch(`${API_BASE}/orders/cart/${currentUser.user_id}`);

    if (!data.items.length) {
      container.innerHTML = `<p class="empty">Your cart is empty.</p>`;
      return;
    }

    const itemsHtml = data.items.map(item => `
      <div class="cart-item">
        <h3>${item.name}</h3>
        <p><strong>Cart Item ID:</strong> ${item.cart_item_id}</p>
        <p><strong>Item ID:</strong> ${item.item_id}</p>
        <p><strong>Price:</strong> $${Number(item.price).toFixed(2)}</p>
        <p><strong>Quantity:</strong> ${item.quantity}</p>
        <p><strong>Subtotal:</strong> $${Number(item.subtotal).toFixed(2)}</p>
        <button onclick="removeFromCart(${item.cart_item_id})">Remove</button>
      </div>
    `).join("");

    container.innerHTML = `
      ${itemsHtml}
      <div class="total-box">Total: $${Number(data.total).toFixed(2)}</div>
    `;
  } catch (error) {
    container.innerHTML = `<p class="empty">Failed to load cart: ${error.message}</p>`;
  }
}

async function removeFromCart(cartItemId) {
  try {
    const data = await safeFetch(`${API_BASE}/orders/cart/item/${cartItemId}`, {
      method: "DELETE"
    });

    alert(data.message);
    loadCart();
  } catch (error) {
    alert(`Remove failed: ${error.message}`);
  }
}

// ------------------------------
// PLACE ORDER
// ------------------------------
document.getElementById("placeOrderBtn").addEventListener("click", async () => {
  if (!currentUser) {
    setStatus("orderStatus", "Please log in first.");
    return;
  }

  const orderType = document.getElementById("orderType").value;
  const address = document.getElementById("deliveryAddress").value.trim();

  const payload = {
    user_id: currentUser.user_id,
    order_type: orderType
  };

  if (orderType === "delivery") {
    payload.address = address;
    payload.payment_method = "cash_on_delivery";
  } else {
    payload.payment_method = "pickup_payment";
  }

  try {
    const data = await safeFetch(`${API_BASE}/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    setStatus(
      "orderStatus",
      `Order placed successfully! Order ID: ${data.order_id}, Total: $${Number(data.total_price).toFixed(2)}`
    );

    loadCart();
    loadMyOrders();
  } catch (error) {
    setStatus("orderStatus", `Order failed: ${error.message}`);
  }
});

// ------------------------------
// MY ORDERS
// ------------------------------
document.getElementById("loadMyOrdersBtn").addEventListener("click", loadMyOrders);

async function loadMyOrders() {
  const container = document.getElementById("myOrdersContainer");

  if (!currentUser) {
    container.innerHTML = `<p class="empty">Please log in first.</p>`;
    return;
  }

  container.innerHTML = "<p>Loading orders...</p>";

  try {
    const orders = await safeFetch(`${API_BASE}/orders/user/${currentUser.user_id}`);

    if (!orders.length) {
      container.innerHTML = `<p class="empty">No orders found.</p>`;
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-item">
        <h3>Order #${order.order_id}</h3>
        <p><strong>Type:</strong> ${order.order_type}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> $${Number(order.total_price).toFixed(2)}</p>
        <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = `<p class="empty">Failed to load orders: ${error.message}</p>`;
  }
}

// ------------------------------
// ADMIN
// ------------------------------
document.getElementById("loadAllOrdersBtn").addEventListener("click", loadAllOrders);

async function loadAllOrders() {
  const container = document.getElementById("adminOrdersContainer");

  if (!currentUser) {
    container.innerHTML = `<p class="empty">Please log in first.</p>`;
    return;
  }

  if (currentUser.role !== "admin") {
    container.innerHTML = `<p class="empty">You must be logged in as admin.</p>`;
    return;
  }

  container.innerHTML = "<p>Loading all orders...</p>";

  try {
    const orders = await safeFetch(`${API_BASE}/admin/orders`);

    if (!orders.length) {
      container.innerHTML = `<p class="empty">No orders found.</p>`;
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="admin-order-item">
        <h3>Order #${order.order_id}</h3>
        <p><strong>User:</strong> ${order.username}</p>
        <p><strong>User ID:</strong> ${order.user_id}</p>
        <p><strong>Type:</strong> ${order.order_type}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Total:</strong> $${Number(order.total_price).toFixed(2)}</p>
        <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = `<p class="empty">Failed to load all orders: ${error.message}</p>`;
  }
}

document.getElementById("updateOrderStatusBtn").addEventListener("click", async () => {
  if (!currentUser) {
    setStatus("adminStatus", "Please log in first.");
    return;
  }

  if (currentUser.role !== "admin") {
    setStatus("adminStatus", "You must be logged in as admin.");
    return;
  }

  const orderId = document.getElementById("adminOrderId").value.trim();
  const status = document.getElementById("adminOrderStatus").value;

  if (!orderId) {
    setStatus("adminStatus", "Please enter an Order ID.");
    return;
  }

  try {
    const data = await safeFetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    setStatus("adminStatus", data.message);
    loadAllOrders();
  } catch (error) {
    setStatus("adminStatus", `Update failed: ${error.message}`);
  }
});

// Initialize UI
updateCurrentUserDisplay();