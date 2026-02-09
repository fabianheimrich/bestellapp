const deliveryFee = 4.99;

const menuData = [
  { id: "burger", title: "Burger & Sandwiches", icon: "🍔", items: [
    { id: "b1", name: "Veggie mushroom black burger", desc: "Mixed green salad, Tomatoes, Edamame, Mushrooms", price: 16.9, image: "images/burger1.jpg" },
    { id: "b2", name: "All meat burger", desc: "Beef, Bacon, Dill pickles, Smoked cheese, Ketchup, BBQ sauce", price: 15.9, image: "images/burger2.jpg" },
  ]},
  { id: "pizza", title: "Pizza", icon: "🍕", note: "(30cm)", items: [
    { id: "p1", name: "Pizza Margherita", desc: "Tomato Sauce, Mozzarella", price: 11.9, image: "images/pizza1.jpg" },
  ]},
  { id: "salad", title: "Salad", icon: "🥗", items: [
    { id: "s2", name: "Mini green Salad", desc: "Green salad, Cucumber, Carrots, Parsley, Radishes", price: 7.9, image: "images/salad2.jpg" },
  ]},
];

const cart = {};
const itemById = buildItemIndex(menuData);
const els = getEls();

init();

function init() {
  renderMenu();
  bindEvents();
  renderCart();
}

function getEls() {
  return {
    menuRoot: document.getElementById("menuRoot"),
    desktopCartItems: document.getElementById("desktopCartItems"),
    mobileCartItems: document.getElementById("mobileCartItems"),
    desktopSubtotal: document.getElementById("desktopSubtotal"),
    desktopDelivery: document.getElementById("desktopDelivery"),
    desktopTotal: document.getElementById("desktopTotal"),
    mobileSubtotal: document.getElementById("mobileSubtotal"),
    mobileDelivery: document.getElementById("mobileDelivery"),
    mobileTotal: document.getElementById("mobileTotal"),
    desktopOrderBtn: document.getElementById("desktopOrderBtn"),
    mobileOrderBtn: document.getElementById("mobileOrderBtn"),
    cartFab: document.getElementById("cartFab"),
    fabTotal: document.getElementById("fabTotal"),
    cartModal: document.getElementById("cartModal"),
    toast: document.getElementById("toast"),
  };
}

function buildItemIndex(data) {
  const map = {};
  data.forEach((sec) => sec.items.forEach((it) => (map[it.id] = it)));
  return map;
}

function bindEvents() {
  els.menuRoot.addEventListener("click", onMenuClick);
  els.desktopCartItems.addEventListener("click", onCartClick);
  els.mobileCartItems.addEventListener("click", onCartClick);
  els.desktopOrderBtn.addEventListener("click", onOrder);
  els.mobileOrderBtn.addEventListener("click", onOrder);
  els.cartFab.addEventListener("click", openModal);
  els.cartModal.addEventListener("click", onModalClick);
  document.addEventListener("keydown", onEscape);
}

function onMenuClick(e) {
  const btn = e.target.closest("[data-add-id]");
  if (!btn) return;
  changeQty(btn.dataset.addId, 1);
}

function onCartClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  runCartAction(btn.dataset.action, btn.dataset.id);
}

function runCartAction(action, id) {
  if (action === "inc") changeQty(id, 1);
  if (action === "dec") changeQty(id, -1);
  if (action === "remove") delete cart[id];
  renderCart();
}

function changeQty(id, delta) {
  const next = (cart[id] || 0) + delta;
  if (next <= 0) delete cart[id];
  else cart[id] = next;
  renderCart();
}

function onOrder() {
  if (getCartCount() === 0) return showToast("Warenkorb ist leer.");
  Object.keys(cart).forEach((k) => delete cart[k]);
  closeModal();
  renderCart();
  showToast("Testbestellung durchgeführt. Vielen Dank!");
}

function openModal() {
  els.cartModal.classList.add("cartModal--open");
  els.cartModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.cartModal.classList.remove("cartModal--open");
  els.cartModal.setAttribute("aria-hidden", "true");
}

