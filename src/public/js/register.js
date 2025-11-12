function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("bi-eye");
      icon.classList.add("bi-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("bi-eye-slash");
      icon.classList.add("bi-eye");
    }
  }

  function checkPasswords() {
    const pass = document.getElementById("password").value;
    const confirmPass = document.getElementById("confirmPassword").value;
    if (pass !== confirmPass) {
      alert("รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบ");
      return false;
    }
    return true;
  }

  function checkPasswordStrength() {
    const pass = document.getElementById("password").value;
    const strengthText = document.getElementById("passwordStrength");

    let strength = 0;

    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[\W]/.test(pass)) strength++; // สัญลักษณ์พิเศษ

    let text = "";
    let color = "";

    switch (strength) {
      case 0:
      case 1:
      case 2:
        text = "อ่อนมาก";
        color = "red";
        break;
      case 3:
      case 4:
        text = "ปานกลาง";
        color = "orange";
        break;
      case 5:
        text = "แข็งแรงมาก";
        color = "green";
        break;
    }

    strengthText.textContent = `ความแข็งแรงของรหัสผ่าน: ${text}`;
    strengthText.style.color = color;
  }