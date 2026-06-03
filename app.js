const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("pt-BR");

const seedEvaluations = [
  {
    id: crypto.randomUUID(),
    client: "Inova Patrimonial",
    address: "Rua Haddock Lobo, 820",
    district: "Jardins",
    type: "Apartamento",
    area: 118,
    rooms: 3,
    parking: 2,
    age: 6,
    estimatedValue: 1848000,
    estimatedM2: 15661,
    confidence: 91,
    status: "Aprovado",
    notes: "Amostras homogeneas, padrao alto e liquidez acima da media regional.",
    date: "2026-05-25",
  },
  {
    id: crypto.randomUUID(),
    client: "Banco Horizonte",
    address: "Av. Republica, 1440",
    district: "Centro",
    type: "Sala comercial",
    area: 64,
    rooms: 0,
    parking: 1,
    age: 14,
    estimatedValue: 608000,
    estimatedM2: 9500,
    confidence: 84,
    status: "Em analise",
    notes: "Imovel comercial com boa exposicao e vacancia regional moderada.",
    date: "2026-05-28",
  },
  {
    id: crypto.randomUUID(),
    client: "Familia Moreira",
    address: "Rua das Acacias, 312",
    district: "Vila Nova",
    type: "Casa",
    area: 156,
    rooms: 4,
    parking: 3,
    age: 18,
    estimatedValue: 1246000,
    estimatedM2: 7987,
    confidence: 78,
    status: "Rascunho",
    notes: "Necessario validar documentacao e benfeitorias externas.",
    date: "2026-05-30",
  },
];

const defaultComparables = [
  { location: "Mesmo condominio", area: 84, value: 980000 },
  { location: "Rua paralela", area: 78, value: 895000 },
  { location: "Bairro similar", area: 91, value: 1038000 },
];

const state = {
  evaluations: loadEvaluations(),
  selectedReportId: null,
  search: "",
};

const elements = {
  pageTitle: document.querySelector("#page-title"),
  navItems: document.querySelectorAll("[data-view]"),
  viewButtons: document.querySelectorAll("[data-view-target]"),
  views: document.querySelectorAll("[data-view-panel]"),
  portfolioTable: document.querySelector("#portfolio-table"),
  propertyGrid: document.querySelector("#property-grid"),
  clientGrid: document.querySelector("#client-grid"),
  reportList: document.querySelector("#report-list"),
  reportTitle: document.querySelector("#report-title"),
  reportSubtitle: document.querySelector("#report-subtitle"),
  reportBody: document.querySelector("#report-body"),
  globalSearch: document.querySelector("#global-search"),
  statusFilter: document.querySelector("#status-filter"),
  valuationForm: document.querySelector("#valuation-form"),
  comparablesList: document.querySelector("#comparables-list"),
  addComp: document.querySelector("#add-comp"),
  estimatedValue: document.querySelector("#estimated-value"),
  estimatedM2: document.querySelector("#estimated-m2"),
  confidenceCopy: document.querySelector("#confidence-copy"),
  themeToggle: document.querySelector("#theme-toggle"),
  printReport: document.querySelector("#print-report"),
  toast: document.querySelector("#toast"),
  metrics: {
    avgM2: document.querySelector("#metric-avg-m2"),
    active: document.querySelector("#metric-active"),
    reports: document.querySelector("#metric-reports"),
    confidence: document.querySelector("#metric-confidence"),
  },
  pipelineTotal: document.querySelector("#pipeline-total"),
};

const titles = {
  dashboard: "Painel / Avaliacao Imobiliaria",
  avaliacao: "Nova avaliacao / Athena Dados V2",
  imoveis: "Base de imoveis / Athena Dados V2",
  relatorios: "Laudos / Athena Dados V2",
  clientes: "Clientes",
};

init();

function init() {
  restoreTheme();
  defaultComparables.forEach(addComparableRow);
  bindEvents();
  renderAll();
  updateEstimate();
}

