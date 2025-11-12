// ใช้ data attributes แทน EJS
(function(){
  const box = document.getElementById('countdown-box');
  if (!box) return;

  const startAt = new Date(box.dataset.start);
  const endAt   = box.dataset.end ? new Date(box.dataset.end) : null;
  const lbl = document.getElementById('countdown-label');
  const text = document.getElementById('countdown');

  function fmt(ms){
    if(ms < 0) ms = 0;
    const s = Math.floor(ms/1000);
    const d = Math.floor(s/86400);
    const h = Math.floor((s%86400)/3600);
    const m = Math.floor((s%3600)/60);
    const sec = s%60;
    return `เหลืออีก ${d} วัน ${h} ชั่วโมง ${m} นาที ${sec} วินาที`;
  }

  function setUrgency(msToStart){
    box.classList.remove('countdown-info','countdown-warning','countdown-danger','countdown-success','countdown-secondary');

    const days = msToStart / (1000*60*60*24);

    if (msToStart <= 0) {
      box.classList.remove('d-none');
      box.classList.add('countdown-success');
      lbl.textContent = 'สถานะ';
      text.textContent = 'งานเริ่มแล้ว';
      return;
    }

    if (days > 7) {
      box.classList.add('d-none');
      return;
    }

    box.classList.remove('d-none');
    lbl.textContent = 'งานจะเริ่มใน';
    text.textContent = fmt(msToStart);

    if (days <= 1) box.classList.add('countdown-danger');
    else if (days <= 3) box.classList.add('countdown-warning');
    else box.classList.add('countdown-info');
  }

  function tick(){
    const now = new Date();
    if (endAt && now > endAt) {
      box.classList.remove('d-none');
      box.classList.remove('countdown-info','countdown-warning','countdown-danger','countdown-success');
      box.classList.add('countdown-secondary');
      lbl.textContent = 'สถานะ';
      text.textContent = 'งานจบแล้ว';
      return;
    }
    setUrgency(startAt - now);
    requestAnimationFrame(() => setTimeout(tick, 250));
  }

  tick();
})();
