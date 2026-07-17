/* ========================================================================== 
   MOUSTAQUE — CHECKOUT DE AGENDAMENTO
   Controla etapas, validações, resumo e envio dos dados para o WhatsApp.
   ========================================================================== */

(() => {
  "use strict";

  const { select, selectAll, formatCurrency, openWhatsApp, showToast } = window.Moustaque;
  const form = select("#booking-form");
  if (!form) return;

  const state = {
    step: 1,
    service: "",
    serviceDescription: "",
    price: 0,
    duration: "",
    barber: "",
    date: "",
    time: "",
    name: "",
    phone: "",
    notes: "",
  };

  const steps = selectAll(".checkout-step");
  const progressSteps = selectAll(".progress-step");
  const progressLines = selectAll(".progress-line");
  const dateInput = select("#booking-date");
  const timeInput = select("#booking-time");
  const timeButtons = selectAll("#time-options button");
  const nextButtons = selectAll(".next-step");
  const phoneInput = select("#customer-phone");
  const notesInput = select("#customer-notes");
  const otherServiceField = select("#other-service-field");
  const otherServiceDescription = select("#other-service-description");

  const summary = {
    service: select("#summary-service"),
    barber: select("#summary-barber"),
    date: select("#summary-date"),
    time: select("#summary-time"),
    duration: select("#summary-duration"),
    price: select("#summary-price"),
  };

  const formatDate = (isoDate, full = false) => {
    if (!isoDate) return "A escolher";
    const [year, month, day] = isoDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: full ? "long" : undefined,
      day: "2-digit",
      month: full ? "long" : "2-digit",
      year: "numeric",
    }).format(date);
  };

  const updateSummary = () => {
    summary.service.textContent = state.service || "A escolher";
    summary.barber.textContent = state.barber || "A escolher";
    summary.date.textContent = formatDate(state.date);
    summary.time.textContent = state.time || "A escolher";
    summary.duration.textContent = state.duration || "—";
    summary.price.textContent = formatCurrency(state.price);
  };

  const updateStepButtons = () => {
    nextButtons.forEach((button) => {
      const destination = Number(button.dataset.next);
      let enabled = false;
      if (destination === 2) enabled = Boolean(state.service) && (state.service !== "Outro serviço" || state.serviceDescription.trim().length >= 5);
      if (destination === 3) enabled = Boolean(state.barber);
      if (destination === 4) enabled = Boolean(state.date && state.time);
      button.disabled = !enabled;
    });
  };

  const goToStep = (targetStep) => {
    const newStep = Math.min(Math.max(Number(targetStep), 1), steps.length);
    state.step = newStep;

    steps.forEach((step) => {
      const active = Number(step.dataset.step) === newStep;
      step.hidden = !active;
      step.classList.toggle("is-active", active);
    });

    progressSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      const complete = stepNumber < newStep;
      const active = stepNumber === newStep;
      step.classList.toggle("is-complete", complete);
      step.classList.toggle("is-active", active);
      step.disabled = stepNumber > newStep;
      step.toggleAttribute("aria-current", active);
      if (active) step.setAttribute("aria-current", "step");
    });

    progressLines.forEach((line, index) => line.classList.toggle("is-complete", index < newStep - 1));
    updateStepButtons();

    const checkoutTop = select(".booking-progress");
    if (checkoutTop) {
      const offset = select("#site-header")?.offsetHeight || 75;
      const top = checkoutTop.getBoundingClientRect().top + window.scrollY - offset - 20;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const selectServiceFromQuery = () => {
    const serviceMap = {
      corte: "Corte Masculino",
      barba: "Barba",
      combo: "Combo Premium",
      pigmentacao: "Pigmentação",
      sobrancelha: "Sobrancelha",
      acabamento: "Acabamento",
    };
    const slug = new URLSearchParams(window.location.search).get("servico");
    if (!slug || !serviceMap[slug]) return;
    const input = select(`input[name="service"][value="${serviceMap[slug]}"]`);
    input?.click();
  };

  const selectBarberFromQuery = () => {
    const barberMap = {
      pedro: "Pedro",
      elder: "Elder",
      pablo: "Pablo",
      wesley: "Wesley",
    };
    const slug = new URLSearchParams(window.location.search).get("barbeiro");
    if (!slug || !barberMap[slug]) return;
    const input = select(`input[name="barber"][value="${barberMap[slug]}"]`);
    input?.click();
  };

  // Serviços
  selectAll('input[name="service"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.service = input.value;
      state.price = Number(input.dataset.price);
      state.duration = input.dataset.duration;
      const isOther = input.value === "Outro serviço";
      if (otherServiceField) otherServiceField.hidden = !isOther;
      if (!isOther) state.serviceDescription = "";
      updateSummary();
      updateStepButtons();
    });
  });

  otherServiceDescription?.addEventListener("input", () => {
    state.serviceDescription = otherServiceDescription.value.trim();
    updateSummary();
    updateStepButtons();
  });

  // Barbeiros
  selectAll('input[name="barber"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.barber = input.value;
      state.time = "";
      if (timeInput) timeInput.value = "";
      timeButtons.forEach((button) => button.classList.remove("is-selected"));
      if (state.date) updateTimeAvailability();
      updateSummary();
      updateStepButtons();
    });
  });

  // Data mínima é sempre o dia atual.
  const today = new Date();
  const todayISO = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  if (dateInput) dateInput.min = todayISO;

  /** Produz indisponibilidades consistentes a partir da data selecionada. */
  function updateTimeAvailability() {
    const label = select("#selected-date-label");
    if (!state.date) {
      if (label) label.textContent = "Selecione uma data";
      return;
    }

    if (label) label.textContent = formatDate(state.date, true);
    const seed = [...`${state.date}-${state.barber}`].reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    );

    timeButtons.forEach((button, index) => {
      const unavailable = ((seed + index * 7) % 11 === 0 || (seed + index * 3) % 17 === 0) && index > 1;
      button.disabled = unavailable;
      button.setAttribute("aria-disabled", String(unavailable));
      if (unavailable && button.classList.contains("is-selected")) {
        button.classList.remove("is-selected");
        state.time = "";
        if (timeInput) timeInput.value = "";
      }
    });
  }

  dateInput?.addEventListener("change", () => {
    const [year, month, day] = dateInput.value.split("-").map(Number);
    const selected = new Date(year, month - 1, day);

    if (selected.getDay() === 0) {
      dateInput.value = "";
      state.date = "";
      state.time = "";
      if (timeInput) timeInput.value = "";
      showToast("A Moustaque não abre aos domingos.", "fa-calendar-xmark");
    } else {
      state.date = dateInput.value;
      state.time = "";
      if (timeInput) timeInput.value = "";
      timeButtons.forEach((button) => button.classList.remove("is-selected"));
      updateTimeAvailability();
    }

    updateSummary();
    updateStepButtons();
  });

  timeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.date) {
        showToast("Escolha primeiro a data do atendimento.", "fa-calendar-day");
        dateInput?.focus();
        return;
      }

      timeButtons.forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      state.time = button.dataset.time;
      if (timeInput) timeInput.value = state.time;
      updateSummary();
      updateStepButtons();
    });
  });

  // Navegação do checkout.
  selectAll(".next-step").forEach((button) =>
    button.addEventListener("click", () => {
      if (!button.disabled) goToStep(button.dataset.next);
    }),
  );
  selectAll(".previous-step").forEach((button) =>
    button.addEventListener("click", () => goToStep(button.dataset.previous)),
  );
  progressSteps.forEach((button) =>
    button.addEventListener("click", () => {
      if (!button.disabled) goToStep(button.dataset.stepTarget);
    }),
  );

  // Máscara brasileira para telefone.
  phoneInput?.addEventListener("input", () => {
    let digits = phoneInput.value.replace(/\D/g, "").slice(0, 11);
    if (digits.length > 10) {
      digits = digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
    } else if (digits.length > 6) {
      digits = digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (digits.length > 2) {
      digits = digits.replace(/^(\d{2})(\d+)/, "($1) $2");
    } else if (digits.length) {
      digits = digits.replace(/^(\d*)/, "($1");
    }
    phoneInput.value = digits;
    phoneInput.closest(".premium-field")?.classList.remove("is-invalid");
  });

  notesInput?.addEventListener("input", () => {
    const count = select(".character-count span");
    if (count) count.textContent = String(notesInput.value.length);
  });

  const validateCustomer = () => {
    const name = select("#customer-name");
    const phone = phoneInput;
    const consent = select("#booking-consent");
    let valid = true;

    const validateField = (input, condition, message) => {
      const wrapper = input.closest(".premium-field");
      const error = select(".field-error", wrapper);
      wrapper.classList.toggle("is-invalid", !condition);
      if (error) error.textContent = condition ? "" : message;
      if (!condition && valid) input.focus();
      valid = valid && condition;
    };

    validateField(name, name.value.trim().length >= 3, "Informe seu nome completo.");
    validateField(phone, phone.value.replace(/\D/g, "").length >= 10, "Informe um WhatsApp válido.");

    if (!consent.checked) {
      showToast("Confirme a autorização para enviar os dados.", "fa-shield-halved");
      valid = false;
    }
    return valid;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!state.service || !state.barber || !state.date || !state.time) {
      showToast("Revise as etapas anteriores antes de confirmar.", "fa-triangle-exclamation");
      goToStep(!state.service ? 1 : !state.barber ? 2 : 3);
      return;
    }

    if (!validateCustomer()) return;

    state.name = select("#customer-name").value.trim();
    state.phone = phoneInput.value.trim();
    state.notes = notesInput.value.trim();

    const message = [
      "*NOVO AGENDAMENTO — MOUSTAQUE*",
      "",
      `*Nome:* ${state.name}`,
      `*Telefone:* ${state.phone}`,
      `*Serviço:* ${state.service}`,
      ...(state.service === "Outro serviço" ? [`*Descrição do serviço:* ${state.serviceDescription}`] : []),
      `*Barbeiro:* ${state.barber}`,
      `*Data:* ${formatDate(state.date, true)}`,
      `*Horário:* ${state.time}`,
      `*Tempo estimado:* ${state.duration}`,
      `*Valor:* ${formatCurrency(state.price)}`,
      `*Observações:* ${state.notes || "Sem observações"}`,
      "",
      "Gostaria de confirmar este horário.",
    ].join("\n");

    showToast("Abrindo o WhatsApp para concluir a reserva.", "fa-brands fa-whatsapp");
    openWhatsApp(message);
  });

  updateSummary();
  updateStepButtons();
  selectServiceFromQuery();
  selectBarberFromQuery();
})();
