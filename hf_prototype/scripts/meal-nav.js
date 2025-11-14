// DR5: Inline date picker + meal buttons with cross-page persistence
(function () {
  const LS_DATE_KEY = 'smartbytes.date';
  const LS_MEAL_KEY = 'smartbytes.meal';

  const dateInput = document.getElementById('meal-date-input');
  const mealButtons = Array.from(document.querySelectorAll('.meal-btn[data-meal]'));

  // Helpers
  const todayYYYYMMDD = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isValidDateStr = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

  function setActiveMeal(meal) {
    mealButtons.forEach(btn => {
      const isActive = btn.dataset.meal === meal;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle('active', isActive);
    });
  }

  // Restore from URL (?date=YYYY-MM-DD&meal=lunch) → overrides localStorage if present
  const params = new URLSearchParams(location.search);
  const urlDate = params.get('date');
  const urlMeal = params.get('meal');

  // Date: restore with priority URL → localStorage → today
  const storedDate = localStorage.getItem(LS_DATE_KEY);
  const initialDate = isValidDateStr(urlDate) ? urlDate
                     : isValidDateStr(storedDate) ? storedDate
                     : todayYYYYMMDD();

  if (dateInput) {
    dateInput.value = initialDate;
    // Emit once so listeners can load content for the restored date
    document.dispatchEvent(new CustomEvent('dateChangeRequested', { detail: { date: initialDate } }));

    dateInput.addEventListener('change', () => {
      const picked = dateInput.value;
      if (isValidDateStr(picked)) {
        localStorage.setItem(LS_DATE_KEY, picked);
        document.dispatchEvent(new CustomEvent('dateChangeRequested', { detail: { date: picked } }));
      }
    });
  }

  // Meal: restore with priority URL → localStorage → default ('lunch')
  const storedMeal = localStorage.getItem(LS_MEAL_KEY);
  const initialMeal = (urlMeal || storedMeal || 'lunch').toLowerCase();

  setActiveMeal(initialMeal);
  document.dispatchEvent(new CustomEvent('mealChangeRequested', { detail: { meal: initialMeal } }));

  mealButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const meal = btn.dataset.meal;
      localStorage.setItem(LS_MEAL_KEY, meal);
      setActiveMeal(meal);
      document.dispatchEvent(new CustomEvent('mealChangeRequested', { detail: { meal } }));
    });
  });

  // Optional: keep multiple tabs in sync (not required, but nice)
  window.addEventListener('storage', (e) => {
    if (e.key === LS_DATE_KEY && dateInput && isValidDateStr(e.newValue)) {
      dateInput.value = e.newValue;
      document.dispatchEvent(new CustomEvent('dateChangeRequested', { detail: { date: e.newValue } }));
    }
    if (e.key === LS_MEAL_KEY && e.newValue) {
      setActiveMeal(e.newValue);
      document.dispatchEvent(new CustomEvent('mealChangeRequested', { detail: { meal: e.newValue } }));
    }
  });
})();
