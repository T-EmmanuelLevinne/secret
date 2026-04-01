// ============ CONFIG ============
const ALLOWED_NAMES = ['raine', 'rainel', 'angel'];
const ERROR_MESSAGES = [
  "typo guro ka, usba raine be HAHAHAHAH",
  "lahh dili mani ikaw ba HAHAHAHA",
  "usba guro, basig naakay namali? or basig dili ni ikaw HAHAHA",
  "usba raine be HAHAHAHAH",
  "ayaw pag empty nameeeee di na mudawat HAHAHA"
];
const EMAILJS_PUBLIC_KEY = 'QF0MOZngGzxnNGD0K';
const EMAILJS_SERVICE_ID = 'service_hqklxq7';
const EMAILJS_TEMPLATE_MESSAGE = 'template_qr3x84j';
const EMAILJS_TEMPLATE_EASTER = '';
let visitorName = '';
let currentSlide = 0;
let activeClaimIndex = -1;
let claimedDate = localStorage.getItem('claimed_date') || null;
let claimedItems = JSON.parse(localStorage.getItem('claimed_items') || '{}');
function isMessageSent() { return localStorage.getItem('visitor_message_sent') === '1'; }
function isBothClaimed() { return !!claimedItems[0] && !!claimedItems[1]; }
function isEmailConfigured() {
  return EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_MESSAGE && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
}
function initEmailJs() {
  if (!isEmailConfigured() || typeof emailjs === 'undefined') return;
  emailjs.init({ publicKey: String(EMAILJS_PUBLIC_KEY).trim() });
}
initEmailJs();
async function sendEmailJS(templateId, templateParams) {
  if (typeof emailjs === 'undefined') throw new Error('EmailJS not loaded');
  const sid = String(EMAILJS_SERVICE_ID).trim();
  const tpl = String(templateId).trim();
  const pk = String(EMAILJS_PUBLIC_KEY).trim();
  try {
    return await emailjs.send(sid, tpl, templateParams, { publicKey: pk });
  } catch (err) {
    console.error('EmailJS:', err?.text || err?.message || err);
    throw err;
  }
}
function emailJsTimestamp() {
  return new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function notifyGateEntered(name) {
  if (!isEmailConfigured() || typeof emailjs === 'undefined') return;
  sendEmailJS(EMAILJS_TEMPLATE_MESSAGE, {
    name, title: 'Claim Portal — visitor entered',
    message: name + ' passed the name gate and opened the portal.',
    time: emailJsTimestamp()
  }).catch(function () {});
}
(function restoreState() {
  var saved = localStorage.getItem('visitor_name');
  if (saved && ALLOWED_NAMES.includes(saved.toLowerCase())) {
    visitorName = saved;
    document.getElementById('gate-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    restoreClaimedButtons();
    if (isBothClaimed() && !isMessageSent()) setTimeout(function () { showMessageModal(); }, 700);
  }
})();
function restoreClaimedButtons() {
  [0, 1].forEach(function (i) {
    if (claimedItems[i]) {
      var btn = document.getElementById('claim-btn-' + i);
      btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Claimed';
      btn.classList.add('claimed');
      btn.style.backgroundColor = '#22c55e';
    }
  });
}
function handleNameSubmit() {
  var input = document.getElementById('name-input');
  var val = input.value.trim();
  var errorEl = document.getElementById('error-msg');
  if (!val) return;
  if (ALLOWED_NAMES.includes(val.toLowerCase())) {
    visitorName = val;
    localStorage.setItem('visitor_name', val);
    notifyGateEntered(val);
    document.getElementById('gate-screen').classList.add('hidden');
    var ws = document.getElementById('welcome-screen');
    ws.classList.remove('hidden');
    document.getElementById('welcome-text').textContent = 'welcome ' + val + ' hehe';
    setTimeout(function () {
      ws.classList.add('hidden');
      document.getElementById('main-screen').classList.remove('hidden');
      restoreClaimedButtons();
    }, 1800);
  } else {
    errorEl.textContent = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
    errorEl.classList.add('show');
    input.classList.add('shake');
    setTimeout(function () { input.classList.remove('shake'); }, 500);
  }
}
document.getElementById('name-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') handleNameSubmit();
});
(function setupDateInputFullClick() {
  var el = document.getElementById('date-input');
  if (!el) return;
  var isFirefox = /Firefox\//i.test(navigator.userAgent);
  el.addEventListener('click', function () {
    if (!isFirefox || typeof el.showPicker !== 'function') return;
    try { el.showPicker(); } catch (_) {}
  });
})();
function goSlide(index) {
  currentSlide = index;
  document.getElementById('carousel-track').style.transform = 'translateX(-' + (index * 100) + '%)';
  document.getElementById('arrow-left').classList.toggle('hidden', index === 0);
  document.getElementById('arrow-right').classList.toggle('hidden', index === 1);
  document.getElementById('dot-0').classList.toggle('active', index === 0);
  document.getElementById('dot-0').classList.toggle('inactive', index === 1);
  document.getElementById('dot-1').classList.toggle('active', index === 1);
  document.getElementById('dot-1').classList.toggle('inactive', index === 0);
}
function handleClaim(index) {
  if (claimedItems[index]) return;
  activeClaimIndex = index;
  if (claimedDate) { applyClaimWithDate(index, claimedDate); return; }
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('date-input').min = today;
  document.getElementById('date-input').value = '';
  document.getElementById('date-modal').classList.remove('hidden');
}
function closeDateModal() { document.getElementById('date-modal').classList.add('hidden'); }
function confirmDate() {
  var dateVal = document.getElementById('date-input').value;
  if (!dateVal) return;
  claimedDate = dateVal;
  localStorage.setItem('claimed_date', dateVal);
  closeDateModal();
  applyClaimWithDate(activeClaimIndex, dateVal);
}
function applyClaimWithDate(index, dateVal) {
  claimedItems[index] = true;
  localStorage.setItem('claimed_items', JSON.stringify(claimedItems));
  var btn = document.getElementById('claim-btn-' + index);
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Claimed';
  btn.classList.add('claimed');
  btn.style.backgroundColor = '#22c55e';
  var formatted = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('toast-text').textContent = 'see you on ' + formatted;
  document.getElementById('success-toast').classList.remove('hidden');
  if (isBothClaimed()) {
    notifyBothGiftsClaimed(dateVal, formatted);
  }
  if (isBothClaimed() && !isMessageSent()) {
    setTimeout(function () { closeToast(); showMessageModal(); }, 1800);
  }
}
/** One email per visitor when both carousel gifts are claimed; includes chosen date. */
function notifyBothGiftsClaimed(dateVal, formatted) {
  if (localStorage.getItem('both_gifts_email_sent') === '1') return;
  if (!isEmailConfigured()) return;
  (async function () {
    try {
      await sendEmailJS(EMAILJS_TEMPLATE_MESSAGE, {
        name: visitorName || 'visitor',
        message:
          (visitorName || 'Visitor') +
          ' claimed BOTH surprises/gifts. Date they chose: ' +
          formatted +
          ' (' +
          dateVal +
          ').',
        title: 'Both gifts claimed!',
        time: emailJsTimestamp()
      });
      localStorage.setItem('both_gifts_email_sent', '1');
    } catch (_) {}
  })();
}
function closeToast() { document.getElementById('success-toast').classList.add('hidden'); }
function showMessageModal() {
  if (isMessageSent()) return;
  var el = document.getElementById('message-modal');
  el.classList.remove('hidden', 'modal-overlay--closing');
  el.style.opacity = '';
  document.getElementById('message-form').classList.remove('hidden');
  document.getElementById('message-thanks').classList.add('hidden');
  document.getElementById('visitor-message').value = '';
  document.getElementById('message-send-btn').disabled = false;
}
async function submitVisitorMessage(e) {
  e.preventDefault();
  var textarea = document.getElementById('visitor-message');
  var msg = textarea.value.trim();
  if (!msg) return;
  var sendBtn = document.getElementById('message-send-btn');
  sendBtn.disabled = true;
  if (isEmailConfigured()) {
    try {
      await sendEmailJS(EMAILJS_TEMPLATE_MESSAGE, {
        name: visitorName || 'visitor', message: msg,
        title: 'Claim Portal — new message', time: emailJsTimestamp()
      });
    } catch (_) {
      sendBtn.disabled = false;
      alert('Could not send. Press F12 → Console for EmailJS error text.');
      return;
    }
  }
  localStorage.setItem('visitor_message_sent', '1');
  showMessageThanksAndFadeOut();
}
function showMessageThanksAndFadeOut() {
  document.getElementById('message-form').classList.add('hidden');
  document.getElementById('message-thanks').classList.remove('hidden');
  var el = document.getElementById('message-modal');
  el.classList.remove('modal-overlay--closing');
  el.style.opacity = '';
  var finished = false;
  function finish(ev) {
    if (ev && (ev.target !== el || ev.propertyName !== 'opacity')) return;
    if (finished) return;
    finished = true;
    el.removeEventListener('transitionend', onEnd);
    el.classList.add('hidden');
    el.classList.remove('modal-overlay--closing');
    el.style.opacity = '';
  }
  function onEnd(ev) { finish(ev); }
  var thanksMs = 5000;
  setTimeout(function () {
    el.addEventListener('transitionend', onEnd);
    requestAnimationFrame(function () { el.classList.add('modal-overlay--closing'); });
    setTimeout(function () { finish(); }, 3200);
  }, thanksMs);
}
document.getElementById('message-form').addEventListener('submit', submitVisitorMessage);
function openLetterModal() { document.getElementById('letter-modal').classList.remove('hidden'); }
function closeLetterModal() { document.getElementById('letter-modal').classList.add('hidden'); }
function getEasterStarsClicked() {
  try { return JSON.parse(localStorage.getItem('easter_stars_clicked') || '{}'); } catch (_) { return {}; }
}
/** One email per visitor: first time they click either easter star. */
function notifyEasterStarClicked(starIndex) {
  if (localStorage.getItem('easter_secret_email_sent') === '1') return;
  if (!isEmailConfigured()) return;
  var templateId = EMAILJS_TEMPLATE_EASTER || EMAILJS_TEMPLATE_MESSAGE;
  var n = Number(starIndex) + 1;
  (async function () {
    try {
      await sendEmailJS(templateId, {
        name: visitorName || 'visitor',
        message:
          'They clicked the easter-egg star on surprise #' +
          n +
          ' and opened the secret letter.',
        title: 'Star secret found!',
        time: emailJsTimestamp()
      });
      localStorage.setItem('easter_secret_email_sent', '1');
    } catch (_) {}
  })();
}
function onEasterStarClick(starIndex) {
  openLetterModal();
  var clicked = getEasterStarsClicked();
  clicked[String(starIndex)] = true;
  localStorage.setItem('easter_stars_clicked', JSON.stringify(clicked));
  notifyEasterStarClicked(starIndex);
 }
