/* ============ CONFIG ============ */
// Lisa's WhatsApp number — international format, digits only, no + or spaces
// e.g. Italian number 392 345 6789 → '393923456789'
const LISA_WHATSAPP = '393516738819';

// Admin PIN to open Lisa's management panel
const ADMIN_PIN = '7777';

// Firebase Realtime Database URL — from Firebase console
// Format: https://nurse-on-the-beach-default-rtdb.europe-west1.firebasedatabase.app/
// Leave empty string to fall back to localStorage (useful for local dev)
const FIREBASE_DB_URL = 'https://nurse-on-the-beach-default-rtdb.europe-west1.firebasedatabase.app';

/* ============ STORAGE LAYER ============
 * Thin wrapper: if FIREBASE_DB_URL is set, use Firebase REST API.
 * Otherwise fall back to localStorage (useful for dev / before setup).
 * All functions return Promises for consistency.
 */
const HAS_FIREBASE = !!FIREBASE_DB_URL;

function fbUrl(path) {
  return `${FIREBASE_DB_URL}/${path}.json`;
}

async function fbGet(path) {
  const r = await fetch(fbUrl(path));
  if (!r.ok) throw new Error(`Firebase GET ${path}: ${r.status}`);
  return await r.json();
}

async function fbPut(path, value) {
  const r = await fetch(fbUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!r.ok) throw new Error(`Firebase PUT ${path}: ${r.status}`);
  return await r.json();
}

async function fbDelete(path) {
  const r = await fetch(fbUrl(path), { method: 'DELETE' });
  if (!r.ok) throw new Error(`Firebase DELETE ${path}: ${r.status}`);
  return true;
}

/* ----- Slots -----
 * Shape in Firebase: { '2026-07-15': ['09:00', '11:00'], ... }
 */
async function getSlots() {
  if (!HAS_FIREBASE) {
    try { return JSON.parse(localStorage.getItem('nob_slots') || '{}'); } catch { return {}; }
  }
  try {
    const data = await fbGet('slots');
    return data || {};
  } catch (e) {
    console.error('getSlots failed:', e);
    return {};
  }
}

async function saveDaySlots(dateISO, times) {
  // Save the times for a single day — or delete the key entirely if empty
  if (!HAS_FIREBASE) {
    const all = JSON.parse(localStorage.getItem('nob_slots') || '{}');
    if (times && times.length) all[dateISO] = times;
    else delete all[dateISO];
    localStorage.setItem('nob_slots', JSON.stringify(all));
    return;
  }
  if (times && times.length) {
    await fbPut(`slots/${dateISO}`, times);
  } else {
    await fbDelete(`slots/${dateISO}`);
  }
}

/* ----- Bookings -----
 * Shape in Firebase: { '<id>': { id, name, phone, service, area, where, notes, date, time, createdAt, lang }, ... }
 */
async function getBookings() {
  if (!HAS_FIREBASE) {
    try { return JSON.parse(localStorage.getItem('nob_bookings') || '[]'); } catch { return []; }
  }
  try {
    const data = await fbGet('bookings');
    if (!data) return [];
    return Object.entries(data).map(([key, b]) => ({ ...b, _key: key }));
  } catch (e) {
    console.error('getBookings failed:', e);
    return [];
  }
}

async function addBooking(booking) {
  if (!HAS_FIREBASE) {
    const all = JSON.parse(localStorage.getItem('nob_bookings') || '[]');
    all.push(booking);
    localStorage.setItem('nob_bookings', JSON.stringify(all));
    return booking;
  }
  // Use the booking id as the key so it's stable and easy to delete later
  await fbPut(`bookings/${booking.id}`, booking);
  return { ...booking, _key: String(booking.id) };
}

async function deleteBooking(booking) {
  if (!HAS_FIREBASE) {
    const all = JSON.parse(localStorage.getItem('nob_bookings') || '[]');
    const filtered = all.filter(x => x.id !== booking.id);
    localStorage.setItem('nob_bookings', JSON.stringify(filtered));
    return;
  }
  const key = booking._key || String(booking.id);
  await fbDelete(`bookings/${key}`);
}

