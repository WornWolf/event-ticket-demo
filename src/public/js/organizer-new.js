const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");
const form = document.getElementById("eventForm");
const imageInput = document.getElementById("image");
const modal = document.getElementById("uploadModal");
const preview = document.getElementById("preview");
const previewContainer = document.getElementById("preview-container");
const editBtn = document.getElementById("editSelectedImage");
const lockStartCheck = document.getElementById("lockStartCheck");

let cropper;

// --- Date helpers ---
function toLocalDateTimeInput(date) {
  const d = new Date(date);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}
function todayLocalISO() { return toLocalDateTimeInput(new Date()); }

// --- Initialize ---
document.addEventListener("DOMContentLoaded", () => {
  const t = todayLocalISO();
  startInput.min = t;
  endInput.min = t;
  if (lockStartCheck.checked) {
    startInput.value = t;
    startInput.readOnly = true;
  }
  updateEndMin();
});

// Update end min
function updateEndMin() {
  const t = todayLocalISO();
  if (lockStartCheck.checked) {
    endInput.min = t;
    if (endInput.value && endInput.value < t) endInput.value = t;
  } else {
    const base = startInput.value || t;
    endInput.min = base;
    if (endInput.value && endInput.value < base) endInput.value = base;
  }
}

// Toggle lockStart
function toggleLockStart() {
  const t = todayLocalISO();
  if (lockStartCheck.checked) {
    startInput.value = t;
    startInput.min = t;
    startInput.readOnly = true;
  } else {
    startInput.readOnly = false;
    startInput.value = "";
    startInput.min = t;
  }
  updateEndMin();
}

// Validate dates
function validateStart() {
  if (!startInput.value) return true;
  if (lockStartCheck.checked) return true;
  const d = new Date(startInput.value);
  const now = new Date();
  const t1 = d.getTime();
  const t2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).getTime();
  if (t1 < t2) {
    alert("ไม่สามารถเลือกวันในอดีตได้");
    startInput.value = "";
    startInput.focus();
    return false;
  }
  return true;
}
function validateEnd() {
  if (!endInput.value) return true;
  const minStr = endInput.min || todayLocalISO();
  const min = new Date(minStr);
  const val = new Date(endInput.value);
  if (val < min) {
    alert("วันสิ้นสุดต้องไม่ต่ำกว่าขอบเขตที่กำหนด");
    endInput.value = minStr;
    endInput.focus();
    return false;
  }
  return true;
}
function validateDates() {
  if (!startInput.value || !endInput.value) return true;
  if (new Date(endInput.value) < new Date(startInput.value)) {
    alert("วันสิ้นสุดต้องไม่ต่ำกว่าวันเริ่มต้น");
    endInput.value = endInput.min || startInput.value;
    endInput.focus();
    return false;
  }
  return true;
}

startInput.addEventListener("change", () => { validateStart(); updateEndMin(); validateDates(); });
endInput.addEventListener("change",   () => { validateEnd(); validateDates(); });

// --- Upload modal ---
function showUploadModal(){ modal.classList.remove("d-none"); setTimeout(()=> modal.classList.add("show"), 10); }
function hideUploadModal(){ modal.classList.remove("show"); setTimeout(()=> modal.classList.add("d-none"), 300); }
form.addEventListener("submit", (e) => { 
  if(!validateStart()||!validateEnd()||!validateDates()){ e.preventDefault(); return; } 
  showUploadModal(); 
});

// --- Image preview & edit ---
function removeImage() {
  imageInput.value = "";
  preview.src = "";
  previewContainer.classList.add("d-none");
  editBtn.classList.add("d-none");
}

function openCropModal(event) {
  let src = "";
  if (event.target && event.target.files && event.target.files[0]) {
    const file = event.target.files[0];
    if (file.size > 5 * 1024 * 1024) { alert("⚠️ ไฟล์ใหญ่เกิน 5MB"); removeImage(); return; }
    src = URL.createObjectURL(file);
  } else if (preview.src) {
    src = preview.src;
  } else { alert("ไม่พบรูปสำหรับแก้ไข"); return; }

  const cropImg = document.getElementById("cropImage");
  cropImg.src = src;

  const cropModal = document.getElementById("cropModal");
  cropModal.classList.remove("d-none");
  setTimeout(() => cropModal.classList.add("show"), 10);

  if (cropper) cropper.destroy();
  cropper = new Cropper(cropImg, { aspectRatio: 16/9, viewMode: 1, autoCropArea: 1 });

  // Slider reset
  const zoomSlider = document.getElementById("cropZoom");
  const rotateSlider = document.getElementById("cropRotate");
  zoomSlider.value = 1; rotateSlider.value = 0;
  zoomSlider.oninput = () => cropper.zoomTo(parseFloat(zoomSlider.value));
  rotateSlider.oninput = () => cropper.rotateTo(parseFloat(rotateSlider.value));
}

// Cancel crop
document.getElementById("btnCropCancel").addEventListener("click", closeCrop);
document.getElementById("btnCropCancelFooter").addEventListener("click", closeCrop);
function closeCrop(){ 
  const cropModal=document.getElementById("cropModal");
  cropModal.classList.remove("show"); 
  setTimeout(()=> cropModal.classList.add("d-none"),300);
  if(cropper) cropper.destroy(); cropper=null; 
}

// Confirm crop
document.getElementById("btnCropConfirm").addEventListener("click", () => {
  if (!cropper) return;
  cropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 675 }).toBlob((blob) => {
    const file = new File([blob], "event.jpg", { type: "image/jpeg" });
    const dt = new DataTransfer();
    dt.items.add(file);
    imageInput.files = dt.files;
    preview.src = URL.createObjectURL(blob);
    previewContainer.classList.remove("d-none");
    editBtn.classList.remove("d-none");
    closeCrop();
  }, "image/jpeg", 0.9);
});

// Show preview when image selected
imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    previewContainer.classList.remove("d-none");
    editBtn.classList.remove("d-none");
  }
});
