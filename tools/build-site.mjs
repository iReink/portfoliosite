import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(rootDir, "content");
const casesDir = path.join(contentDir, "cases");

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const attrs = (attributes) =>
  Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([name, value]) => (value === true ? name : `${name}="${escapeHtml(value)}"`))
    .join(" ");

const indent = (html, spaces) =>
  html
    .split("\n")
    .map((line) => (line ? `${" ".repeat(spaces)}${line}` : line))
    .join("\n");

const renderHead = ({ title, description, stylesheetPath }) => `  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="${stylesheetPath}" />
  </head>`;

const renderSiteHeader = (home) => `<header class="floating-header" aria-label="${escapeHtml(home.navigationLabel)}">
      <a class="brand" href="#top" aria-label="${escapeHtml(home.brand.ariaLabel)}">
        <img src="${escapeHtml(home.brand.image)}" alt="${escapeHtml(home.brand.imageAlt)}" onerror="this.remove()" />
        <span>${escapeHtml(home.brand.initials)}</span>
      </a>
      <nav class="nav-links">
${home.navigation.map((item) => `        <a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("\n")}
      </nav>
    </header>`;

const renderHero = (hero) => `<section class="hero section">
        <div class="hero-copy">
          <p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>
          <h1 class="hero-title">${escapeHtml(hero.title)}</h1>
          <ul class="hero-list">
${hero.items.map((item) => `            <li>${item.html}</li>`).join("\n")}
          </ul>
          <div class="hero-actions" aria-label="${escapeHtml(hero.actionsLabel)}">
            <a class="button primary" href="${escapeHtml(hero.primaryAction.href)}">${escapeHtml(hero.primaryAction.label)}</a>
            <a class="button secondary" href="${escapeHtml(hero.secondaryAction.href)}">${escapeHtml(hero.secondaryAction.label)}</a>
          </div>
        </div>
      </section>`;

const renderCarouselButton = (direction, label) => {
  const isPrev = direction === "prev";
  const paths = isPrev
    ? '<path d="M19 12H5" />\n              <path d="m12 5-7 7 7 7" />'
    : '<path d="M5 12h14" />\n              <path d="m12 5 7 7-7 7" />';

  return `<button class="carousel-button carousel-button-${direction}" type="button" aria-label="${escapeHtml(label)}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              ${paths}
            </svg>
          </button>`;
};

const renderCaseCard = (card) => `<a class="portfolio-card" href="${escapeHtml(card.href)}">
                <img src="${escapeHtml(card.cover)}" alt="${escapeHtml(card.coverAlt)}" />
                <div class="portfolio-card-copy">
                  <p class="case-type">${escapeHtml(card.type)}</p>
                  <h3>${escapeHtml(card.title)}</h3>
                  <p>${escapeHtml(card.summary)}</p>
                  <div class="card-metrics">
${card.metrics.map((metric) => `                    <span>${escapeHtml(metric)}</span>`).join("\n")}
                  </div>
                </div>
              </a>`;

const renderCasesSection = (home, caseCards) => `<section class="section" id="cases">
        <div class="section-heading">
          <p class="eyebrow">${escapeHtml(home.casesSection.eyebrow)}</p>
        </div>

        <div class="case-carousel" aria-label="${escapeHtml(home.casesSection.carouselLabel)}">
          ${renderCarouselButton("prev", home.casesSection.prevLabel)}
          <div class="case-viewport">
            <div class="case-list">
${caseCards.map((card) => indent(renderCaseCard(card), 14)).join("\n\n")}
            </div>
          </div>
          ${renderCarouselButton("next", home.casesSection.nextLabel)}
        </div>
      </section>`;

const renderDetails = (item) => `<details${item.open ? " open" : ""}>
            <summary>
              <span>${escapeHtml(item.title)}</span>
              <small>${escapeHtml(item.meta)}</small>
            </summary>
            <div class="details-body">
