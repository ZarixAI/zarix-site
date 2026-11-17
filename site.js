(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
  }
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Hero: orchestrated business system ---------- */
  var cv = document.getElementById("orchestra");
  if (cv && cv.getContext) {
    var ctx = cv.getContext("2d");
    var css = getComputedStyle(document.documentElement);
    var C = {
      line: "rgba(150,172,222,0.20)",
      text: css.getPropertyValue("--muted").trim() || "#a3aec5",
      fg: css.getPropertyValue("--fg").trim() || "#eef0f5",
      gold: css.getPropertyValue("--gold").trim() || "#cfae66",
      goldHi: css.getPropertyValue("--gold-hi").trim() || "#ecd49a",
      cyan: css.getPropertyValue("--cyan").trim() || "#53c6e0"
    };
    var nodes = [
      { id: "cust", label: "Customer", x: .15, y: .22 },
      { id: "agent", label: "AI Agent", x: .45, y: .24, kind: "agent" },
      { id: "crm", label: "CRM", x: .80, y: .17 },
      { id: "kb", label: "Knowledge Base", x: .22, y: .55 },
      { id: "wf", label: "Workflow", x: .62, y: .50 },
      { id: "human", label: "Human Approval", x: .38, y: .80, kind: "human" },
      { id: "sys", label: "Business System", x: .84, y: .62 },
      { id: "act", label: "Action", x: .74, y: .86, kind: "action" }
    ];
    var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
    var edges = [
      ["cust", "agent", .10], ["agent", "kb", -.18], ["kb", "agent", -.18], ["agent", "crm", -.10],
      ["agent", "wf", .12], ["crm", "wf", .14], ["wf", "human", .16], ["human", "sys", -.14], ["sys", "act", .10]
    ];
    var parts = [];
    edges.forEach(function (e, i) {
      for (var k = 0; k < 2; k++) parts.push({ e: i, t: (k * 0.5 + i * 0.13) % 1, s: 0.0028 + (i % 3) * 0.0007 });
    });
    // A single request that travels the full path, with a pause at human approval
    var route = [
      ["cust", "agent", "Customer request received"],
      ["agent", "kb", "Agent retrieving policy from knowledge base"],
      ["kb", "agent", "Context returned to agent"],
      ["agent", "crm", "Customer record checked in CRM"],
      ["crm", "wf", "Workflow started"],
      ["wf", "human", "Paused for human approval", 1],
      ["human", "sys", "Approved · updating business system"],
      ["sys", "act", "Action complete"]
    ];
    var J = { leg: 0, t: 0, hold: 0 };
    var statusEl = document.getElementById("orch-status");
    var statusTxt = statusEl ? statusEl.querySelector("span") : null;
    function setStatus(i) {
      if (!statusTxt) return;
      statusTxt.textContent = route[i][2];
      statusEl.classList.toggle("wait", !!route[i][3]);
    }
    function edgeFor(a, b) {
      for (var i = 0; i < edges.length; i++) if (edges[i][0] === a && edges[i][1] === b) return edges[i];
      return [a, b, 0.1];
    }
    var W = 0, H = 0, dpr = 1;
    function size() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function P(n) { return { x: n.x * W, y: n.y * H }; }
    function ctrl(a, b, bend) {
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
      return { x: mx - dy * bend, y: my + dx * bend };
    }
    function qp(a, c, b, t) {
      var u = 1 - t;
      return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
    }
    var time = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var unit = Math.min(W, H);
      // edges
      ctx.lineWidth = 1;
      edges.forEach(function (e) {
        var a = P(byId[e[0]]), b = P(byId[e[1]]), c = ctrl(a, b, e[2]);
        ctx.strokeStyle = C.line;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); ctx.stroke();
      });
      // particles
      parts.forEach(function (p) {
        var e = edges[p.e], a = P(byId[e[0]]), b = P(byId[e[1]]), c = ctrl(a, b, e[2]);
        var q = qp(a, c, b, p.t);
        var toHuman = e[1] === "human";
        ctx.fillStyle = toHuman ? C.goldHi : C.cyan;
        ctx.globalAlpha = 0.25 + 0.75 * Math.sin(Math.PI * p.t);
        ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1.6, unit * 0.0045), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      // travelling request (trail + token)
      var leg = route[J.leg], ed = edgeFor(leg[0], leg[1]);
      var ja = P(byId[leg[0]]), jb = P(byId[leg[1]]), jc = ctrl(ja, jb, ed[2]);
      var jt = Math.min(1, J.t), gold = !!leg[3] || leg[0] === "human";
      ctx.lineWidth = 2.2; ctx.lineCap = "round";
      for (var s = 0; s < 14; s++) {
        var t0 = jt - s * 0.022, t1 = jt - (s + 1) * 0.022;
        if (t1 < 0) break;
        var p0 = qp(ja, jc, jb, t0), p1 = qp(ja, jc, jb, t1);
        ctx.strokeStyle = gold ? "rgba(236,212,154," + (0.9 - s * 0.06) + ")" : "rgba(83,198,224," + (0.9 - s * 0.06) + ")";
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }
      var tok = qp(ja, jc, jb, jt);
      var tg = ctx.createRadialGradient(tok.x, tok.y, 0, tok.x, tok.y, unit * 0.03);
      tg.addColorStop(0, gold ? "rgba(236,212,154,0.9)" : "rgba(83,198,224,0.9)"); tg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(tok.x, tok.y, unit * 0.03, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(tok.x, tok.y, Math.max(2.2, unit * 0.006), 0, Math.PI * 2); ctx.fill();
      var activeId = J.t >= 1 ? leg[1] : null;

      // nodes
      var fs = Math.max(10, Math.round(unit * 0.026));
      ctx.font = "500 " + fs + "px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      nodes.forEach(function (n, i) {
        var p = P(n);
        var r = unit * (n.kind === "agent" ? 0.034 : 0.022);
        var col = n.kind === "human" ? C.gold : (n.kind === "agent" ? C.cyan : (n.kind === "action" ? C.goldHi : C.fg));
        var pulse = reduce ? 0.5 : (Math.sin(time * 0.03 + i) + 1) / 2;
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
        g.addColorStop(0, n.kind === "human" ? "rgba(207,174,102,0.30)" : "rgba(83,198,224,0.22)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.globalAlpha = 0.55 + pulse * 0.45;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#08101f"; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
        if (n.kind === "human") {
          ctx.beginPath(); ctx.moveTo(p.x, p.y - r * 1.25); ctx.lineTo(p.x + r * 1.25, p.y); ctx.lineTo(p.x, p.y + r * 1.25); ctx.lineTo(p.x - r * 1.25, p.y); ctx.closePath();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        }
        ctx.fill(); ctx.stroke();
        if (n.id === activeId) {
          ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, r * (1.9 + 0.5 * Math.sin(time * 0.12)), 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1; ctx.lineWidth = 1.5;
        }
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.32, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = n.kind === "human" ? C.goldHi : C.text;
        ctx.fillText(n.label, p.x, p.y + r * 1.5 + 4);
      });
    }
    function tick() {
      time++;
      parts.forEach(function (p) { p.t += p.s; if (p.t > 1) p.t -= 1; });
      if (J.t < 1) {
        J.t += 0.012;
        if (J.t >= 1) { J.t = 1; J.hold = route[J.leg][3] ? 130 : (J.leg === route.length - 1 ? 110 : 26); }
      } else if (--J.hold <= 0) {
        J.leg = (J.leg + 1) % route.length; J.t = 0; setStatus(J.leg);
      }
      draw();
      raf = requestAnimationFrame(tick);
    }
    var raf = null;
    if (reduce) { J.leg = 5; J.t = 1; setStatus(5); }
    size(); draw();
    if (window.ResizeObserver) new ResizeObserver(function () { size(); draw(); }).observe(cv);
    else window.addEventListener("resize", function () { size(); draw(); });
    if (!reduce) {
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (en) {
          en.forEach(function (x) {
            if (x.isIntersecting && !raf) raf = requestAnimationFrame(tick);
            else if (!x.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
          });
        }).observe(cv);
      } else { raf = requestAnimationFrame(tick); }
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(); });
  }


  /* ---------- Tools -> system strip: tool sprawl that the cursor organizes ---------- */
  var hf = document.getElementById("hero-field");
  var fine = !(window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  var mouseInits = [];
  function whenMouse(fn) {
    if (fine) { fn(); return; }
    mouseInits.push(fn);
    if (mouseInits.length === 1) {
      window.addEventListener("pointermove", function first(e) {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        window.removeEventListener("pointermove", first);
        document.documentElement.classList.add("has-mouse");
        mouseInits.forEach(function (f) { f(); });
      });
    }
  }
  if (fine) document.documentElement.classList.add("has-mouse");
  if (hf && hf.getContext && !reduce) (function () {
    var hx = hf.getContext("2d"), hero = hf.parentElement, HW = 0, HH = 0, hd = 1;
    var LABELS = ["Email", "CRM", "Sheets", "Calendar", "Chat", "Forms", "Invoices", "Notes", "Files", "Tasks", "Bookings", "Reports", "Docs", "Inbox", "Quotes", "Payroll"];
    var BCOLS = [-186, -93, 0, 93], BLANES = [-30, 0, 30], COLS = BCOLS, LANES = BLANES, OUT = 168, K = 1;
    var chips = [], tangles = [], mouse = { x: -9999, y: -9999, on: false }, sys = { x: 0, y: 0, a: 0, lx: -9999, ly: -9999 };
    var running = false, hraf = null, ht = 0;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function hsize() {
      var r = hero.getBoundingClientRect(); hd = Math.min(window.devicePixelRatio || 1, 2);
      HW = r.width; HH = r.height; hf.width = HW * hd; hf.height = HH * hd; hx.setTransform(hd, 0, 0, hd, 0, 0);
      K = Math.min(1, HW / 560); COLS = BCOLS.map(function (v) { return v * K; }); LANES = BLANES.map(function (v) { return v * K; }); OUT = 168 * K;
      var n = Math.round(Math.max(18, Math.min(42, HW * HH / 13000)));
      chips = [];
      for (var i = 0; i < n; i++) chips.push({ cx: rnd(20, HW - 20), cy: rnd(20, HH - 30), rot: rnd(-0.5, 0.5), ph: rnd(0, 6.28), label: LABELS[i % LABELS.length], o: 0, slot: -1, x: 0, y: 0, r: 0, e: 0 });
      tangles = [];
      for (var k = 0; k < n * 4 && tangles.length < n * 0.8; k++) { var a = Math.floor(rnd(0, n)), b = Math.floor(rnd(0, n)); if (a !== b && Math.hypot(chips[a].cx - chips[b].cx, chips[a].cy - chips[b].cy) < 240) tangles.push([a, b, rnd(-40, 40)]); }
    }
    function assign() {
      chips.forEach(function (c) { c.slot = -1; });
      if (!mouse.on) return;
      var near = chips.map(function (c, i) { return { i: i, d: Math.hypot(c.cx - mouse.x, c.cy - mouse.y) }; }).sort(function (a, b) { return a.d - b.d; }).slice(0, COLS.length * LANES.length);
      near.sort(function (a, b) { return chips[a.i].cy - chips[b.i].cy; });
      for (var l = 0; l < LANES.length; l++) {
        var row = near.slice(l * COLS.length, (l + 1) * COLS.length).sort(function (a, b) { return chips[a.i].cx - chips[b.i].cx; });
        row.forEach(function (n, c) { chips[n.i].slot = l * COLS.length + c; });
      }
    }
    var lastReal = 0, hint = document.getElementById("sprawl-hint");
    function moveTo(x, y) { mouse.x = x; mouse.y = y; mouse.on = true; if (Math.hypot(mouse.x - sys.lx, mouse.y - sys.ly) > 90) { sys.lx = mouse.x; sys.ly = mouse.y; assign(); } }
    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      var r = hero.getBoundingClientRect(); lastReal = performance.now(); moveTo(e.clientX - r.left, e.clientY - r.top);
      if (hint) hint.classList.add("gone");
    });
    hero.addEventListener("pointerleave", function () { lastReal = 0; });
    function rr(x, y, w, h, r) { hx.beginPath(); hx.moveTo(x + r, y); hx.arcTo(x + w, y, x + w, y + h, r); hx.arcTo(x + w, y + h, x, y + h, r); hx.arcTo(x, y + h, x, y, r); hx.arcTo(x, y, x + w, y, r); hx.closePath(); }
    function slotXY(s) { return [sys.x + COLS[s % COLS.length], sys.y + LANES[Math.floor(s / COLS.length)]]; }
    function hstep() {
      if (!running) return;
      ht += 0.006;
      if (performance.now() - lastReal > 2500) {
        var lo = 210 * K + 10, hi = HW - OUT - 24, ax = HW * (0.5 + 0.3 * Math.sin(ht * 0.55));
        moveTo(hi > lo ? Math.max(lo, Math.min(hi, ax)) : HW / 2, HH * (0.5 + 0.12 * Math.sin(ht * 1.1)));
      }
      if (mouse.on) { sys.x += (mouse.x - sys.x) * 0.1; sys.y += (mouse.y - sys.y) * 0.1; }
      sys.a += ((mouse.on ? 1 : 0) - sys.a) * 0.06;
      hx.clearRect(0, 0, HW, HH);
      chips.forEach(function (c) {
        var wx = c.cx + Math.sin(ht + c.ph) * 16, wy = c.cy + Math.cos(ht * 0.8 + c.ph) * 12;
        c.o += ((c.slot >= 0 ? 1 : 0) - c.o) * 0.08;
        var e = c.o * c.o * (3 - 2 * c.o), tx = wx, ty = wy;
        if (c.slot >= 0 || e > 0.01) { if (c.slot >= 0) { var p = slotXY(c.slot); c.tx = p[0]; c.ty = p[1]; } tx = c.tx; ty = c.ty; }
        c.x = wx + (tx - wx) * e; c.y = wy + (ty - wy) * e; c.r = (c.rot + Math.sin(ht * 0.7 + c.ph) * 0.15) * (1 - e); c.e = e;
      });
      // tangle (fades where order forms)
      hx.lineWidth = 1;
      tangles.forEach(function (t) {
        var A = chips[t[0]], B = chips[t[1]], al = 0.09 * (1 - Math.max(A.e, B.e));
        if (al < 0.01) return;
        hx.strokeStyle = "rgba(227,154,106," + al.toFixed(3) + ")";
        hx.beginPath(); hx.moveTo(A.x, A.y); hx.quadraticCurveTo((A.x + B.x) / 2 + t[2], (A.y + B.y) / 2 - t[2], B.x, B.y); hx.stroke();
      });
      // the system around the cursor: lanes -> approval diamond
      var bySlot = {}; chips.forEach(function (c) { if (c.slot >= 0) bySlot[c.slot] = c; });
      var dx = sys.x + OUT, dy = sys.y;
      for (var l = 0; l < LANES.length; l++) {
        for (var c = 0; c < COLS.length; c++) {
          var A = bySlot[l * COLS.length + c]; if (!A || A.e < 0.5) continue;
          var B = c < COLS.length - 1 ? bySlot[l * COLS.length + c + 1] : null;
          var x2, y2, al;
          if (B) { if (B.e < 0.5) continue; x2 = B.x - 23 * K; y2 = B.y; al = Math.min(A.e, B.e); }
          else { x2 = dx - 8 * K; y2 = dy; al = A.e * sys.a; }
          var al2 = Math.max(0, (al - 0.5) * 2);
          hx.strokeStyle = "rgba(83,198,224," + (al2 * 0.75).toFixed(3) + ")"; hx.lineWidth = 1.3;
          hx.beginPath(); hx.moveTo(A.x + 23 * K, A.y);
          if (B) hx.lineTo(x2, y2); else hx.bezierCurveTo(A.x + 50 * K, A.y, x2 - 40 * K, y2, x2, y2);
          hx.stroke();
          var f = (ht * 2.2 + l * 0.33 + c * 0.21) % 1, px, py;
          if (B) { px = A.x + 23 * K + (x2 - A.x - 23 * K) * f; py = A.y + (y2 - A.y) * f; }
          else { var u = 1 - f; px = u*u*u*(A.x+23*K) + 3*u*u*f*(A.x+50*K) + 3*u*f*f*(x2-40*K) + f*f*f*x2; py = u*u*u*A.y + 3*u*u*f*A.y + 3*u*f*f*y2 + f*f*f*y2; }
          hx.fillStyle = "rgba(255,255,255," + (al2 * 0.9).toFixed(2) + ")"; hx.beginPath(); hx.arc(px, py, 1.6, 0, 6.283); hx.fill();
        }
      }
      // chips
      hx.font = "500 9px 'IBM Plex Mono', ui-monospace, monospace"; hx.textAlign = "center"; hx.textBaseline = "middle";
      chips.forEach(function (c) {
        var e = c.e;
        hx.save(); hx.translate(c.x, c.y); hx.rotate(c.r); hx.scale(K, K);
        rr(-23, -8, 46, 16, 4);
        hx.fillStyle = "rgba(11,21,48," + (0.5 + e * 0.4).toFixed(2) + ")"; hx.fill();
        var r = Math.round(227 + (83 - 227) * e), g = Math.round(154 + (198 - 154) * e), b = Math.round(106 + (224 - 106) * e);
        hx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + (0.2 + e * 0.65).toFixed(2) + ")"; hx.lineWidth = 1; hx.stroke();
        hx.fillStyle = "rgba(163,174,197," + (0.25 + e * 0.65).toFixed(2) + ")"; hx.fillText(c.label, 0, 0.5);
        hx.restore();
      });
      // approval diamond at the end of the system
      if (sys.a > 0.02) {
        hx.save(); hx.translate(dx, dy); hx.rotate(Math.PI / 4); hx.globalAlpha = sys.a;
        hx.shadowColor = "rgba(207,174,102,.85)"; hx.shadowBlur = 12;
        hx.fillStyle = "#0b1530"; hx.fillRect(-6, -6, 12, 12);
        hx.strokeStyle = "#ecd49a"; hx.lineWidth = 1.5; hx.strokeRect(-6, -6, 12, 12);
        hx.fillStyle = "#cfae66"; hx.fillRect(-2.5, -2.5, 5, 5);
        hx.restore();
      }
      hraf = requestAnimationFrame(hstep);
    }
    hsize();
    running = true; hf.classList.add("on"); hraf = requestAnimationFrame(hstep);
    if (window.ResizeObserver) new ResizeObserver(function () { hsize(); assign(); }).observe(hero);
    if (window.IntersectionObserver) new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting && !running) { running = true; hf.classList.add("on"); hraf = requestAnimationFrame(hstep); }
        else if (!x.isIntersecting && running) { running = false; if (hraf) cancelAnimationFrame(hraf); }
      });
    }).observe(hero);
  })();

  /* ---------- X-ray: the cursor reveals the hidden workflow under the page ---------- */
  var xr = document.getElementById("xray");
  if (xr && !reduce) whenMouse(function () {
    var xq = null, xm = { x: -999, y: -999, inHero: false };
    var heroEl = document.querySelector(".hero");
    function xheight() { xr.style.setProperty("--dh", Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) + "px"); }
    function xpaint() {
      xq = null;
      xr.style.setProperty("--mx", xm.x + "px"); xr.style.setProperty("--my", xm.y + "px");
      xr.classList.toggle("on", !xm.inHero && xm.x > -900);
    }
    document.addEventListener("pointermove", function (e) {
      xm.x = e.pageX; xm.y = e.pageY;
      xm.inHero = !!(heroEl && heroEl.contains(e.target));
      if (!xq) xq = requestAnimationFrame(xpaint);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { xm.x = xm.y = -999; if (!xq) xq = requestAnimationFrame(xpaint); });
    xheight();
    window.addEventListener("load", xheight);
    if (window.ResizeObserver) new ResizeObserver(xheight).observe(document.body);
  });

  /* ---------- "Sound familiar?" cards that fix themselves ---------- */
  var fixCards = document.querySelectorAll(".fixable li[data-fix]");
  if (fixCards.length) {
    var NS2 = "http://www.w3.org/2000/svg";
    // node: [id, kind, beforeXY|null, afterXY|null, opts]; kinds: task, tool, sys, person, you
    // opts: m = morphs into the approval diamond, f = fades out after, n = new (appears after)
    var SPEC = {
      manual: { nodes: [
          ["t0","task",[34,66],[22,50]],["t1","task",[52,66],[46,50]],["t2","task",[43,50],[70,50]],["t3","task",[34,34],[94,50]],["t4","task",[52,34],[118,50]],
          ["sys","sys",null,[166,50],{n:1}],["you","you",[118,50],[214,50],{m:1}]],
        before: [["t0","you"],["t1","you"],["t2","you"],["t3","you"],["t4","you"]],
        after: [["t0","t1"],["t1","t2"],["t2","t3"],["t3","t4"],["t4","sys"],["sys","you"]],
        path: ["t0","t1","t2","t3","t4","sys","you"] },
      disconnected: { nodes: [
          ["a","tool",[28,24],[24,50]],["b","tool",[96,80],[66,50]],["c","tool",[150,20],[108,50]],["d","tool",[206,74],[150,50]],["e","tool",[118,46],[192,50]],
          ["you","you",null,[226,50],{n:1,m:1}]],
        before: [],
        after: [["a","b"],["b","c"],["c","d"],["d","e"],["e","you"]],
        path: ["a","b","c","d","e","you"] },
      owner: { nodes: [
          ["you","you",[120,50],[120,50],{m:1}],
          ["p0","person",[120,12],[120,14]],["p1","person",[166,30],[178,30]],["p2","person",[166,72],[178,72]],
          ["p3","person",[120,88],[120,88]],["p4","person",[74,72],[62,72]],["p5","person",[74,30],[62,30]]],
        before: [["p0","you"],["p1","you"],["p2","you"],["p3","you"],["p4","you"],["p5","you"]],
        after: [["p0","p1"],["p1","p2"],["p2","p3"],["p3","p4"],["p4","p5"],["p5","p0"],["p1","you"],["p4","you"]],
        path: ["p0","p1","p2","p3","p4","p5","p0"] },
      bottleneck: { nodes: [
          ["l0","person",[26,22],[26,22]],["l1","person",[26,50],[26,50]],["l2","person",[26,78],[26,78]],
          ["h","sys",[120,50],[120,50]],
          ["r0","person",[214,22],[214,22]],["r1","you",[214,50],[214,50],{m:1}],["r2","person",[214,78],[214,78]],
          ["i0","task",[100,40],[60,50]],["i1","task",[104,62],[84,50]],["i2","task",[94,52],[156,50]],["i3","task",[108,30],[182,50]]],
        before: [["l0","h"],["l1","h"],["l2","h"],["h","r0"],["h","r1"],["h","r2"]],
        after: [["l0","h"],["l1","h"],["l2","h"],["h","r0"],["h","r1"],["h","r2"]],
        path: ["l1","h","r1"] },
      sprawl: { nodes: [
          ["a","tool",[22,20],[64,50]],["b","tool",[70,82],[64,50],{f:1}],["c","tool",[112,16],[118,50]],["d","tool",[160,84],[118,50],{f:1}],
          ["e","tool",[204,26],[172,50]],["f","tool",[50,52],[172,50],{f:1}],["g","tool",[140,54],[118,50],{f:1}],["h","tool",[196,66],[64,50],{f:1}],
          ["you","you",null,[220,50],{n:1,m:1}]],
        before: [["a","d"],["b","e"],["c","f"],["g","h"],["a","g"],["e","f"],["c","h"],["b","d"]],
        after: [["a","c"],["c","e"],["e","you"]],
        path: ["a","c","e","you"] },
      headcount: { nodes: [
          ["i0","task",[22,14],[22,14]],["i1","task",[22,32],[22,32]],["i2","task",[22,50],[22,50]],["i3","task",[22,68],[22,68]],["i4","task",[22,86],[22,86]],
          ["p0","person",[130,20],[176,20]],["p1","person",[130,40],[176,40]],["p2","person",[130,60],[176,60]],["p3","person",[130,80],[176,80]],
          ["hire","hire",[196,86],[196,86],{f:1}],
          ["sys","sys",null,[96,50],{n:1}],["you","you",null,[224,50],{n:1,m:1}]],
        before: [["i0","p0"],["i1","p1"],["i2","p2"],["i3","p3"],["i4","hire"]],
        after: [["i0","sys"],["i1","sys"],["i2","sys"],["i3","sys"],["i4","sys"],["sys","p0"],["sys","p1"],["sys","p2"],["sys","p3"],["p1","you"],["p2","you"]],
        path: ["i2","sys","p1","you"] }
    };
    function el(tag, attrs, parent) { var e = document.createElementNS(NS2, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function build(li) {
      var spec = SPEC[li.getAttribute("data-fix")], svg = li.querySelector(".fixviz");
      if (!spec || !svg) return null;
      var gE = el("g", { class: "fx-edges" }, svg), gN = el("g", { class: "fx-nodes" }, svg);
      var N = {}, E = [];
      spec.nodes.forEach(function (d) {
        var o = d[4] || {}, b = d[2] || d[3], a = d[3] || d[2];
        var g = el("g", { class: "fx-n fx-" + d[1] }, gN), shape;
        if (d[1] === "task" || d[1] === "tool") shape = el("rect", { x: -5, y: -5, width: 10, height: 10, rx: d[1] === "tool" ? 2.5 : 1.5 }, g);
        else if (d[1] === "hire") shape = el("circle", { r: 6, class: "dash" }, g);
        else shape = el("circle", { r: d[1] === "sys" ? 7.5 : d[1] === "you" ? 7.5 : 5.5 }, g);
        var dia = o.m ? el("rect", { x: -6, y: -6, width: 12, height: 12, transform: "rotate(45)", class: "fx-dia" }, g) : null;
        N[d[0]] = { g: g, shape: shape, dia: dia, b: b, a: a, o: o, x: b[0], y: b[1] };
      });
      function addEdges(list, which) { list.forEach(function (p) {
        var key = p[0] + "-" + p[1], found = null;
        E.forEach(function (x) { if (x.key === key) found = x; });
        if (!found) { found = { key: key, s: N[p[0]], t: N[p[1]], b: 0, a: 0, line: el("line", { class: "fx-e" }, gE) }; E.push(found); }
        found[which] = 1;
      }); }
      addEdges(spec.before, "b"); addEdges(spec.after, "a");
      var pulse = el("circle", { r: 2.6, class: "fx-pulse", opacity: 0 }, svg);
      var st = { t: 0, target: 0, raf: null, pt: 0, li: li };
      function draw() {
        var e = ease(st.t);
        for (var k in N) {
          var n = N[k], o = n.o;
          n.x = n.b[0] + (n.a[0] - n.b[0]) * e; n.y = n.b[1] + (n.a[1] - n.b[1]) * e;
          var op = o.f ? 1 - e : o.n ? e : 1;
          n.g.setAttribute("transform", "translate(" + n.x.toFixed(1) + "," + n.y.toFixed(1) + ")" + (o.n ? " scale(" + (0.4 + 0.6 * e).toFixed(2) + ")" : ""));
          n.g.setAttribute("opacity", op.toFixed(2));
          if (n.dia) { var m = Math.max(0, Math.min(1, (e - .55) / .4)); n.dia.setAttribute("opacity", m.toFixed(2)); n.shape.setAttribute("opacity", (1 - m).toFixed(2)); }
        }
        E.forEach(function (x) {
          var op = (x.b && x.a) ? 1 : x.b ? 1 - e : e;
          if (x.b && !x.a) op = (1 - e) ; if (!x.b && x.a) op = Math.max(0, (e - .25) / .75);
          x.line.setAttribute("x1", x.s.x.toFixed(1)); x.line.setAttribute("y1", x.s.y.toFixed(1));
          x.line.setAttribute("x2", x.t.x.toFixed(1)); x.line.setAttribute("y2", x.t.y.toFixed(1));
          x.line.setAttribute("opacity", (op * (x.a && !x.b ? 1 : x.b && x.a ? 1 : .9)).toFixed(2));
          x.line.setAttribute("class", "fx-e" + (x.a && e > .5 ? " ok" : ""));
        });
        li.classList.toggle("is-fixed", e > .55);
        // a request travelling the fixed path
        if (st.t >= 1 && spec.path) {
          st.pt = (st.pt + 0.012) % 1;
          var seg = (spec.path.length - 1) * st.pt, i = Math.floor(seg), f = seg - i;
          var A = N[spec.path[i]], B = N[spec.path[i + 1]];
          pulse.setAttribute("cx", (A.x + (B.x - A.x) * f).toFixed(1)); pulse.setAttribute("cy", (A.y + (B.y - A.y) * f).toFixed(1));
          pulse.setAttribute("opacity", "1");
        } else pulse.setAttribute("opacity", "0");
      }
      function loop() {
        var d = st.target - st.t;
        if (Math.abs(d) > 0.001) st.t += Math.sign(d) * Math.min(Math.abs(d), reduce ? 1 : 0.028);
        draw();
        if (st.t !== st.target || (st.t >= 1 && !reduce)) st.raf = requestAnimationFrame(loop); else st.raf = null;
      }
      st.go = function (v) { st.target = v; if (!st.raf) st.raf = requestAnimationFrame(loop); };
      draw();
      return st;
    }
    var touch = window.matchMedia && window.matchMedia("(hover: none)").matches;
    fixCards.forEach(function (li) {
      var st = build(li); if (!st) return;
      li.addEventListener("mouseenter", function () { st.go(1); });
      li.addEventListener("mouseleave", function () { st.go(0); });
      li.addEventListener("focus", function () { st.go(1); });
      li.addEventListener("blur", function () { st.go(0); });
      li.addEventListener("click", function () { if (touch) st.go(st.target ? 0 : 1); });
      if (touch && window.IntersectionObserver) {
        new IntersectionObserver(function (en, ob) {
          en.forEach(function (x) { if (x.isIntersecting) { setTimeout(function () { st.go(1); }, 700); ob.disconnect(); } });
        }, { threshold: 0.7 }).observe(li);
      }
    });
    var hint = document.querySelector(".fixhint");
    if (hint && touch) hint.textContent = "Tap a card to see it before and after.";
  }

  /* ---------- 3-minute AI check ---------- */
  var quiz = document.getElementById("quiz");
  if (quiz) {
    var CH = ["Your goal", "What's in the way", "What it's costing you", "How ready you are", "Your next step"];
    var BRIDGE = ["", "Now, what's getting in the way?", "Now let's put a number on it.", "A couple of questions on how ready you are.", "Last step."];
    var S = [
      { id: "goal", c: 0, q: "If you could improve one number this year, what would it be?", o: ["More enquiries converted into clients", "Faster response to customers", "Lower costs", "More capacity without hiring"] },
      { id: "wait", c: 1, q: "Where does work most often wait or slip?", o: ["Replying to enquiries", "Handoffs between people", "Waiting for approvals", "Chasing information"] },
      { id: "task", c: 1, q: "What's one task you wish your team never had to do again?", text: true },
      { id: "owner", c: 1, q: "How much of the day-to-day still runs through you personally?", o: ["Almost everything", "Most decisions and approvals", "Some areas", "Very little"] },
      { id: "away", c: 1, q: "If a key person were away for two weeks, what would happen?", o: ["Things would stop", "Things would slow down", "Mostly fine", "Fully covered"] },
      { id: "cost", c: 2, q: "Roughly how much time goes into repetitive work?", calc: true },
      { id: "docs", c: 3, q: "Are your main processes written down?", o: ["Mostly in people's heads", "Some steps written down, often skipped", "Key workflows documented", "Documented, followed and reviewed"] },
      { id: "lead", c: 3, q: "Is anyone responsible for AI in your business?", o: ["No one", "I am, informally", "A named person with time set aside"] },
      { id: "role", c: 4, q: "Who makes the decision on something like this?", o: ["I decide alone", "I decide with a partner", "Someone else decides"] },
      { id: "when", c: 4, q: "When would you like to act?", o: ["This month", "Within 3 months", "Later this year", "Just exploring"] },
      { id: "invest", c: 4, q: "If the assessment shows clear opportunities, would you invest in fixing them this year?", o: ["Yes, if the numbers make sense", "Possibly", "Not this year"] }
    ];
    var HRS = [["0–5 hours", 2.5], ["5–10 hours", 7.5], ["10–20 hours", 15], ["20+ hours", 25]];
    var PPL = [["1 person", 1], ["2–3 people", 2.5], ["4–10 people", 7], ["10+ people", 12]];
    var RATE = { CAD: 35, USD: 25 };
    var WEEKS = 48;
    var A = {}, idx = 0;
    var calc = { h: null, p: null, cur: "CAD", rate: RATE.CAD };
    var body = quiz.querySelector(".quiz-body"), bar = quiz.querySelector(".progress span"), count = quiz.querySelector(".q-count");
    var chaps = quiz.querySelectorAll(".q-chapters li");
    var prev = quiz.querySelector("#q-prev"), next = quiz.querySelector("#q-next"), nav = quiz.querySelector(".quiz-nav");
    function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }
    function money(n, cur) { var v = (Math.round(n / 100) * 100).toLocaleString("en-CA"); return (cur === "USD" ? "US$" : "CA$") + v; }
    function calcVals() {
      if (calc.h === null || calc.p === null) return null;
      var hrs = HRS[calc.h][1] * PPL[calc.p][1];
      var rate = Number(calc.rate) > 0 ? Number(calc.rate) : RATE[calc.cur];
      return { hrs: Math.round(hrs), yr: hrs * rate * WEEKS };
    }
    function calcLine() {
      var v = calcVals();
      if (!v) return "Choose hours and people to see your estimate.";
      return "Your team spends about " + v.hrs + " hours a week on repetitive work: roughly " + money(v.yr, calc.cur) + " a year in time.";
    }
    function answered(st) {
      if (st.text) return true;
      if (st.calc) return calc.h !== null && calc.p !== null;
      return A[st.id] !== undefined;
    }
    function setChapter(c) {
      chaps.forEach(function (li, i) { li.classList.toggle("on", i === c); li.classList.toggle("done", i < c); });
      count.textContent = "Chapter " + (c + 1) + " of 5 · " + CH[c];
    }
    function radios(name, opts, sel) {
      return '<fieldset class="opts" aria-labelledby="q-label">' + opts.map(function (txt, i) {
        var id = name + i;
        return '<label class="opt" for="' + id + '"><input type="radio" name="' + name + '" id="' + id + '" value="' + i + '"' + (sel === i ? " checked" : "") + "><span>" + txt + "</span></label>";
      }).join("") + "</fieldset>";
    }
    function render() {
      var st = S[idx];
      setChapter(st.c);
      bar.style.width = (idx / S.length * 100) + "%";
      var first = idx === 0 || S[idx - 1].c !== st.c;
      var h = (first && BRIDGE[st.c] ? '<p class="q-bridge">' + BRIDGE[st.c] + "</p>" : "") +
        '<p class="q-dim">' + CH[st.c] + '</p><p class="q-text" id="q-label">' + st.q + "</p>";
      if (st.text) {
        h += '<label class="zc-sr" for="q-task">Your answer (optional)</label><textarea id="q-task" class="q-free" maxlength="200" placeholder="Optional. For example: retyping booking details into two systems">' + esc(A.task || "") + '</textarea><p class="small">Optional. You can skip this.</p>';
      } else if (st.calc) {
        h += '<div class="calc"><p class="calc-k">Hours per week one person spends on repetitive tasks</p><div class="calc-row" data-k="h">' +
          HRS.map(function (x, i) { return '<button type="button" data-i="' + i + '" aria-pressed="' + (calc.h === i) + '">' + x[0] + "</button>"; }).join("") + "</div>" +
          '<p class="calc-k">Number of people doing it</p><div class="calc-row" data-k="p">' +
          PPL.map(function (x, i) { return '<button type="button" data-i="' + i + '" aria-pressed="' + (calc.p === i) + '">' + x[0] + "</button>"; }).join("") + "</div>" +
          '<div class="calc-rate"><label for="q-rate">Average hourly cost <span class="small">(optional, change it)</span></label><div class="calc-rate-in"><select id="q-cur" aria-label="Currency"><option' + (calc.cur === "CAD" ? " selected" : "") + '>CAD</option><option' + (calc.cur === "USD" ? " selected" : "") + '>USD</option></select><input id="q-rate" type="number" min="1" step="1" inputmode="numeric" value="' + calc.rate + '"></div></div>' +
          '<p class="calc-out" id="calc-out" aria-live="polite"></p><p class="small">Your estimate, not a promise of savings. Based on ' + WEEKS + ' working weeks a year.</p></div>';
      } else {
        h += radios("q" + idx, st.o, A[st.id]);
      }
      body.innerHTML = h;
      prev.disabled = idx === 0;
      next.disabled = !answered(st);
      next.textContent = idx === S.length - 1 ? "See my result" : (st.text && !A.task ? "Skip" : "Next");
      if (st.text) {
        var ta = body.querySelector("#q-task");
        ta.addEventListener("input", function () { A.task = ta.value.trim(); next.textContent = A.task ? "Next" : "Skip"; });
      } else if (st.calc) {
        var out = body.querySelector("#calc-out");
        out.textContent = calcLine();
        body.querySelectorAll(".calc-row").forEach(function (row) {
          row.addEventListener("click", function (e) {
            var b = e.target.closest("button"); if (!b) return;
            calc[row.getAttribute("data-k")] = Number(b.getAttribute("data-i"));
            row.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
            out.textContent = calcLine(); next.disabled = !answered(st);
          });
        });
        var cur = body.querySelector("#q-cur"), rate = body.querySelector("#q-rate");
        cur.addEventListener("change", function () { calc.cur = cur.value; calc.rate = RATE[calc.cur]; rate.value = calc.rate; out.textContent = calcLine(); });
        rate.addEventListener("input", function () { calc.rate = rate.value; out.textContent = calcLine(); });
      } else {
        body.querySelectorAll("input").forEach(function (inp) {
          inp.addEventListener("change", function () { A[st.id] = Number(inp.value); next.disabled = false; });
        });
      }
    }
    var FIX = {
      owner: "Take routine decisions off your desk. Write down who can approve what, so work doesn't wait for you.",
      away: "Reduce single points of failure. Capture how your key people do their most important tasks.",
      docs: "Write down your top three workflows as they really happen. AI can't improve a process nobody can describe.",
      lead: "Name one person responsible for AI, with a little time set aside each week."
    };
    var WAITFIX = ["Speed up first replies to enquiries, so fewer leads go cold.", "Smooth the handoffs between people, where work most often stalls.",
      "Shorten approval loops with clear limits on who can approve what.", "Put the information your team chases in one place they can search."];
    function result() {
      var sc = { owner: A.owner, away: A.away, docs: A.docs, lead: A.lead === 2 ? 3 : A.lead === 1 ? 1 : 0 };
      var total = sc.owner + sc.away + sc.docs + sc.lead;
      var band, text;
      if (total <= 4) { band = "Foundations first"; text = "Too much still depends on a few people and on knowledge in their heads. Adding AI tools now would likely automate the confusion. A few basics come first, and they pay off quickly."; }
      else if (total <= 8) { band = "Ready for a first pilot"; text = "You have enough in place to start with one well-chosen workflow. The key is picking the right one, so the first result is visible and worth building on."; }
      else { band = "Ready to build"; text = "Your processes and ownership look ready for practical AI tools. The value now is in choosing where to start and keeping people in control."; }
      var weakest = ["owner", "away", "docs", "lead"].sort(function (a, b) { return sc[a] - sc[b]; });
      var notes = [WAITFIX[A.wait], FIX[weakest[0]]];
      var v = calcVals();
      var hot = (A.role === 0 || A.role === 1) && (A.when === 0 || A.when === 1) && A.invest === 0;
      bar.style.width = "100%"; count.textContent = "Your result";
      chaps.forEach(function (li) { li.classList.remove("on"); li.classList.add("done"); });
      nav.hidden = true;
      var h = '<div class="result" aria-live="polite"><p class="q-dim">Your readiness</p><p class="band-name">' + band + '</p><p class="prose">' + text + "</p>";
      if (v) h += '<div class="r-cost"><span>What repetitive work may be costing you</span><b>' + money(v.yr, calc.cur) + ' a year</b><p>About ' + v.hrs + ' hours a week across your team. Your estimate, not a promise of savings.</p><p>At your estimate, six more months like this is about ' + money(v.yr / 2, calc.cur) + ' in time.</p></div>';
      h += '<div class="r-fix"><p class="q-dim">Fix first</p><ol><li>' + notes[0] + "</li><li>" + notes[1] + "</li></ol></div>";
      if (A.task) h += '<p class="small">You said you\'d like your team to stop: “' + esc(A.task) + '”. That\'s a good place to start the conversation.</p>';
      if (hot) {
        h += '<div class="r-cta hot"><p><strong>You\'re ready to act.</strong> Book a 15-minute fit call and we\'ll tell you honestly whether the AI Assessment is the right next step for your business.</p><div class="cta-row"><a class="btn btn-gold" href="contact.html#book">Book a Fit Call</a><button type="button" class="btn btn-ghost" id="q-restart">Start again</button></div></div>';
      } else {
        h += '<div class="r-cta"><p>Want to talk it through? A 15-minute fit call costs nothing and comes with no obligation.</p><div class="cta-row"><a class="btn btn-gold" href="contact.html#book">Book a Fit Call</a><button type="button" class="btn btn-ghost" id="q-restart">Start again</button></div></div>';
      }
      h += '<p class="small">An indicative check, not an assessment. Nothing has been sent. If you book a fit call, your result is attached to your enquiry so we can prepare; you can remove it before sending.</p></div>';
      try {
        var G = ["More enquiries converted", "Faster response to customers", "Lower costs", "More capacity without hiring"];
        var WT = ["Replying to enquiries", "Handoffs between people", "Approvals", "Chasing information"];
        var RL = ["I decide alone", "I decide with a partner", "Someone else decides"], WH = ["This month", "Within 3 months", "Later this year", "Just exploring"], IV = ["Yes, if the numbers make sense", "Possibly", "Not this year"];
        var summary = "Readiness: " + band +
          (v ? " | Repetitive work: ~" + v.hrs + " h/week, " + money(v.yr, calc.cur) + "/year" : "") +
          " | Goal: " + G[A.goal] + " | Work slips at: " + WT[A.wait] +
          " | Decides: " + RL[A.role] + " | Timing: " + WH[A.when] + " | Invest this year: " + IV[A.invest] +
          (A.task ? " | Wants to stop: " + A.task : "");
        sessionStorage.setItem("zx-check", JSON.stringify({ summary: summary, short: band + (v ? " · ~" + money(v.yr, calc.cur) + "/year in repetitive work" : "") }));
      } catch (err) {}
      body.innerHTML = h;
      document.getElementById("q-restart").addEventListener("click", function () {
        A = {}; idx = 0; calc = { h: null, p: null, cur: "CAD", rate: RATE.CAD }; nav.hidden = false; render();
      });
    }
    prev.addEventListener("click", function () { if (idx > 0) { idx--; render(); } });
    next.addEventListener("click", function () {
      if (!answered(S[idx])) return;
      if (idx < S.length - 1) { idx++; render(); } else { result(); }
    });
    render();
  }

  /* ---------- Agentic workflow simulator ---------- */
  var sim = document.getElementById("sim");
  if (sim) {
    var WF = [
      [
        ["trigger", "Enquiry", "TRIGGER", "New enquiry arrives from the website contact form."],
        ["agent", "Understand", "AGENT", "Reads the message: 12-person service firm, wants less manual scheduling."],
        ["tool", "CRM", "CRM", "No existing record found. New contact created with the enquiry attached."],
        ["agent", "Qualify", "AGENT", "Scores fit against the criteria the business defined: good fit, medium urgency."],
        ["human", "Approve", "OWNER", "Drafted follow-up email is waiting for approval.", "Review the drafted follow-up email"],
        ["action", "Follow up", "ACTION", "Email sent with two call times. CRM updated with notes and next step."]
      ],
      [
        ["trigger", "Question", "TRIGGER", "Customer asks to move a booking and get a refund."],
        ["agent", "Classify", "AGENT", "Classifies the request: schedule change plus refund."],
        ["tool", "Knowledge", "KNOWLEDGE", "Retrieves the current cancellation policy from the knowledge base."],
        ["guard", "Check", "RULE", "Refund is outside the policy window. Outside the agent's authority."],
        ["human", "Escalate", "MANAGER", "Escalated with a summary, the policy clause and a suggested reply.", "Decide on the refund exception"],
        ["action", "Respond", "ACTION", "Manager's decision sent to the customer. Conversation logged."]
      ],
      [
        ["trigger", "Received", "TRIGGER", "Supplier invoice arrives by email as a PDF."],
        ["agent", "Extract", "AGENT", "Extracts supplier, amount, due date and line items."],
        ["tool", "Match", "ACCOUNTS", "Compares the invoice with the purchase order on file."],
        ["guard", "Flag", "RULE", "Amount is higher than the purchase order. Flagged for review."],
        ["human", "Review", "FINANCE", "Variance summary prepared for the finance lead.", "Approve the variance or return to supplier"],
        ["action", "Post", "ACTION", "Invoice queued for payment. Variance noted on the record."]
      ],
      [
        ["trigger", "Request", "TRIGGER", "Client asks to move tomorrow's appointment."],
        ["agent", "Interpret", "AGENT", "Identifies the appointment, the location and the client's preferred times."],
        ["tool", "Calendar", "CALENDAR", "Checks staff availability across both locations. Two slots open."],
        ["guard", "Rule", "RULE", "Change is within 24 hours. Business rule requires staff sign-off."],
        ["human", "Confirm", "STAFF", "Staff member asked to confirm the new time.", "Confirm the rescheduled appointment"],
        ["action", "Update", "ACTION", "Booking moved, confirmation sent and reminder rescheduled."]
      ]
    ];
    var tabs = sim.querySelectorAll(".sim-tabs button");
    var track = document.getElementById("sim-track");
    var log = document.getElementById("sim-log");
    var gate = document.getElementById("sim-gate");
    var gateT = document.getElementById("sim-gate-t");
    var gateBar = gate.querySelector(".sim-gate-bar");
    var stEl = document.getElementById("sim-status");
    var cur = 0, run = 0, gateResolve = null, gateTimer = null, revised = false;
    var GLYPH = { trigger: "IN", agent: "AI", tool: "SYS", guard: "!", human: "YOU", action: "OUT" };

    function status(cls, txt) { stEl.className = "sim-status " + cls; stEl.querySelector("span").textContent = txt; }
    function stamp(i) { var s = i * 2 + 1; return "00:" + (s < 10 ? "0" : "") + s; }
    function buildTrack(w) {
      track.innerHTML = WF[w].map(function (s) {
        return '<li class="st k-' + s[0] + '"><span class="dot">' + GLYPH[s[0]] + '</span><span class="lbl">' + s[1] + "</span></li>";
      }).join("");
      track.style.setProperty("--p", 0);
    }
    function addLine(kind, who, text, ts, typed, myRun) {
      var el = document.createElement("div");
      el.className = "ln k-" + kind;
      el.innerHTML = '<span class="ts">' + ts + '</span><span class="who">' + who + '</span><span class="tx"></span>';
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      var tx = el.querySelector(".tx");
      if (!typed) { tx.textContent = text; return Promise.resolve(); }
      return new Promise(function (res) {
        var i = 0;
        (function type() {
          if (myRun !== run) return res();
          i = Math.min(text.length, i + 3);
          tx.innerHTML = "";
          tx.appendChild(document.createTextNode(text.slice(0, i)));
          if (i < text.length) { var c = document.createElement("span"); c.className = "cur"; tx.appendChild(c); setTimeout(type, 18); }
          else res();
        })();
      });
    }
    function wait(ms, myRun) { return new Promise(function (r) { setTimeout(function () { r(myRun === run); }, ms); }); }
    function setStep(i, total) {
      var lis = track.children;
      for (var k = 0; k < lis.length; k++) {
        lis[k].classList.toggle("done", k < i);
        lis[k].classList.toggle("on", k === i);
      }
      track.style.setProperty("--p", Math.max(0, Math.min(1, i / (total - 1))));
    }
    function openGate(text, myRun) {
      gateT.textContent = text; gate.hidden = false;
      gateBar.classList.remove("go"); void gateBar.offsetWidth;
      gateBar.style.setProperty("--t", "7s"); gateBar.classList.add("go");
      return new Promise(function (res) {
        gateResolve = function (choice) { clearTimeout(gateTimer); gate.hidden = true; gateResolve = null; res(choice); };
        gateTimer = setTimeout(function () { if (gateResolve && myRun === run) gateResolve("auto"); }, 7000);
      });
    }
    function showComplete(w) {
      run++; buildTrack(w); log.innerHTML = ""; gate.hidden = true;
      var steps = WF[w];
      steps.forEach(function (s, i) { addLine(s[0], s[2], s[3], stamp(i), false); if (s[0] === "human") addLine("human", s[2], "Approved.", stamp(i) , false); });
      addLine("done", "DONE", "Workflow complete. Every step recorded.", stamp(steps.length), false);
      setStep(steps.length, steps.length);
      status("done", "Complete");
    }
    async function play(w) {
      var myRun = ++run; cur = w; revised = false;
      buildTrack(w); log.innerHTML = ""; gate.hidden = true; clearTimeout(gateTimer);
      var steps = WF[w];
      status("run", "Running");
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        setStep(i, steps.length);
        if (!(await wait(i === 0 ? 300 : 650, myRun))) return;
        await addLine(s[0], s[2], s[3], stamp(i), true, myRun);
        if (myRun !== run) return;
        if (s[0] === "human") {
          status("wait", "Waiting for a person");
          var choice = await openGate(s[4], myRun);
          if (myRun !== run) return;
          if (choice === "revise") {
            await addLine("human", s[2], "Sent back with a note: make it shorter.", stamp(i), true, myRun);
            if (!(await wait(500, myRun))) return;
            await addLine("agent", "AGENT", "Revised and resubmitted for approval.", stamp(i), true, myRun);
            status("wait", "Waiting for a person");
            choice = await openGate(s[4], myRun);
            if (myRun !== run) return;
          }
          await addLine("human", s[2], choice === "auto" ? "Approved (demo auto-approval)." : "Approved.", stamp(i), true, myRun);
          status("run", "Running");
        }
      }
      if (!(await wait(500, myRun))) return;
      setStep(steps.length, steps.length);
      await addLine("done", "DONE", "Workflow complete. Every step recorded.", stamp(steps.length), true, myRun);
      status("done", "Complete");
    }
    function select(w, animate) {
      tabs.forEach(function (b, i) { b.setAttribute("aria-selected", i === w ? "true" : "false"); });
      cur = w;
      if (animate && !reduce) play(w); else showComplete(w);
    }
    tabs.forEach(function (b) { b.addEventListener("click", function () { select(Number(b.dataset.w), true); }); });
    document.getElementById("sim-replay").addEventListener("click", function () { select(cur, true); });
    document.getElementById("sim-approve").addEventListener("click", function () { if (gateResolve) gateResolve("approve"); });
    document.getElementById("sim-revise").addEventListener("click", function () { if (gateResolve) gateResolve("revise"); });
    showComplete(0);
    if (!reduce && window.IntersectionObserver) {
      var seen = false;
      new IntersectionObserver(function (en, ob) {
        en.forEach(function (x) { if (x.isIntersecting && !seen) { seen = true; ob.disconnect(); play(0); } });
      }, { threshold: 0.35 }).observe(sim);
    }
  }

  /* ---------- Agent anatomy loop ---------- */
  var anat = document.getElementById("anat-svg");
  if (anat) {
    var sts = anat.querySelectorAll(".anat-st");
    var items = document.querySelectorAll(".anat-list li");
    var last = -1;
    function mark(i) {
      if (i === last) return; last = i;
      sts.forEach(function (g, k) { g.classList.toggle("on", k === i); });
      items.forEach(function (li, k) { li.classList.toggle("on", k === i); });
    }
    if (reduce) { if (anat.pauseAnimations) anat.pauseAnimations(); mark(0); }
    else {
      (function loop() {
        var t = anat.getCurrentTime ? anat.getCurrentTime() : 0;
        mark(Math.floor(((t % 8) / 2) + 0.5) % 4);
        requestAnimationFrame(loop);
      })();
    }
  }

  /* ---------- Scroll reveal (only below the first screen) ---------- */
  if (!reduce && window.IntersectionObserver) {
    var sel = ".assess, .ladder li, .band-head, .problems li, .pull, .vpa-step, .answers, .contrast, .sim, .examples li, .cap, .compare-col, .closing, .who > div, .ready-band, .faq > div, .final > *, .steps3 li, .anat-fig, .anat-list, .bounds li, .table-wrap, .principles li, .qa section, .svc, .founder";
    var els = Array.prototype.slice.call(document.querySelectorAll(sel));
    var vh = window.innerHeight || 800;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.remove("pre"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--d", Math.min(sib, 5) * 0.07 + "s");
      el.classList.add("rv", "pre");
      io.observe(el);
    });
  }

  /* ---------- Page visuals (services, how we work) ---------- */
  var uid = 0;
  var VIZ = {
    opps: function () {
      var pts = [[.18,.30],[.30,.55],[.42,.22],[.25,.78],[.55,.40],[.62,.18],[.38,.66],[.48,.58],[.70,.35],[.80,.82,1],[.66,.74,2],[.86,.64,3]];
      var X = function (v) { return 60 + v * 330; }, Y = function (v) { return 240 - v * 210; };
      var h = '<svg viewBox="0 0 420 280" role="img" aria-label="Opportunity map: workflows plotted by business value and ease of delivery, with the top three highlighted as priorities.">' +
        '<rect x="' + X(.6) + '" y="' + Y(1) + '" width="' + (X(1) - X(.6)) + '" height="' + (Y(.55) - Y(1)) + '" rx="10" class="zone"/>' +
        '<text x="' + (X(1) - 8) + '" y="' + (Y(1) + 18) + '" text-anchor="end" class="lab g">PRIORITY</text>' +
        '<line x1="60" y1="240" x2="400" y2="240" class="axis"/><line x1="60" y1="240" x2="60" y2="22" class="axis"/>' +
        '<text x="66" y="26" class="lab">VALUE</text><text x="400" y="262" text-anchor="end" class="lab">EASE OF DELIVERY →</text>' +
        '<rect x="60" y="22" width="2" height="218" class="scan"/>';
      pts.forEach(function (p, i) {
        if (p[2]) {
          h += '<g class="pop" style="--i:' + i + '"><circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="15" class="ring"/>' +
            '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="10" class="dot-g"/><text x="' + X(p[0]) + '" y="' + (Y(p[1]) + 4) + '" text-anchor="middle" class="num">' + p[2] + '</text></g>';
        } else {
          h += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="5.5" class="pop dot" style="--i:' + i + '"/>';
        }
      });
      return h + '</svg>';
    },
    blueprint: function () {
      var id = "bp" + (++uid);
      var N = { t: [44, 150, "Trigger"], a: [175, 150, "Agent"], k: [110, 52, "Knowledge"], c: [240, 52, "CRM"], r: [175, 250, "Rules"], h: [300, 150, "Approval"], o: [382, 150, "Outcome"] };
      var E = [["t","a"],["a","k"],["a","c"],["a","r"],["a","h"],["h","o"]];
      var h = '<svg viewBox="0 0 420 290" role="img" aria-label="System design: a trigger reaches an agent that uses knowledge, CRM and business rules, passes an approval point, then produces an outcome.">' +
        '<defs><pattern id="' + id + '" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" class="grid"/></pattern></defs>' +
        '<rect width="420" height="290" fill="url(#' + id + ')"/>';
      E.forEach(function (e, i) {
        var a = N[e[0]], b = N[e[1]];
        h += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="wire draw" style="--i:' + i + '"/>' +
             '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="flow' + (e[1] === "o" || e[0] === "h" ? " g" : "") + '"/>';
      });
      Object.keys(N).forEach(function (k, i) {
        var n = N[k];
        if (k === "h") h += '<g class="pop" style="--i:' + (i + 3) + '"><rect x="' + (n[0] - 13) + '" y="' + (n[1] - 13) + '" width="26" height="26" transform="rotate(45 ' + n[0] + ' ' + n[1] + ')" class="node-g"/></g>';
        else h += '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="' + (k === "a" ? 20 : 12) + '" class="pop ' + (k === "a" ? "node-a" : "node") + '" style="--i:' + (i + 3) + '"/>';
        h += '<text x="' + n[0] + '" y="' + (n[1] + (k === "k" || k === "c" ? -22 : (k === "a" ? 36 : 30))) + '" text-anchor="middle" class="lab' + (k === "h" ? " g" : "") + '">' + n[2] + '</text>';
      });
      return h + '</svg>';
    },
    orch: function () {
      var id = "or" + (++uid);
      var hub = [210, 150], S = [[70, 95, "Sales"], [70, 215, "Support"], [350, 95, "Operations"], [350, 215, "Finance"]];
      var h = '<svg viewBox="0 0 420 280" role="img" aria-label="An orchestrator agent coordinating sales, support, operations and finance agents, with the business owner overseeing it.">';
      h += '<path id="' + id + 'o" d="M210 46 L210 128" class="wire g"/>';
      S.forEach(function (s, i) { h += '<path id="' + id + i + '" d="M' + hub[0] + ' ' + hub[1] + ' L' + s[0] + ' ' + s[1] + '" class="wire"/>'; });
      S.forEach(function (s, i) {
        h += '<circle r="3.5" class="pulse"><animateMotion dur="2.8s" begin="' + (i * .7) + 's" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#' + id + i + '"/></animateMotion></circle>';
        h += '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="13" class="node blink" style="--i:' + i + '"/><text x="' + s[0] + '" y="' + (s[1] + 30) + '" text-anchor="middle" class="lab">' + s[2] + '</text>';
      });
      h += '<circle r="3.5" class="pulse g"><animateMotion dur="3.2s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#' + id + 'o"/></animateMotion></circle>';
      h += '<circle cx="210" cy="150" r="34" class="halo"/><circle cx="210" cy="150" r="22" class="node-a"/><text x="210" y="196" text-anchor="middle" class="lab">Orchestrator</text>';
      h += '<rect x="196" y="22" width="28" height="28" transform="rotate(45 210 36)" class="node-g"/><text x="246" y="41" class="lab g">Owner</text>';
      return h + '</svg>';
    },
    adopt: function () {
      var P = [[110,140],[60,90],[70,200],[160,70],[170,215],[230,130],[240,40],[290,200],[300,95],[350,160],[370,60],[380,230],[200,260],[30,140]];
      var c = P[0], E = [];
      P.forEach(function (p, i) { P.forEach(function (q, j) { if (j > i && Math.hypot(p[0]-q[0], p[1]-q[1]) < 110) E.push([i, j]); }); });
      var h = '<svg viewBox="0 0 420 280" role="img" aria-label="A team network where adoption spreads outward from one confident user.">';
      E.forEach(function (e) { h += '<line x1="' + P[e[0]][0] + '" y1="' + P[e[0]][1] + '" x2="' + P[e[1]][0] + '" y2="' + P[e[1]][1] + '" class="wire"/>'; });
      P.forEach(function (p, i) {
        var d = Math.hypot(p[0]-c[0], p[1]-c[1]) / 300 * 2.6;
        h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === 0 ? 12 : 9) + '" class="person' + (i === 0 ? " champ" : "") + '" style="--d:' + d.toFixed(2) + 's"/>';
      });
      h += '<text x="' + c[0] + '" y="' + (c[1] + 30) + '" text-anchor="middle" class="lab g">Champion</text>';
      return h + '</svg>';
    },
    phases: function () {
      var id = "ph" + (++uid);
      var X = [170, 500, 830], L = ["DIAGNOSE", "DESIGN", "DELIVER"], S = ["Find where value is blocked", "Redesign, then architect", "Build, measure, improve"];
      var h = '<svg viewBox="0 0 1000 170" role="img" aria-label="Three phases in sequence: diagnose, design and deliver, with a loop back for continuous improvement.">' +
        '<path id="' + id + '" d="M110 70 L890 70" class="wire"/>' +
        '<path d="M830 92 C 830 160, 170 160, 170 92" class="wire dashed"/>' +
        '<text x="500" y="160" text-anchor="middle" class="lab">continuous improvement</text>';
      X.forEach(function (x, i) {
        h += '<circle cx="' + x + '" cy="70" r="18" class="st-ph" style="--i:' + i + '"/><text x="' + x + '" y="75" text-anchor="middle" class="num">0' + (i + 1) + '</text>' +
             '<text x="' + x + '" y="34" text-anchor="middle" class="lab big">' + L[i] + '</text><text x="' + x + '" y="114" text-anchor="middle" class="lab">' + S[i] + '</text>';
      });
      h += '<circle r="6" class="pulse g"><animateMotion dur="9s" repeatCount="indefinite"><mpath href="#' + id + '"/></animateMotion></circle>';
      return h + '</svg>';
    },
    gate: function () {
      return '<svg viewBox="0 0 1000 150" role="img" aria-label="Agent actions flowing toward business systems. Routine actions pass the approval gate; high-impact actions stop until a person approves them.">' +
        '<line x1="40" y1="90" x2="960" y2="90" class="wire"/>' +
        '<text x="40" y="128" class="lab">AGENT ACTIONS</text><text x="960" y="128" text-anchor="end" class="lab">BUSINESS SYSTEMS</text>' +
        '<line x1="560" y1="60" x2="560" y2="120" class="post"/><line x1="580" y1="60" x2="580" y2="120" class="post"/>' +
        '<rect x="558" y="18" width="24" height="24" transform="rotate(45 570 30)" class="node-g gate-p"/>' +
        '<text x="600" y="36" class="lab g">Human approval</text>' +
        '<g class="tokens"></g><text x="570" y="66" text-anchor="middle" class="ok" opacity="0">✓</text></svg>';
    }
  };

  function startGate(fig) {
    var svg = fig.querySelector("svg"), g = svg.querySelector(".tokens"), ok = svg.querySelector(".ok"), post = svg.querySelector(".gate-p");
    var NS = "http://www.w3.org/2000/svg";
    var seq = [0, 0, 1, 0, 1, 0, 0, 1], k = 0, toks = [], last = 0, hold = null, running = false, raf2 = null;
    function spawn() {
      var c = document.createElementNS(NS, "circle");
      var high = seq[k++ % seq.length] === 1;
      c.setAttribute("r", high ? 8 : 6); c.setAttribute("cy", 90);
      c.setAttribute("class", high ? "tok g" : "tok");
      g.appendChild(c); toks.push({ el: c, x: 40, high: high, waited: false });
    }
    if (reduce) {
      [[200, 0], [380, 0], [548, 1], [760, 0]].forEach(function (t) {
        var c = document.createElementNS(NS, "circle");
        c.setAttribute("r", t[1] ? 8 : 6); c.setAttribute("cy", 90); c.setAttribute("cx", t[0]);
        c.setAttribute("class", t[1] ? "tok g" : "tok"); g.appendChild(c);
      });
      return;
    }
    function step(ts) {
      if (!running) return;
      if (ts - last > 1100) { spawn(); last = ts; }
      var blocked = false;
      toks.forEach(function (t) {
        if (t.high && !t.waited && t.x >= 548) {
          t.x = 548;
          if (!hold) { hold = ts; post.classList.add("on"); }
          if (ts - hold > 1500) { ok.setAttribute("opacity", "1"); }
          if (ts - hold > 2100) { t.waited = true; hold = null; post.classList.remove("on"); ok.setAttribute("opacity", "0"); }
          blocked = true;
        }
      });
      toks.forEach(function (t, i) {
        if (t.high && !t.waited && t.x >= 548) return;
        var ahead = toks[i - 1];
        var next = t.x + 2.2;
        if (ahead && ahead.x - next < 26) next = ahead.x - 26;
        t.x = Math.max(t.x, next);
        t.el.setAttribute("cx", t.x);
        t.el.setAttribute("opacity", t.x > 920 ? Math.max(0, (960 - t.x) / 40) : 1);
      });
      toks = toks.filter(function (t) { if (t.x > 960) { t.el.remove(); return false; } return true; });
      raf2 = requestAnimationFrame(step);
    }
    return {
      on: function () { if (!running) { running = true; raf2 = requestAnimationFrame(step); } },
      off: function () { running = false; if (raf2) cancelAnimationFrame(raf2); }
    };
  }

  document.querySelectorAll(".viz[data-viz]").forEach(function (fig) {
    var make = VIZ[fig.getAttribute("data-viz")];
    if (!make) return;
    fig.insertAdjacentHTML("afterbegin", make());
    var svg = fig.querySelector("svg");
    var ctl = fig.getAttribute("data-viz") === "gate" ? startGate(fig) : null;
    if (reduce) { if (svg.pauseAnimations) svg.pauseAnimations(); return; }
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) { fig.classList.add("play"); if (ctl) ctl.on(); }
          else if (ctl) ctl.off();
        });
      }, { threshold: 0.2 }).observe(fig);
    } else { fig.classList.add("play"); if (ctl) ctl.on(); }
  });

  /* ---------- Approach finder ---------- */
  var finder = document.getElementById("finder");
  if (finder) {
    var FQ = [
      { k: "human", q: "Is the work rare, sensitive or dependent on personal trust?", on: true, res: 0 },
      { k: "defined", q: "Is the process clearly defined and done the same way each time?", on: false, res: 1 },
      { k: "fixed", q: "Are the steps fixed and rule-based, with predictable inputs?", on: true, res: 2 },
      { k: "assist", q: "Should a person make every decision, with AI only drafting or finding information?", on: true, res: 3 },
      { k: "multi", q: "Does it coordinate several systems and decisions from start to finish?", on: true, res: 5, off: 4 }
    ];
    var RES = [
      ["Human-led process", "The work depends on judgment or trust. Keep it with people and clarify who owns each step."],
      ["Process redesign", "The steps aren't stable yet. Fix the process first; automating it now would lock in the problems."],
      ["Workflow automation", "Fixed, predictable steps. Connecting tools and automating hand-offs is cheaper and more reliable than AI."],
      ["AI assistant", "AI drafts, summarizes and finds information. A person decides what happens next."],
      ["AI agent", "Varied inputs need interpretation across several steps. The agent acts within limits, with approvals and escalation."],
      ["Agentic workflow", "Several systems and decisions need coordinating end to end. Agents and automation work together under human oversight."]
    ];
    var EX = { human: false, defined: true, fixed: false, assist: false, multi: false };
    var ans = Object.assign({}, EX);
    var list = document.getElementById("finder-list");
    var ladder = document.getElementById("finder-ladder");
    ladder.innerHTML = RES.map(function (r, i) { return '<span data-r="' + i + '">' + r[0] + "</span>"; }).join("") + '<i class="finder-ind"></i>';
    list.innerHTML = FQ.map(function (q, i) {
      return '<li data-k="' + q.k + '"><span class="fq">' + q.q + '</span><span class="fyn" role="group" aria-label="Answer">' +
        '<button type="button" data-v="1">Yes</button><button type="button" data-v="0">No</button></span><span class="fskip">Not needed</span></li>';
    }).join("");
    function evaluate() {
      var hit = -1, res = 4;
      for (var i = 0; i < FQ.length; i++) {
        var q = FQ[i], v = ans[q.k];
        if (i === FQ.length - 1) { hit = i; res = v ? q.res : q.off; break; }
        if (v === q.on) { hit = i; res = q.res; break; }
      }
      return { hit: hit, res: res };
    }
    function render() {
      var r = evaluate();
      list.querySelectorAll("li").forEach(function (li, i) {
        var k = li.getAttribute("data-k");
        li.classList.toggle("hit", i === r.hit);
        li.classList.toggle("skip", i > r.hit);
        li.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(ans[k]) === (b.dataset.v === "1" ? "true" : "false") ? "true" : "false"); });
      });
      document.getElementById("finder-name").textContent = RES[r.res][0];
      document.getElementById("finder-why").textContent = RES[r.res][1];
      var spans = ladder.querySelectorAll("span");
      spans.forEach(function (s, i) { s.classList.toggle("on", i === r.res); });
      var on = spans[r.res], ind = ladder.querySelector(".finder-ind");
      if (on) { ind.style.width = on.offsetWidth + "px"; ind.style.transform = "translateX(" + on.offsetLeft + "px)"; }
      var out = finder.querySelector(".finder-out");
      out.classList.remove("flash"); void out.offsetWidth; out.classList.add("flash");
      document.getElementById("finder-ex").textContent = JSON.stringify(ans) === JSON.stringify(EX) ? "Example: handling customer inquiries" : "Your answers";
    }
    list.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var k = b.closest("li").getAttribute("data-k");
      ans[k] = b.dataset.v === "1"; render();
    });
    document.getElementById("finder-reset").addEventListener("click", function () { ans = Object.assign({}, EX); render(); });
    render();
    window.addEventListener("resize", render);
  }

  /* ---------- Booking time picker ---------- */
  var picker = document.getElementById("picker");
  if (picker) {
    var daysEl = document.getElementById("picker-days"), sumEl = document.getElementById("picker-sum");
    var selDay = null, selWin = null, d = new Date(), out = [];
    while (out.length < 8) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d)); }
    daysEl.innerHTML = out.map(function (x) {
      var wd = x.toLocaleDateString("en-CA", { weekday: "short" }), md = x.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
      return '<button type="button" data-day="' + wd + " " + md + '"><b>' + wd + "</b>" + md + "</button>";
    }).join("");
    function upd() {
      sumEl.textContent = selDay && selWin ? selDay + " · " + selWin + " (Toronto time)" : selDay ? selDay + " · choose a time window" : selWin ? selWin + " · choose a day" : "No time selected yet";
      picker.classList.toggle("ready", !!(selDay && selWin));
    }
    picker.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.day) { selDay = b.dataset.day; daysEl.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); }
      if (b.dataset.win) { selWin = b.dataset.win; picker.querySelectorAll("[data-win]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); }
      upd();
    });
    document.getElementById("picker-go").addEventListener("click", function () {
      var chip = document.getElementById("pref-chip"), hid = document.getElementById("f-pref");
      if (selDay && selWin) { hid.value = selDay + ", " + selWin + " (Toronto)"; chip.textContent = "Preferred time: " + hid.value; chip.hidden = false; }
      setTimeout(function () { var f = document.getElementById("f-name"); if (f) f.focus({ preventScroll: true }); }, 400);
    });
    upd();
  }

  /* ---------- Attach AI check result + route enquiries ---------- */
  var chip = document.getElementById("check-chip");
  if (chip) {
    try {
      var saved = JSON.parse(sessionStorage.getItem("zx-check") || "null");
      if (saved && saved.summary) {
        document.getElementById("f-check").value = saved.summary;
        document.getElementById("check-chip-t").textContent = "Your AI check result is attached: " + saved.short;
        chip.hidden = false;
        document.getElementById("check-chip-x").addEventListener("click", function () {
          document.getElementById("f-check").value = ""; chip.hidden = true;
          try { sessionStorage.removeItem("zx-check"); } catch (e) {}
        });
      }
    } catch (e) {}
  }
  var want = document.getElementById("f-want");
  if (want) {
    var note = document.getElementById("want-note");
    want.addEventListener("change", function () {
      var v = want.selectedIndex;
      if (v === 3) { note.hidden = false; note.innerHTML = 'We focus on helping businesses improve how they run. For personal AI learning, we can share training options by email instead of a call.'; }
      else if (v === 4) { note.hidden = false; note.innerHTML = 'No problem. The <a href="ai-readiness.html">3-minute AI check</a> is a good place to start. Book a call whenever you\'re ready to act.'; }
      else { note.hidden = true; }
    });
    try {
      if (/[?&]topic=training\b/.test(location.search)) {
        want.selectedIndex = 2;
        want.dispatchEvent(new Event("change"));
      }
    } catch (e) {}
  }

  /* ---------- Qualification form ---------- */
  var form = document.getElementById("qual-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var msg = document.getElementById("form-msg");
      if (!form.checkValidity()) {
        msg.className = "form-msg err"; msg.hidden = false;
        msg.textContent = "Please complete the required fields marked with an asterisk, then send again.";
        var first = form.querySelector(":invalid"); if (first) first.focus();
        return;
      }
      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        msg.className = "form-msg err"; msg.hidden = false;
        msg.textContent = "This preview form is not connected yet, so nothing was sent.";
        return;
      }
      msg.className = "form-msg ok"; msg.hidden = false; msg.textContent = "Sending…";
      fetch(endpoint, { method: "POST", body: new URLSearchParams(new FormData(form)) })
        .then(function (r) {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then(function (d) {
          if (!d || !d.ok) throw new Error();
          msg.textContent = "Thank you. We will reply within two business days.";
          form.reset();
        })
        .catch(function () {
          msg.className = "form-msg err";
          msg.textContent = "Your message could not be sent. Please try again in a moment.";
        });
    });
  }
})();

