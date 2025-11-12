document.addEventListener("DOMContentLoaded", () => {
  const bookBtn = document.getElementById("bookBtn");
  const qtyInput = document.getElementById("qtyInput");
  const modalQty = document.getElementById("modalQty");
  const modalTotal = document.getElementById("modalTotal");
  const proceedPaymentBtn = document.getElementById("proceedPaymentBtn");
  const bookForm = document.getElementById("bookForm");
  const eventId = bookForm.dataset.eventId; // <-- ดึงจาก data-event-id
  const modal = new bootstrap.Modal(document.getElementById('bookingSummaryModal'));
  const endDate = qtyInput ? new Date(qtyInput.dataset.end) : null;
  const maxTickets = qtyInput ? parseInt(qtyInput.dataset.max) : 0;
  const now = new Date();

  // ✅ ป้องกันการเพิ่มเกิน max ด้วยลูกศร หรือ copy/paste
  if (qtyInput) {
    qtyInput.addEventListener("input", () => {
      const max = parseInt(qtyInput.dataset.max) || 0;
      const val = parseInt(qtyInput.value) || 1;

      if (val > max) {
        qtyInput.value = max;
        // แจ้งเตือนเล็กน้อยแบบไม่ intrusive
        qtyInput.classList.add("is-invalid");
        setTimeout(() => qtyInput.classList.remove("is-invalid"), 1200);
      } else if (val < 1) {
        qtyInput.value = 1;
      }
    });
  }

  if ((endDate && now > endDate) || maxTickets <= 0) {
    if (bookBtn) bookBtn.disabled = true;
    if (qtyInput) qtyInput.disabled = true;
  }

  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      if (bookBtn.disabled) return;

      const qty = parseInt(qtyInput.value) || 1;
      const price = parseFloat(qtyInput.dataset.price) || 0;
      const total = qty * price;

      modalQty.textContent = qty;
      modalTotal.textContent = total.toLocaleString();

      modal.show();
    });
  }

  if (proceedPaymentBtn) {
    proceedPaymentBtn.addEventListener("click", () => {
      const hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.name = "qty";
      hiddenInput.value = qtyInput.value;
      bookForm.appendChild(hiddenInput);

      bookForm.method = "post";
      bookForm.action = `/events/${eventId}/book`;
      bookForm.submit();
    });
  }
});
