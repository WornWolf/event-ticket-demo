(function() {
  // ---------- Avatar ----------
  const fileInput = document.getElementById('avatar');
  const img = document.getElementById('avatarPreview');
  const removeCb = document.getElementById('removeAvatar');
  const DEFAULT_AVATAR = '/img/default-avatar.png';
  const modal = document.getElementById('uploadModal');
  const spinner = document.getElementById('uploadSpinner');
  const msg = document.getElementById('uploadMsg');

  // Cropper Elements
  const cropModal = document.getElementById('cropModal');
  const cropImage = document.getElementById('cropImage');
  const btnCropConfirm = document.getElementById('btnCropConfirm');
  const btnCropCancel = document.getElementById('btnCropCancel');
  let cropper;

  let originalAvatar = img.src;

  // ---------- Cropper ----------
  fileInput.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f || !f.type.startsWith('image/')) return;

    // ✅ ขนาดไม่เกิน 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if(f.size > MAX_SIZE){
      alert('⚠️ ไฟล์ใหญ่เกินไป! กรุณาเลือกไฟล์ไม่เกิน 2MB');
      fileInput.value=''; img.src = originalAvatar;
      return;
    }

    const url = URL.createObjectURL(f);
    cropImage.src = url;
    cropModal.style.display='flex';

    if(cropper) cropper.destroy();
    cropper = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 1,
      minContainerWidth: 300,
      minContainerHeight: 300,
      movable:true, zoomable:true, rotatable:true, scalable:false
    });
  });

  btnCropCancel.addEventListener('click', ()=>{
    cropModal.style.display='none';
    fileInput.value='';
    if(cropper) { cropper.destroy(); cropper=null; }
  });

  btnCropConfirm.addEventListener('click', ()=>{
    if(!cropper) return;
    cropper.getCroppedCanvas({width:300,height:300}).toBlob(blob=>{
      const file = new File([blob],'avatar.png',{type:'image/png'});
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      img.src = URL.createObjectURL(file);
      cropModal.style.display='none';
      cropper.destroy(); cropper=null;
    },'image/png');
  });

  // ---------- Toggle Remove Avatar ----------
  removeCb.addEventListener('change', ()=>{
    if(removeCb.checked){
      fileInput.value='';
      img.src=DEFAULT_AVATAR+'?t='+Date.now();
    }else{
      if(!fileInput.files.length) img.src=originalAvatar;
    }
  });

  // ---------- Buttons & Forms ----------
  const btnBasic = document.getElementById('btnSaveBasic');
  const basicForm = document.getElementById('basicForm');

  btnBasic.addEventListener('click', async (e)=>{
    e.preventDefault();
    const formData = new FormData(basicForm);
    formData.set('removeAvatar', removeCb.checked?'1':'0');
    if(fileInput.files.length>0) formData.set('avatar', fileInput.files[0]);

    btnBasic.disabled=true;
    modal.style.display='flex';
    spinner.style.display='inline-block';
    msg.textContent='กำลังอัปโหลด...';

    try{
      const res = await fetch('/me',{method:'POST',body:formData});
      const data = await res.json();
      spinner.style.display='none';
      if(data.success){
        if(data.removed){
          img.src=DEFAULT_AVATAR+'?t='+Date.now(); originalAvatar=DEFAULT_AVATAR;
          updateNavUser(data.name,DEFAULT_AVATAR);
        }else if(data.avatarUrl){
          img.src=data.avatarUrl+'?t='+Date.now(); originalAvatar=data.avatarUrl;
          updateNavUser(data.name,data.avatarUrl);
        }else if(data.name){
          img.src=originalAvatar; updateNavUser(data.name,originalAvatar);
        }
        fileInput.value=''; removeCb.checked=false;
        msg.textContent='บันทึกข้อมูลเรียบร้อย ✅';
        setTimeout(()=>{ modal.style.display='none'; },1500);
      }else{
        msg.textContent='บันทึกล้มเหลว ❌: '+(data.error||'Unknown error');
      }
    }catch(e){
      spinner.style.display='none';
      msg.textContent='บันทึกไม่สำเร็จ ❌: '+e.message;
    }finally{
      btnBasic.disabled=false;
    }
  });

  // ---------- Toggle Eye Password ----------
  document.querySelectorAll('.toggle-eye').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const input=btn.previousElementSibling;
      const icon=btn.querySelector('i');
      input.type = input.type==='password'?'text':'password';
      icon.classList.toggle('bi-eye'); icon.classList.toggle('bi-eye-slash');
    });
  });

  // ---------- Password Strength & Match ----------
  const form = document.getElementById('pwdForm');
  const current = document.getElementById('pwCurrent');
  const pw = document.getElementById('pwNew');
  const cf = document.getElementById('pwConfirm');
  const btn = document.getElementById('btnSavePw');
  const bar = document.getElementById('pwStrength');
  const hint = document.getElementById('pwHint');
  const matchMsg = document.getElementById('matchMsg');

  function scorePassword(s){ 
    if(!s) return 0; 
    let sc=0; 
    [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].forEach(rx=>rx.test(s)&&sc++); 
    if(s.length>=8) sc++; if(s.length>=12) sc++; return Math.min(sc,6); 
  }

  function renderStrength(){
    const s=scorePassword(pw.value);
    const pct=[0,20,40,60,80,100,100][s];
    bar.style.width=pct+'%';
    const cls=['bg-danger','bg-warning','bg-info','bg-success'];
    bar.classList.remove(...cls);
    if(s<=2){ bar.classList.add('bg-danger'); hint.textContent='รหัสผ่านอ่อนมาก'; }
    else if(s===3){ bar.classList.add('bg-warning'); hint.textContent='รหัสผ่านพอใช้'; }
    else if(s===4){ bar.classList.add('bg-info'); hint.textContent='รหัสผ่านค่อนข้างดี'; }
    else { bar.classList.add('bg-success'); hint.textContent='รหัสผ่านแข็งแรง'; }
  }

  function renderMatch(){
    const ok = pw.value && cf.value && pw.value===cf.value;
    matchMsg.textContent = ok?'ยืนยันรหัสผ่านตรงกัน':(cf.value?'ยืนยันรหัสผ่านไม่ตรงกัน':'');
    matchMsg.className='small mt-1 '+(ok?'text-success':(cf.value?'text-danger':'text-muted'));
    return ok;
  }

  function validateAll(){
    const okLen = (pw.value||'').length>=8;
    const okStrength = scorePassword(pw.value)>=3;
    const okMatch = renderMatch();
    renderStrength();
    btn.disabled = !(current.value && okLen && okStrength && okMatch);
    if(pw.value && !okStrength){
      hint.textContent='รหัสผ่านอ่อนเกินไป ❌ ต้องระดับพอใช้ขึ้นไป';
      bar.classList.remove('bg-info','bg-success');
      bar.classList.add('bg-danger');
    }
  }

  ['input','change'].forEach(ev=>[current,pw,cf].forEach(el=>el.addEventListener(ev,validateAll)));
  form.addEventListener('submit', e=>{ if(!form.checkValidity()||btn.disabled) e.preventDefault(); form.classList.add('was-validated'); });

  window.updateNavUser = window.updateNavUser || function(name, avatarUrl){};
})();