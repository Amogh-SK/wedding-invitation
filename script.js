(() => {
  const opening = document.getElementById('opening');
  const invitation = document.getElementById('invitation');
  const openButton = document.getElementById('openButton');
  const skipOpening = document.getElementById('skipOpening');
  const scrollPrompt = document.getElementById('scrollPrompt');
  const replayButton = document.getElementById('replayButton');
  let opened = false;

  function openInvitation() {
    if (opened) return;
    opened = true;
    opening.classList.add('opened');
    window.setTimeout(() => {
      invitation.classList.add('visible');
      invitation.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => invitation.classList.add('shown'));
      // Keep the guest on the cover. They choose when to scroll to the invitation.
      setTimeout(() => launchConfetti(), 700);
    }, 1750);
  }
  openButton.addEventListener('click', openInvitation);
  skipOpening.addEventListener('click', openInvitation);
  scrollPrompt.addEventListener('click', () => {
    document.getElementById('invitation').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  replayButton.addEventListener('click', () => {
    opened = false;
    invitation.classList.remove('shown');
    invitation.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      invitation.classList.remove('visible');
      opening.classList.remove('opened');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 500);
  });

  function launchConfetti() {
    const layer = document.getElementById('confettiLayer');
    const colors = ['#b89a5d', '#e2d1a6', '#7b8765', '#d8b8a4', '#f8f0df', '#d7bd78', '#aab594'];
    for (let i = 0; i < 180; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      if (Math.random() > .72) piece.style.borderRadius = '50%';
      piece.style.left = (Math.random() * 100) + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty('--drift', ((Math.random() - .5) * 260) + 'px');
      piece.style.animationDelay = (Math.random() * .8) + 's';
      piece.style.animationDuration = (2.8 + Math.random() * 1.3) + 's';
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 6500);
    }
  }

  // Countdown target: update this date/time for the real wedding.
  const weddingDate = new Date('2026-11-30T10:30:00+05:30').getTime();
  function updateCountdown() {
    const distance = Math.max(0, weddingDate - Date.now());
    const values = {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance % 86400000) / 3600000),
      minutes: Math.floor((distance % 3600000) / 60000),
      seconds: Math.floor((distance % 60000) / 1000)
    };
    Object.entries(values).forEach(([id, value]) => {
      document.getElementById(id).textContent = String(value).padStart(2, '0');
    });
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Scratch foil: draw an opaque gold star on the canvas, then erase it only while dragging.
  const canvas = document.getElementById('scratchCanvas');
  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  let drawing = false, revealed = false, lastPoint = null;

  function starPath(context, w, h) {
    const cx = w / 2, cy = h / 2;
    const outerX = w * 0.47, outerY = h * 0.47;
    const innerX = outerX * 0.48, innerY = outerY * 0.48;
    context.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const rX = i % 2 === 0 ? outerX : innerX;
      const rY = i % 2 === 0 ? outerY : innerY;
      const x = cx + Math.cos(angle) * rX;
      const y = cy + Math.sin(angle) * rY;
      if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath();
  }

  function paintFoil() {
    if (revealed) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Clip all foil artwork to the five-point star so the date underneath stays hidden.
    starPath(ctx, rect.width, rect.height);
    ctx.save();
    ctx.clip();
    const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    grad.addColorStop(0, '#8f815c');
    grad.addColorStop(.18, '#e8d7a8');
    grad.addColorStop(.38, '#b5a06b');
    grad.addColorStop(.56, '#f8edce');
    grad.addColorStop(.76, '#a99562');
    grad.addColorStop(1, '#e4d09c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Fine flecks give the foil a subtle textured finish.
    for (let i = 0; i < 520; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,250,226,.75)' : 'rgba(92,73,39,.22)';
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.15 + .25, 0, Math.PI * 2);
      ctx.fill();
    }
    starPath(ctx, rect.width, rect.height);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#c4a65d';
    ctx.stroke();
    ctx.restore();
    ctx.globalCompositeOperation = 'destination-out';
  }

  function pointFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function scratchTo(point) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(30, wrap.clientWidth * .12);
    if (lastPoint) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    lastPoint = point;
  }

  function checkProgress() {
    if (revealed || !canvas.width || !canvas.height) return;
    // Sample alpha values across the canvas to estimate how much foil has been removed.
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0, samples = 0;
    for (let i = 3; i < pixels.length; i += 4 * 8) {
      samples++;
      if (pixels[i] < 40) transparent++;
    }
    if (samples && transparent / samples > .13) {
      revealed = true;
      canvas.style.transition = 'opacity 1.1s ease';
      canvas.style.opacity = '0';
      setTimeout(() => { canvas.style.display = 'none'; }, 1150);
      document.querySelector('.scratch-footnote').textContent = 'A little glimpse of forever, just for you ✦';
    }
  }

  canvas.addEventListener('pointerdown', e => {
    if (revealed) return;
    drawing = true;
    lastPoint = null;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    scratchTo(pointFromEvent(e));
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    if (!drawing || revealed) return;
    scratchTo(pointFromEvent(e));
    e.preventDefault();
  });
  function endScratch() {
    if (!drawing) return;
    drawing = false;
    lastPoint = null;
    checkProgress();
  }
  canvas.addEventListener('pointerup', endScratch);
  canvas.addEventListener('pointercancel', endScratch);
  canvas.addEventListener('lostpointercapture', endScratch);
  window.addEventListener('resize', paintFoil);
  if ('ResizeObserver' in window) new ResizeObserver(() => paintFoil()).observe(wrap);
  window.addEventListener('load', () => requestAnimationFrame(paintFoil));
  requestAnimationFrame(() => requestAnimationFrame(paintFoil));
  setTimeout(paintFoil, 250);

  document.getElementById('saveDate').addEventListener('click', () => {
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wedding Invitation//EN',
      'BEGIN:VEVENT','UID:wedding-20261130@example.com',
      'DTSTAMP:20261011T000000Z','DTSTART:20261130T050000Z',
      'DTEND:20261130T080000Z','SUMMARY:Amara & Arjun Wedding',
      'LOCATION:Bengaluru, Karnataka','DESCRIPTION:We look forward to celebrating with you.',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'wedding-save-the-date.ics';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Slow, graceful reveals for invitation sections only. The opening cover is untouched.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .14, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('#invitation > section, #invitation > footer').forEach(section => revealObserver.observe(section));
  document.querySelectorAll('.timeline-item').forEach((item, index) => {
    item.style.setProperty('--item-delay', `${index * 130}ms`);
    revealObserver.observe(item);
  });

  // A restrained highlight on the seconds tile gives the countdown a gentle, polished pulse.
  let previousSecond = '';
  setInterval(() => {
    const seconds = document.getElementById('seconds');
    if (!seconds || seconds.textContent === previousSecond) return;
    previousSecond = seconds.textContent;
    seconds.classList.remove('tick');
    void seconds.offsetWidth;
    seconds.classList.add('tick');
  }, 1000);
})();