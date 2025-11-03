document.addEventListener("DOMContentLoaded", async () => {
  // IMPORTANT: point this to your folder name
  const PLACEHOLDER_IMG = "images/placeholder-food.jpg";

  const p = window.location.pathname;
  let dataFile = "data/commons.menu.json";
  if (p.includes("sadler")) dataFile = "data/sadler.menu.json";
  if (p.includes("commons")) dataFile = "data/commons.menu.json";

  const sidebar = document.getElementById("sidebar");
  const main = document.getElementById("menuContent");

  const filterLink = document.getElementById("filter-link");
  if (filterLink) {
    filterLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("This feature is in development.");
    });
  }

  function renderStars(rating) {
    const clamp = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(clamp);
    const half = clamp - full >= 0.5 ? 1 : 0;
    const starOutline = `<svg viewBox="0 0 24 24" aria-hidden="true" class="star-svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.25l-7.19-.62L12 2 9.19 8.63 2 9.25l5.46 4.72L5.82 21z"/></svg>`;
    const fullStar = () => `<span class="star full"><span class="fill" style="width:100%">${starOutline}</span>${starOutline}</span>`;
    const halfStar = () => `<span class="star half"><span class="fill" style="width:50%">${starOutline}</span>${starOutline}</span>`;
    const emptyStar = () => `<span class="star empty">${starOutline}</span>`;
    const stars = Array.from({ length: 5 }, (_, i) =>
      i < full ? fullStar() : (i === full && half ? halfStar() : emptyStar())
    ).join("");
    return `<span class="stars" role="img" aria-label="${clamp.toFixed(1)} out of 5 stars">${stars}</span>`;
  }

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

  try {
    const res = await fetch(dataFile);
    if (!res.ok) throw new Error(`Failed to load ${dataFile}`);
    const data = await res.json();

    (data.stations || []).forEach((station, idx) => {
      const btn = document.createElement("button");
      btn.textContent = station.name;
      btn.dataset.target = station.id;
      if (idx === 0) btn.classList.add("active");
      btn.addEventListener("click", () => {
        document.getElementById(station.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      sidebar.appendChild(btn);

      const section = document.createElement("div");
      section.className = "section";
      section.id = station.id;

      const itemsHtml = (station.items || []).map((item) => {
        const name = (item.name || "Untitled").replace(/"/g, "&quot;");
        const calories = String(item.calories ?? "").replace(/"/g, "&quot;");
        const desc = String(item.desc ?? "").replace(/"/g, "&quot;");
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const rating = typeof item.rating === "number" ? item.rating : 0;
        const serving = ((item.serving ?? "") + "").replace(/"/g, "&quot;");
        const img = (item.img || PLACEHOLDER_IMG).replace(/"/g, "&quot;"); // <- uses images/

        return `
          <div class="item"
               data-name="${name}"
               data-calories="${calories}"
               data-desc="${desc}"
               data-tags='${JSON.stringify(tags)}'
               data-rating="${rating}"
               data-serving="${serving}"
               data-img="${img}">
            <div class="item-line">
              <span class="name">${name}</span>
              ${renderStars(rating)}
            </div>
            <div class="badges">
              ${tags.map((t) => `<span class="badge ${badgeClass(t)}">${t.replace("_", " ")}</span>`).join("")}
            </div>
          </div>
        `;
      }).join("");

      section.innerHTML = `<h3>${station.name}</h3>${itemsHtml}`;
      main.appendChild(section);
    });

    document.dispatchEvent(new Event("menuLoaded"));
  } catch (err) {
    console.error(err);
    if (main) main.innerHTML = `<p>Failed to load menu data.</p>`;
  }
});