/* ---------- Clone Your Brain: documents flowing into one core ---------- */
(function () {
  "use strict";
  var svg = document.getElementById("cf-svg");
  if (!svg) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, a, parent) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; }
  var CORE = { x: 340, y: 110 };
  var glow = el("circle", { cx: CORE.x, cy: CORE.y, r: 46, fill: "rgba(207,174,102,.10)" });
  el("circle", { cx: CORE.x, cy: CORE.y, r: 42, fill: "#0e1a34", stroke: "#ecd49a", "stroke-width": 1.6 });
  var ring = el("circle", { cx: CORE.x, cy: CORE.y, r: 42, fill: "none", stroke: "#ecd49a", "stroke-width": 1.2, opacity: 0 });
  var t1 = el("text", { x: CORE.x, y: CORE.y - 2, "text-anchor": "middle", "class": "cf-core" }); t1.textContent = "COMPANY";
  var t2 = el("text", { x: CORE.x, y: CORE.y + 13, "text-anchor": "middle", "class": "cf-core" }); t2.textContent = "BRAIN";
  // kinds: doc (page with lines), mail (envelope), note (sticky)
  var ITEMS = [["doc", "Policies", 30, 26], ["mail", "Old emails", 22, 98], ["note", "Notes", 40, 170], ["doc", "Price list", 140, 30], ["mail", "Supplier emails", 128, 168], ["note", "How-tos", 150, 100]];
  var items = ITEMS.map(function (it) {
    var g = el("g", {});
    if (it[0] === "doc") { el("rect", { x: -9, y: -12, width: 18, height: 24, rx: 2, fill: "#0e1a34", stroke: "#53c6e0", "stroke-width": 1.3 }, g); [-5, 0, 5].forEach(function (y) { el("line", { x1: -5, y1: y, x2: 5, y2: y, stroke: "#53c6e0", "stroke-opacity": .7 }, g); }); }
    else if (it[0] === "mail") { el("rect", { x: -12, y: -8, width: 24, height: 16, rx: 2, fill: "#0e1a34", stroke: "#53c6e0", "stroke-width": 1.3 }, g); el("path", { d: "M -12,-8 L 0,2 L 12,-8", fill: "none", stroke: "#53c6e0", "stroke-width": 1.2 }, g); }
    else { el("rect", { x: -10, y: -10, width: 20, height: 20, rx: 2, fill: "#0e1a34", stroke: "#cfae66", "stroke-width": 1.3 }, g); el("line", { x1: -5, y1: -2, x2: 5, y2: -2, stroke: "#cfae66" }, g); el("line", { x1: -5, y1: 3, x2: 3, y2: 3, stroke: "#cfae66" }, g); }
    var lab = el("text", { x: 0, y: 26, "text-anchor": "middle", "class": "cf-lab" }, g); lab.textContent = it[1];
    return { g: g, lab: lab, x: it[2] + 20, y: it[3] + 10 };
  });
  var LOOP = 7000;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { v = clamp(v); return v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2; }
  function frame(t) {
    var s = t / 1000, absorbed = 0;
    items.forEach(function (it, k) {
      var st = .4 + k * .55, p = (s - st) / 1.4, e = ease(p);
      var x = it.x + (CORE.x - it.x) * e, y = it.y + (CORE.y - it.y) * e;
      var op = s > 6.3 ? clamp((s - 6.3) / .6) : p < .55 ? 1 : 1 - clamp((p - .55) / .3);
      var sc = 1 - .85 * clamp((p - .4) / .5);
      if (s > 6.3) { x = it.x; y = it.y; sc = 1; }
      if (p >= 1 && s <= 6.3) absorbed++;
      it.g.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ") scale(" + sc.toFixed(3) + ")");
      it.g.setAttribute("opacity", op.toFixed(3));
      it.lab.setAttribute("opacity", s > 6.3 ? 1 : (1 - clamp((p - .25) / .25)).toFixed(3));
    });
    glow.setAttribute("r", (48 + absorbed * 3).toFixed(1));
    glow.setAttribute("fill", "rgba(207,174,102," + (.08 + absorbed * .035).toFixed(3) + ")");
    var rp = (s % 1.2) / 1.2;
    ring.setAttribute("r", (42 + rp * 16).toFixed(1));
    ring.setAttribute("opacity", absorbed ? (.6 * (1 - rp)).toFixed(3) : 0);
  }
  if (reduce) { items.forEach(function (it) { it.g.setAttribute("transform", "translate(" + it.x + "," + it.y + ")"); }); glow.setAttribute("r", 52); glow.setAttribute("fill", "rgba(207,174,102,.22)"); return; }
  var start = null, running = false, raf = 0;
  function tick(now) { if (start === null) start = now; frame((now - start) % LOOP); raf = requestAnimationFrame(tick); }
  frame(0);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(tick); }
      else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); } }); }).observe(svg);
  } else { running = true; raf = requestAnimationFrame(tick); }
})();

