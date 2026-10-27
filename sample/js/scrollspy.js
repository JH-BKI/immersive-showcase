// Marks the item closest to the vertical centre of the viewport as active.
// Uses IntersectionObserver with a 1px band at the centre line, so it costs nothing while scrolling.
// Clicking an item also activates it (useful on short screens).
export function initScrollSpy({ items, onChange }) {
  const list = [...items];
  if (!list.length) return;
  let current = -1;

  const set = (i) => {
    if (i === current) return;
    current = i;
    list.forEach((el, n) => {
      el.classList.toggle("is-active", n === i);
      if (n === i) el.setAttribute("aria-current", "step"); else el.removeAttribute("aria-current");
    });
    onChange?.(i);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) set(list.indexOf(e.target)); });
  }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });

  list.forEach((el, i) => {
    io.observe(el);
    el.addEventListener("click", () => set(i));
  });
  set(0);
}
