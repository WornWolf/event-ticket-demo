document.addEventListener("DOMContentLoaded", () => {
  const emailBtn = document.getElementById("useEmailBtn");
  const phoneBtn = document.getElementById("usePhoneBtn");
  const emailField = document.getElementById("emailField");
  const phoneField = document.getElementById("phoneField");
  const emailInput = document.getElementById("emailInput");
  const phoneInput = document.getElementById("phoneInput");
  const countryCode = document.getElementById("countryCode");
  const identifierInput = document.getElementById("identifierInput");
  const form = document.getElementById("forgotForm");
  const submitBtn = document.getElementById("submitBtn");

  // เริ่มต้นเป็น Email
  emailField.classList.remove("d-none");
  phoneField.classList.add("d-none");

  emailBtn.addEventListener("click", () => {
    emailField.classList.remove("d-none");
    phoneField.classList.add("d-none");
  });

  phoneBtn.addEventListener("click", () => {
    phoneField.classList.remove("d-none");
    emailField.classList.add("d-none");
  });

  // ก่อน submit ส่งค่า identifier เดียว + validation
  form.addEventListener("submit", (e) => {
    if (!emailField.classList.contains("d-none")) {
      const emailVal = emailInput.value.trim();
      if (!emailVal) {
        e.preventDefault();
        alert("กรุณาใส่อีเมล");
        emailInput.focus();
        return;
      }
      identifierInput.value = emailVal;
    } else {
      let phoneVal = phoneInput.value.trim().replace(/\s+/g, '');
      if (!phoneVal) {
        e.preventDefault();
        alert("กรุณาใส่เบอร์โทรศัพท์");
        phoneInput.focus();
        return;
      }

      // ถ้าเริ่มด้วย 0 ตัดออก
      if (phoneVal.startsWith("0")) phoneVal = phoneVal.slice(1);

      const code = countryCode.value.startsWith("+") ? countryCode.value : "+" + countryCode.value;
      identifierInput.value = code + phoneVal;
    }
  });
});