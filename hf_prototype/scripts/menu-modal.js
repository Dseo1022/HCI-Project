document.addEventListener("DOMContentLoaded", () => {
  // IMPORTANT: point this to your folder name
  const PLACEHOLDER_IMG = "images/placeholder-food.jpg";

  const modal = document.getElementById("itemModal");
  if (!modal) return;

  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");
  const modalCalories = document.getElementById("modal-calories");
  const modalDesc = document.getElementById("modal-desc");
  const modalBadges = document.getElementById("modal-badges");
  const closeBtn = document.querySelector(".close-btn");

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

  // WHY: fallback to images/ placeholder if primary fails
  function setModalImage(primaryUrl, altText) {
    const src = (primaryUrl && primaryUrl.trim()) || PLACEHOLDER_IMG;
    modalImg.onerror = () => {
      modalImg.onerror = null; // prevent loops
      modalImg.src = PLACEHOLDER_IMG;
    };
    modalImg.onload = () => {
      modalImg.onerror = null;
      modalImg.onload = null;
    };
    modalImg.src = src;
    modalImg.alt = altText || "";
  }

  document.body.addEventListener("click", (e) => {
    const card = e.target.closest(".item");
    if (!card) return;

    const name = card.dataset.name || "";
    const calories = card.dataset.calories || "";
    const desc = card.dataset.desc || "";
    const rating = Number(card.dataset.rating || 0);
    const serving = card.dataset.serving || "";
    const img = card.dataset.img || ""; // may be empty; handled by setModalImage
    let tags = [];
    try { tags = JSON.parse(card.dataset.tags || "[]"); } catch {}

    modalTitle.innerHTML = `${name} ${renderStars(rating)}`;
    modalCalories.textContent =
      (calories || serving)
        ? `${calories ? `${calories} cal` : ""}${(calories && serving) ? " • " : ""}${serving || ""}`
        : "";
    modalDesc.textContent = desc || "No description.";
    modalBadges.innerHTML = tags.map((t) => `<span class="badge ${badgeClass(t)}">${t.replace("_"," ")}</span>`).join("");

    setModalImage(img, name); // <- will use images/placeholder-food.jpg if missing/broken

    modal.classList.remove("hidden");
  });

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.add("hidden"); });
});