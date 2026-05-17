const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const sections = navLinks
  .map((link) => {
    const href = link.getAttribute("href");
    return href && href.startsWith("#") ? document.querySelector(href) : null;
  })
  .filter(Boolean);

const setActiveLink = () => {
  if (!sections.length) return;

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

const zoomableImages = Array.from(document.querySelectorAll(".case-image img, .case-cover img"));

if (zoomableImages.length) {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = '<button type="button" aria-label="Закрыть">×</button><img alt="" />';
  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector("img");
  const closeButton = lightbox.querySelector("button");

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    lightboxImage.removeAttribute("src");
  };

  zoomableImages.forEach((image) => {
    image.addEventListener("click", () => {
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      lightbox.classList.add("open");
    });
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  closeButton.addEventListener("click", closeLightbox);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}
