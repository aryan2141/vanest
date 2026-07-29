(() => {
  const loader = document.getElementById("siteLoader");
  const body = document.body;

  let resolveLoader = () => {};
  window.__vanestLoaderPromise = new Promise((resolve) => {
    resolveLoader = resolve;
  });

  if (!loader) {
    body?.classList.remove("is-loading");
    resolveLoader();
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;

  if (!gsap) {
    window.addEventListener(
      "load",
      () => {
        loader.remove();
        body.classList.remove("is-loading");
        resolveLoader();
      },
      { once: true }
    );
    return;
  }

  const logoWrap = loader.querySelector(".site-loader__logo-wrap");
  const text = loader.querySelector(".site-loader__text");
  const lineFill = loader.querySelector(".site-loader__line-fill");
  const particlesContainer = loader.querySelector(".site-loader__particles");
  const ringProgress = loader.querySelector(".site-loader__ring-progress");
  const circumference = 2 * Math.PI * 96;
  const minDuration = prefersReducedMotion ? 700 : 2350;
  const progressState = { value: 0 };
  const particleTweens = [];
  let rafId = 0;
  let finished = false;
  let pageReady = document.readyState === "complete";
  const startTime = performance.now();

  ringProgress.style.strokeDasharray = `${circumference}`;
  ringProgress.style.strokeDashoffset = `${circumference}`;

  const setVisualProgress = (value) => {
    const clamped = Math.max(0, Math.min(1, value));
    ringProgress.style.strokeDashoffset = `${circumference * (1 - clamped)}`;
    lineFill.style.transform = `scaleX(${clamped})`;
  };

  const createParticles = () => {
    const particleCount = prefersReducedMotion ? 0 : 10;

    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * index) / particleCount;
      const radius = 92 + (index % 3) * 10;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      particle.className = "site-loader__particle";
      particlesContainer.appendChild(particle);

      gsap.set(particle, {
        xPercent: -50,
        yPercent: -50,
        x,
        y,
        scale: 0.45,
      });

      particleTweens.push(
        gsap.to(particle, {
          autoAlpha: 0.9,
          scale: 1,
          duration: 0.9 + (index % 3) * 0.14,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.05,
        })
      );
    }

    if (particleCount) {
      particleTweens.push(
        gsap.to(particlesContainer, {
          rotate: 360,
          duration: 18,
          ease: "none",
          repeat: -1,
        })
      );
    }
  };

  const introTimeline = gsap.timeline({
    defaults: {
      ease: "power3.out",
    },
  });

  introTimeline
    .fromTo(
      loader,
      {
        autoAlpha: 1,
      },
      {
        autoAlpha: 1,
        duration: 0.2,
      },
      0
    )
    .fromTo(
      logoWrap,
      {
        autoAlpha: 0,
        scale: 0.92,
        y: 14,
      },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 0.95,
      },
      0.08
    )
    .fromTo(
      ".site-loader__ring",
      {
        autoAlpha: 0,
        scale: 0.92,
        rotate: -108,
      },
      {
        autoAlpha: 1,
        scale: 1,
        rotate: -90,
        duration: 1.1,
      },
      0.14
    )
    .fromTo(
      ".site-loader__line",
      {
        autoAlpha: 0,
        scaleX: 0.88,
      },
      {
        autoAlpha: 1,
        scaleX: 1,
        duration: 0.8,
      },
      0.42
    )
    .fromTo(
      text,
      {
        autoAlpha: 0,
        y: 10,
      },
      {
        autoAlpha: 0.72,
        y: 0,
        duration: 0.8,
      },
      0.54
    );

  if (!prefersReducedMotion) {
    gsap.to(logoWrap, {
      scale: 1.04,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.85,
    });
  }

  createParticles();

  const finishLoader = () => {
    if (finished) {
      return;
    }

    finished = true;
    window.cancelAnimationFrame(rafId);

    particleTweens.forEach((tween) => tween.kill());
    gsap.killTweensOf(logoWrap);

    const exitTimeline = gsap.timeline({
      defaults: {
        ease: "power2.out",
      },
      onComplete: () => {
        body.classList.remove("is-loading");
        loader.remove();
        window.dispatchEvent(new CustomEvent("vanest:loader-complete"));
        resolveLoader();
      },
    });

    exitTimeline
      .to(
        progressState,
        {
          value: 1,
          duration: prefersReducedMotion ? 0.18 : 0.42,
          onUpdate: () => {
            setVisualProgress(progressState.value);
          },
        },
        0
      )
      .to(
        ".site-loader__particle",
        {
          autoAlpha: 0,
          scale: 0.2,
          duration: 0.28,
          stagger: 0.02,
        },
        0
      )
      .to(
        logoWrap,
        {
          scale: 1.06,
          duration: 0.36,
        },
        0.08
      )
      .to(
        loader,
        {
          autoAlpha: 0,
          duration: prefersReducedMotion ? 0.24 : 0.68,
          ease: "power2.inOut",
        },
        prefersReducedMotion ? 0.08 : 0.28
      );
  };

  const progressLoop = (now) => {
    const elapsed = now - startTime;
    const baseline = prefersReducedMotion
      ? Math.min(elapsed / minDuration, 0.94)
      : Math.min(elapsed / minDuration, 0.9);
    const target = pageReady ? 1 : baseline;
    const lerpFactor = prefersReducedMotion ? 0.2 : 0.1;

    progressState.value += (target - progressState.value) * lerpFactor;
    setVisualProgress(progressState.value);

    if (pageReady && elapsed >= minDuration) {
      finishLoader();
      return;
    }

    rafId = window.requestAnimationFrame(progressLoop);
  };

  window.addEventListener(
    "load",
    () => {
      pageReady = true;
    },
    { once: true }
  );

  rafId = window.requestAnimationFrame(progressLoop);
})();