/* ============ I18N ============ */
const I18N = {
  en: {
    'nav.services': 'Services', 'nav.about': 'About', 'nav.areas': 'Areas', 'nav.book': 'Book',
    'hero.eyebrow': 'Riviera Romagnola · 2026',
    'hero.h1.a': 'Professional nursing care,',
    'hero.h1.b': 'wherever you are',
    'hero.h1.c': 'on the beach.',
    'hero.sub': 'Trained, qualified and bilingual care brought straight to your hotel, apartment or beach umbrella along the Cesenatico coast.',
    'hero.cta.book': 'Book a visit',
    'hero.cta.services': 'See services',
    'hero.badge.qualified': 'Qualified nurse',
    'hero.badge.bilingual': 'IT / EN bilingual',
    'hero.badge.fast': 'Same-day response',
    'hero.sticker': 'care you trust',

    'services.eyebrow': 'What Lisa offers',
    'services.h2.a': 'Professional care,',
    'services.h2.b': 'poolside.',
    'svc.dress.t': 'Wound Care & Dressings',
    'svc.dress.d': 'Expert cleaning, dressing changes, and healing support for cuts, scrapes and post-op wounds.',
    'svc.inj.t': 'Injections & Vaccinations',
    'svc.inj.d': 'Safe and comfortable intramuscular or subcutaneous injections using your prescribed medication.',
    'svc.iv.t': 'IV Hydration Therapy',
    'svc.iv.d': 'Quick rehydration for heat, travel fatigue, or too many days in the sun.',
    'svc.sun.t': 'Sunburn Treatment',
    'svc.sun.d': 'Assessment and relief for sunburn, heat exhaustion and skin reactions — back to the beach fast.',
    'svc.vit.t': 'Blood Pressure & Vitals',
    'svc.vit.d': 'Pressure, pulse, oxygen saturation and temperature — peace of mind in minutes.',
    'svc.post.t': 'Post-op & First Aid',
    'svc.post.d': 'Stitch removal, post-operative checks, minor emergencies — cuts, burns, sprains, allergic reactions.',
    'svc.bls.t': 'BLS Training & Demos',
    'svc.bls.d': 'CPR and basic life support demonstrations, techniques, and training sessions — learn to save a life.',

    'about.eyebrow': 'The nurse behind the sunshine',
    'about.h2.a': "Hi, I'm",
    'about.p1': "I'm a fully qualified Italian nurse based on the Riviera Romagnola, and I founded Nurse on the Beach to bring proper clinical care to travellers, families and seasonal visitors — right where they're staying.",
    'about.p2': "Whether you need a quick vitals check at your hotel, a dressing changed in your apartment, or a rehydration infusion after one too many days in the sun, my goal is simple: reliable, warm, professional care without interrupting your holiday.",
    'about.p3': "I speak fluent Italian and English, so there's no language barrier to worry about. You're in safe hands.",
    'pillar.1.t': 'Qualified & insured',
    'pillar.1.d': 'Registered nurse with full clinical training.',
    'pillar.2.t': 'Warm & personal',
    'pillar.2.d': 'One-to-one care that treats you like a human, not a number.',
    'pillar.3.t': 'I come to you',
    'pillar.3.d': "Hotel, apartment, villa, beach club — wherever you're staying.",
    'pillar.4.t': 'IT / EN fluent',
    'pillar.4.d': 'Comfortable switching languages to put you at ease.',

    'areas.eyebrow': 'Where I work',
    'areas.h2.a': 'Serving the',
    'areas.h2.b': 'Cesenatico coast.',
    'areas.sub': 'Available across three main areas on the Riviera Romagnola.',

    'book.eyebrow': 'Book your visit',
    'book.h2.a': "Let's get you",
    'book.h2.b': 'feeling great.',
    'form.name': 'Your name',
    'form.phone': 'Phone / WhatsApp',
    'form.service': 'Service needed',
    'form.area': 'Area',
    'form.where': 'Hotel / address',
    'form.date': 'Preferred date',
    'form.time': 'Preferred time',
    'form.time.pick': 'Select a date first.',
    'form.notes': 'Notes (optional)',
    'form.notes.placeholder': 'Anything Lisa should know — allergies, specific medication, etc.',
    'form.note': "You'll be redirected to WhatsApp to confirm with Lisa directly.",
    'form.submit': 'Send booking request',
    'form.submitting': 'Sending…',
    'opt.dress': 'Wound Care & Dressings',
    'opt.inj': 'Injections & Vaccinations',
    'opt.iv': 'IV Hydration Therapy',
    'opt.sun': 'Sunburn Treatment',
    'opt.vit': 'Blood Pressure & Vitals',
    'opt.post': 'Post-op & First Aid',
    'opt.bls': 'BLS Training & Demos',
    'opt.other': "Other — I'll explain",

    'conf.h': 'Request sent!',
    'conf.p': 'WhatsApp should have opened — send the message to confirm with Lisa. Your booking is also saved in her calendar.',
    'conf.again': 'Book another visit',

    'foot.by': 'Run by Lisa · Qualified Italian nurse · IT / EN',
    'foot.area': 'Gatteo a Mare · Cesenatico · Milano Marittima',
    'foot.disclaimer': 'Not an emergency service. For emergencies call 112.',
    'cal.months': ['January','February','March','April','May','June','July','August','September','October','November','December'],
    'cal.days': ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    'alert.missing': 'Please fill in your name, phone, service, area, date and time.',
    'alert.noslots': 'No slots available for this day yet. Pick another date or contact Lisa directly.',
    'alert.savefailed': 'Could not save your booking. Please try again, or contact Lisa directly via WhatsApp.',
    'alert.loadfailed': 'Could not load data. Check your internet and try again.',

    'admin.title': 'Admin',
    'admin.tab.bookings': 'Bookings',
    'admin.tab.slots': 'Available slots',
    'admin.no_bookings': 'No bookings yet.',
    'admin.slots_intro': "Add the times you're available for each of the next 14 days. Clients will only be able to pick from these.",
    'admin.delete': 'delete',
    'admin.add': '+ add',
    'admin.confirm_delete': 'Delete this booking?',
    'admin.saving': 'Saving…',
    'admin.saved': 'Saved',
    'admin.savefailed': 'Save failed',
    'admin.loading': 'Loading…',
  },
  it: {
    'nav.services': 'Servizi', 'nav.about': 'Chi sono', 'nav.areas': 'Zone', 'nav.book': 'Prenota',
    'hero.eyebrow': 'Riviera Romagnola · 2026',
    'hero.h1.a': 'Assistenza infermieristica professionale,',
    'hero.h1.b': 'ovunque tu sia',
    'hero.h1.c': 'in spiaggia.',
    'hero.sub': 'Cure qualificate e bilingui direttamente in hotel, appartamento o sotto l’ombrellone sulla costa cesenaticense.',
    'hero.cta.book': 'Prenota una visita',
    'hero.cta.services': 'Vedi i servizi',
    'hero.badge.qualified': 'Infermiera qualificata',
    'hero.badge.bilingual': 'Bilingue IT / EN',
    'hero.badge.fast': 'Risposta in giornata',
    'hero.sticker': 'cure di cui fidarsi',

    'services.eyebrow': 'Cosa offre Lisa',
    'services.h2.a': 'Cure professionali,',
    'services.h2.b': 'in vacanza.',
    'svc.dress.t': 'Medicazioni e cura ferite',
    'svc.dress.d': 'Pulizia esperta, cambio medicazioni e supporto alla guarigione per tagli, abrasioni e ferite post-operatorie.',
    'svc.inj.t': 'Iniezioni e vaccinazioni',
    'svc.inj.d': 'Iniezioni intramuscolari e sottocutanee sicure e confortevoli, con il farmaco che ti è stato prescritto.',
    'svc.iv.t': 'Flebo e idratazione',
    'svc.iv.d': 'Reidratazione rapida per caldo, stanchezza da viaggio o troppi giorni al sole.',
    'svc.sun.t': 'Scottature solari',
    'svc.sun.d': 'Valutazione e sollievo per scottature, colpi di calore e reazioni cutanee — per tornare subito in spiaggia.',
    'svc.vit.t': 'Pressione e parametri',
    'svc.vit.d': 'Pressione, battito, saturazione e temperatura — tranquillità in pochi minuti.',
    'svc.post.t': 'Post-operatorio e primo soccorso',
    'svc.post.d': 'Rimozione punti, controlli post-operatori, piccole emergenze — tagli, ustioni, distorsioni, reazioni allergiche.',
    'svc.bls.t': 'Addestramento BLS e dimostrazioni',
    'svc.bls.d': 'Dimostrazioni di RCP e primo soccorso, tecniche e sessioni di addestramento — impara a salvare una vita.',

    'about.eyebrow': 'L’infermiera dietro al sole',
    'about.h2.a': 'Ciao, sono',
    'about.p1': 'Sono un’infermiera italiana qualificata e vivo sulla Riviera Romagnola. Ho creato Nurse on the Beach per portare cure cliniche serie a turisti, famiglie e visitatori stagionali — direttamente dove alloggiano.',
    'about.p2': 'Che tu abbia bisogno di un rapido controllo dei parametri in hotel, di una medicazione in appartamento o di una flebo reidratante dopo un giorno di troppo al sole, il mio obiettivo è uno: assistenza affidabile, calorosa e professionale, senza interrompere la vacanza.',
    'about.p3': 'Parlo fluentemente italiano e inglese, quindi niente barriere linguistiche. Sei in buone mani.',
    'pillar.1.t': 'Qualificata e assicurata',
    'pillar.1.d': 'Infermiera iscritta con formazione clinica completa.',
    'pillar.2.t': 'Calore e attenzione',
    'pillar.2.d': 'Cure uno-a-uno: sei una persona, non un numero.',
    'pillar.3.t': 'Vengo da te',
    'pillar.3.d': 'Hotel, appartamento, villa, stabilimento — ovunque alloggi.',
    'pillar.4.t': 'IT / EN fluente',
    'pillar.4.d': 'Cambio lingua senza problemi per metterti a tuo agio.',

    'areas.eyebrow': 'Dove lavoro',
    'areas.h2.a': 'Al servizio della',
    'areas.h2.b': 'costa cesenaticense.',
    'areas.sub': 'Disponibile in tre zone principali della Riviera Romagnola.',

    'book.eyebrow': 'Prenota la tua visita',
    'book.h2.a': 'Rimettiamoti',
    'book.h2.b': 'in forma.',
    'form.name': 'Nome',
    'form.phone': 'Telefono / WhatsApp',
    'form.service': 'Servizio richiesto',
    'form.area': 'Zona',
    'form.where': 'Hotel / indirizzo',
    'form.date': 'Data preferita',
    'form.time': 'Orario preferito',
    'form.time.pick': 'Seleziona prima una data.',
    'form.notes': 'Note (opzionale)',
    'form.notes.placeholder': 'Tutto ciò che Lisa dovrebbe sapere — allergie, farmaci specifici, ecc.',
    'form.note': 'Verrai reindirizzato su WhatsApp per confermare direttamente con Lisa.',
    'form.submit': 'Invia richiesta',
    'form.submitting': 'Invio…',
    'opt.dress': 'Medicazioni e cura ferite',
    'opt.inj': 'Iniezioni e vaccinazioni',
    'opt.iv': 'Flebo e idratazione',
    'opt.sun': 'Scottature solari',
    'opt.vit': 'Pressione e parametri',
    'opt.post': 'Post-operatorio e primo soccorso',
    'opt.bls': 'Addestramento BLS e dimostrazioni',
    'opt.other': 'Altro — lo spiego io',

    'conf.h': 'Richiesta inviata!',
    'conf.p': 'WhatsApp si è aperto — invia il messaggio per confermare con Lisa. La prenotazione è anche salvata nel suo calendario.',
    'conf.again': 'Prenota un\'altra visita',

    'foot.by': 'Gestito da Lisa · Infermiera italiana qualificata · IT / EN',
    'foot.area': 'Gatteo a Mare · Cesenatico · Milano Marittima',
    'foot.disclaimer': 'Non è un servizio di emergenza. Per emergenze chiama il 112.',
    'cal.months': ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
    'cal.days': ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'],
    'alert.missing': 'Compila nome, telefono, servizio, zona, data e orario.',
    'alert.noslots': 'Nessuno slot disponibile per questo giorno. Scegli un\'altra data o contatta Lisa direttamente.',
    'alert.savefailed': 'Impossibile salvare la prenotazione. Riprova o contatta Lisa direttamente via WhatsApp.',
    'alert.loadfailed': 'Impossibile caricare i dati. Controlla la connessione e riprova.',

    'admin.title': 'Admin',
    'admin.tab.bookings': 'Prenotazioni',
    'admin.tab.slots': 'Orari disponibili',
    'admin.no_bookings': 'Nessuna prenotazione ancora.',
    'admin.slots_intro': 'Aggiungi gli orari in cui sei disponibile per i prossimi 14 giorni. I clienti potranno scegliere solo tra questi.',
    'admin.delete': 'elimina',
    'admin.add': '+ aggiungi',
    'admin.confirm_delete': 'Eliminare questa prenotazione?',
    'admin.saving': 'Salvataggio…',
    'admin.saved': 'Salvato',
    'admin.savefailed': 'Errore salvataggio',
    'admin.loading': 'Caricamento…',
  }
};

