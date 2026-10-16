(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#main-nav");
  function closeMenu() {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "打开导航");
  }
  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigation.classList.contains("open")) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".header")) closeMenu();
  });
  matchMedia("(min-width: 601px)").addEventListener("change", closeMenu);

  const slides = [...document.querySelectorAll(".hero-slide")];
  const slideButtons = [...document.querySelectorAll("[data-slide]")];
  let activeSlide = 0;
  function showSlide(index) {
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== activeSlide;
    });
    slideButtons.forEach((button, i) => {
      button.classList.toggle("selected", i === activeSlide);
      button.setAttribute("aria-pressed", String(i === activeSlide));
    });
    document.querySelector(".hero-counter b").textContent = String(
      activeSlide + 1,
    ).padStart(2, "0");
  }
  if (slides.length) {
    slideButtons.forEach((button) =>
      button.addEventListener("click", () =>
        showSlide(Number(button.dataset.slide)),
      ),
    );
    document
      .querySelector(".hero-prev")
      .addEventListener("click", () => showSlide(activeSlide - 1));
    document
      .querySelector(".hero-next")
      .addEventListener("click", () => showSlide(activeSlide + 1));
  }
  let toastTimer;
  function toast(message) {
    const el = document.querySelector(".toast");
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("visible"), 2600);
  }
  document.querySelectorAll("[data-copy-email]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyEmail);
        toast("邮箱已复制，期待你的来信。");
      } catch {
        toast("暂时无法复制，请选中邮箱地址手动复制。");
      }
    });
  });
  const dialog = document.querySelector("#search-dialog"),
    input = document.querySelector("#search-input"),
    status = document.querySelector("#search-status"),
    results = document.querySelector("#search-results");
  let catalog, pending;
  async function loadCatalog() {
    if (catalog) return catalog;
    pending ||= fetch(dialog.dataset.index)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
    catalog = await pending;
    return catalog;
  }
  async function search() {
    const query = input.value.trim().toLocaleLowerCase();
    results.replaceChildren();
    if (!query) {
      status.textContent = "输入关键词，探索所有文章。";
      return;
    }
    status.textContent = "正在检索存档…";
    try {
      await loadCatalog();
      if (input.value.trim().toLocaleLowerCase() !== query) return;
      const words = query.split(/\s+/);
      const matches = catalog.filter((post) =>
        words.every((word) =>
          `${post.title} ${post.tags.join(" ")} ${post.text}`
            .toLocaleLowerCase()
            .includes(word),
        ),
      );
      status.textContent = matches.length
        ? `找到 ${matches.length} 篇文章`
        : "这个区域还未探索。换一个关键词试试？";
      results.replaceChildren();
      matches.forEach((post) => {
        const a = document.createElement("a"),
          title = document.createElement("strong"),
          excerpt = document.createElement("p");
        a.href = dialog.dataset.root + post.path;
        title.textContent = post.title;
        excerpt.textContent = post.text.replace(/\s+/g, " ").slice(0, 105);
        a.append(title, excerpt);
        results.append(a);
      });
    } catch {
      if (input.value.trim().toLocaleLowerCase() === query)
        status.textContent = "加载失败，请检查网络后重新输入关键词。";
    }
  }
  function openSearch() {
    if (!dialog.open) dialog.showModal();
    input.focus();
  }
  document.querySelector(".search-open").addEventListener("click", openSearch);
  document
    .querySelector(".search-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
  input.addEventListener("input", search);
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) &&
      !event.target.isContentEditable
    ) {
      event.preventDefault();
      openSearch();
    }
  });
  const topButton = document.querySelector(".floating-top");
  const readingProgress = document.querySelector(".reading-progress");
  function updateScroll() {
    topButton.classList.toggle("visible", scrollY > 500);
    if (readingProgress)
      readingProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)))})`;
  }
  addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();
  topButton.addEventListener("click", () =>
    scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    }),
  );
  const imageDialog = document.querySelector("#image-dialog");
  document
    .querySelector(".image-close")
    .addEventListener("click", () => imageDialog.close());
  imageDialog.addEventListener("click", (event) => {
    if (event.target === imageDialog) imageDialog.close();
  });
  document.querySelectorAll(".prose img").forEach((img) => {
    if (img.closest("a")) return;
    const button = document.createElement("button");
    button.className = "zoom-image";
    button.setAttribute("aria-label", `放大查看：${img.alt || "文章配图"}`);
    img.before(button);
    button.append(img);
    button.addEventListener("click", () => {
      const preview = imageDialog.querySelector("img");
      preview.src = img.currentSrc || img.src;
      preview.alt = img.alt;
      imageDialog.querySelector("p").textContent = img.alt || "文章配图";
      imageDialog.showModal();
    });
  });
  document
    .querySelectorAll(".prose figure.highlight, .prose > pre")
    .forEach((block) => {
      const button = document.createElement("button");
      button.className = "copy-code";
      button.textContent = "复制";
      button.setAttribute("aria-label", "复制代码");
      button.addEventListener("click", async () => {
        const code = block.querySelector(".code pre, code");
        const text = code
          ? code.innerText
          : [...block.childNodes]
              .filter((n) => n !== button)
              .map((n) => n.textContent)
              .join("");
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "已复制 ✓";
          setTimeout(() => (button.textContent = "复制"), 1800);
        } catch {
          toast("复制未获授权，请选中代码手动复制。");
        }
      });
      block.append(button);
    });
  const diagrams = [
    ...document.querySelectorAll(
      ".prose code.language-mermaid, .prose code.hljs.mermaid, .prose code.mermaid",
    ),
  ];
  if (diagrams.length) {
    const script = document.createElement("script");
    script.src = dialog.dataset.root + "assets/mermaid.min.js";
    script.onload = async () => {
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
        suppressErrorRendering: true,
      });
      for (const [index, code] of diagrams.entries()) {
        const original = code.closest("figure.highlight") || code.closest("pre");
        try {
          const { svg } = await window.mermaid.render(
            `journal-diagram-${index}`,
            code.innerText,
          );
          const region = document.createElement("div");
          region.className = "diagram";
          region.tabIndex = 0;
          region.setAttribute("role", "region");
          region.setAttribute("aria-label", "流程图，可横向滚动");
          region.innerHTML = svg;
          const details = document.createElement("details");
          details.className = "diagram-source";
          const summary = document.createElement("summary");
          summary.textContent = "查看图表源码";
          details.append(summary);
          original.replaceWith(region, details);
          details.append(original);
        } catch {
          const note = document.createElement("p");
          note.className = "diagram-note";
          note.textContent = "此图表保留为源码，可复制查看。";
          original.before(note);
        }
      }
    };
    script.onerror = () => toast("图表加载失败，已保留完整源码。");
    document.head.append(script);
  }
})();