/* ---------- Shared motion controller for the "ax" pieces ---------- */
function axRunner(fig, LOOP, frame, onStatic) {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { fig.classList.add("static"); onStatic(); return; }
  var t = 0, last = null, visible = false, paused = false, hover = false, raf = 0;
  var btn = fig.querySelector(".ax-pause");
  function setPaused(v) { paused = v; fig.classList.toggle("paused", paused); if (btn) btn.setAttribute("aria-pressed", paused ? "true" : "false"); }
  if (btn) btn.addEventListener("click", function (e) { e.stopPropagation(); setPaused(!paused); });
  fig.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hover = true; });
  fig.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hover = false; });
  fig.addEventListener("click", function (e) { if (e.target.closest(".ax-pause")) return; if (!matchMedia("(hover: hover)").matches) setPaused(!paused); });
  function tick(now) {
    if (last !== null && !paused && !hover) t = (t + Math.min(now - last, 100)) % LOOP;
    last = now; frame(t); raf = requestAnimationFrame(tick);
  }
  frame(0);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (e.isIntersecting && !visible) { visible = true; last = null; raf = requestAnimationFrame(tick); }
      else if (!e.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); } }); }, { threshold: .15 }).observe(fig);
  } else { raf = requestAnimationFrame(tick); }
}

