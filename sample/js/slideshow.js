// Hero crossfade slideshow. Auto-advances unless the visitor prefers reduced motion,
// pauses on hover/focus and while the tab is hidden. Dots jump to a slide.
export function initSlideshow(root, { interval = 5000, reduceMotion = false } = {}) {
  if (!root) return;
  const slides = [...root.querySelectorAll("[data-slide]")];
  const dotsWrap = root.querySelector("[data-slide-dots]");
  if (slides.length < 2) return;
  let index = 0;
  let timer = null;
  let paused = false;

  dotsWrap.classList.add("dots");
  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot";
    b.setAttribute("aria-label", `Show slide ${i + 1} of ${slides.length}`);
    b.addEventListener("click", () => { show(i); restart(); });
    dotsWrap.append(b);
    return b;
  });

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => {
      s.classList.toggle("is-active", n === index);
      s.setAttribute("aria-hidden", n === index ? "false" : "true");
    });
    dots.forEach((d, n) => d.setAttribute("aria-current", n === index ? "true" : "false"));
  }
  function restart() {
    clearInterval(timer);
    if (reduceMotion) return;
    timer = setInterval(() => { if (!paused && !document.hidden) show(index + 1); }, interval);
  }

  root.addEventListener("pointerenter", () => (paused = true));
  root.addEventListener("pointerleave", () => (paused = false));
  root.addEventListener("focusin", () => (paused = true));
  root.addEventListener("focusout", () => (paused = false));

  show(0);
  restart();
}
