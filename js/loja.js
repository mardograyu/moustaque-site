/* ========================================================================== 
   MOUSTAQUE — LOJA, FILTROS, FAVORITOS E CARRINHO
   Todos os dados e estados são processados no navegador, sem servidor.
   ========================================================================== */

(() => {
  "use strict";

  const { select, selectAll, escapeHTML, formatCurrency, openWhatsApp, showToast, debounce } =
    window.Moustaque;

  const products = Object.freeze([
    {
      id: 1,
      name: "Pomada Matte Signature",
      category: "cabelo",
      categoryLabel: "Cabelo",
      price: 69.9,
      rating: 4.9,
      reviews: 128,
      badge: "Bestseller",
      description: "Fixação firme, efeito seco e acabamento natural sem resíduos.",
      image: "https://images.pexels.com/photos/373639/pexels-photo-373639.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 2,
      name: "Óleo de Barba Noble",
      category: "barba",
      categoryLabel: "Barba",
      price: 54.9,
      rating: 4.8,
      reviews: 96,
      badge: "Favorito",
      description: "Nutrição profunda, toque seco e fragrância amadeirada sofisticada.",
      image: "https://images.pexels.com/photos/3872899/pexels-photo-3872899.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 3,
      name: "Shampoo Detox Black",
      category: "cuidado",
      categoryLabel: "Cuidado",
      price: 59.9,
      rating: 4.7,
      reviews: 74,
      badge: "Novo",
      description: "Limpeza equilibrada para couro cabeludo, fios e barba.",
      image: "https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 4,
      name: "Pente de Madeira Heritage",
      category: "acessorios",
      categoryLabel: "Acessórios",
      price: 39.9,
      rating: 4.9,
      reviews: 51,
      badge: "Artesanal",
      description: "Madeira antiestática com dentes duplos para cabelo e barba.",
      image: "https://images.pexels.com/photos/897262/pexels-photo-897262.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 5,
      name: "Balm Pós-Barba Reserve",
      category: "barba",
      categoryLabel: "Barba",
      price: 64.9,
      rating: 4.8,
      reviews: 83,
      badge: "Premium",
      description: "Acalma, hidrata e reduz a sensibilidade após o barbear.",
      image: "https://images.pexels.com/photos/4210374/pexels-photo-4210374.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 6,
      name: "Modelador Fiber Cream",
      category: "cabelo",
      categoryLabel: "Cabelo",
      price: 72.9,
      rating: 4.7,
      reviews: 62,
      badge: "Versátil",
      description: "Textura flexível, brilho controlado e remodelagem ao longo do dia.",
      image: "https://images.pexels.com/photos/7797428/pexels-photo-7797428.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 7,
      name: "Escova para Barba Oak",
      category: "acessorios",
      categoryLabel: "Acessórios",
      price: 49.9,
      rating: 4.9,
      reviews: 107,
      badge: "Essencial",
      description: "Cerdas firmes para alinhar os fios e distribuir óleos uniformemente.",
      image: "https://images.pexels.com/photos/7518755/pexels-photo-7518755.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 8,
      name: "Tônico Fortalecedor Prime",
      category: "cuidado",
      categoryLabel: "Cuidado",
      price: 79.9,
      rating: 4.6,
      reviews: 45,
      badge: "Performance",
      description: "Fórmula refrescante para fortalecer os fios e equilibrar a raiz.",
      image: "https://images.pexels.com/photos/6621462/pexels-photo-6621462.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 9,
      name: "Kit Ritual Moustaque",
      category: "cuidado",
      categoryLabel: "Cuidado",
      price: 189.9,
      rating: 5,
      reviews: 39,
      badge: "Edição especial",
      description: "Shampoo, pomada matte e óleo de barba em embalagem exclusiva.",
      image: "https://images.pexels.com/photos/3764014/pexels-photo-3764014.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 10,
      name: "Navalhete Professional Gold",
      category: "acessorios",
      categoryLabel: "Acessórios",
      price: 89.9,
      rating: 4.8,
      reviews: 31,
      badge: "Profissional",
      description: "Corpo metálico balanceado e acabamento dourado fosco.",
      image: "https://images.pexels.com/photos/2035308/pexels-photo-2035308.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 11,
      name: "Spray Texturizador Sea Salt",
      category: "cabelo",
      categoryLabel: "Cabelo",
      price: 62.9,
      rating: 4.7,
      reviews: 58,
      badge: "Textura",
      description: "Volume leve, movimento natural e acabamento praiano sem ressecar.",
      image: "https://images.pexels.com/photos/7262995/pexels-photo-7262995.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
    {
      id: 12,
      name: "Necessaire Executive",
      category: "acessorios",
      categoryLabel: "Acessórios",
      price: 119.9,
      rating: 4.9,
      reviews: 27,
      badge: "Viagem",
      description: "Couro sintético premium, interior resistente à água e divisórias.",
      image: "https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=900",
    },
  ]);

  const storage = {
    read(key, fallback) {
      try {
        const value = window.localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (error) {
        return fallback;
      }
    },
    write(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // A loja continua funcional durante a sessão se o storage estiver bloqueado.
      }
    },
  };

  const state = {
    category: "todos",
    query: "",
    sort: "featured",
    favoriteOnly: false,
    favorites: new Set(storage.read("moustaque-favorites", [])),
    cart: storage.read("moustaque-cart", []),
    quickViewId: null,
    quickViewQuantity: 1,
  };

  const grid = select("#product-grid");
  const cartDrawer = select("#cart-drawer");
  const cartOverlay = select("#cart-overlay");
  if (!grid || !cartDrawer) return;

  const findProduct = (id) => products.find((product) => product.id === Number(id));
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const ratingMarkup = (rating, reviews) => {
    const fullStars = Math.floor(rating);
    return `${Array.from({ length: 5 }, (_, index) =>
      `<i class="${index < fullStars ? "fa-solid" : "fa-regular"} fa-star" aria-hidden="true"></i>`,
    ).join("")}<span>${rating.toFixed(1)} (${reviews})</span>`;
  };

  const productMarkup = (product, index) => {
    const favorite = state.favorites.has(product.id);
    return `
      <article class="product-card" data-product-id="${product.id}" style="animation-delay:${Math.min(index * 55, 330)}ms">
        <div class="product-card__media">
          <img src="${product.image}" alt="${escapeHTML(product.name)}" width="700" height="760" loading="lazy" />
          ${product.badge ? `<span class="product-card__badge">${escapeHTML(product.badge)}</span>` : ""}
          <button class="product-card__favorite ${favorite ? "is-favorite" : ""}" type="button" data-favorite="${product.id}" aria-label="${favorite ? "Remover dos" : "Adicionar aos"} favoritos" aria-pressed="${favorite}">
            <i class="${favorite ? "fa-solid" : "fa-regular"} fa-heart"></i>
          </button>
          <button class="product-card__quick" type="button" data-quick-view="${product.id}">Visualização rápida</button>
        </div>
        <div class="product-card__content">
          <span class="product-card__category">${escapeHTML(product.categoryLabel)}</span>
          <h3>${escapeHTML(product.name)}</h3>
          <p class="product-card__description">${escapeHTML(product.description)}</p>
          <div class="product-rating" aria-label="Avaliação ${product.rating} de 5">${ratingMarkup(product.rating, product.reviews)}</div>
          <div class="product-card__bottom">
            <div class="product-card__price"><small>A partir de</small><strong>${formatCurrency(product.price)}</strong></div>
            <button class="product-card__add" type="button" data-add-cart="${product.id}" aria-label="Adicionar ${escapeHTML(product.name)} à sacola"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
      </article>`;
  };

  const getFilteredProducts = () => {
    let filtered = [...products];
    if (state.category !== "todos") filtered = filtered.filter((product) => product.category === state.category);
    if (state.query) {
      const query = normalize(state.query);
      filtered = filtered.filter((product) =>
        normalize(`${product.name} ${product.description} ${product.categoryLabel}`).includes(query),
      );
    }
    if (state.favoriteOnly) filtered = filtered.filter((product) => state.favorites.has(product.id));

    const sorters = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      featured: (a, b) => a.id - b.id,
    };
    return filtered.sort(sorters[state.sort] || sorters.featured);
  };

  const renderProducts = () => {
    const filtered = getFilteredProducts();
    grid.innerHTML = filtered.map(productMarkup).join("");
    select("#product-count").textContent = String(filtered.length);
    select("#catalog-empty").hidden = filtered.length > 0;
    grid.hidden = filtered.length === 0;

    const favoritesButton = select("#show-favorites");
    favoritesButton?.classList.toggle("is-active", state.favoriteOnly);
    if (favoritesButton) {
      favoritesButton.innerHTML = `<i class="${state.favoriteOnly ? "fa-solid" : "fa-regular"} fa-heart"></i> ${state.favoriteOnly ? "Exibindo favoritos" : "Mostrar favoritos"}`;
    }
  };

  const persistFavorites = () => {
    storage.write("moustaque-favorites", [...state.favorites]);
    select("#wishlist-count").textContent = String(state.favorites.size);
  };

  const toggleFavorite = (id) => {
    const product = findProduct(id);
    if (!product) return;
    if (state.favorites.has(product.id)) {
      state.favorites.delete(product.id);
      showToast(`${product.name} removido dos favoritos.`, "fa-heart-crack");
    } else {
      state.favorites.add(product.id);
      showToast(`${product.name} salvo nos favoritos.`, "fa-heart");
    }
    persistFavorites();
    renderProducts();
  };

  const persistCart = () => storage.write("moustaque-cart", state.cart);

  const getCartQuantity = () => state.cart.reduce((total, item) => total + item.quantity, 0);
  const getCartTotal = () =>
    state.cart.reduce((total, item) => total + (findProduct(item.id)?.price || 0) * item.quantity, 0);

  const addToCart = (id, quantity = 1) => {
    const product = findProduct(id);
    if (!product) return;
    const existing = state.cart.find((item) => item.id === product.id);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, 10);
    else state.cart.push({ id: product.id, quantity: Math.min(quantity, 10) });
    persistCart();
    renderCart();
    showToast(`${product.name} adicionado à sacola.`, "fa-bag-shopping");
  };

  const changeQuantity = (id, direction) => {
    const item = state.cart.find((cartItem) => cartItem.id === Number(id));
    if (!item) return;
    item.quantity = Math.min(Math.max(item.quantity + direction, 1), 10);
    persistCart();
    renderCart();
  };

  const removeFromCart = (id) => {
    const product = findProduct(id);
    state.cart = state.cart.filter((item) => item.id !== Number(id));
    persistCart();
    renderCart();
    if (product) showToast(`${product.name} removido da sacola.`, "fa-trash-can");
  };

  const cartItemMarkup = (item) => {
    const product = findProduct(item.id);
    if (!product) return "";
    return `
      <article class="cart-item">
        <div class="cart-item__image"><img src="${product.image}" alt="${escapeHTML(product.name)}" /></div>
        <div class="cart-item__content">
          <span>${escapeHTML(product.categoryLabel)}</span>
          <h3>${escapeHTML(product.name)}</h3>
          <strong>${formatCurrency(product.price * item.quantity)}</strong>
          <div class="quantity-control">
            <button type="button" data-cart-minus="${product.id}" aria-label="Diminuir quantidade">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-plus="${product.id}" aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
        <button class="cart-item__remove" type="button" data-cart-remove="${product.id}" aria-label="Remover ${escapeHTML(product.name)}"><i class="fa-regular fa-trash-can"></i></button>
      </article>`;
  };

  function renderCart() {
    state.cart = state.cart.filter((item) => findProduct(item.id) && item.quantity > 0);
    const quantity = getCartQuantity();
    const total = getCartTotal();
    const itemsContainer = select("#cart-items");
    const empty = select("#cart-empty");
    const footer = select("#cart-footer");

    itemsContainer.innerHTML = state.cart.map(cartItemMarkup).join("");
    empty.hidden = quantity > 0;
    footer.hidden = quantity === 0;
    select("#cart-count").textContent = String(quantity);
    select("#cart-subtotal").textContent = formatCurrency(total);
    select("#cart-total").textContent = formatCurrency(total);

    const goal = 200;
    const percent = Math.min((total / goal) * 100, 100);
    select("#cart-progress-bar").style.width = `${percent}%`;
    select("#cart-progress-text").textContent =
      total >= goal
        ? "Seu pedido está pronto para ser confirmado."
        : `Faltam ${formatCurrency(goal - total)} para completar R$ 200 em produtos.`;
  }

  const openCart = () => {
    cartDrawer.classList.add("is-open");
    cartOverlay.classList.add("is-visible");
    cartDrawer.setAttribute("aria-hidden", "false");
    select("#cart-toggle")?.setAttribute("aria-expanded", "true");
    document.body.classList.add("cart-open");
    window.setTimeout(() => select("#cart-close")?.focus(), 300);
  };

  const closeCart = () => {
    cartDrawer.classList.remove("is-open");
    cartOverlay.classList.remove("is-visible");
    cartDrawer.setAttribute("aria-hidden", "true");
    select("#cart-toggle")?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("cart-open");
  };

  const openQuickView = (id) => {
    const product = findProduct(id);
    const modal = select("#quick-view");
    if (!product || !modal) return;
    state.quickViewId = product.id;
    state.quickViewQuantity = 1;
    select("#quick-view-image").src = product.image;
    select("#quick-view-image").alt = product.name;
    select("#quick-view-category").textContent = product.categoryLabel;
    select("#quick-view-title").textContent = product.name;
    select("#quick-view-rating").innerHTML = ratingMarkup(product.rating, product.reviews);
    select("#quick-view-description").textContent = product.description;
    select("#quick-view-price").textContent = formatCurrency(product.price);
    select("#quick-view-quantity").textContent = "1";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    window.setTimeout(() => select(".quick-view__close")?.focus(), 300);
  };

  const closeQuickView = () => {
    const modal = select("#quick-view");
    modal?.classList.remove("is-open");
    modal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
  };

  // Eventos do catálogo por delegação.
  grid.addEventListener("click", (event) => {
    const favorite = event.target.closest("[data-favorite]");
    const add = event.target.closest("[data-add-cart]");
    const quick = event.target.closest("[data-quick-view]");
    if (favorite) toggleFavorite(favorite.dataset.favorite);
    if (add) addToCart(add.dataset.addCart);
    if (quick) openQuickView(quick.dataset.quickView);
  });

  selectAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      state.favoriteOnly = false;
      selectAll("[data-category]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderProducts();
    });
  });

  const searchInput = select("#product-search");
  const clearSearch = select("#clear-search");
  searchInput?.addEventListener(
    "input",
    debounce(() => {
      state.query = searchInput.value;
      clearSearch.hidden = !state.query;
      renderProducts();
    }, 160),
  );
  clearSearch?.addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    clearSearch.hidden = true;
    renderProducts();
    searchInput.focus();
  });

  select("#product-sort")?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });

  const toggleFavoriteView = () => {
    state.favoriteOnly = !state.favoriteOnly;
    renderProducts();
    if (state.favoriteOnly && !state.favorites.size) showToast("Você ainda não salvou produtos favoritos.", "fa-heart");
    document.querySelector("#produtos")?.scrollIntoView({ behavior: "smooth" });
  };
  select("#show-favorites")?.addEventListener("click", toggleFavoriteView);
  select("#wishlist-toggle")?.addEventListener("click", toggleFavoriteView);

  const resetFilters = () => {
    state.category = "todos";
    state.query = "";
    state.favoriteOnly = false;
    searchInput.value = "";
    clearSearch.hidden = true;
    selectAll("[data-category]").forEach((button) =>
      button.classList.toggle("is-active", button.dataset.category === "todos"),
    );
    renderProducts();
  };
  select("#reset-filters")?.addEventListener("click", resetFilters);

  select("#cart-toggle")?.addEventListener("click", openCart);
  select("#cart-close")?.addEventListener("click", closeCart);
  select("#cart-overlay")?.addEventListener("click", closeCart);
  select("#continue-shopping")?.addEventListener("click", closeCart);

  select("#cart-items")?.addEventListener("click", (event) => {
    const plus = event.target.closest("[data-cart-plus]");
    const minus = event.target.closest("[data-cart-minus]");
    const remove = event.target.closest("[data-cart-remove]");
    if (plus) changeQuantity(plus.dataset.cartPlus, 1);
    if (minus) changeQuantity(minus.dataset.cartMinus, -1);
    if (remove) removeFromCart(remove.dataset.cartRemove);
  });

  selectAll("[data-close-quick-view]").forEach((element) => element.addEventListener("click", closeQuickView));
  select("[data-quick-minus]")?.addEventListener("click", () => {
    state.quickViewQuantity = Math.max(1, state.quickViewQuantity - 1);
    select("#quick-view-quantity").textContent = String(state.quickViewQuantity);
  });
  select("[data-quick-plus]")?.addEventListener("click", () => {
    state.quickViewQuantity = Math.min(10, state.quickViewQuantity + 1);
    select("#quick-view-quantity").textContent = String(state.quickViewQuantity);
  });
  select("#quick-view-add")?.addEventListener("click", () => {
    if (state.quickViewId) addToCart(state.quickViewId, state.quickViewQuantity);
    closeQuickView();
    openCart();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeCart();
    closeQuickView();
  });

  select("#checkout-cart")?.addEventListener("click", () => {
    if (!state.cart.length) return;
    const lines = state.cart.map((item, index) => {
      const product = findProduct(item.id);
      return `${index + 1}. ${product.name}\n   Quantidade: ${item.quantity}\n   Subtotal: ${formatCurrency(product.price * item.quantity)}`;
    });
    const message = [
      "*PEDIDO — MOUSTAQUE ESSENTIALS*",
      "",
      ...lines,
      "",
      `*Quantidade total:* ${getCartQuantity()} item(ns)`,
      `*Total do pedido:* ${formatCurrency(getCartTotal())}`,
      "",
      "Olá! Gostaria de confirmar disponibilidade, retirada/entrega e forma de pagamento.",
    ].join("\n");
    showToast("Abrindo o WhatsApp com seu pedido completo.", "fa-comment-dots");
    openWhatsApp(message);
  });

  persistFavorites();
  renderProducts();
  renderCart();
})();
