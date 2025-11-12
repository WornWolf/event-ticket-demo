window.addEventListener("DOMContentLoaded", () => {
    const countdownEl = document.getElementById("countdown");
    const resendBtn = document.getElementById("resendBtn");
    const otpInput = document.getElementById("otpInput");
    const errorMsg = document.getElementById("errorMsg");

    // ดึงเวลาที่เหลือจาก hidden input
    let timeLeft = parseInt(document.getElementById("timeLeftInput").value) || 60;
    let timer;

    function formatTime(seconds) {
      const m = Math.floor(seconds / 60).toString().padStart(2, "0");
      const s = (seconds % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    }

    function startCountdown() {
      if (timer) clearInterval(timer);
      countdownEl.textContent = formatTime(timeLeft);
      resendBtn.disabled = timeLeft > 0;

      timer = setInterval(() => {
        timeLeft--;
        countdownEl.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(timer);
          countdownEl.textContent = "00:00";
          resendBtn.disabled = false;
        }
      }, 1000);
    }

    startCountdown();

    // แสดงข้อความ error จาก server
    const serverError = document.querySelector("#serverError");
    if (serverError) errorMsg.textContent = serverError.textContent;

    otpInput.addEventListener("input", () => {
      errorMsg.textContent = "";
    });

    // resend
    document.getElementById("resendForm").addEventListener("submit", (e) => {
      e.preventDefault();
      resendBtn.disabled = true;
      resendBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> กำลังส่ง...';
      e.target.submit();
    });
  });