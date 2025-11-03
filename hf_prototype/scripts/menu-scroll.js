// scripts/menu-scroll.js
// Wait until menu content is dynamically loaded
document.addEventListener("menuLoaded", () => {
  const sidebarButtons = document.querySelectorAll(".sidebar button");
  const menu = document.getElementById("menuContent");
  const sections = document.querySelectorAll(".section");

  if (!menu || sections.length === 0) return;

  // Map section IDs to sidebar buttons
  const btnById = Array.from(sidebarButtons).reduce((map, btn) => {
    map[btn.dataset.target] = btn;
    return map;
  }, {});

  function setActive(sectionId) {
    sidebarButtons.forEach((b) =>
      b.classList.toggle("active", b.dataset.target === sectionId)
    );
    const btn = btnById[sectionId];
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  let suppressScrollSpy = false;

  // Sidebar click → scroll main content
  sidebarButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        suppressScrollSpy = true;

        // Adjust scroll offset so section header is visible
        const targetY = target.offsetTop - menu.offsetTop - 8;
        menu.scrollTo({ top: targetY, behavior: "smooth" });
        setActive(target.id);

        // Calculate smooth scroll duration dynamically based on distance
        const distance = Math.abs(menu.scrollTop - targetY);
        const duration = Math.min(1200, Math.max(600, distance * 1.2)); // cap between 0.6–1.2s

        setTimeout(() => {
        suppressScrollSpy = false;
        }, duration + 200); // 200ms buffer after scroll ends
    });
  });

  // Scroll spy → highlight section currently near the middle of the viewport
  function onScroll() {
    if (suppressScrollSpy) return;

    const menuRect = menu.getBoundingClientRect();
    const midY = menuRect.top + menuRect.height / 2;
    let activeId = sections[0].id;

    for (const sec of sections) {
      const rect = sec.getBoundingClientRect();
      // Section considered active when its top passes the midpoint
      if (rect.top <= midY && rect.bottom >= midY) {
        activeId = sec.id;
        break;
      }
    }

    setActive(activeId);
  }

  menu.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // Initialize highlight
});