function bindEvents() {
  elements.navItems.forEach((item) => {
    item.addEventListener("click", () => setView(item.dataset.view));
  });

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.viewTarget));
  });

  elements.globalSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderAll();
  });

  elements.statusFilter.addEventListener("change", renderPortfolio);
  elements.addComp.addEventListener("click", () => {
    addComparableRow({ location: "", area: 80, value: 900000 });
    updateEstimate();
  });

  elements.valuationForm.addEventListener("input", updateEstimate);
  elements.valuationForm.addEventListener("submit", saveEvaluation);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.printReport.addEventListener("click", () => window.print());
}

function loadEvaluations() {
  const stored = localStorage.getItem("athena-dados-v2:evaluations");
  if (!stored) return seedEvaluations;

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : seedEvaluations;
  } catch {
    return seedEvaluations;
  }
}

function persist() {
  localStorage.setItem("athena-dados-v2:evaluations", JSON.stringify(state.evaluations));
}

function setView(view) {
  elements.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  elements.views.forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  elements.pageTitle.textContent = titles[view] || "Athena Dados V2";

  if (view === "relatorios" && !state.selectedReportId && state.evaluations[0]) {
    selectReport(state.evaluations[0].id);
  }
}

function renderAll() {
  renderMetrics();
  renderPortfolio();
  renderProperties();
  renderClients();
  renderReports();
}

