// Case studies: loads data/case-studies.json, renders filter pills and cards,
// docks the filter bar once it scrolls past the top, renders the spotlight, and drives the case dialog.
import { watch } from "./placeholders.js";
import { mediaHTML } from "./media.js";

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const ICON_PLAY = '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M8 4l18 11L8 26z"/></svg>';

export async function initCaseStudies({ dataUrl, root, dialog }) {
  if (!root) return;
  const grid = root.querySelector("[data-case-grid]");
  const empty = root.querySelector("[data-empty]");
  const status = root.querySelector("[data-results-status]");

  let data;
  try {
    const res = await fetch(dataUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (err) {
    grid.innerHTML = `<li class="body">Case studies couldn't be loaded. If you opened this file directly, run it from a local server (see README).</li>`;
    console.error("[case-studies]", err);
    return;
  }

  const typeLabel = Object.fromEntries(data.filters.types.map((t) => [t.id, t.label]));
  const indLabel = Object.fromEntries(data.filters.industries.map((t) => [t.id, t.label]));
  const cases = data.caseStudies.filter((c) => c.published !== false).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const state = { type: "all", industry: "all" };
  const matches = (c, type = state.type, industry = state.industry) =>
    (type === "all" || c.types.includes(type)) && (industry === "all" || c.industry === industry);
  const visible = () => cases.filter((c) => matches(c));

  /* ---------- filters ---------- */
  const groups = {
    type: { el: root.querySelector('[data-filter-group="type"]'), options: data.filters.types },
    industry: { el: root.querySelector('[data-filter-group="industry"]'), options: data.filters.industries },
  };
  function renderFilters() {
    for (const [key, g] of Object.entries(groups)) {
      const opts = [{ id: "all", label: "All" }, ...g.options];
      g.el.innerHTML = opts.map((o) => {
        const n = cases.filter((c) => (key === "type" ? matches(c, o.id, state.industry) : matches(c, state.type, o.id))).length;
        const on = state[key] === o.id;
        const label = o.id === "all" ? "All" : `${esc(o.label)} (${n})`;
        return `<button type="button" class="pill${n === 0 && !on ? " is-empty" : ""}" aria-pressed="${on}" data-key="${key}" data-value="${esc(o.id)}">${label}</button>`;
      }).join("");
    }
  }
  root.querySelector("[data-filters]").addEventListener("click", (e) => {
    const b = e.target.closest(".pill");
    if (!b) return;
    state[b.dataset.key] = b.dataset.value;
    renderFilters();
    renderCards();
    if (filters.classList.contains("is-docked")) grid.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- cards ---------- */
  function renderCards() {
    const list = visible();
    grid.innerHTML = list.map((c) => `
      <li class="card" data-open="${esc(c.id)}">
        <button type="button" class="card__media" data-open="${esc(c.id)}" aria-haspopup="dialog" aria-label="Open case study: ${esc(c.title)}">
          <img src="${esc(c.card?.image || "")}" alt="" data-placeholder="${esc(c.card?.alt || "")}" loading="lazy">
        </button>
        <p class="eyebrow">${esc([indLabel[c.industry] || c.industry, c.duration].filter(Boolean).join(" · "))}</p>
        <h3 class="card__title">${esc(c.title)}</h3>
        <p class="small">${esc(c.summary)}</p>
        <span class="tags" aria-label="Experience types">${c.types.map((t) => `<span class="tag">${esc(typeLabel[t] || t)}</span>`).join("")}</span>
        <button type="button" class="link-btn" data-open="${esc(c.id)}" aria-haspopup="dialog">View case study →</button>
      </li>`).join("");
    grid.querySelectorAll("img[data-placeholder]").forEach(watch);
    empty.hidden = list.length > 0;
    if (!cases.length) empty.textContent = "No case studies published yet.";
    status.textContent = `${list.length} case ${list.length === 1 ? "study" : "studies"} shown`;
  }
  grid.addEventListener("click", (e) => {
    // the whole card is clickable; focus returns to a real button on close
    const b = e.target.closest("[data-open]");
    if (!b) return;
    const opener = b.matches("button") ? b : b.querySelector("button[data-open]");
    openCase(b.dataset.open, opener);
  });

  /* ---------- docking filter bar ---------- */
  const holder = root.querySelector("[data-filters-holder]");
  const filters = root.querySelector("[data-filters]");
  // A rAF-throttled scroll check is used rather than IntersectionObserver because a fast jump
  // (e.g. "Back to top", a deep link) can skip straight past a sentinel without firing.
  let ticking = false;
  const checkDock = () => {
    ticking = false;
    const dock = holder.getBoundingClientRect().top < 0;
    if (dock === filters.classList.contains("is-docked")) return;
    holder.style.minHeight = dock ? `${filters.offsetHeight}px` : "";
    filters.classList.toggle("is-docked", dock);
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(checkDock); } }, { passive: true });
  window.addEventListener("resize", checkDock);
  checkDock();

  /* ---------- case view (shared by the dialog and the spotlight) ---------- */
  const caseNum = (c) => pad(c.order ?? cases.indexOf(c) + 1);
  const viewOpts = { typeLabel, indLabel };

  /* ---------- spotlight: one featured case study embedded in the page ---------- */
  const spotRoot = document.querySelector("[data-spotlight]");
  // The featured case is flagged with "spotlight": true in the JSON. It also stays in the listing below.
  // No published case studies yet (e.g. the clean build's blank data): render an empty frame so the layout holds.
  const BLANK = { id: "", title: "", client: "", industry: "", types: [], duration: "", summary: "", challenge: "", approach: "", outcome: "", experience: {}, assets: [{}, {}, {}] }; // 3 empty image frames
  const spotCase = cases.find((c) => c.spotlight === true) || cases[0] || BLANK;
  if (spotRoot && spotCase) {
    const spot = createCaseView(spotRoot, viewOpts);
    spot.render(spotCase);
    const crumb = document.querySelector("[data-spot-num]");
    if (crumb) crumb.textContent = spotCase === BLANK ? "" : ` · Case study ${caseNum(spotCase)}`;
  }

  /* ---------- dialog ---------- */
  const view = createCaseView(dialog, viewOpts);
  let opener = null;

  function openCase(id, from) {
    const c = cases.find((x) => x.id === id);
    if (!c) return;
    opener = from || null;
    dialog.querySelector("[data-cd-crumb]").textContent = `Case study ${caseNum(c)} · ${c.title}`;
    view.render(c);
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add("has-dialog");
    history.replaceState(null, "", `#case/${c.id}`);
  }

  function closeCase() {
    dialog.close();
  }

  dialog.addEventListener("click", (e) => {
    // a click on the darkened backdrop targets the <dialog> itself
    if (e.target === dialog) return closeCase();
    if (e.target.closest("[data-cd-close]")) closeCase();
  });
  dialog.addEventListener("close", () => {
    view.clear(); // stops any running experience
    document.documentElement.classList.remove("has-dialog");
    if (location.hash.startsWith("#case/")) history.replaceState(null, "", location.pathname + location.search);
    opener?.focus();
  });

  renderFilters();
  renderCards();

  // Deep link: index.html#case/<id> (e.g. #case/case-01) opens that case study
  const openFromHash = () => {
    const m = location.hash.match(/^#case\/(.+)$/);
    if (m) openCase(decodeURIComponent(m[1]));
  };
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
}

/**
 * Renders one case study into an element that holds the .cd__body markup:
 * the 16:9 stage, the asset strip with arrows, dots and counter, and the text column.
 * Used by the case dialog and by the in-page spotlight. Each instance keeps its own asset index.
 */
function createCaseView(el, { typeLabel, indLabel }) {
  const $ = (sel) => el.querySelector(sel);
  const stage = $("[data-cd-stage]"), strip = $("[data-cd-strip]"), dotsEl = $("[data-cd-dots]"), count = $("[data-cd-count]");
  dotsEl.classList.add("dots", "dots--green");
  let current = null, assetIndex = 0;
  const slides = (c) => [{ type: "experience", caption: "Interactive experience" }, ...(c.assets || [])];
  const set = (sel, text) => { const n = $(sel); if (n) n.textContent = text; };

  function render(c) {
    current = c;
    set("[data-cd-meta]", [indLabel[c.industry] || c.industry, c.duration].filter(Boolean).join(" · "));
    set("[data-cd-title]", c.title);
    set("[data-cd-summary]", c.summary);
    set("[data-cd-client]", c.client);
    $("[data-cd-types]").innerHTML = c.types.map((t) => `<span class="tag">${esc(typeLabel[t] || t)}</span>`).join("");
    set("[data-cd-challenge]", c.challenge);
    set("[data-cd-approach]", c.approach);
    set("[data-cd-outcome]", c.outcome);
    set("[data-cd-note]", c.experience?.note || "");
    strip.innerHTML = slides(c).map((s, i) => {
      if (s.type === "experience") return `<button type="button" class="thumb" data-asset="${i}" aria-label="Show interactive experience"><span class="thumb__img thumb__img--exp"><span>${ICON_PLAY}</span></span><span class="thumb__cap">Interactive experience</span></button>`;
      // a video or iframe item uses its thumb (or poster) image if it has one, else an icon tile
      const still = s.thumb || (s.type === "video" || s.type === "iframe" ? s.poster : s.src);
      const inner = still
        ? `<img src="${esc(still)}" alt="" data-placeholder=" " loading="lazy">`
        : `<span class="thumb__icon">${s.type === "image" || !s.type ? "" : ICON_PLAY}</span>`;
      return `<button type="button" class="thumb" data-asset="${i}" aria-label="Show ${esc(s.caption || "asset " + (i + 1))}"><span class="thumb__img${still ? "" : " thumb__img--media"}">${inner}</span><span class="thumb__cap" title="${esc(s.caption)}">${esc(s.caption)}</span></button>`;
    }).join("");
    strip.querySelectorAll("img[data-placeholder]").forEach(watch);
    dotsEl.innerHTML = slides(c).map((s, i) => `<button type="button" class="dot" data-asset="${i}" aria-label="Show ${esc(s.caption)}"></button>`).join("");
    show(0);
  }

  function show(i) {
    const list = slides(current);
    assetIndex = (i + list.length) % list.length;
    const s = list[assetIndex];
    if (s.type === "experience") {
      const x = current.experience || {};
      if (x.type === "video" || x.type === "image") {
        // a recorded walkthrough or a still, shown directly rather than behind a launch button
        stage.innerHTML = mediaHTML({ ...x, alt: x.alt || current.title, title: `${current.title}: ${x.label || "experience"}` });
      } else {
        stage.innerHTML = `
        <div class="cd__poster"><img src="${esc(x.poster || "")}" alt="" data-placeholder=" "></div>
        <span class="cd__mode">${esc(x.label || "")}</span>
        <button type="button" class="play-btn cd__launch" data-launch aria-label="Launch ${esc(current.title)}">${ICON_PLAY}</button>`;
      }
    } else {
      stage.innerHTML = mediaHTML(s) + (s.caption ? `<span class="cd__caption">${esc(s.caption)}</span>` : "");
    }
    stage.querySelectorAll("img[data-placeholder]").forEach(watch);
    strip.querySelectorAll(".thumb").forEach((t, n) => t.setAttribute("aria-current", n === assetIndex ? "true" : "false"));
    dotsEl.querySelectorAll(".dot").forEach((d, n) => d.setAttribute("aria-current", n === assetIndex ? "true" : "false"));
    count.textContent = `${pad(assetIndex + 1)} / ${pad(list.length)}`;
    // keep the active thumb visible when the strip scrolls, without scrolling the page
    const t = strip.children[assetIndex];
    if (t) {
      const sr = strip.getBoundingClientRect(), tr = t.getBoundingClientRect();
      if (tr.left < sr.left) strip.scrollLeft -= sr.left - tr.left + 3;
      else if (tr.right > sr.right) strip.scrollLeft += tr.right - sr.right + 3;
    }
  }

  // The experience iframe only loads when the visitor chooses to launch it.
  function launch() {
    const x = current.experience || {};
    stage.innerHTML = `<iframe src="${esc(x.src)}" title="${esc(current.title)} – interactive experience" allow="xr-spatial-tracking; fullscreen; accelerometer; gyroscope; autoplay" allowfullscreen loading="lazy"></iframe>`;
  }

  el.addEventListener("click", (e) => {
    if (!current) return;
    if (e.target.closest("[data-cd-prev]")) return show(assetIndex - 1);
    if (e.target.closest("[data-cd-next]")) return show(assetIndex + 1);
    if (e.target.closest("[data-launch]")) return launch();
    const a = e.target.closest("[data-asset]");
    if (a) show(Number(a.dataset.asset));
  });
  el.addEventListener("keydown", (e) => {
    if (!current || e.target.closest("iframe, input, textarea")) return;
    if (e.key === "ArrowLeft") show(assetIndex - 1);
    if (e.key === "ArrowRight") show(assetIndex + 1);
  });

  return { render, show, clear: () => { stage.innerHTML = ""; } };
}