/* ---------- Clone Your Brain: knowledge becomes a system ---------- */
(function () {
  "use strict";
  var fig = document.getElementById("kflow");
  if (!fig) return;
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, a, parent) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); parent.appendChild(e); return e; }
  var cards = [].slice.call(fig.querySelectorAll(".kf-card")), agents = [].slice.call(fig.querySelectorAll(".kf-agent"));
  var core = fig.querySelector(".kf-core"), graph = fig.querySelector(".kf-graph"), wires = fig.querySelector(".ax-wires");
  var pills = [].slice.call(fig.querySelectorAll(".ax-scenes li"));
  // knowledge graph
  var defs = el("defs", {}, graph);
  var rg = el("radialGradient", { id: "kfcore" }, defs);
  el("stop", { offset: "0", "stop-color": "#ecd49a" }, rg); el("stop", { offset: "1", "stop-color": "#cfae66", "stop-opacity": ".55" }, rg);
  var f = el("filter", { id: "kfblur", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs); el("feGaussianBlur", { stdDeviation: "6" }, f);
  var N = [[100, 32], [158, 58], [172, 120], [128, 168], [62, 166], [28, 112], [46, 52], [134, 92], [68, 88], [100, 140], [100, 100]];
  var E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 7], [1, 7], [2, 7], [6, 8], [5, 8], [3, 9], [4, 9], [7, 10], [8, 10], [9, 10], [0, 8], [2, 9]];
  var eG = el("g", {}, graph), nG = el("g", {}, graph);
  var lines = E.map(function (e) { var a = N[e[0]], b = N[e[1]]; return { e: e, l: el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "#53c6e0", "stroke-width": 1, opacity: 0 }, eG) }; });
  var glow = el("circle", { cx: 100, cy: 100, r: 22, fill: "#cfae66", opacity: 0, filter: "url(#kfblur)" }, nG);
  var pulse = el("circle", { cx: 100, cy: 100, r: 16, fill: "none", stroke: "#ecd49a", "stroke-width": 1, opacity: 0 }, nG);
  var nodes = N.map(function (n, i) {
    var c = i === 10;
    return el("circle", { cx: n[0], cy: n[1], r: c ? 12 : 4.5, fill: c ? "url(#kfcore)" : "#0a1428", stroke: c ? "#ecd49a" : "#53c6e0", "stroke-width": c ? 1.2 : 1.3, opacity: 0 }, nG);
  });
  // wires + particles
  var wsrc = [], wout = [], parts = [];
  function anchor(r, fr, side) {
    var x = r.left - fr.left, y = r.top - fr.top;
    if (side === "r") return [x + r.width, y + r.height / 2];
    if (side === "l") return [x, y + r.height / 2];
    if (side === "b") return [x + r.width / 2, y + r.height];
    if (side === "t") return [x + r.width / 2, y];
    return [x + r.width / 2, y + r.height / 2];
  }
  function curve(a, b, vertical) {
    if (vertical) { var my = (a[1] + b[1]) / 2; return "M" + a[0] + "," + a[1] + " C" + a[0] + "," + my + " " + b[0] + "," + my + " " + b[0] + "," + b[1]; }
    var mx = (a[0] + b[0]) / 2; return "M" + a[0] + "," + a[1] + " C" + mx + "," + a[1] + " " + mx + "," + b[1] + " " + b[0] + "," + b[1];
  }
  function layout() {
    while (wires.firstChild) wires.removeChild(wires.firstChild);
    wsrc = []; wout = []; parts = [];
    var fr = fig.getBoundingClientRect(), gr = graph.getBoundingClientRect();
    var stacked = gr.top > cards[cards.length - 1].getBoundingClientRect().bottom - 2;
    var gc = [gr.left - fr.left + gr.width / 2, gr.top - fr.top + gr.height / 2], rad = gr.width * .36;
    cards.forEach(function (c, i) {
      var a = anchor(c.getBoundingClientRect(), fr, stacked ? "b" : "r");
      var b = stacked ? [gc[0] + (i % 2 ? 1 : -1) * rad * .4, gc[1] - rad] : [gc[0] - rad, gc[1] + (i - 2.5) * rad * .18];
      var p = el("path", { d: curve(a, b, stacked), fill: "none", stroke: "rgba(150,172,222,.22)", "stroke-width": 1 }, wires);
      wsrc.push(p);
      for (var k = 0; k < 2; k++) parts.push({ p: p, kind: "s", i: i, o: k * .5, c: el("circle", { r: 2.2, fill: "#53c6e0", opacity: 0 }, wires) });
    });
    agents.forEach(function (ag, i) {
      var a = stacked ? [gc[0], gc[1] + rad] : [gc[0] + rad, gc[1]];
      var b = anchor(ag.getBoundingClientRect(), fr, stacked ? "t" : "l");
      if (stacked) b[0] = gc[0];
      var p = el("path", { d: curve(a, b, stacked), fill: "none", stroke: "rgba(150,172,222,.22)", "stroke-width": 1 }, wires);
      wout.push(p);
      if (!stacked || i === 0) parts.push({ p: p, kind: "o", i: i, o: 0, c: el("circle", { r: 2.4, fill: "#ecd49a", opacity: 0 }, wires) });
    });
    parts.forEach(function (q) { try { q.len = q.p.getTotalLength(); } catch (e) { q.len = 0; } });
  }
  var lt = 0; window.addEventListener("resize", function () { clearTimeout(lt); lt = setTimeout(function () { layout(); frame(lastT); }, 120); });
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var lastT = 0;
  var AG = [6.2, 7.8, 9.4];
  function frame(ms) {
    lastT = ms; var s = ms / 1000;
    cards.forEach(function (c, i) { c.classList.toggle("on", s >= .2 + i * .35); });
    var shown = 0;
    nodes.forEach(function (n, i) { var at = i === 10 ? 5.3 : 3.0 + i * .22; var v = cl((s - at) / .4); n.setAttribute("opacity", v.toFixed(2)); if (v > 0) shown++; });
    lines.forEach(function (L) { var at = Math.max(L.e[0] === 10 || L.e[1] === 10 ? 5.3 : 0, 3.0 + Math.max(L.e[0] % 10, L.e[1] % 10) * .22); L.l.setAttribute("opacity", (cl((s - at) / .5) * .55).toFixed(2)); });
    var formed = s >= 5.6;
    core.classList.toggle("formed", formed);
    glow.setAttribute("opacity", formed ? (.35 + .2 * Math.sin(s * 2.4)).toFixed(2) : 0);
    var pp = formed ? ((s - 5.6) % 2.2) / 2.2 : 0;
    pulse.setAttribute("r", (14 + pp * 26).toFixed(1)); pulse.setAttribute("opacity", formed ? (.7 * (1 - pp)).toFixed(2) : 0);
    agents.forEach(function (a, i) {
      var t0 = AG[i];
      a.classList.toggle("on", s >= t0); a.classList.toggle("asked", s >= t0 + .3);
      a.classList.toggle("typing", s >= t0 + .7 && s < t0 + 1.4); a.classList.toggle("answered", s >= t0 + 1.4);
      a.classList.toggle("approve", i === 1 && s >= 11.4);
      if (wout[i]) wout[i].setAttribute("stroke", s >= t0 ? "rgba(207,174,102,.55)" : "rgba(150,172,222,.22)");
    });
    core.classList.toggle("locked", s >= 11.8);
    wsrc.forEach(function (w, i) { w.setAttribute("stroke", s >= .2 + i * .35 && s < 5.8 ? "rgba(83,198,224,.45)" : "rgba(150,172,222,.22)"); });
    parts.forEach(function (q) {
      var on, u;
      if (q.kind === "s") { on = s >= .6 + q.i * .35 && s < 5.6; u = ((s * .55 + q.o + q.i * .13) % 1); }
      else { var t0 = AG[q.i]; on = s >= t0 - .3 && s < t0 + 1.2; u = cl((s - t0 + .3) / 1.2); }
      if (!on || !q.len) { q.c.setAttribute("opacity", 0); return; }
      var pt = q.p.getPointAtLength(q.len * u);
      q.c.setAttribute("cx", pt.x.toFixed(1)); q.c.setAttribute("cy", pt.y.toFixed(1));
      q.c.setAttribute("opacity", (Math.sin(Math.PI * u) * .95).toFixed(2));
    });
    var sc = s < 3 ? 1 : s < 6.2 ? 2 : s < 11.3 ? 3 : 4;
    pills.forEach(function (p) { p.classList.toggle("on", +p.getAttribute("data-s") === sc); });
  }
  layout();
  axRunner(fig, 14500, frame, function () {
    frame(13000);
    parts.forEach(function (q) { q.c.setAttribute("opacity", 0); });
    agents.forEach(function (a) { a.classList.remove("typing"); });
  });
})();

