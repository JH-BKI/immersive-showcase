// Lightweight canvas demos for the "Formats we work in" stage.
// These are stand-ins: swap each <canvas> for a real <model-viewer>, 360 viewer or WebXR iframe later.
// Only the active, on-screen demo is drawn each frame.
// initWebXRDemo() drives the separate WebXR section's browser demo the same way.

const PARTS = [ // low-poly training forklift: centre [x,y,z], size [w,h,d], colour
  { c: [0, 0.38, 0], s: [1.2, 0.46, 0.8], col: "#78deb6" },
  { c: [-0.62, 0.48, 0], s: [0.3, 0.56, 0.78], col: "#008566" },
  { c: [-0.08, 0.76, 0], s: [0.4, 0.28, 0.5], col: "#0e2b3c" },
  { c: [-0.08, 1.3, 0.3], s: [0.06, 0.8, 0.06], col: "#375962" },
  { c: [-0.08, 1.3, -0.3], s: [0.06, 0.8, 0.06], col: "#375962" },
  { c: [-0.08, 1.72, 0], s: [0.5, 0.05, 0.66], col: "#375962" },
  { c: [0.66, 0.92, 0], s: [0.1, 1.7, 0.62], col: "#375962" },
  { c: [0.98, 0.12, 0.2], s: [0.62, 0.05, 0.1], col: "#646f7d" },
  { c: [0.98, 0.12, -0.2], s: [0.62, 0.05, 0.1], col: "#646f7d" },
  { c: [0.4, 0.15, 0.44], s: [0.32, 0.32, 0.12], col: "#1d2b35" },
  { c: [0.4, 0.15, -0.44], s: [0.32, 0.32, 0.12], col: "#1d2b35" },
  { c: [-0.42, 0.15, 0.44], s: [0.32, 0.32, 0.12], col: "#1d2b35" },
  { c: [-0.42, 0.15, -0.44], s: [0.32, 0.32, 0.12], col: "#1d2b35" },
];
const FACES = [[0, 1, 2, 3, [0, 0, -1]], [5, 4, 7, 6, [0, 0, 1]], [4, 0, 3, 7, [-1, 0, 0]], [1, 5, 6, 2, [1, 0, 0]], [3, 2, 6, 7, [0, 1, 0]], [4, 5, 1, 0, [0, -1, 0]]];
const LIGHT = normalise([0.45, 0.8, 0.55]);
const HOTSPOTS = [
  { x: 300, y: 330, t: "Emergency trolley" }, { x: 1000, y: 230, t: "Handover station" },
  { x: 1630, y: 260, t: "Fire exit" }, { x: 2100, y: 330, t: "Medication room" },
];

function normalise(v) { const m = Math.hypot(...v); return v.map((n) => n / m); }
function hexToRgb(h) { return [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)); }
function rotate([x, y, z], yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const rx = x * cy + z * sy, rz = -x * sy + z * cy;
  return [rx, y * cp - rz * sp, y * sp + rz * cp];
}

