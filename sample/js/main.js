// Entry point. Each module is self-contained and safe to remove.
import { initPlaceholders } from "./placeholders.js";
import { initSlideshow } from "./slideshow.js";
import { initScrollSpy } from "./scrollspy.js";
import { initDemos, initWebXRDemo } from "./demos.js";
import { initCaseStudies } from "./case-studies.js";
import { initReveal } from "./reveal.js";
import { initSectionNav } from "./sectionnav.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initPlaceholders(document);
initReveal({ reduceMotion });
initSectionNav({ reduceMotion });
initSlideshow(document.querySelector("[data-slideshow]"), { interval: 5000, reduceMotion });

// Formats scrollytelling: highlight the format nearest the viewport centre and swap the stage layer.
const formatLabels = ["3D content", "360° scenes and video", "Extended reality (XR)"];
const demos = initDemos(document.querySelector("[data-format-stage]"), { reduceMotion });
initWebXRDemo(document.querySelector("[data-webxr-demo]"), { reduceMotion });
initScrollSpy({
  items: document.querySelectorAll("[data-format]"),
  onChange(index) {
    document.querySelectorAll("[data-layer]").forEach((el) => el.classList.toggle("is-active", Number(el.dataset.layer) === index));
    const label = document.querySelector("[data-stage-label]");
    if (label) label.textContent = `${String(index + 1).padStart(2, "0")} · ${formatLabels[index]}`;
    demos?.setActive(index);
  },
});

// Process: same pattern, swaps the sticky image.
const stepLabels = ["Discover", "Design", "Develop", "Deploy"];
initScrollSpy({
  items: document.querySelectorAll("[data-step]"),
  onChange(index) {
    document.querySelectorAll("[data-process-img]").forEach((el) => el.classList.toggle("is-active", Number(el.dataset.processImg) === index));
    const label = document.querySelector("[data-process-label]");
    if (label) label.textContent = `${index + 1} · ${stepLabels[index]}`;
  },
});

initCaseStudies({
  dataUrl: "data/case-studies.json",
  root: document.querySelector("#case-studies"),
  dialog: document.querySelector("[data-case-dialog]"),
});
