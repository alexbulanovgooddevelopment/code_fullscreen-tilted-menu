document.addEventListener("DOMContentLoaded", () => {
  const MAX_PREVIEW_IMAGES = 3;
  const CLIP_CLOSED = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";
  const CLIP_OPEN = "polygon(0% 0%, 100% 0%, 100% 175%, 0% 100%)";

  const page = document.querySelector("main");
  const menu = document.querySelector(".menu");
  const menuContent = document.querySelector(".menu-content");
  const menuToggle = document.querySelector(".menu-toggle");
  const toggleOpen = document.querySelector(".toggle-open");
  const toggleClose = document.querySelector(".toggle-close");
  const preview = document.querySelector(".menu-preview");
  const defaultImg = document.querySelector(".menu-img");
  const navLinks = document.querySelectorAll(".nav-link");
  const socialLinks = document.querySelectorAll(".social-link");

  if (!page || !menu || !menuContent || !menuToggle || !preview || !defaultImg)
    return;

  const menuLinks = [...navLinks, ...socialLinks];

  let isOpen = false;
  let activeSrc = defaultImg.getAttribute("src");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const tl = gsap.timeline({
    paused: true,
    defaults: { duration: 1.25, ease: "power4.inOut" },
    // Снимаем блокировку только после завершения анимации закрытия
    onReverseComplete: () => {
      document.documentElement.classList.remove("is-locked");
      menuContent.scrollTop = 0;
      resetPreview();
    },
  });

  // Ссылки и подпись живут отдельно, чтобы при закрытии панель
  // начинала двигаться сразу, а не ждала окончания их анимации
  const linksTl = gsap.timeline({ paused: true });
  const toggleTl = gsap.timeline({
    paused: true,
    defaults: { duration: 0.5, ease: "power2.inOut" },
  });

  if (reduceMotion) {
    // Без движения: меню и подпись просто проявляются
    gsap.set(menu, { clipPath: CLIP_OPEN, autoAlpha: 0 });
    gsap.set(toggleClose, { opacity: 0 });

    tl.to(menu, { autoAlpha: 1, duration: 0.25, ease: "none" });
    toggleTl
      .to(toggleOpen, { opacity: 0 }, 0)
      .to(toggleClose, { opacity: 1 }, 0);
  } else {
    // Начальные состояния
    gsap.set(menu, { clipPath: CLIP_CLOSED });
    gsap.set(menuContent, {
      x: -100,
      y: -100,
      rotation: -15,
      scale: 1.5,
      opacity: 0.25,
    });
    gsap.set(menuLinks, { yPercent: 120, opacity: 0.25 });
    gsap.set(toggleClose, { x: -5, y: 10, rotation: 5, opacity: 0 });

    tl.to(page, { x: 300, y: 450, rotation: 10, scale: 1.5 }, 0)
      .to(menuContent, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }, 0)
      .to(menu, { clipPath: CLIP_OPEN }, 0);

    linksTl.to(
      menuLinks,
      {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      },
      0.75,
    );

    toggleTl
      .to(toggleOpen, { x: -5, y: -10, rotation: -5, opacity: 0 }, 0)
      .to(toggleClose, { x: 0, y: 0, rotation: 0, opacity: 1 }, 0.25);
  }

  function setMenuOpen(open) {
    isOpen = open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    if (open) {
      document.documentElement.classList.add("is-locked");
      menu.inert = false;
      tl.timeScale(1).play();
      linksTl.timeScale(1).play();
      toggleTl.play();
    } else {
      // Возвращаем фокус до inert, иначе он потеряется вместе с меню
      if (menu.contains(document.activeElement)) menuToggle.focus();
      menu.inert = true;
      tl.timeScale(1.6).reverse(); // закрытие быстрее открытия
      linksTl.timeScale(3).reverse(); // ссылки исчезают раньше панели
      toggleTl.reverse();
    }
  }

  function showPreview(src) {
    if (!isOpen || !src || src === activeSrc) return;
    activeSrc = src;

    const img = document.createElement("img");
    img.className = "menu-img";
    img.src = src;
    img.alt = "";
    preview.appendChild(img);

    while (preview.children.length > MAX_PREVIEW_IMAGES) {
      preview.firstElementChild.remove();
    }

    gsap.fromTo(
      img,
      reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.25, rotation: 10 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.75, ease: "power2.out" },
    );
  }

  function resetPreview() {
    activeSrc = defaultImg.getAttribute("src");
    preview.replaceChildren(defaultImg);
  }

  menuToggle.addEventListener("click", () => setMenuOpen(!isOpen));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) setMenuOpen(false);
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a") && isOpen) setMenuOpen(false);
  });

  navLinks.forEach((link) => {
    const { img: src } = link.dataset;

    // Загружаем заранее, чтобы картинка не появлялась с задержкой
    if (src) new Image().src = src;

    link.addEventListener("pointerenter", () => showPreview(src));
    link.addEventListener("focus", () => showPreview(src));
  });
});
