// cart.js — add "today-only" guard + popup feedback
(() => {
  const LS_KEY = 'smartbytes.consumed.v1';

  const getStore = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
  };
  const setStore = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

  const today = () => {
    const d = new Date();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  // === NEW: guard that only allows today's date ===
  function isTodayDate(dateStr) {
    return (dateStr || '').slice(0,10) === today();
  }

  // === NEW: simple centered popup ===
  function showPopup(message) {
    let backdrop = document.querySelector('.sb-alert-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sb-alert-backdrop';
      backdrop.innerHTML = `
        <div class="sb-alert" role="dialog" aria-modal="true" aria-live="assertive">
          <div class="sb-alert-title">Can’t add for this date</div>
          <div class="sb-alert-msg"></div>
          <button type="button" class="sb-alert-btn">OK</button>
        </div>`;
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', (e) => {
        if (e.target.classList.contains('sb-alert-backdrop') ||
            e.target.classList.contains('sb-alert-btn')) {
          backdrop.classList.remove('show');
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') backdrop.classList.remove('show');
      });
    }
    backdrop.querySelector('.sb-alert-msg').textContent = message;
    backdrop.classList.add('show');
  }

  // lightweight toast (kept for success)
  function showToast(msg='Added to My Meals') {
    let t = document.querySelector('.toast-fixed');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast-fixed';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1200);
  }

  function persist(entry) {
    try {
      const arr = getStore();
      arr.push(entry);
      setStore(arr);
    } catch {
      setStore([entry]);
    }
  }

  // -------- My Meals rendering (unchanged) --------
  function renderMyMealsPage() {
    const listEl = document.getElementById('meal-list');
    if (!listEl) return;

    const dateInput = document.getElementById('meal-date-input');
    const curDate = dateInput?.value || today();
    const store = getStore();
    const entries = store.filter(e => e.date === curDate);

    const totals = entries.reduce((acc, e) => {
      acc.cal += e.calories || 0;
      acc.pro += e.protein || 0;
      acc.carbs += e.carbs || 0;
      acc.fat += e.fat || 0;
      return acc;
    }, { cal:0, pro:0, carbs:0, fat:0 });

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
    setText('stat-cal', totals.cal);
    setText('stat-pro', totals.pro);
    setText('stat-carbs', totals.carbs);
    setText('stat-fat', totals.fat);

    listEl.innerHTML = '';
    if (!entries.length) {
      listEl.innerHTML = `<p class="desc">No meals logged for ${curDate} yet.</p>`;
      return;
    }

    for (const e of entries) {
      const row = document.createElement('div');
      row.className = 'meal-entry';
      row.dataset.id = e.id;
      row.innerHTML = `
        <div class="line">
          <strong>${escapeHTML(e.title)}</strong>
          <span class="meta">${e.meal} · ${e.calories || 0} cal</span>
        </div>
        <div class="desc">P: ${e.protein||0}g · C: ${e.carbs||0}g · F: ${e.fat||0}g</div>
        <div class="entry-actions">
          <div class="stars" data-id="${e.id}" aria-label="Rate ${escapeHTML(e.title)}">
            ${renderStars(e.rating || 0)}
          </div>
          <button class="del-btn" data-id="${e.id}">Remove</button>
        </div>
      `;
      listEl.appendChild(row);
    }
  }

  function escapeHTML(s='') {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function renderStars(rating) {
    const stars = [];
    for (let i=1; i<=5; i++) {
      const isFull = rating >= i;
      stars.push(`
        <span class="star ${isFull ? 'full' : 'empty'}" data-rate="${i}">
          <svg class="star-svg" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </span>`);
    }
    return stars.join('');
  }

  function wireMyMealsInteractions() {
    const listEl = document.getElementById('meal-list');
    if (!listEl) return;

    listEl.addEventListener('click', (e) => {
      const star = e.target.closest('.star');
      const del = e.target.closest('.del-btn');
      const id = (star || del)?.closest('.entry-actions')?.querySelector('.stars')?.dataset.id
              || (del?.dataset.id) || (star?.closest('.stars')?.dataset.id);

      if (star && id) {
        const rate = Number(star.dataset.rate || 0);
        const store = getStore();
        const idx = store.findIndex(x => x.id === id);
        if (idx > -1) {
          store[idx].rating = rate;
          setStore(store);
          const starsContainer = listEl.querySelector(`.stars[data-id="${CSS.escape(id)}"]`);
          if (starsContainer) starsContainer.innerHTML = renderStars(rate);
        }
      }
      if (del && id) {
        const store = getStore().filter(x => x.id !== id);
        setStore(store);
        del.closest('.meal-entry')?.remove();
        document.dispatchEvent(new Event('recalcStats'));
      }
    });

    document.addEventListener('recalcStats', renderMyMealsPage);
  }

  function wireFilters() {
    document.addEventListener('dateChangeRequested', renderMyMealsPage);
    document.addEventListener('mealChangeRequested', renderMyMealsPage);
  }

  // === Modal add (single source of truth) ===
  function wireModalAdd() {
    const btn = document.getElementById('modalAddBtn');
    if (!btn) return;
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', () => {
      // Guard: only allow when selected date is today
      const selectedDate = btn.dataset.date || document.getElementById('meal-date-input')?.value || today();
      if (!isTodayDate(selectedDate)) {
        showPopup(`You can only add meals for today (${today()}).\nChange the date to today to log this meal.`);
        return;
      }

      const entry = {
        id: 'modal-' + Date.now(),
        title: btn.dataset.title || 'Unknown Item',
        calories: Number(btn.dataset.calories || 0),
        protein: Number(btn.dataset.protein || 0),
        carbs: Number(btn.dataset.carbs || 0),
        fat: Number(btn.dataset.fat || 0),
        meal: btn.dataset.meal || 'lunch',
        date: selectedDate,
        rating: 0,
        addedAt: Date.now(),
      };

      persist(entry);

      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Added!';
      document.getElementById('itemModal')?.classList.add('hidden');
      document.dispatchEvent(new Event('recalcStats'));
      showToast();

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = original;
      }, 600);
    });
  }

  // Generic delegate for any future non-modal add buttons (ignored inside modal)
  function wireEatButtons(root=document) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.eat-btn');
      if (!btn) return;
      if (btn.closest('#itemModal')) return; // modal handled above
      e.stopPropagation();

      const item = btn.closest('.item');
      if (!item) return;

      // Guard: only allow today
      const selectedDate = document.getElementById('meal-date-input')?.value || today();
      if (!isTodayDate(selectedDate)) {
        showPopup(`You can only add meals for today (${today()}).\nChange the date to today to log this meal.`);
        return;
      }

      const entry = {
        id: (item.dataset.id || (item.dataset.title || item.dataset.name || 'item') + '-' + Date.now()),
        title: item.dataset.title || item.dataset.name || (item.querySelector('.name,.item-title')?.textContent?.trim() || 'Unknown Item'),
        calories: Number(item.dataset.calories || 0),
        protein: Number(item.dataset.protein || 0),
        carbs: Number(item.dataset.carbs || 0),
        fat: Number(item.dataset.fat || 0),
        meal: document.querySelector('.meal-btn[aria-pressed="true"]')?.dataset.meal || 'lunch',
        date: selectedDate,
        rating: 0,
        addedAt: Date.now()
      };

      persist(entry);
      const original = btn.textContent;
      btn.textContent = 'Added!';
      setTimeout(() => (btn.textContent = original), 900);
      document.dispatchEvent(new Event('recalcStats'));
      showToast();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireModalAdd();
    wireEatButtons(document);
    wireMyMealsInteractions();
    wireFilters();
    renderMyMealsPage();
  });
})();
