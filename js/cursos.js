/* Moustaque Academy — inscrições de cursos pelo WhatsApp. */
(() => {
  "use strict";
  const init = () => {
    if (!window.Moustaque) return;
    document.querySelectorAll(".course-buy").forEach((button) => {
      button.addEventListener("click", () => {
        const course = button.dataset.course;
        const price = button.dataset.price;
        const message = ["*INTERESSE EM CURSO — MOUSTAQUE ACADEMY*", "", `*Curso:* ${course}`, `*Investimento:* ${price}`, "", "Olá! Gostaria de verificar as próximas turmas, datas e formas de pagamento."].join("\n");
        window.Moustaque.showToast("Abrindo atendimento da Moustaque Academy.", "fa-graduation-cap");
        window.Moustaque.openWhatsApp(message);
      });
    });
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
