import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportRoot = path.join(root, "notion", "Private & Shared", "Резюме - Вадим Баранов");
const assetsRoot = path.join(root, "assets", "notion");

const cases = [
  {
    slug: "price-lists",
    title: "Редизайн раздела «Прайс-листы»",
    kicker: "B2B SaaS / Mobile / Системная архитектура",
    source: path.join(exportRoot, "Редизайн раздела «Прайс-листы» 351b7150c93e8049b176f6296afc8ab2.md"),
    assetKey: "Редизайн раздела",
    meta: ["Ведущий дизайнер раздела", "Архитектура данных", "Retention D30 +22%"],
  },
  {
    slug: "desktop-price",
    title: "Десктопная модель прайса",
    kicker: "Web / B2B-инструмент / Табличная модель",
    source: path.join(exportRoot, "Десктопная модель прайса 34fb7150c93e81e5b1ccf53181474300.md"),
    assetKey: "Десктопная модель прайса",
    meta: ["Единственный дизайнер направления", "Функциональный прототип", "Платные подписки +8%"],
  },
  {
    slug: "waiter-app",
    title: "Приложение официанта",
    kicker: "Mobile / UX research / Test task",
    source: path.join(exportRoot, "Приложение официанта 34fb7150c93e8106912be755b2773f90.md"),
    assetKey: "Приложение официанта",
    meta: ["Анализ конкурентов", "Глубинное интервью", "User Flow"],
  },
];

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const encodeSegment = (segment) => encodeURIComponent(segment).replaceAll("%20", "%20");

const resolveAssetUrl = (href, currentCase) => {
  if (/^https?:\/\//.test(href)) return href;

  const decoded = decodeURIComponent(href);
  const filename = decoded.split(/[\\/]/).pop();
  return `../assets/notion/${currentCase.slug}/${encodeSegment(filename)}`;
};

const inline = (value, currentCase) => {
  let html = escapeHtml(value);

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, (_, text, href) => {
    const cleanHref = href.replaceAll("&amp;", "&");
    const safeText = inline(text.replaceAll("&amp;", "&"), currentCase);
    const url = /^https?:\/\//.test(cleanHref) ? cleanHref : resolveAssetUrl(cleanHref, currentCase);
    return `<a href="${escapeHtml(url)}"${/^https?:\/\//.test(url) ? ' target="_blank" rel="noreferrer"' : ""}>${safeText}</a>`;
  });

  return html;
};

const makeTable = (rows, currentCase) => {
  const parsedRows = rows
    .filter((row) => !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(row))
    .map((row) =>
      row
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => inline(cell.trim(), currentCase)),
    );

  if (!parsedRows.length) return "";

  const [head, ...body] = parsedRows;
  return `<div class="table-wrap"><table><thead><tr>${head.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
};

const convertMarkdown = (markdown, currentCase) => {
  const normalizedMarkdown = markdown
    .replace(/\r\n/g, "\n")
    .replace(/!\[([\s\S]*?)\]\((.+?)\)/g, (_, alt, href) => `![${alt.replace(/\n+/g, " ").trim()}](${href})`);
  const lines = normalizedMarkdown.split("\n");
  const output = [];
  let listType = null;
  let tableRows = [];

  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = null;
  };

  const closeTable = () => {
    if (!tableRows.length) return;
    closeList();
    output.push(makeTable(tableRows, currentCase));
    tableRows = [];
  };

  const openList = (type) => {
    closeTable();
    if (listType === type) return;
    closeList();
    output.push(`<${type}>`);
    listType = type;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (index === 0 && trimmed.startsWith("# ")) continue;

    if (!trimmed) {
      closeTable();
      closeList();
      continue;
    }

    if (trimmed === "<aside>") {
      closeTable();
      closeList();
      output.push('<div class="notion-aside">');
      continue;
    }

    if (trimmed === "</aside>") {
      closeTable();
      closeList();
      output.push("</div>");
      continue;
    }

    if (/^\|.+\|$/.test(trimmed)) {
      closeList();
      tableRows.push(trimmed);
      continue;
    }

    closeTable();

    const imageMatch = trimmed.match(/^!\[(.*?)\]\((.+?)\)$/);
    if (imageMatch) {
      closeList();
      const [, alt, href] = imageMatch;
      const src = resolveAssetUrl(href, currentCase);
      output.push(
        `<figure class="case-image wide-image"><img src="${escapeHtml(src)}" alt="${escapeHtml(
          alt || currentCase.title,
        )}" loading="lazy" />${alt ? `<figcaption>${inline(alt, currentCase)}</figcaption>` : ""}</figure>`,
      );
      continue;
    }

    const videoLinkMatch = trimmed.match(/^\[(.+?)\]\((.+?\.mp4)\)$/i);
    if (videoLinkMatch) {
      closeList();
      const [, caption, href] = videoLinkMatch;
      const src = resolveAssetUrl(href, currentCase);
      output.push(
        `<figure class="case-video"><video controls muted preload="metadata" src="${escapeHtml(
          src,
        )}"></video><figcaption>${inline(caption, currentCase)}</figcaption></figure>`,
      );
      continue;
    }

    const headingMatch = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      output.push(`<h${level}>${inline(headingMatch[2], currentCase)}</h${level}>`);
      continue;
    }

    if (trimmed === "---") {
      closeList();
      output.push("<hr />");
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      if (!quoteMatch[1].trim()) continue;
      closeList();
      output.push(`<blockquote>${inline(quoteMatch[1], currentCase)}</blockquote>`);
      continue;
    }

    const unorderedMatch = line.match(/^\s*-\s+(.+)$/);
    if (unorderedMatch) {
      openList("ul");
      output.push(`<li>${inline(unorderedMatch[1], currentCase)}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (orderedMatch) {
      openList("ol");
      output.push(`<li>${inline(orderedMatch[1], currentCase)}</li>`);
      continue;
    }

    closeList();
    output.push(`<p>${inline(trimmed, currentCase)}</p>`);
  }

  closeTable();
  closeList();

  return output.join("\n");
};

const pageTemplate = (currentCase, content) => `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(currentCase.title)} - кейс Вадима Баранова" />
    <title>${escapeHtml(currentCase.title)} - Вадим Баранов</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../styles.css" />
  </head>
  <body class="case-page notion-case">
    <main>
      <header class="case-header">
        <a class="back-link" href="../index.html#cases">← Все кейсы</a>
        <p class="eyebrow">${escapeHtml(currentCase.kicker)}</p>
        <h1>${escapeHtml(currentCase.title)}</h1>
        <div class="case-meta">
          ${currentCase.meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("\n          ")}
        </div>
      </header>

      <article class="notion-content">
        ${content}
      </article>
    </main>

    <footer>
      <span>Вадим Баранов</span>
      <a href="../index.html#contacts">Контакты</a>
    </footer>

    <script src="../script.js"></script>
  </body>
</html>
`;

fs.mkdirSync(path.join(root, "cases"), { recursive: true });
fs.mkdirSync(assetsRoot, { recursive: true });

for (const currentCase of cases) {
  const markdown = fs.readFileSync(currentCase.source, "utf8");
  const html = convertMarkdown(markdown, currentCase);
  fs.writeFileSync(path.join(root, "cases", `${currentCase.slug}.html`), pageTemplate(currentCase, html));
}