${indent(item.bodyHtml.trim(), 14)}
            </div>
          </details>`;

const renderExperience = (experience) => `<section class="section split-section" id="experience">
        <div class="section-heading sticky-copy">
          <p class="eyebrow">${escapeHtml(experience.eyebrow)}</p>
          <h2>${escapeHtml(experience.title)}</h2>
        </div>

        <div class="accordion-list">
${experience.items.map((item) => indent(renderDetails(item), 10)).join("\n\n")}
        </div>
      </section>`;

const renderSkills = (skills) => `<section class="section skill-section" id="skills">
        <div class="section-heading">
          <p class="eyebrow">${escapeHtml(skills.eyebrow)}</p>
        </div>
        <div class="skill-cloud" aria-label="${escapeHtml(skills.ariaLabel)}">
${skills.items.map((skill) => `          <span>${escapeHtml(skill)}</span>`).join("\n")}
        </div>
      </section>`;

const renderEducation = (education) => `<section class="section education-section" aria-label="${escapeHtml(education.ariaLabel)}">
        <div class="accordion-list compact">
${education.items.map((item) => indent(renderDetails(item), 10)).join("\n")}
        </div>
      </section>`;

const renderContacts = (contacts) => `<section class="section contact-section" id="contacts">
        <div>
          <p class="eyebrow">${escapeHtml(contacts.eyebrow)}</p>
          <h2>${escapeHtml(contacts.title)}</h2>
        </div>
        <div class="contact-links">
${contacts.links.map((link) => `          <a ${attrs({ href: link.href, target: link.target, rel: link.rel })}>${escapeHtml(link.label)}</a>`).join("\n")}
        </div>
      </section>`;

const renderFooter = (footer, contactsHref = "#top", linkLabel = footer.linkLabel) => `<footer>
      <span>${escapeHtml(footer.name)}</span>
      <a href="${escapeHtml(contactsHref)}">${escapeHtml(linkLabel)}</a>
    </footer>`;

const renderIndex = (home, caseCards) => `<!doctype html>
<html lang="ru">
${renderHead({ title: home.site.title, description: home.site.description, stylesheetPath: "styles.css" })}
  <body>
    ${renderSiteHeader(home)}

    <main id="top">
      ${renderHero(home.hero)}

      ${renderCasesSection(home, caseCards)}

      ${renderExperience(home.experience)}

      ${renderSkills(home.skills)}

      ${renderEducation(home.education)}

      ${renderContacts(home.contacts)}
    </main>

    ${renderFooter(home.footer)}

    <script src="script.js"></script>
  </body>
</html>
`;

const renderCasePage = (home, page) => `<!doctype html>
<html lang="ru">
${renderHead({ title: page.pageTitle, description: page.description, stylesheetPath: "../styles.css" })}
  <body class="case-page notion-case">
    <main>
      <header class="case-header">
        <a class="back-link" href="../index.html#cases">${escapeHtml(page.backLabel)}</a>
        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <div class="case-meta">
${page.meta.map((item) => `          <span>${escapeHtml(item)}</span>`).join("\n")}
        </div>
      </header>

      <article class="notion-content">
${indent(page.bodyHtml.trim(), 8)}
      </article>
    </main>

    ${renderFooter(home.footer, "../index.html#contacts", home.footer.caseLinkLabel || "Контакты")}

    <script src="../script.js"></script>
  </body>
</html>
`;

const main = async () => {
  const home = await readJson(path.join(contentDir, "home.json"));
  const caseFiles = (await fs.readdir(casesDir)).filter((file) => file.endsWith(".json")).sort();
  const cases = await Promise.all(caseFiles.map((file) => readJson(path.join(casesDir, file))));
  const sortedCases = cases.sort((a, b) => (a.order || 0) - (b.order || 0));

  await fs.writeFile(path.join(rootDir, "index.html"), renderIndex(home, sortedCases.map((item) => item.card)), "utf8");
  await fs.mkdir(path.join(rootDir, "cases"), { recursive: true });

  for (const casePage of sortedCases) {
    await fs.writeFile(path.join(rootDir, casePage.outputPath), renderCasePage(home, casePage), "utf8");
  }

  console.log(`Built ${sortedCases.length + 1} pages from content/`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
