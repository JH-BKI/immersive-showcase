// Section nav: a small fixed control in the right-hand gutter with "back to top",
// one dot per major section (the current one is highlighted) and "next section".
// Below 900px it becomes two round buttons, bottom-right. Hidden near the top of the page
// and while the case study dialog is open.
const SECTIONS = [
  ["what", "Introduction"], ["formats", "Content offerings"], ["process", "Process"],
  ["webxr", "WebXR"], ["spotlight", "Featured case study"], ["case-studies", "Case studies"],
];
const ICON_UP = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M5 9l5-5 5 5"/></svg>';
const ICON_DOWN = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M5 11l5 5 5-5"/></svg>';

export function initSectionNav({ reduceMotion = false } = {}) {
  const items = SECTIONS.map(([id, label]) => ({ id, label, el: document.getElementById(id) })).filter((s) => s.el);
  if (!items.length) return;
  const nav = document.createElement("nav");
  nav.className = "section-nav";
  nav.setAttribute("aria-label", "Page sections");
  nav.innerHTML = `
    <button type="button" class="section-nav__btn" data-nav-top aria-label="Back to top" title="Back to top">${ICON_UP}</button>
    <div class="section-nav__dots">${items.map((s, i) => `<button type="button" class="section-nav__dot" data-nav-i="${i}" aria-label="Go to ${s.label}" title="${s.label}"><span></span></button>`).join("")}</div>
    <button type="button" class="section-nav__btn" data-nav-next>${ICON_DOWN}</button>`;
  document.body.appendChild(nav);
  const dots = [...nav.querySelectorAll("[data-nav-i]")];
  const nextBtn = nav.querySelector("[data-nav-next]");
  const behavior = reduceMotion ? "auto" : "smooth";
  let current = -1;

  const go = (el) => el.scrollIntoView({ behavior, block: "start" });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("[data-nav-top]")) return window.scrollTo({ top: 0, behavior });
    if (e.target.closest("[data-nav-next]")) { const n = items[current + 1]; if (n) go(n.el); return; }
    const d = e.target.closest("[data-nav-i]");
    if (d) go(items[Number(d.dataset.navI)].el);
  });

  // rAF-throttled scroll check, like the docking filter bar: the current section is the last
  // one whose top has passed 40% of the viewport height.
  let ticking = false;
  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.4;
    let cur = -1;
    items.forEach((s, i) => { if (s.el.getBoundingClientRect().top <= line) cur = i; });
    nav.classList.toggle("is-visible", window.scrollY > 300);
    if (cur === current) return;
    current = cur;
    dots.forEach((d, i) => d.setAttribute("aria-current", i === cur ? "true" : "false"));
    const n = items[cur + 1];
    nextBtn.disabled = !n;
    const label = n ? `Next section: ${n.label}` : "End of page";
    nextBtn.setAttribute("aria-label", label);
    nextBtn.title = label;
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update);
  update();
}
