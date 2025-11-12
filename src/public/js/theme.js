// ======================
// Theme Toggle
// ======================
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");
const saved = localStorage.getItem("theme") || "light";

root.setAttribute("data-theme", saved);
toggle.innerHTML =
  saved === "dark"
    ? '<i class="bi bi-moon-stars"></i>'
    : '<i class="bi bi-sun"></i>';

toggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  toggle.innerHTML =
    next === "dark"
      ? '<i class="bi bi-moon-stars"></i>'
      : '<i class="bi bi-sun"></i>';
});

// ======================
// Update Nav User Info
// ======================
function updateNavUser(name, avatarUrl) {
  const nameEl = document.getElementById("navUserName");
  const avatarEl = document.getElementById("navAvatar");
  const dropdownEl = document.getElementById("navUserNameDropdown");

  if (nameEl && name) nameEl.textContent = name;
  if (dropdownEl && name) dropdownEl.textContent = name;
  if (avatarEl && avatarUrl)
    avatarEl.src = avatarUrl + "?t=" + Date.now();
}

// ======================
// Auto-hide Bootstrap Alerts
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 3000);
  });
});
