// Fade-in on scroll. Each [data-reveal] block fades up once its top passes 88% of the
// viewport height, then stays visible. A rAF-throttled scroll check is used instead of
// IntersectionObserver so blocks skipped by a fast jump (hash link, Back to top) still reveal.
// [data-reveal="fade"] fades without moving, for wrappers whose children use position:fixed.
export function initReveal({ reduceMotion = false } = {}) {
  const pending = new Set(document.querySelectorAll("[data-reveal]"));
  if (!pending.size) return;
  if (reduceMotion) {
    pending.forEach((el) => el.classList.add("is-revealed"));
    return;
  }
  let ticking = false;
  const check = () => {
    ticking = false;
    const line = window.innerHeight * 0.88;
    pending.forEach((el) => {
      if (el.getBoundingClientRect().top < line) {
        el.classList.add("is-revealed");
        pending.delete(el);
      }
    });
    if (!pending.size) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(check); }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  check();
}
