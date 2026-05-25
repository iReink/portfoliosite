const caseCarousel = document.querySelector(".case-carousel");

if (caseCarousel) {
  const track = caseCarousel.querySelector(".case-list");
  const prevButton = caseCarousel.querySelector(".carousel-button-prev");
  const nextButton = caseCarousel.querySelector(".carousel-button-next");
  const originalCards = Array.from(track.children);
  let cards = originalCards;
  let currentIndex = 0;
  let isAnimating = false;
  let transitionTimer;

  if (originalCards.length > 1) {
    const cloneCard = (card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      return clone;
    };

    const leadingClones = originalCards.map(cloneCard);
    const trailingClones = originalCards.map(cloneCard);

    track.prepend(...leadingClones);
    track.append(...trailingClones);
    cards = Array.from(track.children);
    currentIndex = originalCards.length;
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
    window.clearTimeout(transitionTimer);
    currentIndex += direction;
    updateCarousel(true);
    transitionTimer = window.setTimeout(finishCarouselMove, 560);
  };

  prevButton?.addEventListener("click", () => moveCarousel(-1));
  nextButton?.addEventListener("click", () => moveCarousel(1));

  const finishCarouselMove = () => {
    if (originalCards.length <= 1) return;

    if (currentIndex < originalCards.length) {
      currentIndex += originalCards.length;
      updateCarousel(false);
    }

    if (currentIndex >= originalCards.length * 2) {
      currentIndex -= originalCards.length;
      updateCarousel(false);
    }

    isAnimating = false;
  };

  track.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform") return;
    window.clearTimeout(transitionTimer);
    finishCarouselMove();
  });

  window.addEventListener("resize", () => {
    isAnimating = false;
    updateCarousel(false);
  });
  window.addEventListener("load", () => updateCarousel(false));
  updateCarousel(false);
}

const jtbdShowcases = Array.from(document.querySelectorAll(".jtbd-showcase"));

jtbdShowcases.forEach((showcase) => {
  const tabs = Array.from(showcase.querySelectorAll(".jtbd-tab"));
  const tabList = showcase.querySelector(".jtbd-tabs");
  const videoPanels = Array.from(showcase.querySelectorAll(".jtbd-video-panel"));
  const copyPanels = Array.from(showcase.querySelectorAll(".jtbd-copy-panel"));
  const videos = Array.from(showcase.querySelectorAll("video"));
  let selectedIndex = Math.max(0, tabs.findIndex((tab) => tab.classList.contains("is-selected")));
  let preloadStarted = false;

  const ensureVideoSource = (video) => {
    if (!video || video.src || !video.dataset.src) return;
    video.src = video.dataset.src;
    video.preload = "auto";
    video.load();
  };

  const selectTab = (index) => {
    selectedIndex = index;

    tabs.forEach((tab, tabIndex) => {
      const isSelected = tabIndex === selectedIndex;
      tab.classList.toggle("is-selected", isSelected);
      tab.setAttribute("aria-selected", String(isSelected));
    });

    videoPanels.forEach((panel) => {
      const isActive = Number(panel.dataset.jtbdIndex) === selectedIndex;
      panel.classList.toggle("is-active", isActive);
      if (isActive) ensureVideoSource(panel.querySelector("video"));
    });

    copyPanels.forEach((panel) => {
      panel.classList.toggle("is-active", Number(panel.dataset.jtbdIndex) === selectedIndex);
    });
  };

  const clearHover = () => {
    tabList?.classList.remove("has-hover");
    tabs.forEach((tab) => tab.classList.remove("is-hovered"));
  };

  const preloadVideosInOrder = async () => {
    if (preloadStarted || showcase.dataset.preloadVideos === "false") return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType)) return;

    preloadStarted = true;
    const orderedVideos = videos
      .map((video) => ({ video, index: Number(video.closest(".jtbd-video-panel")?.dataset.jtbdIndex || 0) }))
      .sort((a, b) => a.index - b.index)
      .map((item) => item.video);

    for (const video of orderedVideos) {
      const url = video.currentSrc || video.src || video.dataset.src;
      if (!url) continue;

      try {
        await fetch(url, { cache: "force-cache" });
      } catch {
        // The video element still gets a chance to load through the browser media pipeline.
      }

      ensureVideoSource(video);
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("mouseenter", () => {
      tabList?.classList.add("has-hover");
      tabs.forEach((item) => item.classList.toggle("is-hovered", item === tab));
    });
    tab.addEventListener("focus", () => {
      tabList?.classList.add("has-hover");
      tabs.forEach((item) => item.classList.toggle("is-hovered", item === tab));
    });
    tab.addEventListener("mouseleave", clearHover);
    tab.addEventListener("blur", clearHover);
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();

      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : event.key === "ArrowUp" || event.key === "ArrowLeft"
              ? (selectedIndex - 1 + tabs.length) % tabs.length
              : (selectedIndex + 1) % tabs.length;

      tabs[nextIndex]?.focus();
      selectTab(nextIndex);
    });
  });

  selectTab(selectedIndex);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        preloadVideosInOrder();
        observer.disconnect();
      },
      { rootMargin: "420px 0px" },
    );

    observer.observe(showcase);
  } else {
    window.addEventListener("load", preloadVideosInOrder, { once: true });
  }
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