function filteredEvaluations() {
  if (!state.search) return state.evaluations;

  return state.evaluations.filter((evaluation) => {
    const haystack = [
      evaluation.client,
      evaluation.address,
      evaluation.district,
      evaluation.type,
      evaluation.status,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(state.search);
  });
}

function renderMetrics() {
  const evaluations = state.evaluations;
  const avgM2 = average(evaluations.map((item) => item.estimatedM2));
  const avgConfidence = average(evaluations.map((item) => item.confidence));
  const pipelineTotal = evaluations.reduce((sum, item) => sum + item.estimatedValue, 0);

  elements.metrics.avgM2.textContent = currency.format(avgM2);
  elements.metrics.active.textContent = evaluations.filter((item) => item.status !== "Aprovado").length;
  elements.metrics.reports.textContent = evaluations.filter((item) => item.status === "Aprovado").length;
  elements.metrics.confidence.textContent = `${Math.round(avgConfidence)}%`;
  elements.pipelineTotal.textContent = currency.format(pipelineTotal);
}

function renderPortfolio() {
  const status = elements.statusFilter.value;
  const evaluations = filteredEvaluations().filter((item) => status === "todos" || item.status === status);

  elements.portfolioTable.innerHTML =
    evaluations
      .map(
        (item) => `
          <tr>
            <td><strong>${escapeHtml(item.type)}</strong><br><span>${escapeHtml(item.district)}</span></td>
            <td>${escapeHtml(item.client)}</td>
            <td>${currency.format(item.estimatedValue)}</td>
            <td>${statusBadge(item.status)}</td>
            <td>${item.confidence}%</td>
          </tr>
        `,
      )
      .join("") || `<tr><td colspan="5">Nenhuma avaliacao encontrada.</td></tr>`;
}

function renderProperties() {
  const evaluations = filteredEvaluations();
  elements.propertyGrid.innerHTML =
    evaluations
      .map(
        (item) => `
          <article class="property-card">
            <div class="property-visual" aria-hidden="true"></div>
            <h3>${escapeHtml(item.type)} em ${escapeHtml(item.district)}</h3>
            <p>${escapeHtml(item.address)}</p>
            <strong>${currency.format(item.estimatedValue)}</strong>
            <p>${number.format(item.area)} m² · ${currency.format(item.estimatedM2)}/m²</p>
            ${statusBadge(item.status)}
          </article>
        `,
      )
      .join("") || `<p>Nenhum imovel encontrado.</p>`;
}

function renderClients() {
  const grouped = state.evaluations.reduce((acc, item) => {
    acc[item.client] ||= { count: 0, total: 0, districts: new Set() };
    acc[item.client].count += 1;
    acc[item.client].total += item.estimatedValue;
    acc[item.client].districts.add(item.district);
    return acc;
  }, {});

  elements.clientGrid.innerHTML = Object.entries(grouped)
    .map(([client, data]) => {
      const averageTicket = data.total / data.count;
      return `
        <article class="client-card">
          <h3>${escapeHtml(client)}</h3>
          <p>${data.count} avaliacao(oes) · ${Array.from(data.districts).join(", ")}</p>
          <strong>${currency.format(averageTicket)}</strong>
          <p>Ticket medio estimado</p>
        </article>
      `;
    })
    .join("");
}

function renderReports() {
  elements.reportList.innerHTML =
    state.evaluations
      .map(
        (item) => `
          <button class="report-item ${item.id === state.selectedReportId ? "active" : ""}" type="button" data-report-id="${item.id}">
            <h3>${escapeHtml(item.type)} · ${escapeHtml(item.district)}</h3>
            <p>${escapeHtml(item.client)} · ${currency.format(item.estimatedValue)}</p>
            ${statusBadge(item.status)}
          </button>
        `,
      )
      .join("") || `<p>Nenhum relatorio disponivel.</p>`;

  elements.reportList.querySelectorAll("[data-report-id]").forEach((item) => {
    item.addEventListener("click", () => selectReport(item.dataset.reportId));
  });

  if (state.selectedReportId) {
    renderReportPreview(state.evaluations.find((item) => item.id === state.selectedReportId));
  }
}

function selectReport(id) {
  state.selectedReportId = id;
  renderReports();
}

function renderReportPreview(item) {
  if (!item) return;

  elements.reportTitle.textContent = `${item.type} em ${item.district}`;
  elements.reportSubtitle.textContent = `${item.address} · Cliente: ${item.client}`;
  elements.reportBody.innerHTML = `
    <section class="report-kpis">
      <div>
        <span>Valor de mercado</span>
        <h2>${currency.format(item.estimatedValue)}</h2>
      </div>
      <div>
        <span>Valor unitario</span>
        <h2>${currency.format(item.estimatedM2)}/m²</h2>
      </div>
      <div>
        <span>Confianca</span>
        <h2>${item.confidence}%</h2>
      </div>
    </section>
    <section>
      <h2>Resumo executivo</h2>
      <p>O imovel avaliado possui ${number.format(item.area)} m² de area privativa, tipologia ${escapeHtml(item.type).toLowerCase()} e localizacao em ${escapeHtml(item.district)}. A estimativa considera comparaveis recentes, padrao construtivo, estado de conservacao, liquidez e ajustes de mercado.</p>
    </section>
    <section>
      <h2>Premissas e ressalvas</h2>
      <p>${escapeHtml(item.notes || "Sem ressalvas cadastradas.")}</p>
    </section>
  `;
}

function addComparableRow(comp) {
  const row = document.createElement("div");
  row.className = "comp-row";
  row.innerHTML = `
    <label>
      Localizacao
      <input data-comp="location" value="${escapeAttr(comp.location)}" placeholder="Ex.: Rua proxima" />
    </label>
    <label>
      Area (m²)
      <input data-comp="area" type="number" min="10" value="${comp.area}" />
    </label>
    <label>
      Valor vendido
      <input data-comp="value" type="number" min="1000" value="${comp.value}" />
    </label>
    <button class="icon-button" type="button" aria-label="Remover comparavel" title="Remover comparavel">×</button>
  `;
  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    updateEstimate();
  });
  elements.comparablesList.append(row);
}