function drawScene(ctx, x0, y0, w, h, yaw, pitch, light) {
  const D = 5.2, f = Math.min(w, h) * 1.25, cx = x0 + w / 2, cy = y0 + h * 0.58;
  const P = (p) => { const r = rotate([p[0], p[1] - 0.7, p[2]], yaw, pitch); const d = D - r[2]; return [cx + (f * r[0]) / d, cy - (f * r[1]) / d, r[2]]; };
  ctx.lineWidth = 1;
  ctx.strokeStyle = light ? "rgba(55,89,98,.18)" : "rgba(120,222,182,.22)";
  for (let g = -2; g <= 2.001; g += 0.5) {
    for (const [a, b] of [[[g, 0, -2], [g, 0, 2]], [[-2, 0, g], [2, 0, g]]]) {
      const pa = P(a), pb = P(b);
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    }
  }
  const polys = [];
  for (const part of PARTS) {
    const [cxp, cyp, czp] = part.c, [hx, hy, hz] = part.s.map((n) => n / 2);
    const v = [
      [cxp - hx, cyp - hy, czp - hz], [cxp + hx, cyp - hy, czp - hz], [cxp + hx, cyp + hy, czp - hz], [cxp - hx, cyp + hy, czp - hz],
      [cxp - hx, cyp - hy, czp + hz], [cxp + hx, cyp - hy, czp + hz], [cxp + hx, cyp + hy, czp + hz], [cxp - hx, cyp + hy, czp + hz],
    ].map(P);
    const base = hexToRgb(part.col);
    for (const fc of FACES) {
      const n = rotate(fc[4], yaw, pitch);
      if (n[2] <= 0.01) continue; // back-face
      const k = 0.55 + 0.45 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      const pts = [v[fc[0]], v[fc[1]], v[fc[2]], v[fc[3]]];
      polys.push({ z: pts.reduce((s, p) => s + p[2], 0) / 4, pts, col: `rgb(${base.map((c) => Math.round(c * k)).join(",")})` });
    }
  }
  polys.sort((a, b) => a.z - b.z);
  for (const p of polys) {
    ctx.beginPath(); ctx.moveTo(p.pts[0][0], p.pts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(p.pts[i][0], p.pts[i][1]);
    ctx.closePath(); ctx.fillStyle = p.col; ctx.fill();
    ctx.strokeStyle = "rgba(14,43,60,.35)"; ctx.stroke();
  }
}

function buildPanorama() {
  const c = document.createElement("canvas"); c.width = 2400; c.height = 600;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 600);
  grd.addColorStop(0, "#e9f4f0"); grd.addColorStop(0.62, "#cfe5dd"); grd.addColorStop(0.62, "#9fbfb5"); grd.addColorStop(1, "#7fa79b");
  g.fillStyle = grd; g.fillRect(0, 0, 2400, 600);
  for (let i = 0; i < 6; i++) {
    const x = i * 400;
    g.fillStyle = "#e0ece8"; g.fillRect(x + 20, 0, 360, 18);
    g.fillStyle = "#f6fbf9"; g.fillRect(x + 20, 40, 360, 10);
    g.fillStyle = "#bfffff"; g.fillRect(x + 60, 110, 120, 150);
    g.strokeStyle = "#88aa9d"; g.lineWidth = 6; g.strokeRect(x + 60, 110, 120, 150);
    g.beginPath(); g.moveTo(x + 120, 110); g.lineTo(x + 120, 260); g.stroke();
    g.fillStyle = "rgba(0,133,102,.25)"; g.fillRect(x + 196, 60, 14, 330);
    g.fillStyle = "#fff"; g.fillRect(x + 210, 300, 160, 70);
    g.fillStyle = "#78deb6"; g.fillRect(x + 210, 300, 50, 70);
    g.fillStyle = "#375962"; g.fillRect(x + 214, 370, 8, 40); g.fillRect(x + 358, 370, 8, 40);
  }
  g.fillStyle = "#0e2b3c"; g.fillRect(1560, 150, 140, 220);
  g.fillStyle = "#00b388"; g.fillRect(1590, 120, 80, 24);
  return c;
}

