// Evaluated in the page by capture.sh (`agent-browser eval`). Returns, as JSON,
// every transcript row and text block with its box and computed text style:
// from the DOM for the Web original, from the `<lynx-view>` shadow tree for
// Lynx for Web. Positions are relative to the scroll content.
(() => {
  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  const lynxRoot = document.querySelector("lynx-view")?.shadowRoot ?? null;
  const out = { client: lynxRoot ? "lynx" : "web", rows: [], texts: [], extras: {} };
  const styleOf = (el) => {
    const s = getComputedStyle(el);
    return {
      fs: s.fontSize,
      fw: s.fontWeight,
      color: s.color,
      ff: s.fontFamily.split(",")[0].trim(),
      lh: s.lineHeight,
      td: s.textDecorationLine,
      fst: s.fontStyle,
    };
  };
  if (!lynxRoot) {
    const sc = document.querySelector("[data-chat-scroll-container]");
    if (!sc) return JSON.stringify({ error: "no scroll container" });
    const base = sc.getBoundingClientRect();
    const rel = (r) => ({
      x: Math.round((r.left - base.left) * 10) / 10,
      y: Math.round((r.top - base.top + sc.scrollTop) * 10) / 10,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
    });
    out.extras = {
      scrollHeight: sc.scrollHeight,
      clientHeight: sc.clientHeight,
      containerX: base.left,
      containerW: base.width,
    };
    for (const row of sc.querySelectorAll("[data-timeline-row-kind]")) {
      out.rows.push({
        kind: row.getAttribute("data-timeline-row-kind"),
        role: row.getAttribute("data-message-role"),
        ...rel(row.getBoundingClientRect()),
        text: norm(row.innerText).slice(0, 70),
      });
    }
    const blocks = new Map();
    const walker = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!norm(n.nodeValue)) continue;
      let el = n.parentElement;
      if (!el || el.closest("[aria-hidden='true'],.sr-only,.katex-mathml")) continue;
      const cs0 = getComputedStyle(el);
      if (cs0.visibility === "hidden" || cs0.display === "none") continue;
      let block = el;
      while (
        block &&
        block !== sc &&
        getComputedStyle(block).display.startsWith("inline") &&
        getComputedStyle(block).display === "inline"
      )
        block = block.parentElement;
      const entry = blocks.get(block) ?? { text: "", inl: [] };
      entry.text += n.nodeValue;
      if (el !== block)
        entry.inl.push({ t: norm(n.nodeValue), tag: el.tagName.toLowerCase(), ...styleOf(el) });
      blocks.set(block, entry);
    }
    for (const [block, entry] of blocks) {
      const r = block.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      out.texts.push({
        t: norm(entry.text),
        tag: block.tagName.toLowerCase(),
        ...rel(r),
        ...styleOf(block),
        inl: entry.inl,
      });
    }
    out.extras.images = [...sc.querySelectorAll("img")].map((i) => ({
      alt: i.alt,
      ...rel(i.getBoundingClientRect()),
      ok: i.complete && i.naturalWidth > 0,
    }));
    out.extras.buttons = [...sc.querySelectorAll("button,[role=button],a")]
      .map((b) => ({
        label: norm(b.getAttribute("aria-label") || b.getAttribute("title") || b.innerText).slice(
          0,
          50,
        ),
        ...rel(b.getBoundingClientRect()),
      }))
      .filter((b) => b.w > 0);
    return JSON.stringify(out);
  }
  const all = [...lynxRoot.querySelectorAll("*")];
  const sc = all.find(
    (e) => e.tagName === "X-LIST" && String(e.className).includes("TranscriptList"),
  );
  if (!sc) return JSON.stringify({ error: "no TranscriptList" });
  const base = sc.getBoundingClientRect();
  const rel = (r) => ({
    x: Math.round((r.left - base.left) * 10) / 10,
    y: Math.round((r.top - base.top + sc.scrollTop) * 10) / 10,
    w: Math.round(r.width * 10) / 10,
    h: Math.round(r.height * 10) / 10,
  });
  out.extras = {
    scrollHeight: sc.scrollHeight,
    clientHeight: sc.clientHeight,
    containerX: base.left,
    containerW: base.width,
  };
  const textOf = (el) => {
    if (el.tagName === "RAW-TEXT") return el.getAttribute("text") ?? "";
    let s = "";
    for (const c of el.childNodes)
      s += c.nodeType === 3 ? c.nodeValue : c.nodeType === 1 ? textOf(c) : "";
    return s;
  };
  for (const row of sc.querySelectorAll("list-item")) {
    out.rows.push({
      kind: row.getAttribute("item-key") ?? "",
      cls: String(row.className).slice(0, 60),
      ...rel(row.getBoundingClientRect()),
      text: norm(textOf(row)).slice(0, 70),
    });
  }
  for (const el of sc.querySelectorAll("x-text")) {
    if (el.parentElement?.closest("x-text")) continue;
    const t = norm(textOf(el));
    if (!t) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const inl = [...el.querySelectorAll("x-text")]
      .map((c) => ({ t: norm(textOf(c)), cls: String(c.className).slice(0, 60), ...styleOf(c) }))
      .filter((c) => c.t);
    out.texts.push({ t, cls: String(el.className).slice(0, 80), ...rel(r), ...styleOf(el), inl });
  }
  out.extras.images = [...sc.querySelectorAll("x-image,img")].map((i) => ({
    src: String(i.getAttribute("src")).slice(0, 80),
    cls: String(i.className).slice(0, 60),
    ...rel(i.getBoundingClientRect()),
  }));
  out.extras.sample = [...sc.querySelectorAll("list-item")]
    .slice(0, 2)
    .map((e) => e.outerHTML.slice(0, 1500));
  return JSON.stringify(out);
})();