function updateEstimate() {
  const data = formData();
  const comps = getComparables();
  const baseM2 = average(comps.map((comp) => comp.value / comp.area));
  const ageAdjustment = Math.max(0.78, 1 - data.age * 0.006);
  const roomAdjustment = 1 + Math.min(data.rooms, 4) * 0.012 + Math.min(data.parking, 3) * 0.018;
  const adjustedM2 = baseM2 * data.condition * data.standard * data.liquidity * ageAdjustment * roomAdjustment;
  const estimatedValue = adjustedM2 * data.area;
  const confidence = confidenceFrom(comps, data);

  elements.estimatedValue.textContent = currency.format(estimatedValue || 0);
  elements.estimatedM2.textContent = `${currency.format(adjustedM2 || 0)}/m²`;
  elements.confidenceCopy.textContent = `${confidence}% de confianca com ${comps.length} comparavel(is) valido(s).`;

  return {
    ...data,
    estimatedValue: Math.round(estimatedValue || 0),
    estimatedM2: Math.round(adjustedM2 || 0),
    confidence,
  };
}

function saveEvaluation(event) {
  event.preventDefault();
  const estimate = updateEstimate();

  const evaluation = {
    id: crypto.randomUUID(),
    client: estimate.client,
    address: estimate.address,
    district: estimate.district,
    type: estimate.type,
    area: estimate.area,
    rooms: estimate.rooms,
    parking: estimate.parking,
    age: estimate.age,
    estimatedValue: estimate.estimatedValue,
    estimatedM2: estimate.estimatedM2,
    confidence: estimate.confidence,
    status: estimate.confidence >= 85 ? "Aprovado" : "Em analise",
    notes: estimate.notes,
    date: new Date().toISOString().slice(0, 10),
  };

  state.evaluations.unshift(evaluation);
  state.selectedReportId = evaluation.id;
  persist();
  renderAll();
  showToast("Avaliacao salva e relatorio atualizado.");
  setView("relatorios");
}

function formData() {
  const data = new FormData(elements.valuationForm);
  return {
    client: String(data.get("client") || "Cliente nao informado"),
    address: String(data.get("address") || "Endereco nao informado"),
    type: String(data.get("type") || "Apartamento"),
    district: String(data.get("district") || "Regiao nao informada"),
    area: Number(data.get("area")) || 1,
    rooms: Number(data.get("rooms")) || 0,
    parking: Number(data.get("parking")) || 0,
    age: Number(data.get("age")) || 0,
    condition: Number(data.get("condition")) || 1,
    standard: Number(data.get("standard")) || 1,
    liquidity: Number(data.get("liquidity")) || 1,
    notes: String(data.get("notes") || ""),
  };
}

function getComparables() {
  return Array.from(elements.comparablesList.querySelectorAll(".comp-row"))
    .map((row) => ({
      location: row.querySelector('[data-comp="location"]').value,
      area: Number(row.querySelector('[data-comp="area"]').value),
      value: Number(row.querySelector('[data-comp="value"]').value),
    }))
    .filter((comp) => comp.area > 0 && comp.value > 0);
}

function confidenceFrom(comps, data) {
  if (!comps.length) return 0;

  const sampleScore = Math.min(45, comps.length * 12);
  const areaValues = comps.map((comp) => comp.area);
  const avgArea = average(areaValues);
  const areaGap = Math.abs(avgArea - data.area) / data.area;
  const areaScore = Math.max(0, 25 - areaGap * 50);
  const dispersion = standardDeviation(comps.map((comp) => comp.value / comp.area)) / average(comps.map((comp) => comp.value / comp.area));
  const dispersionScore = Math.max(0, 30 - dispersion * 70);

  return Math.round(Math.min(96, sampleScore + areaScore + dispersionScore));
}

function statusBadge(status) {
  const className = status === "Aprovado" ? "" : status === "Em analise" ? "warning" : "neutral";
  return `<span class="badge ${className}">${escapeHtml(status)}</span>`;
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function standardDeviation(values) {
  const avg = average(values);
  if (!avg) return 0;
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("athena-dados-v2:theme", document.body.classList.contains("dark") ? "dark" : "light");
}

function restoreTheme() {
  if (localStorage.getItem("athena-dados-v2:theme") === "dark") {
    document.body.classList.add("dark");
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