export function initDemos(stage, { reduceMotion = false } = {}) {
  if (!stage) return null;
  const view = { yaw: 0.7, pitch: 0.32, pan: 0, drag: null };
  const types = ["object", "pano", "stereo"];
  let active = 0;
  let visible = true;
  const pano = buildPanorama();
  const font = getComputedStyle(document.body).fontFamily;

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

  function fit(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return null;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawPano(ctx, w, h, t) {
    const s = h / 600, W = 2400 * s, off = ((view.pan % W) + W) % W;
    ctx.drawImage(pano, -off, 0, W, h); ctx.drawImage(pano, W - off, 0, W, h);
    const pulse = reduceMotion ? 6 : 6 + 3 * Math.sin(t / 300);
    ctx.font = `600 13px ${font}`;
    for (const hs of HOTSPOTS) {
      for (const r of [-1, 0, 1]) {
        const x = hs.x * s - off + r * W, y = hs.y * s;
        if (x < -120 || x > w + 120) continue;
        ctx.beginPath(); ctx.arc(x, y, 14 + pulse, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,179,136,.22)"; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fillStyle = "#00b388"; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
        const tw = ctx.measureText(hs.t).width;
        ctx.fillStyle = "rgba(14,43,60,.85)"; ctx.fillRect(x + 18, y - 12, tw + 16, 24);
        ctx.fillStyle = "#fff"; ctx.fillText(hs.t, x + 26, y + 5);
      }
    }
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.75);
    vg.addColorStop(0, "rgba(14,43,60,0)"); vg.addColorStop(1, "rgba(14,43,60,.35)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  function drawStereo(ctx, w, h) {
    ctx.fillStyle = "#081a24"; ctx.fillRect(0, 0, w, h);
    const ew = w / 2 - 18, eh = h - 70;
    [-1, 1].forEach((side, i) => {
      const x0 = i === 0 ? 12 : w / 2 + 6, y0 = 24;
      ctx.save(); ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x0, y0, ew, eh, ew * 0.42); else ctx.rect(x0, y0, ew, eh);
      ctx.clip();
      ctx.fillStyle = "#0e2b3c"; ctx.fillRect(x0, y0, ew, eh);
      drawScene(ctx, x0, y0, ew, eh, view.yaw + side * 0.05, view.pitch, false);
      const vg = ctx.createRadialGradient(x0 + ew / 2, y0 + eh / 2, eh * 0.25, x0 + ew / 2, y0 + eh / 2, ew * 0.75);
      vg.addColorStop(0, "rgba(8,26,36,0)"); vg.addColorStop(1, "rgba(8,26,36,.85)");
      ctx.fillStyle = vg; ctx.fillRect(x0, y0, ew, eh);
      ctx.restore();
    });
    ctx.font = `600 12px ${font}`; ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.fillText("LEFT EYE", 24, h - 22); ctx.fillText("RIGHT EYE", w / 2 + 18, h - 22);
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if (!view.drag && !reduceMotion) { view.yaw += 0.004; view.pan += 0.25; }
    const type = types[active];
    const cv = stage.querySelector(`canvas[data-demo="${type}"]`);
    const F = cv && fit(cv);
    if (!F) return;
    const { ctx, w, h } = F;
    if (type === "object") { ctx.fillStyle = "#0e2b3c"; ctx.fillRect(0, 0, w, h); drawScene(ctx, 0, 0, w, h, view.yaw, view.pitch, false); }
    else if (type === "pano") drawPano(ctx, w, h, t);
    else drawStereo(ctx, w, h);
  }
  requestAnimationFrame(frame);

  // Drag to rotate / look around (pointer events cover mouse, touch and pen)
  stage.addEventListener("pointerdown", (e) => {
    const cv = e.target.closest("canvas[data-demo]");
    if (!cv) return;
    view.drag = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch, pan: view.pan, type: cv.dataset.demo };
    cv.setPointerCapture?.(e.pointerId);
  });
  window.addEventListener("pointermove", (e) => {
    if (!view.drag) return;
    const dx = e.clientX - view.drag.x, dy = e.clientY - view.drag.y;
    if (view.drag.type === "pano") view.pan = view.drag.pan - dx * 1.4;
    else { view.yaw = view.drag.yaw + dx * 0.01; view.pitch = Math.max(-0.1, Math.min(1.1, view.drag.pitch + dy * 0.006)); }
  });
  const end = () => { view.drag = null; };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);

  return { setActive(i) { active = i; } };
}

// The WebXR section's demo: the forklift in a browser window. Own view state and loop,
// drawn only while the section is on screen and the tab is visible.
export function initWebXRDemo(root, { reduceMotion = false } = {}) {
  const cv = root?.querySelector("canvas[data-demo=\"web\"]");
  if (!cv) return;
  const view = { yaw: 0.7, pitch: 0.32, drag: null };
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if (!view.drag && !reduceMotion) view.yaw += 0.004;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#eef5f3"; ctx.fillRect(0, 0, w, h);
    drawScene(ctx, 0, 0, w, h, view.yaw, view.pitch, true);
  }
  requestAnimationFrame(frame);
  cv.addEventListener("pointerdown", (e) => {
    view.drag = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch };
    cv.setPointerCapture?.(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!view.drag) return;
    view.yaw = view.drag.yaw + (e.clientX - view.drag.x) * 0.01;
    view.pitch = Math.max(-0.1, Math.min(1.1, view.drag.pitch + (e.clientY - view.drag.y) * 0.006));
  });
  const end = () => { view.drag = null; };
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);
}
