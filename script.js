/* =========================================================
   CONFIGURAÇÃO: edite só esta parte
   ========================================================= */
const CONFIG = {
  // Cole aqui a URL do App Script (passo a passo no README.md)
  scriptUrl: "https://script.google.com/macros/s/AKfycbzeiN9U-D-_c5fQ8Zox9j7Ys8uCpb7XawsUFZeBFtZ8EZxpWk0mCiFtt9uQpl59pRmMrw/exec",

  // Link do botão "abrir no mapa"
  mapsUrl: "https://maps.app.goo.gl/brFYHweSXuNozZY56",

  // Máximo de acompanhantes por resposta
  maxCompanions: 10,
};

/* ========================================================= */

const $ = (sel) => document.querySelector(sel);

const form = $("#rsvp-form");
const nameInput = $("#name");
const companionsBox = $("#companions");
const companionsList = $("#companions-list");
const addBtn = $("#add-companion");
const submitBtn = $("#submit-btn");
const formError = $("#form-error");
const thanks = $("#thanks");

// link do mapa
$("#maps-link").href = CONFIG.mapsUrl;

/* ---------- acompanhantes ---------- */
function addCompanion(value = "") {
  const count = companionsList.children.length;
  if (count >= CONFIG.maxCompanions) return;

  const li = document.createElement("li");
  li.className = "companion";
  const n = count + 1;
  li.innerHTML = `
    <input type="text" maxlength="80" placeholder="Nome do acompanhante" aria-label="Nome do acompanhante ${n}">
    <button type="button" class="companion__remove" aria-label="Remover acompanhante">×</button>
  `;
  const input = li.querySelector("input");
  input.value = value;
  li.querySelector("button").addEventListener("click", () => {
    li.remove();
    updateAddBtn();
  });
  companionsList.appendChild(li);
  input.focus();
  updateAddBtn();
}

function updateAddBtn() {
  addBtn.hidden = companionsList.children.length >= CONFIG.maxCompanions;
}

addBtn.addEventListener("click", () => addCompanion());

/* ---------- vou / não vou ---------- */
form.addEventListener("change", (e) => {
  if (e.target.name === "attending") {
    companionsBox.hidden = e.target.value !== "sim";
    $("#attending-error").hidden = true;
  }
});

nameInput.addEventListener("input", () => {
  nameInput.removeAttribute("aria-invalid");
  $("#name-error").hidden = true;
});

/* ---------- envio ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const name = nameInput.value.trim().replace(/\s+/g, " ");
  const attending = form.querySelector('input[name="attending"]:checked')?.value;
  let ok = true;

  if (name.length < 2) {
    nameInput.setAttribute("aria-invalid", "true");
    $("#name-error").hidden = false;
    ok = false;
  }
  if (!attending) {
    $("#attending-error").hidden = false;
    ok = false;
  }
  if (!ok) {
    (name.length < 2 ? nameInput : form.querySelector('input[name="attending"]')).focus();
    return;
  }

  const companions =
    attending === "sim"
      ? [...companionsList.querySelectorAll("input")]
          .map((i) => i.value.trim().replace(/\s+/g, " "))
          .filter(Boolean)
      : [];

  const body = new URLSearchParams({
    nome: name,
    resposta: attending === "sim" ? "Vou" : "Não vou",
    acompanhantes: companions.join(" | "),
    website: form.website.value, // anti-robô
  });

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";

  try {
    if (CONFIG.scriptUrl.startsWith("COLE_AQUI")) {
      // modo de teste: ainda sem planilha conectada
      console.info("[RSVP] Modo de teste. Dados que seriam enviados:", Object.fromEntries(body));
      await new Promise((r) => setTimeout(r, 700));
    } else {
      await fetch(CONFIG.scriptUrl, { method: "POST", mode: "no-cors", body });
    }
    showThanks(name, attending === "sim", companions.length);
  } catch (err) {
    console.error(err);
    formError.textContent =
      "Ops, não conseguimos enviar. Verifique sua conexão e tente de novo.";
    formError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar resposta";
  }
});

function showThanks(name, going, nCompanions) {
  const first = name.split(" ")[0];
  if (going) {
    $("#thanks-title").textContent = `Que alegria, ${first}!`;
    $("#thanks-text").textContent =
      nCompanions > 0
        ? `Sua presença e a de mais ${nCompanions} ${nCompanions === 1 ? "pessoa" : "pessoas"} está confirmada. Nos vemos sob o sol do dia 19.`
        : "Sua presença está confirmada. Nos vemos sob o sol do dia 19.";
    $(".thanks__sun").style.display = "";
  } else {
    $("#thanks-title").textContent = `Que pena, ${first}.`;
    $("#thanks-text").textContent =
      "Obrigada por avisar. Vamos sentir sua falta, e fica o convite para o próximo solstício.";
    $(".thanks__sun").style.display = "none";
  }
  form.hidden = true;
  $(".rsvp__deadline").hidden = true;
  $(".rsvp__title").hidden = true;
  thanks.hidden = false;
  thanks.focus();
}

$("#again").addEventListener("click", () => {
  form.reset();
  companionsList.innerHTML = "";
  companionsBox.hidden = true;
  updateAddBtn();
  thanks.hidden = true;
  form.hidden = false;
  $(".rsvp__deadline").hidden = false;
  $(".rsvp__title").hidden = false;
  nameInput.focus();
});
