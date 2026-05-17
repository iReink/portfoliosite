const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const setActiveLink = () => {
  const currentSection = sections
    .slice()
    .reverse()
    .find((section) => section.getBoundingClientRect().top <= 140);

  navLinks.forEach((link) => {
    link.classList.toggle("active", currentSection && link.getAttribute("href") === `#${currentSection.id}`);
  });
};

setActiveLink();
window.addEventListener("scroll", setActiveLink, { passive: true });

document.querySelectorAll(".accordion-list details").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (!details.open) return;

    const parent = details.closest(".accordion-list");
    parent.querySelectorAll("details").forEach((item) => {
      if (item !== details) item.open = false;
    });
  });
});
