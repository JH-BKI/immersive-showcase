// Swaps any <img data-placeholder="..."> that fails to load for a labelled placeholder block.
// Lets the page be reviewed before real photography exists. Safe to keep in production.
export function initPlaceholders(scope = document) {
  scope.querySelectorAll("img[data-placeholder]").forEach(watch);
}

export function watch(img) {
  const swap = () => {
    if (img.dataset.phDone) return;
    img.dataset.phDone = "1";
    const ph = document.createElement("div");
    ph.className = "ph";
    ph.textContent = img.dataset.placeholder || img.alt || "";
    if (img.alt) ph.setAttribute("role", "img"), ph.setAttribute("aria-label", img.alt);
    else ph.setAttribute("aria-hidden", "true");
    img.replaceWith(ph);
  };
  if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) swap();
  else img.addEventListener("error", swap, { once: true });
  if (!img.getAttribute("src")) swap();
}
