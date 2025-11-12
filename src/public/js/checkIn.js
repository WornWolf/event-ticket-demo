// public/js/checkIn.js

function initCheckIn(currentUserId) {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  const resultArea = document.getElementById("resultArea");

  async function searchTicket() {
    const keyword = input.value.trim();
    if (!keyword) {
      resultArea.innerHTML = `<div class="alert alert-warning">กรุณากรอก Ticket ID หรือ Ticket Code</div>`;
      return;
    }

    resultArea.innerHTML = `<div class="alert alert-info">กำลังค้นหา...</div>`;

    try {
      const res = await fetch("/organizer/checkin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();

      if (!data.success) {
        resultArea.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        return;
      }

      const t = data.ticket;
      renderTicketCard(t);
    } catch (err) {
      console.error(err);
      resultArea.innerHTML = `<div class="alert alert-warning">เกิดข้อผิดพลาด กรุณาลองใหม่</div>`;
    }
  }

  function renderTicketCard(t) {
    const status = t.status; // valid / used / cancelled
    const checkTime = t.checkedInAt
      ? new Date(t.checkedInAt).toLocaleString()
      : "-";
    const qrImg =
      t.qrCodeDataUrl ||
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        t.ticketCode
      )}`;

    // ตรวจสอบว่าเป็นเจ้าของ event หรือไม่
    const isOwner = t.event?.organizer === currentUserId;

    let actionButtons = "";
    if (isOwner) {
      actionButtons = `
      <button class="btn btn-success me-2 mb-2" onclick="updateTicket('${
        t._id
      }','checkin', this)" ${status === "used" ? "disabled" : ""}>
        <i class="bi bi-check-circle"></i> เช็คอินตอนนี้
      </button>
      <button class="btn btn-danger mb-2" onclick="updateTicket('${
        t._id
      }','cancel', this)" ${status === "cancelled" ? "disabled" : ""}>
        <i class="bi bi-x-circle"></i> ยกเลิกบัตร
      </button>
    `;
    } else {
      actionButtons = `<div class="alert alert-info py-2">เจ้าของ event เท่านั้นที่สามารถจัดการได้</div>`;
    }

    resultArea.innerHTML = `
    <div class="card mt-3 shadow-sm">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-8 ">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0"><i class="bi bi-ticket-perforated"></i> ข้อมูลบัตร</h5>
                <a
                href="/ticket/verify?b=${t.booking._id}&t=${t.qrToken}"
                class="btn btn-sm btn-outline-primary w-25"
                target="_blank"
                >
                ดู E-Ticket
                </a>
            </div>
            <hr>
            <p class="mb-1"><strong>Ticket ID:</strong> ${t._id}</p>
            <p class="mb-1"><strong>Ticket Code:</strong> ${t.ticketCode}</p>
            <p class="mb-1"><strong>เจ้าของ:</strong> ${
              t.owner?.name || "ไม่ระบุ"
            }</p>
            <p class="mb-1"><strong>งาน:</strong> ${
              t.event?.title || "ไม่ระบุ"
            }</p>
            <p class="mb-1"><strong>สถานะ:</strong> 
              <span class="badge ${
                status === "valid"
                  ? "bg-success"
                  : status === "used"
                  ? "bg-danger"
                  : "bg-secondary"
              }">
                ${status.toUpperCase()}
              </span>
            </p>
            <p class="mb-3"><strong>เวลาเช็คอิน:</strong> ${checkTime}</p>
            ${actionButtons}
          </div>
          <div class="col-md-4 text-center">
            <div class="border rounded p-2 bg-light">
              <img src="${qrImg}" alt="QR Code" class="img-fluid" style="max-width:200px;" />
              <p class="text-muted small mt-2 mb-0">QR Code ของบัตรนี้</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  // อัปเดตสถานะบัตร
  window.updateTicket = async function (ticketId, action, btnEl) {
    try {
      btnEl.disabled = true;
      btnEl.innerHTML += " ⏳";

      const url =
        action === "checkin"
          ? "/organizer/checkin/confirm"
          : "/organizer/checkin/cancel";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        btnEl.disabled = false;
        btnEl.innerHTML = btnEl.innerHTML.replace(" ⏳", "");
        return;
      }

      const t = data.ticket;
      const card = btnEl.closest(".col-md-8");
      const badge = card.querySelector(".badge");
      badge.textContent = t.status.toUpperCase();
      badge.className = `badge ${
        t.status === "valid"
          ? "bg-success"
          : t.status === "used"
          ? "bg-danger"
          : "bg-secondary"
      }`;

      const buttons = card.querySelectorAll("button");
      buttons.forEach((b) => {
        if (b.innerText.includes("เช็คอิน")) b.disabled = t.status === "used";
        if (b.innerText.includes("ยกเลิก")) b.disabled = t.status === "cancelled";
      });

      btnEl.innerHTML = btnEl.innerHTML.replace(" ⏳", "");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
      btnEl.disabled = false;
      btnEl.innerHTML = btnEl.innerHTML.replace(" ⏳", "");
    }
  };

  btn.addEventListener("click", searchTicket);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchTicket();
  });
}
