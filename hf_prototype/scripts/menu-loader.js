document.addEventListener("DOMContentLoaded", async () => {
  const PLACEHOLDER_IMG = "images/placeholder-food.jpg";

  const path = window.location.pathname;
  let dataFile = "data/commons.menu.json";
  if (path.includes("sadler")) dataFile = "data/sadler.menu.json";
  if (path.includes("commons")) dataFile = "data/commons.menu.json";

  const sidebar = document.getElementById("sidebar");
  const main = document.getElementById("menuContent");
  const filterLink = document.getElementById("filter-link");

  let availableTags = [];
  let hasMacroData = false;

  /* ============================================================
     FILTER MODAL
  ============================================================ */

  function buildFilterModal() {
    let backdrop = document.getElementById("filterModal");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "filterModal";
    backdrop.className = "filter-backdrop";
    backdrop.innerHTML = `
      <div class="filter-modal">
        <h2>Filter menu</h2>
        <form id="filterForm">
          <section class="filter-section">
            <h3>Tags</h3>
            <div class="filter-tags" id="filterTags"></div>
          </section>

          <section class="filter-section">
            <h3>Calories</h3>
            <div class="filter-row">
              <label>
                Min
                <input type="number" name="minCal" inputmode="numeric" placeholder="0" />
              </label>
              <label>
                Max
                <input type="number" name="maxCal" inputmode="numeric" placeholder="800" />
              </label>
            </div>
          </section>

          <section class="filter-section">
            <h3>Macros (optional)</h3>
            <p class="filter-hint">If macro data is available.</p>
            <div class="filter-row">
              <label>
                Min protein (g)
                <input type="number" name="minProtein" inputmode="numeric" />
              </label>
            </div>
            <div class="filter-row">
              <label>
                Max carbs (g)
                <input type="number" name="maxCarbs" inputmode="numeric" />
              </label>
              <label>
                Max fat (g)
                <input type="number" name="maxFat" inputmode="numeric" />
              </label>
            </div>
          </section>

          <section class="filter-section">
            <h3>Popularity</h3>

            <label class="filter-chip" style="margin-top: 6px;">
              <input type="checkbox" name="sortPopular" value="desc" />
              <span>Sort by popularity</span>
            </label>
          </section>

          <div class="filter-actions">
            <button type="submit" class="filter-apply">Apply filters</button>
            <button type="button" class="filter-clear">Clear</button>
            <button type="button" class="filter-close">Close</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(backdrop);

    // clicking outside closes
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.classList.remove("open");
    });

    const form = backdrop.querySelector("#filterForm");
    const clearBtn = backdrop.querySelector(".filter-clear");
    const closeBtn = backdrop.querySelector(".filter-close");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFiltersFromForm(form);
      backdrop.classList.remove("open");
    });

    clearBtn.addEventListener("click", () => {
      form.reset();
      applyFiltersFromForm(form);
    });

    closeBtn.addEventListener("click", () => backdrop.classList.remove("open"));

    return backdrop;
  }

  function populateTagOptions() {
    const tagContainer = document.getElementById("filterTags");
    if (!tagContainer) return;

    tagContainer.innerHTML = availableTags.length
      ? ""
      : `<p class="filter-hint">No tags available.</p>`;

    availableTags.forEach((tag) => {
      const label = document.createElement("label");
      label.className = "filter-chip";
      label.innerHTML = `
        <input type="checkbox" name="tag" value="${tag}" />
        <span>${tag.replace("_", " ")}</span>
      `;
      tagContainer.appendChild(label);
    });
  }

  function openFilterModal() {
    const backdrop = buildFilterModal();
    populateTagOptions();
    backdrop.classList.add("open");
  }

  function parseNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && value !== "" ? n : null;
  }

  function applyFiltersFromForm(form) {
    if (!main) return;

    const data = new FormData(form);

    const selectedTags = new Set(data.getAll("tag"));
    const minCal = parseNumber(data.get("minCal"));
    const maxCal = parseNumber(data.get("maxCal"));
    const minProtein = parseNumber(data.get("minProtein"));
    const maxCarbs = parseNumber(data.get("maxCarbs"));
    const maxFat = parseNumber(data.get("maxFat"));

    const items = main.querySelectorAll(".item");

    /* -----------------------------
      FILTERING (visibility only)
    ----------------------------- */
    items.forEach((item) => {
      let visible = true;

      const calories = Number(item.dataset.calories || 0);
      let tags = [];
      try {
        tags = JSON.parse(item.dataset.tags || "[]");
      } catch {}

      const protein = Number(item.dataset.protein || 0);
      const carbs = Number(item.dataset.carbs || 0);
      const fat = Number(item.dataset.fat || 0);

      // AND logic for tags
      if (selectedTags.size > 0) {
        const matchAll = [...selectedTags].every((t) => tags.includes(t));
        if (!matchAll) visible = false;
      }

      if (visible && minCal !== null && calories < minCal) visible = false;
      if (visible && maxCal !== null && calories > maxCal) visible = false;

      if (visible && minProtein !== null && protein < minProtein) visible = false;
      if (visible && maxCarbs !== null && carbs > maxCarbs) visible = false;
      if (visible && maxFat !== null && fat > maxFat) visible = false;

      item.style.display = visible ? "" : "none";
    });

    /* -----------------------------
      POPULARITY SORT (Best → Worst)
      Only applies if checkbox checked
    ----------------------------- */

    const sortPopular = data.get("sortPopular"); // "desc" or null
    if (sortPopular === "desc") {
      const sections = document.querySelectorAll(".section");

      sections.forEach((section) => {
        const allItems = Array.from(section.querySelectorAll(".item"));
        const visibleItems = allItems.filter((i) => i.style.display !== "none");

        // Sort: highest rating first
        visibleItems.sort((a, b) =>
          Number(b.dataset.rating || 0) - Number(a.dataset.rating || 0)
        );

        // Re-append sorted visible items
        visibleItems.forEach((item) => section.appendChild(item));
      });
    }
  }

  if (filterLink) {
    filterLink.addEventListener("click", (e) => {
      e.preventDefault();
      openFilterModal();
    });
  }

  /* ============================================================
     RENDER HELPERS
  ============================================================ */

  function badgeClass(t) {
    switch (t) {
      case "vegan": return "b-vegan";
      case "vegetarian": return "b-veg";
      case "gluten_free": return "b-gf";
      case "plant_forward": return "b-pf";
      case "eat_well": return "b-ew";
      default: return "";
    }
  }

  // 🔥 restored star ratings for list view (from JSON rating)
  function renderStars(rating) {
    const clamp = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(clamp);
    const half = clamp - full >= 0.5 ? 1 : 0;

    const outline = `
      <svg class="star-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2
                 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    `.trim();

    const fullStar = () =>
      `<span class="star full"><span class="fill" style="width:100%">${outline}</span>${outline}</span>`;
    const halfStar = () =>
      `<span class="star half"><span class="fill" style="width:50%">${outline}</span>${outline}</span>`;
    const emptyStar = () =>
      `<span class="star empty">${outline}</span>`;

    return `
      <span class="stars" aria-label="${clamp.toFixed(1)} stars">
        ${Array.from({ length: 5 }, (_, i) =>
          i < full ? fullStar() : (i === full && half ? halfStar() : emptyStar())
        ).join("")}
      </span>
    `;
  }

  /* ============================================================
     MENU LOAD + RENDER
  ============================================================ */

  try {
    const res = await fetch(dataFile);
    if (!res.ok) throw new Error("Menu file failed to load");
    const data = await res.json();

    const tagSet = new Set();

    (data.stations || []).forEach((station) => {
      (station.items || []).forEach((item) => {
        (item.tags || []).forEach((t) => tagSet.add(t));
        if (item.protein || item.carbs || item.fat) hasMacroData = true;
      });
    });

    availableTags = Array.from(tagSet).sort();

    data.stations.forEach((station, idx) => {
      if (!sidebar || !main) return;

      const sb = document.createElement("button");
      sb.textContent = station.name;
      sb.dataset.target = station.id;
      if (idx === 0) sb.classList.add("active");
      sb.addEventListener("click", () => {
        document.getElementById(station.id)?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
      sidebar.appendChild(sb);

      const section = document.createElement("div");
      section.className = "section";
      section.id = station.id;

      const itemsHtml = (station.items || [])
        .map((item) => {
          const name = (item.name || "").replace(/"/g, "&quot;");
          const calories = item.calories ?? "";
          const desc = (item.desc || "").replace(/"/g, "&quot;");
          const tags = Array.isArray(item.tags) ? item.tags : [];
          const rating = typeof item.rating === "number" ? item.rating : 0;
          const img = (item.img || PLACEHOLDER_IMG).replace(/"/g, "&quot;");
          const protein = item.protein ?? 0;
          const carbs = item.carbs ?? 0;
          const fat = item.fat ?? 0;

          return `
            <div class="item"
                 data-name="${name}"
                 data-desc="${desc}"
                 data-calories="${calories}"
                 data-tags='${JSON.stringify(tags)}'
                 data-rating="${rating}"
                 data-img="${img}"
                 data-protein="${protein}"
                 data-carbs="${carbs}"
                 data-fat="${fat}">
              <div class="item-line">
                <span class="name">${name}</span>
                <span>
                  ${renderStars(rating)}
                  ${calories ? `<span class="cal">${calories} cal</span>` : ""}
                </span>
              </div>
              <div class="badges">
                ${tags
                  .map(
                    (t) =>
                      `<span class="badge ${badgeClass(t)}">${t.replace("_", " ")}</span>`
                  )
                  .join("")}
              </div>
            </div>
          `;
        })
        .join("");

      section.innerHTML = `<h3>${station.name}</h3>${itemsHtml}`;
      main.appendChild(section);
    });

    document.dispatchEvent(new Event("menuLoaded"));
  } catch (err) {
    console.error(err);
    if (main) main.innerHTML = `<p>Failed to load menu.</p>`;
  }
});
