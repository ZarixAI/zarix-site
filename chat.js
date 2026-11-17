(function () {
  "use strict";
  var KB = window.ZARIX_KB || [];
  if (!KB.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Retrieval over the knowledge base ---------- */
  var STOP = "a an and are as at be but by can do does for from how i if in into is it its me my of on or our so than that the their them then there these this to us was we what when where which who why will with you your about would should could".split(" ");
  var stop = {}; STOP.forEach(function (w) { stop[w] = 1; });
  function toks(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(function (w) { return w && w.length > 1 && !stop[w]; })
      .map(function (w) { return w.length > 4 ? w.replace(/(ies|es|s)$/, "") : w; });
  }
  var DOCS = KB.map(function (d, i) {
    return { i: i, d: d, title: toks(d.t), body: toks(d.a + " " + d.k) };
  });
  var df = {};
  DOCS.forEach(function (x) { var seen = {}; x.title.concat(x.body).forEach(function (w) { if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } }); });
  function search(q, n) {
    var qt = toks(q);
    if (!qt.length) return [];
    if (qt.every(function (w) { return w === "zarix" || w === "ai" || w === "consulting"; })) return [{ s: 9, d: KB[0] }];
    return DOCS.map(function (x) {
      var s = 0;
      qt.forEach(function (w) {
        var idf = Math.log(1 + DOCS.length / (df[w] || 0.5));
        if (x.title.indexOf(w) > -1) s += 2.2 * idf;
        var c = 0; x.body.forEach(function (b) { if (b === w) c++; });
        if (c) s += idf * (1 + Math.log(c));
      });
      return { s: s / Math.sqrt(qt.length), d: x.d };
    }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, n || 3);
  }

  /* ---------- UI ---------- */
  var SUGGEST = ["What does Zarix AI do?", "AI agent vs automation?", "What do I get from the AI Assessment?", "How much does it cost?", "Can you build AI systems for us?"];
  var root = document.createElement("div");
  root.className = "zc";
  root.innerHTML =
    '<button type="button" class="zc-launch" aria-expanded="false" aria-controls="zc-panel" aria-label="Ask Zarix AI"><span class="zc-orb" aria-hidden="true"></span><span class="zc-ll">Ask Zarix AI</span></button>' +
    '<div class="zc-tease" hidden><button type="button" class="zc-tease-x" aria-label="Dismiss">×</button><p>Watch our assistant work. Ask how Zarix AI decides between automation and an AI agent.</p></div>' +
    '<section class="zc-panel" id="zc-panel" role="dialog" aria-label="Zarix AI assistant" hidden>' +
      '<header class="zc-head"><div><p class="zc-name"><span class="zc-orb sm" aria-hidden="true"></span>Zarix AI Assistant</p><p class="zc-sub">Answers only from our knowledge base</p></div>' +
      '<span class="zc-mode">Knowledge base</span><button type="button" class="zc-x" aria-label="Close assistant">×</button></header>' +
      '<div class="zc-body" id="zc-body" aria-live="polite"></div>' +
      '<div class="zc-sugg" id="zc-sugg"></div>' +
      '<form class="zc-form" id="zc-form"><label for="zc-in" class="zc-sr">Your question</label><input id="zc-in" type="text" autocomplete="off" maxlength="300" placeholder="Ask about our services, approach or agentic AI">' +
      '<button type="submit" class="zc-send" aria-label="Send">→</button></form>' +
      '<p class="zc-foot">Automated assistant. It answers only from our published knowledge base and won\'t give advice on your specific situation. Please don\'t share personal information.</p>' +
    '</section>';
  document.body.appendChild(root);
  var launch = root.querySelector(".zc-launch"), panel = root.querySelector(".zc-panel"), body = root.querySelector("#zc-body");
  var form = root.querySelector("#zc-form"), input = root.querySelector("#zc-in"), sugg = root.querySelector("#zc-sugg");
  var tease = root.querySelector(".zc-tease");
  var busy = false;

  sugg.innerHTML = SUGGEST.map(function (s) { return '<button type="button">' + s + "</button>"; }).join("");
  function greet() {
    msg("bot").querySelector(".zc-txt").textContent = "Hello. I answer questions about Zarix AI, how may I help you?";
  }
  function open() {
    panel.hidden = false; launch.setAttribute("aria-expanded", "true"); root.classList.add("on"); tease.hidden = true;
    try { sessionStorage.setItem("zc-seen", "1"); } catch (e) {}
    if (!body.children.length) greet();
    setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
  }
  function close() { panel.hidden = true; launch.setAttribute("aria-expanded", "false"); root.classList.remove("on"); launch.focus(); }
  launch.addEventListener("click", function () { panel.hidden ? open() : close(); });
  root.querySelector(".zc-x").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  root.querySelector(".zc-tease-x").addEventListener("click", function () { tease.hidden = true; try { sessionStorage.setItem("zc-seen", "1"); } catch (e) {} });
  tease.querySelector("p").addEventListener("click", open);
  document.querySelectorAll('[data-open-chat]').forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); open(); }); });
  var seen = false; try { seen = sessionStorage.getItem("zc-seen") === "1"; } catch (e) {}
  function hideTease() { if (!tease.hidden) { tease.hidden = true; try { sessionStorage.setItem("zc-seen", "1"); } catch (e) {} } }
  if (!seen) setTimeout(function () {
    if (!panel.hidden) return;
    tease.hidden = false;
    var y0 = window.scrollY;
    setTimeout(hideTease, 6000);
    window.addEventListener("scroll", function onS() { if (Math.abs(window.scrollY - y0) > 40) { hideTease(); window.removeEventListener("scroll", onS); } }, { passive: true });
  }, 7000);
  /* compact round launcher that sits in the page margin; label shows on hover/focus */
  root.classList.add("mini");

  sugg.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && !busy) ask(b.textContent); });
  form.addEventListener("submit", function (e) { e.preventDefault(); var q = input.value.trim(); if (q && !busy) { input.value = ""; ask(q); } });

  function msg(who, text) {
    var el = document.createElement("div");
    el.className = "zc-msg " + who;
    el.innerHTML = (who === "bot" ? '<ol class="zc-trace"></ol>' : "") + '<p class="zc-txt"></p>' + (who === "bot" ? '<div class="zc-src"></div><div class="zc-act"></div>' : "");
    if (text) el.querySelector(".zc-txt").textContent = text;
    body.appendChild(el); body.scrollTop = body.scrollHeight;
    return el;
  }
  function step(el, kind, text) {
    var li = document.createElement("li");
    li.className = "zc-step " + kind + " run";
    li.innerHTML = '<span class="zc-ic" aria-hidden="true"></span><span></span>';
    li.lastChild.textContent = text;
    el.querySelector(".zc-trace").appendChild(li);
    body.scrollTop = body.scrollHeight;
    return { done: function (t) { li.classList.remove("run"); li.classList.add("ok"); if (t) li.lastChild.textContent = t; } };
  }
  function sources(el, docs) {
    var box = el.querySelector(".zc-src"), seenU = {};
    docs.forEach(function (d) {
      if (seenU[d.t]) return; seenU[d.t] = 1;
      var a = document.createElement("a");
      a.href = d.u; a.textContent = d.t; a.className = "zc-chip";
      box.appendChild(a);
    });
  }
  function offerCall(el) {
    var box = el.querySelector(".zc-act");
    if (box.childNodes.length) return;
    box.innerHTML = '<a class="btn btn-gold btn-sm" href="contact.html#book">Book a 15-minute fit call</a>';
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function typeOut(el, text) {
    var t = el.querySelector(".zc-txt");
    if (reduce) { t.textContent = text; return Promise.resolve(); }
    return new Promise(function (res) {
      var i = 0;
      (function go() {
        i = Math.min(text.length, i + 4); t.textContent = text.slice(0, i); body.scrollTop = body.scrollHeight;
        if (i < text.length) setTimeout(go, 12); else res();
      })();
    });
  }
  function wantsCall(q) { return /book|call|meet|talk|price|pricing|cost|fee|how much|hire|start|help (us|me)|work with|quote|budget/i.test(q); }

  /* ---------- Answer engine: knowledge-base search, runs entirely in the browser ---------- */
  async function askLocal(q, el) {
    var s1 = step(el, "think", "Reading the question");
    await wait(250); s1.done("Intent: " + (toks(q).slice(0, 4).join(" · ") || "general question"));
    var s2 = step(el, "tool", "Searching the knowledge base (" + KB.length + " passages)");
    await wait(350);
    var hits = search(q, 3);
    var good = hits.length && hits[0].s >= 2;
    s2.done(good ? "Found " + Math.min(hits.length, 3) + " relevant passage" + (hits.length > 1 ? "s" : "") + ", best match: " + hits[0].d.t : "No reliable match in the knowledge base");
    var s3 = step(el, "guard", "Checking guardrails");
    await wait(200); s3.done("Guardrails: answer from sources only · no pricing · no personal advice");
    el.classList.remove("typing");
    if (good) {
      await typeOut(el, hits[0].d.a);
      sources(el, hits.filter(function (h, i) { return i === 0 || h.s > hits[0].s * 0.55; }).map(function (h) { return h.d; }));
    } else {
      await typeOut(el, "That isn't covered in our knowledge base, so I won't guess. The quickest way to get a real answer is a 15-minute fit call with a consultant.");
    }
    if (!good || wantsCall(q)) { var s4 = step(el, "act", "Choosing next step"); await wait(300); s4.done("Action: offered a fit call"); offerCall(el); }
  }

  async function ask(q) {
    busy = true; form.classList.add("busy"); sugg.hidden = true;
    msg("user", q);
    var el = msg("bot"); el.classList.add("typing");
    try { await askLocal(q, el); }
    finally { busy = false; form.classList.remove("busy"); }
  }

})();
