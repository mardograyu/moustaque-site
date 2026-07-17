/* ========================================================================== 
   MOUSTAQUE — INTERAÇÕES GLOBAIS
   Recursos compartilhados: navegação, preloader, cursor, partículas e motion.
   ========================================================================== */

(() => {
  "use strict";

  /**
   * Configuração central do projeto.
   * Substitua o número abaixo pelo WhatsApp oficial, sempre com DDI + DDD.
   */
  window.MOUSTAQUE_CONFIG = Object.freeze({
    whatsapp: "5535984078323",
    locale: "pt-BR",
    currency: "BRL",
    brand: "Moustaque",
  });

  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const select = (selector, context = doc) => context.querySelector(selector);
  const selectAll = (selector, context = doc) => [...context.querySelectorAll(selector)];

  /** Debounce leve para eventos que podem disparar muitas vezes. */
  const debounce = (callback, wait = 120) => {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), wait);
    };
  };

  /** Mantém valores numéricos entre um mínimo e um máximo. */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /** Formatação monetária reutilizável pelas páginas internas. */
  const formatCurrency = (value) =>
    new Intl.NumberFormat(window.MOUSTAQUE_CONFIG.locale, {
      style: "currency",
      currency: window.MOUSTAQUE_CONFIG.currency,
    }).format(value);

  /** Escapa conteúdo dinâmico antes de inseri-lo em templates HTML. */
  const escapeHTML = (value = "") =>
    String(value).replace(
      /[&<>'"]/g,
      (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
          character
        ],
    );

  /** Abre o WhatsApp com mensagem codificada e sem depender de servidor. */
  const openWhatsApp = (message) => {
    const number = window.MOUSTAQUE_CONFIG.whatsapp.replace(/\D/g, "");
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    const popup = window.open("", "_blank");
    if (popup) {
      popup.opener = null;
      popup.location.href = url;
    } else {
      window.location.assign(url);
    }
  };

  /** Toast global para feedback de ações. */
  const showToast = (message, icon = "fa-circle-check", duration = 3200) => {
    let stack = select(".toast-stack");

    if (!stack) {
      stack = doc.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      body.append(stack);
    }

    const toast = doc.createElement("div");
    toast.className = "toast";
    const iconClass = /\bfa-(solid|regular|brands)\b/.test(icon) ? icon : `fa-solid ${icon}`;
    toast.innerHTML = `<i class="${escapeHTML(iconClass)}" aria-hidden="true"></i><span>${escapeHTML(message)}</span>`;
    stack.append(toast);

    window.setTimeout(() => {
      toast.classList.add("is-leaving");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }, duration);
  };

  // API pequena e intencional para evitar repetição nos demais módulos.
  window.Moustaque = Object.freeze({
    select,
    selectAll,
    debounce,
    clamp,
    escapeHTML,
    formatCurrency,
    openWhatsApp,
    showToast,
  });

  /* ------------------------------------------------------------------------
     PRELOADER
     ------------------------------------------------------------------------ */
  const initPreloader = () => {
    const preloader = select("#preloader");
    if (!preloader) {
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
      return;
    }

    const progress = select(".preloader__progress", preloader);
    const counter = select(".preloader__counter", preloader);
    let current = 0;
    let target = 86;
    let finishing = false;

    const render = () => {
      current += Math.max(0.45, (target - current) * 0.055);
      current = Math.min(current, target);
      const rounded = Math.round(current);

      if (progress) progress.style.width = `${rounded}%`;
      if (counter) counter.textContent = String(rounded).padStart(2, "0");

      if (current < target - 0.1) window.requestAnimationFrame(render);
    };

    render();

    const finish = () => {
      if (finishing) return;
      finishing = true;
      target = 100;

      const complete = () => {
        current += Math.max(1, (target - current) * 0.18);
        current = Math.min(current, 100);
        const rounded = Math.round(current);
        if (progress) progress.style.width = `${rounded}%`;
        if (counter) counter.textContent = String(rounded).padStart(2, "0");

        if (rounded < 100) {
          window.requestAnimationFrame(complete);
          return;
        }

        window.setTimeout(() => {
          preloader.classList.add("is-hidden");
          body.classList.remove("is-loading");
          body.classList.add("is-ready");
          window.setTimeout(() => preloader.remove(), 900);
        }, reducedMotion ? 0 : 220);
      };

      complete();
    };

    if (doc.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    // Segurança: nunca mantém a interface bloqueada por uma mídia lenta.
    window.setTimeout(finish, 4000);
  };

  /* ------------------------------------------------------------------------
     NAVEGAÇÃO RESPONSIVA E HEADER
     ------------------------------------------------------------------------ */
  const initNavigation = () => {
    const header = select("#site-header");
    const nav = select("#main-nav");
    const toggle = select(".menu-toggle");
    if (!header) return;

    const updateHeader = () => {
      const scrolled = window.scrollY > 36;
      header.classList.toggle("is-scrolled", scrolled);

      const floatingButton = select(".floating-booking");
      if (floatingButton) floatingButton.classList.toggle("is-visible", window.scrollY > 480);
    };

    const closeMenu = () => {
      if (!toggle || !nav) return;
      nav.classList.remove("is-open");
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      body.classList.remove("menu-open");
    };

    toggle?.addEventListener("click", () => {
      const willOpen = !nav?.classList.contains("is-open");
      nav?.classList.toggle("is-open", willOpen);
      toggle.classList.toggle("is-active", willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
      toggle.setAttribute("aria-label", willOpen ? "Fechar menu" : "Abrir menu");
      body.classList.toggle("menu-open", willOpen);
    });

    selectAll("a", nav || doc).forEach((link) => link.addEventListener("click", closeMenu));
    doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", debounce(() => {
      if (window.innerWidth > 960) closeMenu();
    }));
    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();
  };

  /* ------------------------------------------------------------------------
     SMOOTH SCROLL E LINK ATIVO
     ------------------------------------------------------------------------ */
  const initAnchors = () => {
    selectAll('a[href^="#"]:not([href="#"])').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const target = select(anchor.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        const headerOffset = select("#site-header")?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      });
    });

    const observedSections = selectAll("main section[id]");
    const navLinks = selectAll('.main-nav__link[href^="#"]');
    if (!observedSections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
        });
      },
      { rootMargin: "-30% 0px -58%", threshold: [0.1, 0.35, 0.65] },
    );

    observedSections.forEach((section) => observer.observe(section));
  };

  /* ------------------------------------------------------------------------
     CURSOR, GLOW E MAGNETISMO
     ------------------------------------------------------------------------ */
  const initPointerEffects = () => {
    if (!finePointer || reducedMotion) return;

    const dot = select(".cursor--dot");
    const outline = select(".cursor--outline");
    const glow = select(".mouse-glow");
    if (!dot || !outline) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outlineX = mouseX;
    let outlineY = mouseY;
    let glowX = mouseX;
    let glowY = mouseY;

    window.addEventListener(
      "pointermove",
      (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
      },
      { passive: true },
    );

    const animate = () => {
      outlineX += (mouseX - outlineX) * 0.17;
      outlineY += (mouseY - outlineY) * 0.17;
      glowX += (mouseX - glowX) * 0.055;
      glowY += (mouseY - glowY) * 0.055;
      outline.style.left = `${outlineX}px`;
      outline.style.top = `${outlineY}px`;

      if (glow) {
        glow.style.left = `${glowX}px`;
        glow.style.top = `${glowY}px`;
      }
      window.requestAnimationFrame(animate);
    };
    animate();

    selectAll("a, button, input, textarea, .tilt-card").forEach((element) => {
      element.addEventListener("mouseenter", () => outline.classList.add("is-hovering"));
      element.addEventListener("mouseleave", () => outline.classList.remove("is-hovering"));
    });

    selectAll(".magnetic").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate(${x * 0.13}px, ${y * 0.18}px)`;
      });
      element.addEventListener("pointerleave", () => {
        element.style.transform = "";
      });
    });
  };

  /* ------------------------------------------------------------------------
     PARTÍCULAS DOURADAS — canvas nativo, sem biblioteca pesada
     ------------------------------------------------------------------------ */
  const initParticles = () => {
    const canvas = select("#gold-particles");
    if (!canvas || reducedMotion) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let particles = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const amount = clamp(Math.round(window.innerWidth / 48), 15, 38);
      particles = Array.from({ length: amount }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.25 + 0.25,
        speedX: (Math.random() - 0.5) * 0.11,
        speedY: -(Math.random() * 0.2 + 0.06),
        opacity: Math.random() * 0.42 + 0.08,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (time) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        if (particle.y < -10) particle.y = window.innerHeight + 10;
        if (particle.x < -10) particle.x = window.innerWidth + 10;
        if (particle.x > window.innerWidth + 10) particle.x = -10;

        const pulse = 0.65 + Math.sin(time * 0.001 + particle.phase) * 0.35;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(244, 211, 94, ${particle.opacity * pulse})`;
        context.fill();
      });

      window.requestAnimationFrame(draw);
    };

    window.addEventListener("resize", debounce(resize, 180));
    resize();
    window.requestAnimationFrame(draw);
  };

  /* ------------------------------------------------------------------------
     CARDS 3D
     ------------------------------------------------------------------------ */
  const initTiltCards = () => {
    if (!finePointer || reducedMotion) return;

    selectAll(".tilt-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const rotateY = x * 8;
        const rotateX = y * -8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)";
      });
    });
  };

  /* ------------------------------------------------------------------------
     PARALLAX LEVE
     ------------------------------------------------------------------------ */
  const initParallax = () => {
    const elements = selectAll("[data-parallax]");
    if (!elements.length || reducedMotion) return;
    let ticking = false;

    const render = () => {
      elements.forEach((element) => {
        const rect = element.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const speed = Number(element.dataset.parallax) || 0.1;
        const offset = (rect.top - window.innerHeight / 2) * speed;
        element.style.transform = `scale(1.12) translate3d(0, ${offset}px, 0)`;
      });
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(render);
          ticking = true;
        }
      },
      { passive: true },
    );
    render();
  };

  /* ------------------------------------------------------------------------
     CONTADORES DA HOME
     ------------------------------------------------------------------------ */
  const initCounters = () => {
    const counters = selectAll("[data-counter]");
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          const target = Number(element.dataset.counter);
          const suffix = element.dataset.suffix || "";
          const decimals = String(target).includes(".") ? 1 : 0;
          const duration = reducedMotion ? 1 : 1550;
          const start = performance.now();

          const update = (now) => {
            const progress = clamp((now - start) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
            if (progress < 1) window.requestAnimationFrame(update);
          };

          window.requestAnimationFrame(update);
          currentObserver.unobserve(element);
        });
      },
      { threshold: 0.55 },
    );

    counters.forEach((counter) => observer.observe(counter));
  };

  /* ------------------------------------------------------------------------
     DEPOIMENTOS
     ------------------------------------------------------------------------ */
  const initTestimonials = () => {
    const slides = selectAll(".testimonial");
    if (slides.length < 2) return;

    const previous = select("#testimonial-prev");
    const next = select("#testimonial-next");
    const progress = select(".slider-progress span");
    let index = 0;
    let autoplay;

    const show = (newIndex) => {
      index = (newIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });
      if (progress) progress.style.transform = `translateX(${index * 100}%)`;
    };

    const resetAutoplay = () => {
      window.clearInterval(autoplay);
      if (!reducedMotion) autoplay = window.setInterval(() => show(index + 1), 6500);
    };

    previous?.addEventListener("click", () => {
      show(index - 1);
      resetAutoplay();
    });
    next?.addEventListener("click", () => {
      show(index + 1);
      resetAutoplay();
    });
    show(0);
    resetAutoplay();
  };

  /* ------------------------------------------------------------------------
     SELO CIRCULAR DINÂMICO
     ------------------------------------------------------------------------ */
  const initCircularText = () => {
    selectAll(".about__seal-text").forEach((element) => {
      const text = element.textContent.trim();
      element.textContent = "";
      [...text].forEach((character, index) => {
        const span = doc.createElement("span");
        span.textContent = character;
        span.style.transform = `rotate(${(360 / text.length) * index}deg)`;
        element.append(span);
      });
    });
  };

  /* ------------------------------------------------------------------------
     NEWSLETTER LOCAL E RODAPÉ
     ------------------------------------------------------------------------ */
  const initFooter = () => {
    const year = select("#current-year");
    if (year) year.textContent = String(new Date().getFullYear());

    const form = select("#newsletter-form");
    if (!form) return;
    const input = select('input[type="email"]', form);
    const message = select(".form-message", form);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!input?.checkValidity()) {
        if (message) {
          message.textContent = "Informe um e-mail válido.";
          message.style.color = "var(--danger)";
        }
        input?.focus();
        return;
      }

      try {
        window.localStorage.setItem("moustaque-newsletter", input.value.trim());
      } catch (error) {
        // O cadastro visual continua funcionando mesmo se o navegador bloquear storage.
      }

      if (message) {
        message.textContent = "Bem-vindo ao clube Moustaque.";
        message.style.color = "var(--success)";
      }
      showToast("Cadastro realizado com sucesso.", "fa-envelope-circle-check");
      form.reset();
    });
  };

  /* ------------------------------------------------------------------------
     CONTATO — formulário, atalhos, horário ao vivo e FAQ
     Mantido no módulo global porque a página não precisa de uma dependência extra.
     ------------------------------------------------------------------------ */
  const initContactPage = () => {
    const contactForm = select("#contact-form");

    selectAll("[data-whatsapp-contact]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openWhatsApp("Olá, equipe Moustaque! Gostaria de falar com vocês.");
      });
    });

    const phone = select("#contact-phone");
    phone?.addEventListener("input", () => {
      let digits = phone.value.replace(/\D/g, "").slice(0, 11);
      if (digits.length > 10) digits = digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
      else if (digits.length > 6) digits = digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
      else if (digits.length > 2) digits = digits.replace(/^(\d{2})(\d+)/, "($1) $2");
      else if (digits.length) digits = digits.replace(/^(\d*)/, "($1");
      phone.value = digits;
      phone.closest(".premium-field")?.classList.remove("is-invalid");
    });

    contactForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = select("#contact-name");
      const message = select("#contact-message");
      const consent = select("#contact-consent");
      let valid = true;

      const validate = (input, condition, errorText) => {
        const field = input.closest(".premium-field");
        const error = select(".field-error", field);
        field?.classList.toggle("is-invalid", !condition);
        if (error) error.textContent = condition ? "" : errorText;
        if (!condition && valid) input.focus();
        valid = valid && condition;
      };

      validate(name, name.value.trim().length >= 3, "Informe seu nome completo.");
      validate(phone, phone.value.replace(/\D/g, "").length >= 10, "Informe um WhatsApp válido.");
      validate(message, message.value.trim().length >= 10, "Conte um pouco mais para que possamos ajudar.");

      if (!consent.checked) {
        showToast("Confirme a autorização para enviar a mensagem.", "fa-shield-halved");
        valid = false;
      }
      if (!valid) return;

      const subject = select('input[name="subject"]:checked')?.value || "Contato";
      const text = [
        "*CONTATO PELO SITE — MOUSTAQUE*",
        "",
        `*Nome:* ${name.value.trim()}`,
        `*Telefone:* ${phone.value.trim()}`,
        `*Assunto:* ${subject}`,
        `*Mensagem:* ${message.value.trim()}`,
      ].join("\n");
      showToast("Abrindo sua mensagem no WhatsApp.", "fa-comment-dots");
      openWhatsApp(text);
    });

    const status = select("#open-status");
    if (status) {
      const now = new Date();
      const day = now.getDay();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const closesAt = day === 6 ? 18 * 60 : 20 * 60;
      const open = day >= 1 && day <= 6 && minutes >= 9 * 60 && minutes < closesAt;
      status.textContent = open ? `Aberto agora — fecha às ${day === 6 ? "18h" : "20h"}` : "Fechado agora — consulte o próximo horário";
      status.parentElement?.classList.toggle("is-closed", !open);
    }

    selectAll(".faq-item > button").forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        const willOpen = !item.classList.contains("is-open");
        selectAll(".faq-item").forEach((faq) => {
          faq.classList.remove("is-open");
          select("button", faq)?.setAttribute("aria-expanded", "false");
        });
        item.classList.toggle("is-open", willOpen);
        button.setAttribute("aria-expanded", String(willOpen));
      });
    });
  };

  /* ------------------------------------------------------------------------
     AOS E FALLBACK DE IMAGENS
     ------------------------------------------------------------------------ */
  const initAnimations = () => {
    if (window.AOS) {
      window.AOS.init({
        duration: 850,
        easing: "ease-out-cubic",
        once: true,
        offset: 70,
        disable: reducedMotion,
      });
    }

    selectAll("img").forEach((image) => {
      image.addEventListener(
        "error",
        () => {
          image.classList.add("image-fallback");
          image.alt = image.alt || "Imagem temporariamente indisponível";
        },
        { once: true },
      );
    });
  };

  const init = () => {
    initPreloader();
    initNavigation();
    initAnchors();
    initPointerEffects();
    initParticles();
    initTiltCards();
    initParallax();
    initCounters();
    initTestimonials();
    initCircularText();
    initFooter();
    initContactPage();
    initAnimations();
  };

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