function onModalClick(e) {
  const closeEl = e.target.closest("[data-close]");
  if (!closeEl) return;
  closeModal();
}

function onEscape(e) {
  if (e.key !== "Escape") return;
  if (!els.cartModal.classList.contains("cartModal--open")) return;
  closeModal();
}

function renderMenu() {
  els.menuRoot.innerHTML = menuData.map(sectionTemplate).join("");
}

function sectionTemplate(section) {
  return `
    <section class="menu-section" id="${section.id}">
      ${sectionBarTemplate(section)}
      <div class="menu-list">${section.items.map(menuItemTemplate).join("")}</div>
    </section>
  `;
}

function sectionBarTemplate(section) {
  const note = section.note ? `<span class="section-bar__note">${escapeHtml(section.note)}</span>` : "";
  return `
    <div class="section-bar">
      <div class="section-bar__left">
        <span class="section-bar__icon" aria-hidden="true">${section.icon}</span>
        <h2 class="section-bar__title">${escapeHtml(section.title)} ${note}</h2>
      </div>
    </div>
  `;
}

function menuItemTemplate(item) {
  return `
    <article class="menu-item">
      <img class="menu-item__img" src="${item.image}" alt="${escapeHtml(item.name)}" />
      <div class="menu-item__body">
        <h3 class="menu-item__name">${escapeHtml(item.name)}</h3>
        <p class="menu-item__desc">${escapeHtml(item.desc)}</p>
      </div>
      <div class="menu-item__meta">
        <div class="menu-item__price">${formatEur(item.price)}</div>
        <button class="addBtn" type="button" data-add-id="${item.id}">+</button>
      </div>
    </article>
  `;
}

function renderCart() {
  const items = Object.keys(cart).map((id) => ({ ...itemById[id], id, qty: cart[id] }));
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;
  const html = items.length ? items.map(cartItemTemplate).join("") : emptyCartTemplate();
  els.desktopCartItems.innerHTML = html;
  els.mobileCartItems.innerHTML = html;
  setTotals("desktop", subtotal, subtotal > 0 ? deliveryFee : 0, total);
  setTotals("mobile", subtotal, subtotal > 0 ? deliveryFee : 0, total);
  els.fabTotal.textContent = formatEur(total);
  const text = `Buy now (${formatEur(total)})`;
  els.desktopOrderBtn.textContent = text;
  els.mobileOrderBtn.textContent = text;
}

function cartItemTemplate(item) {
  return `
    <div class="basket-item">
      <div class="basket-item__row">
        <div class="basket-item__name">${item.qty} x ${escapeHtml(item.name)}</div>
        <div class="basket-item__price">${formatEur(item.price * item.qty)}</div>
      </div>
      <div class="basket-item__controls">
        ${qtyTemplate(item.id, item.qty)}
        <button class="iconBtn" data-action="remove" data-id="${item.id}">🗑️</button>
      </div>
    </div>
  `;
}

function qtyTemplate(id, qty) {
  return `
    <div class="qty">
      <button class="iconBtn" data-action="dec" data-id="${id}">−</button>
      <span class="qty__value">${qty}</span>
      <button class="iconBtn" data-action="inc" data-id="${id}">+</button>
    </div>
  `;
}

function emptyCartTemplate() {
  return `<div class="basket-item"><div class="basket-item__name">Dein Warenkorb ist leer.</div></div>`;
}

function setTotals(prefix, subtotal, del, total) {
  document.getElementById(`${prefix}Subtotal`).textContent = formatEur(subtotal);
  document.getElementById(`${prefix}Delivery`).textContent = formatEur(del);
  document.getElementById(`${prefix}Total`).textContent = formatEur(total);
}

function getCartCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("toast--show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(hideToast, 2200);
}

function hideToast() {
  els.toast.classList.remove("toast--show");
}

function formatEur(value) {
  return (value || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;",
  }[m]));
}