let currentLang = localStorage.getItem('nob_lang') || (navigator.language.startsWith('it') ? 'it' : 'en');

function t(key) {
  return I18N[currentLang][key] !== undefined ? I18N[currentLang][key] : key;
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('nob_lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.dataset.t;
    if (I18N[lang][key] !== undefined) el.textContent = I18N[lang][key];
  });
  document.querySelectorAll('[data-t-placeholder]').forEach(el => {
    const key = el.dataset.tPlaceholder;
    if (I18N[lang][key] !== undefined) el.placeholder = I18N[lang][key];
  });
  document.querySelectorAll('.lang-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  renderCalendar();
  renderTimeSlots();
}

document.querySelectorAll('.lang-toggle button').forEach(b => {
  b.addEventListener('click', () => applyLang(b.dataset.lang));
});

/* ============ SYNC STATUS TOAST ============ */
function showToast(message, kind = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast toast-${kind} show`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = `toast toast-${kind}`; }, 2400);
}

/* ============ STATE CACHE ============
 * Slots are cached in memory so the calendar renders instantly.
 * Refreshed on page load and whenever admin changes slots.
 */
let slotsCache = {};

async function refreshSlotsCache() {
  slotsCache = await getSlots();
}

/* ============ CALENDAR ============ */
let calMonth = new Date();
calMonth.setDate(1);
let selectedDate = null;
let selectedSlot = null;

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function renderCalendar() {
  const y = calMonth.getFullYear();
  const m = calMonth.getMonth();
  const title = document.getElementById('cal_title');
  title.textContent = `${I18N[currentLang]['cal.months'][m]} ${y}`;

  const daysEl = document.getElementById('cal_days');
  daysEl.innerHTML = '';
  I18N[currentLang]['cal.days'].forEach(d => {
    const span = document.createElement('div');
    span.className = 'cal-day';
    span.textContent = d;
    daysEl.appendChild(span);
  });

  const datesEl = document.getElementById('cal_dates');
  datesEl.innerHTML = '';
  const firstDay = new Date(y, m, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  for (let i = 0; i < mondayOffset; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal-date other-month';
    b.disabled = true;
    datesEl.appendChild(b);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(y, m, d);
    const dateStr = toISO(dateObj);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cal-date';
    btn.textContent = d;
    if (dateObj.getTime() === today.getTime()) btn.classList.add('today');
    if (dateObj < today) btn.disabled = true;
    // Dot indicator if there are slots available on this day
    if ((slotsCache[dateStr] || []).length > 0 && dateObj >= today) {
      btn.classList.add('has-slots');
    }
    if (selectedDate === dateStr) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      selectedDate = dateStr;
      selectedSlot = null;
      renderCalendar();
      renderTimeSlots();
    });
    datesEl.appendChild(btn);
  }
}

document.getElementById('cal_prev').addEventListener('click', () => {
  calMonth.setMonth(calMonth.getMonth() - 1);
  renderCalendar();
});
document.getElementById('cal_next').addEventListener('click', () => {
  calMonth.setMonth(calMonth.getMonth() + 1);
  renderCalendar();
});

function renderTimeSlots() {
  const container = document.getElementById('time_slots');
  container.innerHTML = '';
  if (!selectedDate) {
    const span = document.createElement('span');
    span.className = 'time-slot-note';
    span.textContent = t('form.time.pick');
    container.appendChild(span);
    return;
  }
  const slots = (slotsCache[selectedDate] || []).slice().sort();
  if (!slots.length) {
    const span = document.createElement('span');
    span.className = 'time-slot-note';
    span.textContent = t('alert.noslots');
    container.appendChild(span);
    return;
  }
  slots.forEach(time => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot' + (selectedSlot === time ? ' selected' : '');
    btn.textContent = time;
    btn.addEventListener('click', () => {
      selectedSlot = time;
      renderTimeSlots();
    });
    container.appendChild(btn);
  });
}

/* ============ BOOKING SUBMIT ============ */
const submitBtn = document.getElementById('submitBtn');
submitBtn.addEventListener('click', async () => {
  const name = document.getElementById('f_name').value.trim();
  const phone = document.getElementById('f_phone').value.trim();
  const service = document.getElementById('f_service').value;
  const area = document.getElementById('f_area').value;
  const where = document.getElementById('f_where').value.trim();
  const notes = document.getElementById('f_notes').value.trim();

  if (!name || !phone || !service || !area || !selectedDate || !selectedSlot) {
    alert(t('alert.missing'));
    return;
  }

  const booking = {
    id: Date.now(),
    name, phone, service, area, where, notes,
    date: selectedDate,
    time: selectedSlot,
    createdAt: new Date().toISOString(),
    lang: currentLang,
  };

  const btnLabel = submitBtn.querySelector('[data-t="form.submit"]');
  const originalText = btnLabel.textContent;
  btnLabel.textContent = t('form.submitting');
  submitBtn.disabled = true;

  try {
    await addBooking(booking);
  } catch (e) {
    console.error(e);
    alert(t('alert.savefailed'));
    btnLabel.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }

  // Open WhatsApp with pre-filled message
  const headline = currentLang === 'it'
    ? `Ciao Lisa! Vorrei prenotare una visita:`
    : `Hi Lisa! I'd like to book a visit:`;
  const lines = [
    headline, '',
    `👤 ${name}`,
    `📞 ${phone}`,
    `🩺 ${service}`,
    `📍 ${area}${where ? ' — ' + where : ''}`,
    `📅 ${selectedDate} · ${selectedSlot}`,
  ];
  if (notes) lines.push(`📝 ${notes}`);
  const msg = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/${LISA_WHATSAPP}?text=${msg}`, '_blank');

  document.getElementById('bookingForm').style.display = 'none';
  document.getElementById('confirmation').classList.add('show');

  btnLabel.textContent = originalText;
  submitBtn.disabled = false;
});

document.getElementById('newBooking').addEventListener('click', () => {
  document.getElementById('bookingForm').style.display = '';
  document.getElementById('confirmation').classList.remove('show');
  ['f_name','f_phone','f_service','f_area','f_where','f_notes'].forEach(id => document.getElementById(id).value = '');
  selectedDate = null; selectedSlot = null;
  renderCalendar(); renderTimeSlots();
});

/* ============ ADMIN ============ */
const adminPanel = document.getElementById('adminPanel');
document.getElementById('adminLink').addEventListener('click', (e) => {
  e.preventDefault();
  const pin = prompt('PIN?');
  if (pin !== ADMIN_PIN) return;
  adminPanel.classList.add('show');
  renderAdminBookings();
  renderSlotsEditor();
});
document.getElementById('adminClose').addEventListener('click', () => adminPanel.classList.remove('show'));

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab_bookings').style.display = tab.dataset.tab === 'bookings' ? '' : 'none';
    document.getElementById('tab_slots').style.display = tab.dataset.tab === 'slots' ? '' : 'none';
    if (tab.dataset.tab === 'bookings') renderAdminBookings();
    if (tab.dataset.tab === 'slots') renderSlotsEditor();
  });
});

async function renderAdminBookings() {
  const list = document.getElementById('bookingsList');
  list.innerHTML = `<p style="color: var(--ink-soft);">${t('admin.loading')}</p>`;
  let all;
  try {
    all = await getBookings();
  } catch (e) {
    list.innerHTML = `<p style="color: var(--coral-deep);">${t('alert.loadfailed')}</p>`;
    return;
  }
  all.sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (!all.length) {
    list.innerHTML = `<p style="color: var(--ink-soft);">${t('admin.no_bookings')}</p>`;
    return;
  }
  list.innerHTML = '';
  all.forEach(b => {
    const div = document.createElement('div');
    div.className = 'admin-booking';
    div.innerHTML = `
      <div>
        <strong>${escapeHtml(b.name)}</strong> · ${b.date} ${b.time}<br>
        <span class="admin-booking-meta">${escapeHtml(b.service)} · ${escapeHtml(b.area)}${b.where ? ' — ' + escapeHtml(b.where) : ''}</span><br>
        <span class="admin-booking-meta">📞 ${escapeHtml(b.phone)}${b.notes ? ' · 📝 ' + escapeHtml(b.notes) : ''}</span>
      </div>
      <button type="button" class="admin-del">${t('admin.delete')}</button>
    `;
    div.querySelector('.admin-del').addEventListener('click', async () => {
      if (!confirm(t('admin.confirm_delete'))) return;
      try {
        await deleteBooking(b);
        showToast(t('admin.saved'), 'success');
        renderAdminBookings();
      } catch (err) {
        console.error(err);
        showToast(t('admin.savefailed'), 'error');
      }
    });
    list.appendChild(div);
  });
}

async function renderSlotsEditor() {
  const editor = document.getElementById('slotsEditor');
  editor.innerHTML = `<p style="color: var(--ink-soft);">${t('admin.loading')}</p>`;
  await refreshSlotsCache();
  editor.innerHTML = '';
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const iso = toISO(d);
    const daySlots = (slotsCache[iso] || []).slice().sort();
    const div = document.createElement('div');
    div.className = 'slot-day';
    const dayName = I18N[currentLang]['cal.days'][(d.getDay() + 6) % 7];
    const monthName = I18N[currentLang]['cal.months'][d.getMonth()];
    div.innerHTML = `
      <div class="slot-day-head">
        <strong>${dayName} ${d.getDate()} ${monthName}</strong>
        <span style="color: var(--ink-soft); font-size: 0.85rem;">${iso}</span>
      </div>
      <div class="slot-chips"></div>
      <div class="slot-add">
        <input type="time" step="900" />
        <button type="button">${t('admin.add')}</button>
      </div>
    `;
    const chipsEl = div.querySelector('.slot-chips');
    daySlots.forEach(time => {
      const chip = document.createElement('div');
      chip.className = 'slot-chip';
      chip.innerHTML = `${time} <button type="button" aria-label="remove">×</button>`;
      chip.querySelector('button').addEventListener('click', async () => {
        const newList = (slotsCache[iso] || []).filter(x => x !== time);
        slotsCache[iso] = newList;
        chip.remove();
        showToast(t('admin.saving'), 'info');
        try {
          await saveDaySlots(iso, newList);
          showToast(t('admin.saved'), 'success');
          renderCalendar();
        } catch (err) {
          console.error(err);
          showToast(t('admin.savefailed'), 'error');
          renderSlotsEditor();
        }
      });
      chipsEl.appendChild(chip);
    });
    const input = div.querySelector('input');
    const addBtn = div.querySelector('.slot-add button');
    addBtn.addEventListener('click', async () => {
      const v = input.value;
      if (!v) return;
      const cur = new Set(slotsCache[iso] || []);
      cur.add(v);
      const newList = Array.from(cur).sort();
      slotsCache[iso] = newList;
      input.value = '';
      showToast(t('admin.saving'), 'info');
      try {
        await saveDaySlots(iso, newList);
        showToast(t('admin.saved'), 'success');
        renderSlotsEditor();
        renderCalendar();
      } catch (err) {
        console.error(err);
        showToast(t('admin.savefailed'), 'error');
        renderSlotsEditor();
      }
    });
    editor.appendChild(div);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ============ Reveal on scroll ============ */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.15 });
document.querySelectorAll('section').forEach(s => {
  s.classList.add('reveal');
  io.observe(s);
});

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('navLinks').classList.remove('open'));
});

/* ============ Init ============ */
(async function init() {
  applyLang(currentLang);
  await refreshSlotsCache();
  renderCalendar();
  renderTimeSlots();
})();
