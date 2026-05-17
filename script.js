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

const caseCarousel = document.querySelector(".case-carousel");

if (caseCarousel) {
  const track = caseCarousel.querySelector(".case-list");
  const prevButton = caseCarousel.querySelector(".carousel-button-prev");
  const nextButton = caseCarousel.querySelector(".carousel-button-next");
  const originalCards = Array.from(track.children);
  let cards = originalCards;
  let currentIndex = 0;
  let isAnimating = false;

  if (originalCards.length > 1) {
    const firstClone = originalCards[0].cloneNode(true);
    const lastClone = originalCards[originalCards.length - 1].cloneNode(true);

    [firstClone, lastClone].forEach((clone) => {
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
    });

    track.prepend(lastClone);
    track.append(firstClone);
    cards = Array.from(track.children);
    currentIndex = 1;
  }

  const updateCarousel = (animate = true) => {
    if (!cards.length) return;

    track.classList.toggle("no-transition", !animate);
    track.style.transform = `translate3d(${-cards[currentIndex].offsetLeft}px, 0, 0)`;

    if (!animate) {
      requestAnimationFrame(() => track.classList.remove("no-transition"));
    }
  };

  const moveCarousel = (direction) => {
    if (cards.length <= 1 || isAnimating) return;
    isAnimating = true;
    currentIndex += direction;
    updateCarousel(true);
  };

  prevButton?.addEventListener("click", () => moveCarousel(-1));
  nextButton?.addEventListener("click", () => moveCarousel(1));

  track.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform" || originalCards.length <= 1) return;

    if (currentIndex === 0) {
      currentIndex = cards.length - 2;
      updateCarousel(false);
    }

    if (currentIndex === cards.length - 1) {
      currentIndex = 1;
      updateCarousel(false);
    }

    isAnimating = false;
  });

  window.addEventListener("resize", () => {
    isAnimating = false;
    updateCarousel(false);
  });
  window.addEventListener("load", () => updateCarousel(false));
  updateCarousel(false);
}

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
