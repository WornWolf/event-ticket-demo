const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");
const form = document.getElementById("eventForm");
const imageInput = document.getElementById("image");
const modal = document.getElementById("uploadModal");
const preview = document.getElementById("preview");
const previewContainer = document.getElementById("preview-container");
const lockStartCheck = document.getElementById("lockStartCheck");

// --- Date helpers ---
function toLocalDateTimeInput(date){
  const d = new Date(date);
  const tzOffset = d.getTimezoneOffset()*60000;
  return new Date(d.getTime()-tzOffset).toISOString().slice(0,16);
}
function todayLocalISO(){ return toLocalDateTimeInput(new Date()); }

// ---------- Init + min rule เหมือน new.ejs ----------
document.addEventListener("DOMContentLoaded", ()=>{
  const t = todayLocalISO();
  startInput.min = t;
  endInput.min = t;

  if(lockStartCheck.checked){
    startInput.value = t;
    startInput.min = t;
    startInput.readOnly = true;
  }else{
    startInput.readOnly = false;
  }
  updateEndMin();
});

// อัปเดต min ของ end ตามสถานะ lockStart / startInput
function updateEndMin(){
  const t = todayLocalISO();
  if (lockStartCheck.checked) {
    // ติ๊ก "ตั้งแต่วันนี้": end ต้อง >= วันนี้
    endInput.min = t;
    if (endInput.value && endInput.value < t) endInput.value = t;
  } else {
    // ไม่ติ๊ก: end ต้อง >= start (ถ้ายังไม่มี start ใช้วันนี้เป็นฐาน)
    const base = startInput.value || t;
    endInput.min = base;
    if (endInput.value && endInput.value < base) endInput.value = base;
  }
}

function toggleLockStart(){
  const t = todayLocalISO();
  if(lockStartCheck.checked){
    startInput.value = t;
    startInput.min = t;
    startInput.readOnly = true;
  } else {
    startInput.readOnly = false;
    // ให้ผู้ใช้ตั้งค่า start เอง; ถ้าเว้นว่างไว้ end จะกันด้วยวันนี้ใน updateEndMin()
    // ไม่เซ็ต value ติดตาย
  }
  updateEndMin();
}

// --- Validate dates (อิง endInput.min) ---
function validateStart(){
  if(!startInput.value) return true;
  if(lockStartCheck.checked) return true;
  const d=new Date(startInput.value), now=new Date();
  const t1=d.getTime(), t2=new Date(now.getFullYear(),now.getMonth(),now.getDate(),now.getHours(),now.getMinutes()).getTime();
  if(t1<t2){
    alert("ไม่สามารถเลือกวันในอดีตได้");
    startInput.value="";
    startInput.focus();
    return false;
  }
  return true;
}

function validateEnd(){
  if(!endInput.value) return true;
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

function validateDates(){
  if(!startInput.value || !endInput.value) return true;
  if(new Date(endInput.value) < new Date(startInput.value)){
    alert("วันสิ้นสุดต้องไม่ต่ำกว่าวันเริ่มต้น");
    endInput.value = endInput.min || startInput.value;
    endInput.focus();
    return false;
  }
  return true;
}

startInput.addEventListener("change", ()=>{
  validateStart();
  updateEndMin();     // สำคัญ: ปรับขอบเขต end ทุกครั้งที่เปลี่ยน start
  validateDates();
});

endInput.addEventListener("change", ()=>{
  validateEnd();
  validateDates();
});

// --- Upload modal ---
function showUploadModal(){ modal.classList.remove("d-none"); setTimeout(()=> modal.classList.add("show"),10); }
function hideUploadModal(){ modal.classList.remove("show"); setTimeout(()=> modal.classList.add("d-none"),300); }
form.addEventListener("submit",(e)=>{
  if(!validateStart()||!validateEnd()||!validateDates()){ e.preventDefault(); return; }
  showUploadModal();
});

// --- Image preview & remove (no inline onclick) ---
function handleRemoveImage(e){
  e?.preventDefault?.();
  const removeFlag = document.getElementById("removeImage");
  if (imageInput) imageInput.value = "";
  if (preview) preview.src = "";
  if (previewContainer) previewContainer.classList.add("d-none");
  if (removeFlag) removeFlag.value = "1"; // แจ้ง server ให้ลบรูป
}

document.addEventListener("DOMContentLoaded", () => {
  const btnRemove = document.getElementById("btnRemoveImage");
  const removeFlag = document.getElementById("removeImage");
  if (btnRemove) btnRemove.addEventListener("click", handleRemoveImage);
  if (imageInput && removeFlag){
    imageInput.addEventListener("change", (e)=>{
      if(e.target.files && e.target.files[0]) removeFlag.value = "0"; // มีไฟล์ใหม่ → ไม่ลบ
    });
  }
});

// --- Cropper ---
let cropper;
function openCropperWithSrc(src){
  const cropImg=document.getElementById("cropImage");
  cropImg.src=src;
  const cropModal=document.getElementById("cropModal");
  cropModal.classList.remove("d-none");
  setTimeout(()=> cropModal.classList.add("show"),10);

  if(cropper) cropper.destroy();
  cropper=new Cropper(cropImg,{aspectRatio:16/9, viewMode:1, autoCropArea:1});

  const zoomSlider=document.getElementById("cropZoom");
  const rotateSlider=document.getElementById("cropRotate");
  zoomSlider.value=1; rotateSlider.value=0;
  zoomSlider.oninput=()=>{ cropper.zoomTo(parseFloat(zoomSlider.value)); };
  rotateSlider.oninput=()=>{ cropper.rotateTo(parseFloat(rotateSlider.value)); };
}

imageInput.addEventListener("change", (e)=>{
  const file = e.target.files?.[0];
  if(!file) return;
  if(file.size>5*1024*1024){ alert("⚠️ ไฟล์ใหญ่เกิน 5MB"); handleRemoveImage(); return; }
  openCropperWithSrc(URL.createObjectURL(file));
});

// ปุ่มแก้ไขรูปเดิม
const editExistingBtn = document.getElementById("editExistingImage");
if(editExistingBtn){ editExistingBtn.addEventListener("click", ()=>{
  if(preview && preview.src){ openCropperWithSrc(preview.src); }
}); }

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
document.getElementById("btnCropConfirm").addEventListener("click", ()=>{
  const removeFlag = document.getElementById("removeImage");
  if(!cropper) return;
  cropper.getCroppedCanvas({maxWidth:1200, maxHeight:675}).toBlob((blob)=>{
    const file=new File([blob],"event.jpg",{type:"image/jpeg"});
    const dt=new DataTransfer();
    dt.items.add(file);
    imageInput.files=dt.files;

    preview.src=URL.createObjectURL(blob);
    previewContainer.classList.remove("d-none");

    // จะอัปโหลดรูปใหม่แทนของเดิม
    if (removeFlag) removeFlag.value = "0";

    closeCrop();
  },"image/jpeg",0.9);
});
