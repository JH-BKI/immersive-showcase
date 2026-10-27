// Clean build: any <img data-placeholder> that has no file yet (empty src or a failed load)
// is swapped for a plain empty frame at the same size, so the layout holds until real media arrives.
export function initPlaceholders(scope = document) {
  scope.querySelectorAll("img[data-placeholder]").forEach(watch);
}

export function watch(img) {
  const swap = () => {
    if (img.dataset.phDone) return;
    img.dataset.phDone = "1";
    const ph = document.createElement("div");
    ph.className = "ph";
    if (img.alt) { ph.setAttribute("role", "img"); ph.setAttribute("aria-label", img.alt); }
    else ph.setAttribute("aria-hidden", "true");
    img.replaceWith(ph);
  };
  if (!img.getAttribute("src")) return swap();
  if (img.complete && img.naturalWidth === 0) swap();
  else img.addEventListener("error", swap, { once: true });
}
