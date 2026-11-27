// full-text search over the readings: s/idx/<VOL>.json = [[pdf index, printed page, text], ...], loaded on first search
(() => {
  const form = document.getElementById("qform");
  if (!form) return;
  const VOLS = window.QW_VOLS || {}, cache = {};
  const fold = s => s.replace(/ſ/g, "s").replace(/ß/g, "ss").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const load = v => cache[v] || (cache[v] = fetch(`idx/${v}.json`).then(r => r.json()).then(rows =>
    rows.map(([i, n, t]) => ({i, n, t, f: fold(t)}))));
  const res = document.getElementById("qres"), q = document.getElementById("q"), sel = document.getElementById("qvol");
  const terms = s => { const out = []; s.replace(/"([^"]+)"|(\S+)/g, (_, a, b) => out.push(fold(a || b))); return out.filter(Boolean); };
  async function run() {
    const ts = terms(q.value);
    const p = new URLSearchParams(); if (q.value) p.set("q", q.value); if (sel.value) p.set("vol", sel.value);
    history.replaceState(null, "", "?" + p);
    if (!ts.length) { res.innerHTML = ""; return; }
    res.innerHTML = '<p class="meta">lade Texte …</p>';
    const vols = sel.value ? [sel.value] : Object.keys(VOLS);
    let hits = [], total = 0;
    for (const v of vols) {
      for (const r of await load(v)) {
        if (ts.every(t => r.f.includes(t))) { total++; if (hits.length < 300) hits.push([v, r]); }
      }
    }
    const kwic = r => {
      const k = r.f.indexOf(ts[0]), a = Math.max(0, k - 90), b = Math.min(r.t.length, k + ts[0].length + 90);
      // fold() keeps length for nearly all characters of these texts, so positions carry over
      return (a ? "… " : "") + esc(r.t.slice(a, k)) + "<mark>" + esc(r.t.slice(k, k + ts[0].length)) + "</mark>" +
        esc(r.t.slice(k + ts[0].length, b)) + (b < r.t.length ? " …" : "");
    };
    res.innerHTML = `<p class="meta">${total} Seiten${total > hits.length ? `, die ersten ${hits.length} gezeigt` : ""}</p>` +
      '<ul class="hits">' + hits.map(([v, r]) => `<li><div class="src"><a href="../v/${v}/p.html#${r.i}">${esc(VOLS[v])}, S. ${esc(r.n ?? "–")}</a>
        <span class="meta">(PDF-Seite ${r.i + 1})</span></div><div class="kwic">${kwic(r)}</div></li>`).join("") + "</ul>";
  }
  form.addEventListener("submit", ev => { ev.preventDefault(); run(); });
  const p = new URLSearchParams(location.search);
  if (p.get("vol")) sel.value = p.get("vol");
  if (p.get("q")) { q.value = p.get("q"); run(); }
})();
