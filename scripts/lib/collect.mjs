// Content collectors shared by content-snapshot and scene-audit (PRD 07 §3, invariants C1-C8).

export /** Runs in the page (pass to page.evaluate). Everything returned must be deterministic. */
function collect() {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const roots = [
    ...document.querySelectorAll("header, main > section[id], footer"),
  ].map((el) => ({ el, key: el.id ? `#${el.id}` : el.tagName.toLowerCase() }));
  const textNodes = (root) => {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = norm(n.textContent);
      if (t && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(n.parentElement.tagName)) out.push(t);
    }
    return out;
  };
  const ctrl = (el) => ({
    tag: el.tagName.toLowerCase(),
    text: norm(el.textContent),
    href: el.getAttribute("href"),
    type: el.getAttribute("type"),
    name: el.getAttribute("name"),
    ariaLabel: el.getAttribute("aria-label"),
    placeholder: el.getAttribute("placeholder"),
    required: el.hasAttribute("required"),
    label: el.labels?.[0] ? norm(el.labels[0].textContent) : null,
  });
  const c1 = {}, c2 = {}, c3 = {}, c4 = {}, c8 = {};
  for (const { el, key } of roots) {
    c1[key] = norm(el.innerText);
    c2[key] = [...el.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
      level: +h.tagName[1], text: norm(h.textContent),
    }));
    c3[key] = [...el.querySelectorAll("img")].map((i) => ({
      src: i.getAttribute("src"), alt: i.getAttribute("alt"),
    }));
    c4[key] = [...el.querySelectorAll("a, button, input, textarea, select")].map(ctrl);
    c8[key] = textNodes(el);
  }
  return {
    c1, c2, c3, c4,
    c5: [...document.querySelectorAll("main > section")].map((s) => s.id || null),
    c8,
    keys: roots.map((r) => r.key),
  };
}

/** C6: aria snapshot per header / section[id] / footer, keyed like the other collectors. */
export async function collectAria(page) {
  const c6 = {};
  const sel = ["header", "main > section[id]", "footer"];
  for (const s of sel) {
    const loc = page.locator(s);
    for (let i = 0; i < (await loc.count()); i++) {
      const id = await loc.nth(i).getAttribute("id");
      const key = id ? `#${id}` : s;
      c6[key] = await loc.nth(i).ariaSnapshot();
    }
  }
  return c6;
}
