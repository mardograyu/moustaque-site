/* ========================================================================== 
   MOUSTAQUE — FILTROS E LIGHTBOX DA GALERIA
   ========================================================================== */

(() => {
  "use strict";

  const { select, selectAll } = window.Moustaque;
  const grid = select("#masonry-grid");
  const lightbox = select("#gallery-lightbox");
  if (!grid || !lightbox) return;

  const allItems = selectAll(".gallery-item", grid);
  const filters = selectAll("[data-filter]");
  const figure = select(".gallery-lightbox__figure", lightbox);
  const image = select("#lightbox-image");
  const currentLabel = select("#lightbox-current");
  const totalLabel = select("#lightbox-total");
  let visibleItems = [...allItems];
  let currentIndex = 0;
  let touchStartX = 0;

  const categoryLabels = {
    cortes: "Cortes",
    barba: "Barba",
    ambiente: "Ambiente",
    clientes: "Clientes",
  };

  const updateResultCount = () => {
    const count = select("#gallery-results span");
    if (count) count.textContent = String(visibleItems.length);
  };

  const filterGallery = (category) => {
    allItems.forEach((item) => item.classList.add("is-filtering"));

    window.setTimeout(() => {
      allItems.forEach((item, index) => {
        const shouldShow = category === "todos" || item.dataset.category === category;
        item.classList.toggle("is-hidden", !shouldShow);
        item.classList.remove("is-filtering");
        if (shouldShow) item.style.animationDelay = `${Math.min(index * 45, 300)}ms`;
      });
      visibleItems = allItems.filter((item) => !item.classList.contains("is-hidden"));
      updateResultCount();
    }, 240);
  };

  const filterGroup = select(".gallery-filters");
  filterGroup?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    filters.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    filterGallery(button.dataset.filter);
  });

  const setLightboxContent = (index, direction = 1) => {
    if (!visibleItems.length) return;
    currentIndex = (index + visibleItems.length) % visibleItems.length;
    const item = visibleItems[currentIndex];
    const source = select("img", item);
    const title = item.dataset.title;
    const category = categoryLabels[item.dataset.category] || item.dataset.category;

    figure.classList.add("is-changing");
    const preloaded = new Image();
    preloaded.src = source.currentSrc || source.src;
    preloaded.onload = () => {
      image.src = preloaded.src;
      image.alt = source.alt;
      image.style.transformOrigin = direction > 0 ? "right center" : "left center";
      select("#lightbox-title").textContent = title;
      select("#lightbox-category").textContent = category;
      currentLabel.textContent = String(currentIndex + 1).padStart(2, "0");
      totalLabel.textContent = String(visibleItems.length).padStart(2, "0");
      window.setTimeout(() => figure.classList.remove("is-changing"), 40);
    };
  };

  const openLightbox = (item) => {
    visibleItems = allItems.filter((galleryItem) => !galleryItem.classList.contains("is-hidden"));
    currentIndex = visibleItems.indexOf(item);
    setLightboxContent(currentIndex);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    window.setTimeout(() => select("[data-lightbox-close]", select(".gallery-lightbox__header"))?.focus(), 300);
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
  };

  const showPrevious = () => setLightboxContent(currentIndex - 1, -1);
  const showNext = () => setLightboxContent(currentIndex + 1, 1);

  allItems.forEach((item) => select("button", item)?.addEventListener("click", () => openLightbox(item)));
  selectAll("[data-lightbox-close]", lightbox).forEach((element) => element.addEventListener("click", closeLightbox));
  select("#lightbox-prev")?.addEventListener("click", showPrevious);
  select("#lightbox-next")?.addEventListener("click", showNext);

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showPrevious();
    if (event.key === "ArrowRight") showNext();
  });

  // Navegação por gesto em telas touch.
  figure?.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
    },
    { passive: true },
  );
  figure?.addEventListener(
    "touchend",
    (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) < 50) return;
      if (distance > 0) showPrevious();
      else showNext();
    },
    { passive: true },
  );

  updateResultCount();
})();
