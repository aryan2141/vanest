(() => {
  if (window.__vanestPremiumMotionInitialized) {
    return;
  }

  window.__vanestPremiumMotionInitialized = true;

  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(pointer: fine)");
  const sectionIds = ["home", "mission", "about", "projects", "team", "donate", "events"];
  const splitTargets = new Set();
  const state = {
    lenis: null,
    lenisTick: null,
    lenisScrollHandler: null,
    swiper: null,
    navVisible: true,
    lastScroll: 0,
  };

  const hasMotionSupport = () =>
    !reducedMotionQuery.matches &&
    typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined";

  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const getNav = () => document.querySelector(".bottom-nav");

  const getNavHeight = () => {
    const nav = getNav();
    return nav ? nav.getBoundingClientRect().height : 0;
  };

  const getAnchorTarget = (hash) => {
    if (!hash || hash === "#") {
      return null;
    }

    try {
      return document.querySelector(hash);
    } catch (error) {
      return null;
    }
  };

  const debounce = (callback, delay = 180) => {
    let timeoutId = 0;

    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => callback(...args), delay);
    };
  };

  const closeMobileNav = () => {
    const offcanvasElement = document.getElementById("offcanvasExample");

    if (!offcanvasElement || typeof window.bootstrap === "undefined") {
      return;
    }

    const instance = window.bootstrap.Offcanvas.getInstance(offcanvasElement);

    if (instance) {
      instance.hide();
    }
  };

  const setActiveNavLink = (sectionId) => {
    qsa(".bottom-nav .nav-link[href^='#'], .mob-nav .nav-link[href^='#']").forEach((link) => {
      const isActive = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const syncTestimonialSlides = (swiper) => {
    if (!swiper) {
      return;
    }

    qsa(".testimonial-swiper .swiper-slide").forEach((slide) => {
      slide.classList.toggle("is-focus", slide.classList.contains("swiper-slide-active"));
      slide.classList.toggle("is-near", slide.classList.contains("swiper-slide-next") || slide.classList.contains("swiper-slide-prev"));
    });
  };

  const initSwiper = () => {
    if (typeof window.Swiper === "undefined") {
      return;
    }

    if (state.swiper && typeof state.swiper.destroy === "function") {
      state.swiper.destroy(true, true);
    }

    state.swiper = new window.Swiper(".mySwiper", {
      slidesPerView: 2,
      spaceBetween: 10,
      loop: true,
      speed: reducedMotionQuery.matches ? 500 : 1100,
      autoplay: reducedMotionQuery.matches
        ? false
        : {
            delay: 4600,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
      breakpoints: {
        0: {
          slidesPerView: 1,
          spaceBetween: 10,
        },
        576: {
          slidesPerView: 1,
          spaceBetween: 10,
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 10,
        },
      },
      on: {
        init(swiper) {
          syncTestimonialSlides(swiper);
        },
        slideChangeTransitionStart(swiper) {
          syncTestimonialSlides(swiper);
        },
        transitionEnd(swiper) {
          syncTestimonialSlides(swiper);
        },
      },
    });
  };

  const destroyLenis = () => {
    if (!state.lenis) {
      return;
    }

    if (state.lenisScrollHandler && typeof state.lenis.off === "function") {
      state.lenis.off("scroll", state.lenisScrollHandler);
    }

    if (state.lenisTick && typeof window.gsap !== "undefined") {
      window.gsap.ticker.remove(state.lenisTick);
    }

    state.lenis.destroy();
    state.lenis = null;
    state.lenisTick = null;
    state.lenisScrollHandler = null;
  };

  const revealNav = (immediate = false) => {
    const nav = getNav();

    if (!nav || !hasMotionSupport()) {
      return;
    }

    state.navVisible = true;
    window.gsap.to(nav, {
      yPercent: 0,
      y: 0,
      autoAlpha: 1,
      duration: immediate ? 0 : 0.75,
      ease: immediate ? "none" : "power3.out",
      overwrite: true,
    });
  };

  const hideNav = () => {
    const nav = getNav();

    if (!nav || !hasMotionSupport()) {
      return;
    }

    state.navVisible = false;
    window.gsap.to(nav, {
      yPercent: -118,
      y: -6,
      autoAlpha: 0.98,
      duration: 0.62,
      ease: "power3.out",
      overwrite: true,
    });
  };

  const updateNavOnScroll = (scrollTop, direction = 0) => {
    const nav = getNav();

    if (!nav) {
      return;
    }

    nav.classList.toggle("is-scrolled", scrollTop > 16);

    if (!hasMotionSupport()) {
      return;
    }

    if (scrollTop <= 24) {
      revealNav(true);
      state.lastScroll = scrollTop;
      return;
    }

    if (direction > 0 && state.navVisible && scrollTop - state.lastScroll > 6) {
      hideNav();
    } else if (direction < 0 && !state.navVisible) {
      revealNav();
    }

    state.lastScroll = scrollTop;
  };

  const initLenis = () => {
    if (!hasMotionSupport() || typeof window.Lenis === "undefined") {
      return;
    }

    destroyLenis();

    state.lenis = new window.Lenis({
      duration: 1.15,
      lerp: 0.085,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.92,
    });

    state.lenisScrollHandler = (lenis) => {
      window.ScrollTrigger.update();
      updateNavOnScroll(lenis.scroll, lenis.direction || 0);
    };

    state.lenis.on("scroll", state.lenisScrollHandler);

    state.lenisTick = (time) => {
      if (state.lenis) {
        state.lenis.raf(time * 1000);
      }
    };

    window.gsap.ticker.add(state.lenisTick);
    window.gsap.ticker.lagSmoothing(0);
    revealNav(true);
  };

  const restoreSplitTargets = () => {
    splitTargets.forEach((element) => {
      if (element.dataset.originalText) {
        element.textContent = element.dataset.originalText;
        element.removeAttribute("aria-label");
      }
    });
  };

  const splitTextLines = (element) => {
    const originalText = element.dataset.originalText || element.textContent.trim();

    if (!originalText) {
      return [];
    }

    splitTargets.add(element);
    element.dataset.originalText = originalText;
    element.textContent = "";
    element.setAttribute("aria-label", originalText);

    const fragment = document.createDocumentFragment();

    originalText.split(/\s+/).forEach((word, index, words) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "split-word";
      wordSpan.textContent = word;
      fragment.appendChild(wordSpan);

      if (index < words.length - 1) {
        fragment.appendChild(document.createTextNode(" "));
      }
    });

    element.appendChild(fragment);

    const lines = [];
    let lastTop = null;

    qsa(".split-word", element).forEach((wordSpan) => {
      const top = wordSpan.offsetTop;

      if (lastTop === null || Math.abs(top - lastTop) > 2) {
        lines.push([wordSpan.textContent]);
        lastTop = top;
      } else {
        lines[lines.length - 1].push(wordSpan.textContent);
      }
    });

    const lineFragment = document.createDocumentFragment();
    lines.forEach((lineWords) => {
      const line = document.createElement("span");
      const inner = document.createElement("span");

      line.className = "split-line";
      line.setAttribute("aria-hidden", "true");
      inner.className = "split-line-inner";
      inner.textContent = lineWords.join(" ");

      line.appendChild(inner);
      lineFragment.appendChild(line);
    });

    element.textContent = "";
    element.appendChild(lineFragment);

    return qsa(".split-line-inner", element);
  };

  const maskIn = (timeline, target, at, vars = {}) => {
    if (!target) {
      return;
    }

    timeline.fromTo(
      target,
      {
        autoAlpha: vars.autoAlphaFrom ?? 1,
        y: vars.y ?? 20,
        x: vars.x ?? 0,
        rotate: vars.rotate ?? 0.8,
        rotateX: vars.rotateX ?? 0,
        clipPath: vars.clipPathFrom || "inset(0 0 100% 0)",
        filter: vars.filterFrom || "blur(12px)",
        transformOrigin: vars.transformOrigin || "50% 100%",
      },
      {
        autoAlpha: 1,
        y: 0,
        x: 0,
        rotate: 0,
        rotateX: 0,
        clipPath: vars.clipPathTo || "inset(0 0 0% 0)",
        filter: "blur(0px)",
        duration: vars.duration || 0.95,
        ease: vars.ease || "power3.out",
        clearProps: "clipPath,filter,transformOrigin",
      },
      at
    );
  };

  const revealTextBlock = (wrapper, options = {}) => {
    if (!wrapper) {
      return;
    }

    const label = wrapper.querySelector(".section-sm-title");
    const title = wrapper.querySelector(".section-title");
    const paragraphs = Array.from(new Set(wrapper.querySelectorAll(".section-desc, p")));
    const accent = wrapper.querySelector("span img");
    const button = wrapper.querySelector(".theme-btn");

    const timeline = window.gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
      scrollTrigger: {
        trigger: options.trigger || wrapper,
        start: options.start || "top 78%",
        once: true,
      },
    });

    maskIn(timeline, label, 0, {
      y: 16,
      rotate: 0,
      duration: 0.75,
      filterFrom: "blur(10px)",
    });

    maskIn(timeline, title, options.titleAt ?? 0.06, {
      y: 22,
      rotate: options.titleRotate ?? 1.2,
      duration: 1,
      filterFrom: "blur(12px)",
      clipPathFrom: "inset(0 0 100% 0)",
    });

    if (paragraphs.length) {
      timeline.fromTo(
        paragraphs,
        {
          autoAlpha: 1,
          y: 22,
          rotate: 0.8,
          clipPath: "inset(0 0 100% 0)",
          filter: "blur(12px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          rotate: 0,
          clipPath: "inset(0 0 0% 0)",
          filter: "blur(0px)",
          duration: 0.95,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "clipPath,filter",
        },
        options.copyAt ?? 0.18
      );
    }

    if (accent) {
      timeline.fromTo(
        accent,
        {
          autoAlpha: 0,
          scaleX: 0.72,
          y: 14,
          transformOrigin: "50% 50%",
        },
        {
          autoAlpha: 1,
          scaleX: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          clearProps: "transformOrigin",
        },
        options.accentAt ?? 0.26
      );
    }

    if (button) {
      timeline.fromTo(
        button,
        {
          autoAlpha: 1,
          x: -14,
          y: 14,
          scale: 0.98,
          clipPath: "inset(0 100% 0 0)",
          filter: "blur(10px)",
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          clipPath: "inset(0 0% 0 0)",
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          clearProps: "clipPath,filter",
        },
        options.buttonAt ?? 0.34
      );
    }
  };

  const createImageReveal = (trigger, imageWrapper, options = {}) => {
    if (!trigger || !imageWrapper) {
      return;
    }

    const image = imageWrapper.querySelector("img");
    const timeline = window.gsap.timeline({
      scrollTrigger: {
        trigger,
        start: options.start || "top 80%",
        once: true,
      },
    });

    timeline.fromTo(
      imageWrapper,
      {
        autoAlpha: 1,
        rotate: options.rotateFrom ?? 1.8,
        y: options.y ?? 24,
        clipPath: options.clipPathFrom || "inset(0 100% 0 0)",
        filter: "blur(12px)",
        transformOrigin: options.transformOrigin || "50% 50%",
      },
      {
        autoAlpha: 1,
        rotate: 0,
        y: 0,
        clipPath: "inset(0 0 0 0)",
        filter: "blur(0px)",
        duration: options.duration || 1.15,
        ease: options.ease || "power3.out",
        clearProps: "clipPath,filter,transformOrigin",
      },
      0
    );

    if (image) {
      timeline.fromTo(
        image,
        {
          scale: options.scaleFrom ?? 1.12,
          x: options.imageX ?? 0,
        },
        {
          scale: 1,
          x: 0,
          duration: options.duration || 1.2,
          ease: options.ease || "power3.out",
        },
        0
      );
    }
  };

  const initHeroStory = () => {
    const nav = getNav();
    const label = document.querySelector(".banner-content-wrapper .section-sm-title");
    const title = document.querySelector(".banner-title");
    const copy = document.querySelector(".banner-desc");
    const cta = document.querySelector(".banner-content-wrapper .theme-btn");
    const imageWrapper = document.querySelector(".banner-thumb-wrapper");
    const image = imageWrapper?.querySelector(".banner-thumb");
    const background = document.querySelector(".banner-bg-wrapper");

    if (!nav || !title || !copy || !cta || !imageWrapper) {
      return;
    }

    const heroLines = splitTextLines(title);

    window.gsap.set(nav, {
      autoAlpha: 0,
      y: -24,
    });
    window.gsap.set(label, {
      clipPath: "inset(0 0 100% 0)",
      y: 16,
      filter: "blur(8px)",
    });
    window.gsap.set(heroLines, {
      yPercent: 108,
      rotate: 2.2,
      filter: "blur(12px)",
    });
    window.gsap.set(copy, {
      clipPath: "inset(0 0 100% 0)",
      y: 18,
      rotate: 0.8,
      filter: "blur(12px)",
    });
    window.gsap.set(cta, {
      clipPath: "inset(0 100% 0 0)",
      x: -14,
      y: 12,
      scale: 0.98,
      filter: "blur(10px)",
    });
    window.gsap.set(imageWrapper, {
      clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
      rotate: 1.8,
      filter: "blur(14px)",
    });

    if (image) {
      window.gsap.set(image, {
        scale: 1.14,
        x: 26,
      });
    }

    if (background) {
      window.gsap.set(background, {
        scaleX: 0.96,
        transformOrigin: "left center",
      });
    }

    const timeline = window.gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
    });

    timeline
      .to(
        nav,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
        },
        0
      )
      .to(
        imageWrapper,
        {
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          rotate: 0,
          filter: "blur(0px)",
          duration: 1.12,
          clearProps: "clipPath,filter",
        },
        0.1
      );

    if (image) {
      timeline.to(
        image,
        {
          scale: 1,
          x: 0,
          duration: 1.18,
        },
        0.1
      );
    }

    if (background) {
      timeline.to(
        background,
        {
          scaleX: 1,
          duration: 1.02,
        },
        0.12
      );
    }

    timeline
      .to(
        label,
        {
          clipPath: "inset(0 0 0% 0)",
          y: 0,
          filter: "blur(0px)",
          duration: 0.72,
          clearProps: "clipPath,filter",
        },
        0.3
      )
      .to(
        heroLines,
        {
          yPercent: 0,
          rotate: 0,
          filter: "blur(0px)",
          duration: 0.92,
          stagger: 0.1,
          clearProps: "filter",
        },
        0.38
      )
      .to(
        copy,
        {
          clipPath: "inset(0 0 0% 0)",
          y: 0,
          rotate: 0,
          filter: "blur(0px)",
          duration: 0.9,
          clearProps: "clipPath,filter",
        },
        0.66
      )
      .to(
        cta,
        {
          clipPath: "inset(0 0% 0 0)",
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.84,
          clearProps: "clipPath,filter",
        },
        0.88
      );
  };

  const initServiceStory = () => {
    const section = document.querySelector(".service-section");
    const cards = qsa(".service-box", section);

    if (!section || !cards.length) {
      return;
    }

    const timeline = window.gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 72%",
        once: true,
      },
    });

    cards.forEach((card, index) => {
      const icon = card.querySelector(".service-icon img");

      timeline.fromTo(
        card,
        {
          autoAlpha: 1,
          y: 24,
          rotate: index % 2 === 0 ? -1.4 : 1.4,
          rotateX: 6,
          clipPath: index % 2 === 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
          filter: "blur(12px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          rotate: 0,
          rotateX: 0,
          clipPath: "inset(0 0 0 0)",
          filter: "blur(0px)",
          duration: 1.02,
          ease: "power3.out",
          clearProps: "clipPath,filter",
        },
        index * 0.14
      );

      if (icon) {
        timeline.fromTo(
          icon,
          {
            y: 16,
            x: index % 2 === 0 ? -10 : 10,
            scale: 0.92,
          },
          {
            y: 0,
            x: 0,
            scale: 1,
            duration: 0.84,
            ease: "power3.out",
          },
          index * 0.14 + 0.08
        );
      }
    });
  };

  const initAboutStory = () => {
    const section = document.querySelector(".save-life-section");
    const textBlock = section?.querySelector(".section-content-wrapper");
    const imageWrapper = section?.querySelector(".save-life-thumb-wrapper");

    if (!section) {
      return;
    }

    revealTextBlock(textBlock, {
      trigger: section,
      start: "top 74%",
    });

    createImageReveal(section, imageWrapper, {
      start: "top 72%",
      clipPathFrom: "polygon(0 0, 82% 0, 64% 100%, 0 100%)",
      rotateFrom: 1.4,
      scaleFrom: 1.1,
      imageX: 18,
    });
  };

  const initProjectStory = () => {
    const section = document.querySelector(".blog-section");
    const intro = section?.querySelector(".section-content-wrapper");
    const cards = qsa(".blog-block", section);
    const clipVariants = [
      "polygon(0 0, 0 0, 0 100%, 0 100%)",
      "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
      "polygon(14% 0, 100% 0, 86% 100%, 0 100%)",
    ];

    if (!section || !cards.length) {
      return;
    }

    revealTextBlock(intro, {
      trigger: intro,
      start: "top 80%",
      titleRotate: 0.8,
    });

    cards.forEach((card, index) => {
      const imageWrapper = card.querySelector(".block-thumb-wrapper");
      const image = imageWrapper?.querySelector(".blog-thub");
      const contentItems = Array.from(new Set(card.querySelectorAll(".blog-title, .progressbar-wrapper, .blog-desc")));
      const progressBar = card.querySelector(".progress-count");
      const targetWidth = progressBar?.style.width || "0%";

      if (progressBar) {
        progressBar.style.width = "0%";
      }

      const timeline = window.gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: "top 82%",
          once: true,
        },
      });

      timeline.fromTo(
        card,
        {
          autoAlpha: 1,
          y: 20,
          rotate: index % 2 === 0 ? -1.4 : 1.4,
          clipPath: "inset(0 0 12% 0)",
          filter: "blur(12px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          rotate: 0,
          clipPath: "inset(0 0 0% 0)",
          filter: "blur(0px)",
          duration: 1.02,
          ease: "power3.out",
          clearProps: "clipPath,filter",
        },
        0
      );

      if (imageWrapper) {
        timeline.fromTo(
          imageWrapper,
          {
            clipPath: clipVariants[index % clipVariants.length],
            filter: "blur(10px)",
          },
          {
            clipPath: "inset(0 0 0 0)",
            filter: "blur(0px)",
            duration: 1.1,
            ease: "power3.out",
            clearProps: "clipPath,filter",
          },
          0.02
        );
      }

      if (image) {
        timeline.fromTo(
          image,
          {
            scale: 1.14,
            x: index % 2 === 0 ? 14 : -14,
          },
          {
            scale: 1,
            x: 0,
            duration: 1.18,
            ease: "power3.out",
          },
          0.02
        );
      }

      if (contentItems.length) {
        timeline.fromTo(
          contentItems,
          {
            autoAlpha: 1,
            y: 18,
            clipPath: "inset(0 0 100% 0)",
            filter: "blur(10px)",
          },
          {
            autoAlpha: 1,
            y: 0,
            clipPath: "inset(0 0 0% 0)",
            filter: "blur(0px)",
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "clipPath,filter",
          },
          0.18
        );
      }

      if (progressBar) {
        timeline.to(
          progressBar,
          {
            width: targetWidth,
            duration: 0.95,
            ease: "power2.out",
          },
          0.34
        );
      }
    });
  };

  const initVolunteerStory = () => {
    const section = document.querySelector(".team-section");
    const imageColumn = section?.querySelector(".team-image-wrapper");
    const teamBlocks = qsa(".team-block", imageColumn);
    const textBlock = section?.querySelector(".team-content-wrapper .section-content-wrapper");

    if (!section || !imageColumn || !textBlock) {
      return;
    }

    const timeline = window.gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 72%",
        once: true,
      },
    });

    timeline.fromTo(
      imageColumn,
      {
        autoAlpha: 1,
        x: -36,
        rotate: -1.2,
        clipPath: "inset(0 14% 0 0)",
        filter: "blur(12px)",
      },
      {
        autoAlpha: 1,
        x: 0,
        rotate: 0,
        clipPath: "inset(0 0% 0 0)",
        filter: "blur(0px)",
        duration: 1.12,
        ease: "power3.out",
        clearProps: "clipPath,filter",
      },
      0
    );

    if (teamBlocks.length) {
      timeline.fromTo(
        teamBlocks,
        {
          autoAlpha: 1,
          y: 18,
          scale: 0.96,
          clipPath: "inset(0 0 18% 0)",
          filter: "blur(10px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          clipPath: "inset(0 0 0 0)",
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "clipPath,filter",
        },
        0.12
      );
    }

    timeline.fromTo(
      textBlock,
      {
        autoAlpha: 1,
        x: 34,
        rotate: 1.2,
        clipPath: "inset(0 0 0 16%)",
        filter: "blur(12px)",
      },
      {
        autoAlpha: 1,
        x: 0,
        rotate: 0,
        clipPath: "inset(0 0 0 0%)",
        filter: "blur(0px)",
        duration: 1.1,
        ease: "power3.out",
        clearProps: "clipPath,filter",
      },
      0.06
    );

    const detailsTimeline = window.gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 72%",
        once: true,
      },
    });

    revealTextBlock(textBlock, {
      trigger: section,
      start: "top 72%",
      titleAt: 0.12,
      copyAt: 0.22,
      accentAt: 0.28,
      buttonAt: 0.34,
    });

    return detailsTimeline;
  };

  const initDonationStory = () => {
    const section = document.querySelector(".donation-setting");
    const textBlock = section?.querySelector(".section-content-wrapper");
    const chips = qsa(".row.gy-4 > .col-auto", section);
    const cta = section?.querySelector(".mt-4.mt-lg-5 .theme-btn");

    if (!section) {
      return;
    }

    revealTextBlock(textBlock, {
      trigger: section,
      start: "top 76%",
      buttonAt: 0.3,
    });

    if (!chips.length) {
      return;
    }

    const timeline = window.gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 74%",
        once: true,
      },
    });

    timeline.fromTo(
      chips,
      {
        autoAlpha: 1,
        y: 18,
        rotate: -1,
        clipPath: "inset(0 0 100% 0)",
        filter: "blur(10px)",
      },
      {
        autoAlpha: 1,
        y: 0,
        rotate: 0,
        clipPath: "inset(0 0 0% 0)",
        filter: "blur(0px)",
        duration: 0.84,
        stagger: 0.07,
        ease: "power3.out",
        clearProps: "clipPath,filter",
      },
      0.18
    );

    if (cta) {
      timeline.fromTo(
        cta,
        {
          autoAlpha: 1,
          x: -10,
          clipPath: "inset(0 100% 0 0)",
          filter: "blur(10px)",
        },
        {
          autoAlpha: 1,
          x: 0,
          clipPath: "inset(0 0% 0 0)",
          filter: "blur(0px)",
          duration: 0.88,
          ease: "power3.out",
          clearProps: "clipPath,filter",
        },
        0.42
      );
    }
  };

  const initEventStory = () => {
    const section = document.querySelector(".recent-event-section");
    const intro = section?.querySelector(".section-content-wrapper");
    const cards = qsa(".event-box", section);

    if (!section || !cards.length) {
      return;
    }

    revealTextBlock(intro, {
      trigger: intro,
      start: "top 80%",
      titleRotate: 0.8,
    });

    cards.forEach((card, index) => {
      const imageWrapper = card.querySelector(".event-thumb-wrapper");
      const image = imageWrapper?.querySelector(".event-thumb");
      const content = card.querySelector(".event-content");

      const timeline = window.gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: "top 84%",
          once: true,
        },
      });

      timeline.fromTo(
        card,
        {
          autoAlpha: 1,
          y: 18,
          rotate: index % 2 === 0 ? -1 : 1,
          clipPath: "inset(0 0 14% 0)",
          filter: "blur(12px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          rotate: 0,
          clipPath: "inset(0 0 0% 0)",
          filter: "blur(0px)",
          duration: 1.02,
          ease: "power3.out",
          clearProps: "clipPath,filter",
        },
        0
      );

      if (imageWrapper) {
        timeline.fromTo(
          imageWrapper,
          {
            clipPath: index % 2 === 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
            filter: "blur(10px)",
          },
          {
            clipPath: "inset(0 0 0 0)",
            filter: "blur(0px)",
            duration: 1.08,
            ease: "power3.out",
            clearProps: "clipPath,filter",
          },
          0.02
        );
      }

      if (image) {
        timeline.fromTo(
          image,
          {
            scale: 1.12,
            x: index % 2 === 0 ? 16 : -16,
          },
          {
            scale: 1,
            x: 0,
            duration: 1.18,
            ease: "power3.out",
          },
          0.02
        );
      }

      if (content) {
        timeline.fromTo(
          content,
          {
            autoAlpha: 1,
            x: index % 2 === 0 ? 26 : -26,
            clipPath: index % 2 === 0 ? "inset(0 0 0 16%)" : "inset(0 16% 0 0)",
            filter: "blur(12px)",
          },
          {
            autoAlpha: 1,
            x: 0,
            clipPath: "inset(0 0 0 0)",
            filter: "blur(0px)",
            duration: 1,
            ease: "power3.out",
            clearProps: "clipPath,filter",
          },
          0.12
        );
      }
    });
  };

  const initTestimonialStory = () => {
    const section = document.querySelector(".testimonial-section");
    const intro = section?.querySelector(".section-content-wrapper");
    const slider = section?.querySelector(".testimonial-swiper");

    if (!section || !slider) {
      return;
    }

    revealTextBlock(intro, {
      trigger: intro,
      start: "top 82%",
      titleRotate: 0.6,
    });

    const timeline = window.gsap.timeline({
      scrollTrigger: {
        trigger: slider,
        start: "top 84%",
        once: true,
      },
    });

    timeline.fromTo(
      slider,
      {
        autoAlpha: 1,
        scale: 0.965,
        y: 18,
        clipPath: "inset(8% 0 8% 0)",
        filter: "blur(12px)",
      },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        clipPath: "inset(0% 0 0% 0)",
        filter: "blur(0px)",
        duration: 1.08,
        ease: "power3.out",
        clearProps: "clipPath,filter",
      },
      0
    );
  };

  const initFooterStory = () => {
    const footer = document.querySelector(".footer");

    if (!footer) {
      return;
    }

    window.gsap.fromTo(
      footer,
      {
        autoAlpha: 1,
        y: 18,
        clipPath: "inset(0 0 100% 0)",
        filter: "blur(10px)",
      },
      {
        autoAlpha: 1,
        y: 0,
        clipPath: "inset(0 0 0% 0)",
        filter: "blur(0px)",
        duration: 0.92,
        ease: "power3.out",
        clearProps: "clipPath,filter",
        scrollTrigger: {
          trigger: footer,
          start: "top 94%",
          once: true,
        },
      }
    );
  };

  const initInteractiveCards = () => {
    if (!hasMotionSupport() || !finePointerQuery.matches) {
      return;
    }

    qsa(".service-box, .blog-block, .event-box, .team-block").forEach((card) => {
      const image = card.querySelector(".blog-thub, .event-thumb, .team-thumb");
      const icon = card.querySelector(".service-icon img");
      const rotateXTo = window.gsap.quickTo(card, "rotationX", {
        duration: 0.45,
        ease: "power3.out",
      });
      const rotateYTo = window.gsap.quickTo(card, "rotationY", {
        duration: 0.45,
        ease: "power3.out",
      });
      const yTo = window.gsap.quickTo(card, "y", {
        duration: 0.5,
        ease: "power3.out",
      });
      const imageScaleTo = image
        ? window.gsap.quickTo(image, "scale", {
            duration: 0.7,
            ease: "power3.out",
          })
        : null;
      const iconXTo = icon
        ? window.gsap.quickTo(icon, "x", {
            duration: 0.55,
            ease: "power3.out",
          })
        : null;
      const iconYTo = icon
        ? window.gsap.quickTo(icon, "y", {
            duration: 0.55,
            ease: "power3.out",
          })
        : null;

      window.gsap.set(card, {
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      });

      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;

        rotateYTo(px * 5.2);
        rotateXTo(py * -4.2);
        yTo(-8);

        if (imageScaleTo) {
          imageScaleTo(1.05);
        }

        if (iconXTo && iconYTo) {
          iconXTo(px * 12);
          iconYTo(py * 8);
        }
      });

      card.addEventListener("mouseleave", () => {
        rotateXTo(0);
        rotateYTo(0);
        yTo(0);

        if (imageScaleTo) {
          imageScaleTo(1);
        }

        if (iconXTo && iconYTo) {
          iconXTo(0);
          iconYTo(0);
        }
      });
    });
  };

  const initAnchorNavigation = () => {
    qsa(".bottom-nav .nav-link[href^='#'], .mob-nav .nav-link[href^='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = getAnchorTarget(link.getAttribute("href"));

        if (!target) {
          return;
        }

        event.preventDefault();
        setActiveNavLink(target.id);

        if (state.lenis) {
          state.lenis.scrollTo(target, {
            offset: -getNavHeight() + 8,
            duration: 1.15,
          });
        } else {
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - getNavHeight(),
            behavior: reducedMotionQuery.matches ? "auto" : "smooth",
          });
        }

        if (link.classList.contains("mob-link")) {
          closeMobileNav();
        }
      });
    });

    setActiveNavLink("home");
    updateNavOnScroll(window.scrollY, 0);

    if (reducedMotionQuery.matches) {
      window.addEventListener(
        "scroll",
        () => {
          updateNavOnScroll(window.scrollY, 0);
        },
        { passive: true }
      );
    }
  };

  const initSectionTracking = () => {
    sectionIds.forEach((sectionId) => {
      const section = document.getElementById(sectionId);

      if (!section) {
        return;
      }

      window.ScrollTrigger.create({
        trigger: section,
        start: sectionId === "home" ? "top top+=18%" : "top center",
        end: "bottom center",
        onEnter: () => setActiveNavLink(sectionId),
        onEnterBack: () => setActiveNavLink(sectionId),
      });
    });
  };

  const refreshAfterImagesLoad = () => {
    if (typeof window.ScrollTrigger === "undefined") {
      return;
    }

    const pendingImages = Array.from(document.images).filter((image) => !image.complete);

    if (!pendingImages.length) {
      window.ScrollTrigger.refresh();
      return;
    }

    let remaining = pendingImages.length;
    const onComplete = () => {
      remaining -= 1;

      if (remaining <= 0) {
        window.ScrollTrigger.refresh();
      }
    };

    pendingImages.forEach((image) => {
      image.addEventListener("load", onComplete, { once: true });
      image.addEventListener("error", onComplete, { once: true });
    });

    window.addEventListener(
      "load",
      () => {
        window.ScrollTrigger.refresh();
      },
      { once: true }
    );
  };

  const applyReducedMotionState = () => {
    root.classList.remove("has-motion");
    root.classList.add("reduced-motion");
    restoreSplitTargets();
    destroyLenis();

    if (typeof window.ScrollTrigger !== "undefined") {
      window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }

    if (typeof window.gsap !== "undefined") {
      window.gsap.set(
        [
          ".bottom-nav",
          ".banner-content-wrapper > *",
          ".banner-thumb-wrapper",
          ".banner-bg-wrapper",
          ".service-box",
          ".save-life-thumb-wrapper",
          ".blog-block",
          ".team-image-wrapper",
          ".team-content-wrapper",
          ".event-box",
          ".testimonial-swiper",
          ".footer",
        ],
        {
          clearProps: "all",
        }
      );
    }
  };

  const initMotionSystem = () => {
    if (!hasMotionSupport()) {
      applyReducedMotionState();
      return;
    }

    root.classList.add("has-motion");
    root.classList.remove("reduced-motion");

    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    initLenis();
    initHeroStory();
    initServiceStory();
    initAboutStory();
    initProjectStory();
    initVolunteerStory();
    initDonationStory();
    initEventStory();
    initTestimonialStory();
    initFooterStory();
    initInteractiveCards();
    initSectionTracking();
    refreshAfterImagesLoad();

    window.addEventListener(
      "resize",
      debounce(() => {
        if (!hasMotionSupport()) {
          return;
        }

        const heroTitle = document.querySelector(".banner-title");
        if (heroTitle && heroTitle.dataset.originalText) {
          const wasVisible = qsa(".split-line-inner", heroTitle).every((line) => {
            const translate = window.gsap.getProperty(line, "yPercent");
            return Number(translate) === 0;
          });

          heroTitle.textContent = heroTitle.dataset.originalText;
          heroTitle.removeAttribute("aria-label");

          const rebuiltLines = splitTextLines(heroTitle);
          if (wasVisible) {
            window.gsap.set(rebuiltLines, {
              yPercent: 0,
              rotate: 0,
              filter: "blur(0px)",
            });
          }
        }

        window.ScrollTrigger.refresh();
      }),
      { passive: true }
    );
  };

  const init = () => {
    initAnchorNavigation();
    initSwiper();

    const fontsReady =
      document.fonts && typeof document.fonts.ready !== "undefined"
        ? document.fonts.ready
        : Promise.resolve();
    const loaderReady = window.__vanestLoaderPromise || Promise.resolve();

    Promise.all([fontsReady.catch(() => undefined), loaderReady]).finally(() => {
      initMotionSystem();
    });
  };

  init();
})();
