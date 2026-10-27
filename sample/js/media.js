// One renderer for every media item: { type: "image" | "video" | "iframe", src, poster, alt, title, captions }.
// Used by the case study carousel and experience. Anything without a type is treated as an image.
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function mediaHTML(m = {}) {
  const type = m.type === "video" || m.type === "iframe" ? m.type : "image";
  if (type === "video") {
    return `<video class="media" controls playsinline preload="metadata"${m.poster ? ` poster="${esc(m.poster)}"` : ""} aria-label="${esc(m.title || m.alt || m.caption || "Video")}">`
      + (m.src ? `<source src="${esc(m.src)}"${m.mime ? ` type="${esc(m.mime)}"` : ""}>` : "")
      + (m.captions ? `<track kind="captions" src="${esc(m.captions)}" srclang="en" label="English" default>` : "")
      + `</video>`;
  }
  if (type === "iframe") {
    return `<iframe class="media" src="${esc(m.src || "about:blank")}" title="${esc(m.title || m.alt || m.caption || "Embedded content")}" loading="lazy" allow="xr-spatial-tracking; fullscreen; accelerometer; gyroscope; autoplay" allowfullscreen></iframe>`;
  }
  const alt = m.alt || "";
  return `<img class="media" src="${esc(m.src || "")}" alt="${esc(alt)}" data-placeholder="${esc(alt || m.caption || " ")}">`;
}