/* ---------- Home: how a workflow changes ---------- */
(function () {
  "use strict";
  var fig = document.getElementById("wflow");
  if (!fig) return;
  var scenes = [].slice.call(fig.querySelectorAll(".wf-scene")), caps = [].slice.call(fig.querySelectorAll(".wf-caps li"));
  var last = 0;
  function frame(ms) {
    var s = ms / 1000, n = s < 4.2 ? 1 : s < 9 ? 2 : 3;
    if (n === last) return; last = n;
    scenes.forEach(function (x) { x.classList.toggle("on", +x.getAttribute("data-s") === n); });
    caps.forEach(function (x) { x.classList.toggle("on", +x.getAttribute("data-s") === n); });
  }
  axRunner(fig, 14000, frame, function () { scenes.forEach(function (x) { x.classList.add("on"); }); });
})();

/* ---------- Services: What your Workflow Plan answers (lights up on scroll) ---------- */
(function () {
  "use strict";
  var box = document.getElementById("plan-answers");
  if (!box) return;
  var list = box.querySelector(".pa-list"), steps = [].slice.call(box.querySelectorAll(".pa-step"));
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function fill(n) {
    if (!n) { list.style.setProperty("--pa-fill", "0px"); return; }
    var dot = steps[n - 1].querySelector(".pa-dot"), lr = list.getBoundingClientRect(), dr = dot.getBoundingClientRect();
    list.style.setProperty("--pa-fill", Math.max(0, dr.top + dr.height / 2 - lr.top - 22) + "px");
  }
  if (reduce || !("IntersectionObserver" in window)) {
    box.classList.add("static"); steps.forEach(function (s) { s.classList.add("on"); }); fill(steps.length); return;
  }
  function update() {
    var trigger = window.innerHeight * 0.62, n = 0;
    steps.forEach(function (s, i) { var r = s.getBoundingClientRect(); if (r.top + r.height / 2 < trigger) n = i + 1; });
    steps.forEach(function (s, i) { s.classList.toggle("on", i < n); });
    fill(n);
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

/* ---------- Services: Workflow Plan example (scroll reveal, same style as the plan-answers block) ---------- */
(function () {
  "use strict";
  var box = document.getElementById("sample-maps");
  if (!box) return;
  var steps = [].slice.call(box.querySelectorAll(".sx-step"));
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) { box.classList.add("static"); steps.forEach(function (s) { s.classList.add("on"); }); return; }
  function update() {
    var trigger = window.innerHeight * 0.72;
    steps.forEach(function (s) { var r = s.getBoundingClientRect(); s.classList.toggle("on", r.top + 40 < trigger); });
  }
  var t = false;
  window.addEventListener("scroll", function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; update(); }); } }, { passive: true });
  window.addEventListener("resize", update); update();
})();

