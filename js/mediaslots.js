// Media slots: a container marked [data-media-slot] holds ONE <img>, <video> or <iframe>.
// - <iframe data-src="…"> only gets its src when the slot is activated (saves running several embeds at once).
// - <video data-autoplay> plays (muted, looping) only while its slot is active, and never with reduced motion.
export function activateSlot(slot, { reduceMotion = false } = {}) {
  if (!slot) return;
  slot.querySelectorAll("iframe[data-src]").forEach((f) => { if (!f.getAttribute("src")) f.src = f.dataset.src; });
  if (!reduceMotion) slot.querySelectorAll("video[data-autoplay]").forEach((v) => { v.muted = true; v.play?.().catch(() => {}); });
}
export function deactivateSlot(slot) {
  slot?.querySelectorAll("video[data-autoplay]").forEach((v) => v.pause());
}
// Activate a slot once it scrolls near the viewport (used for the WebXR section).
export function activateWhenVisible(slot, opts) {
  if (!slot) return;
  new IntersectionObserver((entries, io) => {
    entries.forEach((e) => {
      if (e.isIntersecting) activateSlot(slot, opts);
      else deactivateSlot(slot);
    });
  }, { rootMargin: "200px 0px" }).observe(slot);
}