/* ---------- Services: "What you get" stacking cards (agentic assembly) ---------- */
(function () {
  "use strict";
  var list = document.getElementById("wp-get");
  if (!list) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; /* keeps the plain 3 x 3 grid */
  list.classList.add("stack");
  var cards = [].slice.call(list.querySelectorAll(".wp-card"));
  function stickTop(c) { return parseFloat(getComputedStyle(c).top) || 0; }
  function update() {
    var vh = window.innerHeight;
    cards.forEach(function (c, i) {
      var r = c.getBoundingClientRect(), st = stickTop(c);
      if (r.top < vh * 0.78) c.classList.add("go");
      if (r.top <= st + 4 || r.top < vh * 0.45) { if (!c._t) c._t = setTimeout(function () { c.classList.add("done"); }, 900); }
      var next = cards[i + 1], t = 0;
      if (next) { var nr = next.getBoundingClientRect(); t = Math.max(0, Math.min(1, (r.bottom - nr.top) / r.height)); }
      var depth = 0; for (var k = i + 1; k < cards.length; k++) { var kr = cards[k].getBoundingClientRect(); if (kr.top <= stickTop(cards[k]) + 2) depth++; }
      var sc = 1 - Math.min(0.12, 0.03 * depth + 0.03 * t);
      c.style.transform = "scale(" + sc.toFixed(4) + ")";
      c.style.filter = t > 0 ? "brightness(" + (1 - 0.15 * Math.min(1, t + depth * 0.2)).toFixed(3) + ")" : "";
    });
  }
  var q = false;
  window.addEventListener("scroll", function () { if (!q) { q = true; requestAnimationFrame(function () { q = false; update(); }); } }, { passive: true });
  window.addEventListener("resize", update); update();
})();
