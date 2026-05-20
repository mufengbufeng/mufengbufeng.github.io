(function() {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileMediaQuery = window.matchMedia ? window.matchMedia("(max-width: 767px)") : { matches: false };
  var isMobile = mobileMediaQuery.matches;
  if (mobileMediaQuery.addEventListener) {
    mobileMediaQuery.addEventListener("change", function(e) {
      isMobile = e.matches;
    });
  }
  var activeObservers = [];
  var sparkPool = [];
  var decoTypes = ["block", "coin", "pipe", "star", "mushroom"];
  var pjaxCache = new Map();
  var pjaxInflight = new Map();
  var pjaxPrefetchQueue = [];
  var pjaxPrefetchQueued = new Set();
  var pjaxPrefetchTimer = 0;
  var PJAX_CACHE_LIMIT = 24;
  var PJAX_PREFETCH_LIMIT = isMobile ? 6 : 14;
  var PJAX_PREFETCH_BATCH = isMobile ? 2 : 4;
  var PJAX_PREFETCH_DELAY = isMobile ? 360 : 180;

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function initDecorations() {
    if (reduceMotion || document.querySelector(".retro-layer")) {
      return;
    }

    var layer = document.createElement("div");
    var count = isMobile ? 8 : 18;
    layer.className = "retro-layer";
    layer.setAttribute("aria-hidden", "true");

    for (var i = 0; i < count; i++) {
      var piece = document.createElement("span");
      var type = decoTypes[i % decoTypes.length];
      var size = 14 + (i % 5) * 4;
      piece.className = "retro-deco retro-deco--" + type;
      piece.style.setProperty("--x", ((i * 47) % 94 + 2) + "%");
      piece.style.setProperty("--y", ((i * 31) % 86 + 8) + "%");
      piece.style.setProperty("--size", size + "px");
      piece.style.setProperty("--duration", (5 + (i % 6)) + "s");
      piece.style.setProperty("--delay", (-1 * (i % 7)) + "s");
      piece.style.setProperty("--opacity", String(0.22 + (i % 4) * 0.08));
      layer.appendChild(piece);
    }

    document.body.appendChild(layer);
  }

  function initReveal() {
    var targets = document.querySelectorAll([
      ".index-card",
      ".list-group-item",
      ".tagcloud a",
      ".markdown-body > h2",
      ".markdown-body > h3",
      ".about-tetris",
      ".post-prevnext"
    ].join(","));

    if (!targets.length) {
      return;
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function(target) {
        target.classList.add("retro-revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries, ob) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("retro-revealed");
        ob.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px 12% 0px"
    });

    activeObservers.push(observer);

    targets.forEach(function(target, index) {
      target.classList.add("retro-reveal");
      target.style.transitionDelay = Math.min(index % 6, 5) * 45 + "ms";
      observer.observe(target);
    });
  }

  function cleanupObservers() {
    activeObservers.forEach(function(ob) {
      ob.disconnect();
    });
    activeObservers = [];
  }

  function getSparkNode() {
    var node = sparkPool.pop();
    if (!node) {
      node = document.createElement("span");
      node.className = "retro-spark";
    }
    return node;
  }

  function createSpark(x, y) {
    if (reduceMotion) {
      return;
    }

    for (var i = 0; i < 6; i++) {
      var spark = getSparkNode();
      var angle = (Math.PI * 2 * i) / 6;
      var distance = 26 + (i % 3) * 11;
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      spark.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      spark.style.setProperty("--dy", Math.sin(angle) * distance + "px");
      spark.style.background = i % 2 ? "var(--retro-yellow)" : "var(--retro-red)";
      document.body.appendChild(spark);
      window.setTimeout(function(node) {
        node.remove();
        if (sparkPool.length < 36) {
          sparkPool.push(node);
        }
      }, 720, spark);
    }
  }

  function initPressFeedback() {
    if (root.dataset.retroPressBound === "true") {
      return;
    }
    root.dataset.retroPressBound = "true";

    var selector = [
      ".index-card",
      ".list-group-item",
      ".tagcloud a",
      "#navbar .nav-link",
      "#navbar .navbar-brand",
      ".pagination a",
      ".about-tetris__controls button",
      ".btn",
      "#scroll-top-button"
    ].join(",");

    document.addEventListener("pointerdown", function(event) {
      var target = event.target.closest(selector);
      if (!target) {
        return;
      }
      target.classList.add("retro-pressing");
    }, { passive: true });

    document.addEventListener("pointerup", function(event) {
      var target = event.target.closest(selector);
      if (!target) {
        return;
      }
      target.classList.remove("retro-pressing");
      createSpark(event.clientX, event.clientY);
    }, { passive: true });

    document.addEventListener("pointercancel", function(event) {
      var target = event.target.closest(selector);
      if (target) {
        target.classList.remove("retro-pressing");
      }
    }, { passive: true });
  }

  function initNavbarState() {
    var navbar = document.getElementById("navbar");
    if (!navbar) {
      return;
    }

    var tick = false;
    var update = function() {
      navbar.classList.toggle("scrolled", window.scrollY > 24);
      tick = false;
    };

    update();
    if (navbar.dataset.retroScrollBound === "true") {
      return;
    }
    navbar.dataset.retroScrollBound = "true";

    window.addEventListener("scroll", function() {
      if (tick) {
        return;
      }
      tick = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
  }

  function normalizePath(value) {
    if (!value) {
      return "/";
    }

    var url;
    try {
      url = new URL(value, window.location.origin);
    } catch (error) {
      return "/";
    }

    if (url.origin !== window.location.origin) {
      return "";
    }

    var path = url.pathname || "/";
    path = path.replace(/\/index\.html$/i, "/");
    path = path.replace(/\/{2,}/g, "/");
    if (path.length > 1) {
      path = path.replace(/\/$/, "");
    }
    return path || "/";
  }

  function isRouteMatch(currentPath, targetPath) {
    if (!targetPath || targetPath === "javascript:") {
      return false;
    }
    if (targetPath === "/") {
      return currentPath === "/";
    }
    return currentPath === targetPath || currentPath.indexOf(targetPath + "/") === 0;
  }

  function initActiveNavbar() {
    var navbar = document.getElementById("navbar");
    if (!navbar) {
      return;
    }

    var currentPath = normalizePath(window.location.href);
    var links = Array.prototype.slice.call(navbar.querySelectorAll(".nav-link[href], .dropdown-item[href]"));
    var best = null;
    var bestLength = -1;

    links.forEach(function(link) {
      var href = link.getAttribute("href");
      if (!href || href.indexOf("javascript:") === 0 || href.charAt(0) === "#") {
        return;
      }

      var targetPath = normalizePath(href);
      if (!isRouteMatch(currentPath, targetPath)) {
        return;
      }

      if (targetPath.length > bestLength) {
        best = link;
        bestLength = targetPath.length;
      }
    });

    navbar.querySelectorAll(".is-active, .retro-nav-switched").forEach(function(node) {
      node.classList.remove("is-active", "retro-nav-switched");
      node.removeAttribute("aria-current");
    });

    if (!best) {
      return;
    }

    var activeItem = best.closest(".nav-item");
    var parentDropdown = best.closest(".dropdown");
    var parentToggle = parentDropdown && parentDropdown.querySelector(":scope > .nav-link");

    best.classList.add("is-active", "retro-nav-switched");
    if (best.classList.contains("nav-link")) {
      best.setAttribute("aria-current", "page");
    }

    if (activeItem) {
      activeItem.classList.add("is-active");
    }

    if (parentToggle && parentToggle !== best) {
      parentDropdown.classList.add("is-active");
      parentToggle.classList.add("is-active", "retro-nav-switched");
      best.setAttribute("aria-current", "page");
    }

    window.setTimeout(function() {
      navbar.querySelectorAll(".retro-nav-switched").forEach(function(node) {
        node.classList.remove("retro-nav-switched");
      });
    }, 520);
  }

  function initSearchModalPlacement() {
    var modal = document.getElementById("modalSearch");
    if (!modal) {
      return;
    }

    var moveModalToBody = function() {
      if (modal.parentNode !== document.body) {
        document.body.appendChild(modal);
      }
    };

    moveModalToBody();

    var input = modal.querySelector("#local-search-input");
    var body = modal.querySelector(".modal-body");
    var searchButton = document.querySelector("#search-btn [data-target=\"#modalSearch\"]");

    if (searchButton && searchButton.dataset.retroSearchBound !== "true") {
      searchButton.dataset.retroSearchBound = "true";
      searchButton.addEventListener("click", function() {
        moveModalToBody();
      }, true);
    }

    if (input && modal.dataset.retroFocusBound !== "true") {
      modal.dataset.retroFocusBound = "true";
      modal.addEventListener("shown.bs.modal", function() {
        window.setTimeout(function() {
          input.focus();
          input.select();
        }, 0);
      });
    }

    if (body && body.dataset.retroWheelBound !== "true") {
      body.dataset.retroWheelBound = "true";
      body.addEventListener("wheel", function(event) {
        var before = body.scrollTop;
        body.scrollTop += event.deltaY;
        if (body.scrollTop !== before) {
          event.preventDefault();
        }
      }, { passive: false });
    }
  }

  function initScrollTopButton() {
    if (root.dataset.retroScrollTopBound === "true") {
      return;
    }
    root.dataset.retroScrollTopBound = "true";

    document.addEventListener("click", function(event) {
      var button = event.target.closest("#scroll-top-button");
      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }, true);
  }

  function isSafePjaxPath(pathname) {
    return pathname === "/"
      || pathname === "/games"
      || pathname.indexOf("/page") === 0
      || pathname.indexOf("/archives") === 0
      || pathname.indexOf("/categories") === 0
      || pathname.indexOf("/tags") === 0;
  }

  function getPjaxCacheKey(url) {
    return normalizePath(url.href) + (url.search || "");
  }

  function getCurrentPjaxCacheKey() {
    return getPjaxCacheKey(new URL(window.location.href));
  }

  function setPjaxCachedHtml(key, html) {
    if (pjaxCache.has(key)) {
      pjaxCache.delete(key);
    }
    pjaxCache.set(key, html);

    while (pjaxCache.size > PJAX_CACHE_LIMIT) {
      pjaxCache.delete(pjaxCache.keys().next().value);
    }
  }

  function getPjaxCachedHtml(key) {
    if (!pjaxCache.has(key)) {
      return "";
    }

    var html = pjaxCache.get(key);
    pjaxCache.delete(key);
    pjaxCache.set(key, html);
    return html;
  }

  function canPrefetchPjax() {
    if (!window.fetch || !window.DOMParser) {
      return false;
    }

    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) {
      return true;
    }

    return !connection.saveData && !/2g/.test(connection.effectiveType || "");
  }

  function getPjaxEligibleUrl(link) {
    if (!link) {
      return null;
    }
    if (link.target && link.target !== "_self") {
      return null;
    }
    if (link.hasAttribute("download")) {
      return null;
    }

    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) {
      return null;
    }

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return null;
    }

    if (url.origin !== window.location.origin) {
      return null;
    }

    var normalizedPath = normalizePath(url.href);
    if (!isSafePjaxPath(normalizedPath)) {
      return null;
    }

    if (normalizedPath === normalizePath(window.location.href) && url.search === window.location.search) {
      return null;
    }

    return url;
  }

  function isPjaxEligibleLink(link, event) {
    if (!link || event.defaultPrevented || event.button !== 0) {
      return false;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }

    var url = getPjaxEligibleUrl(link);
    if (!url) {
      return false;
    }

    link.dataset.retroPjaxUrl = url.href;
    return true;
  }

  function fetchPjaxHtml(url) {
    var key = getPjaxCacheKey(url);
    var cachedHtml = getPjaxCachedHtml(key);
    if (cachedHtml) {
      return Promise.resolve(cachedHtml);
    }

    if (pjaxInflight.has(key)) {
      return pjaxInflight.get(key);
    }

    var request = window.fetch(url.href, {
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "retro-pjax"
      }
    })
      .then(function(response) {
        if (!response.ok) {
          throw new Error("PJAX request failed: " + response.status);
        }
        return response.text();
      })
      .then(function(html) {
        setPjaxCachedHtml(key, html);
        return html;
      })
      .finally(function() {
        pjaxInflight.delete(key);
        pjaxPrefetchQueued.delete(key);
      });

    pjaxInflight.set(key, request);
    return request;
  }

  function prefetchPjaxPage(url) {
    if (!canPrefetchPjax()) {
      return;
    }

    var key = getPjaxCacheKey(url);
    if (key === getCurrentPjaxCacheKey() || pjaxCache.has(key) || pjaxInflight.has(key)) {
      return;
    }

    fetchPjaxHtml(url).catch(function() {
      pjaxCache.delete(key);
    });
  }

  function schedulePjaxPrefetch() {
    if (pjaxPrefetchTimer || !pjaxPrefetchQueue.length) {
      return;
    }

    var run = function(deadline) {
      var started = 0;
      pjaxPrefetchTimer = 0;

      while (pjaxPrefetchQueue.length && started < PJAX_PREFETCH_BATCH) {
        if (started > 0 && deadline && typeof deadline.timeRemaining === "function" && deadline.timeRemaining() < 6) {
          break;
        }
        prefetchPjaxPage(pjaxPrefetchQueue.shift());
        started++;
      }

      if (pjaxPrefetchQueue.length) {
        window.setTimeout(schedulePjaxPrefetch, PJAX_PREFETCH_DELAY);
      }
    };

    if ("requestIdleCallback" in window) {
      pjaxPrefetchTimer = window.requestIdleCallback(run, { timeout: 1400 });
    } else {
      pjaxPrefetchTimer = window.setTimeout(run, PJAX_PREFETCH_DELAY);
    }
  }

  function queuePjaxPrefetch(url, immediate) {
    if (!canPrefetchPjax()) {
      return;
    }

    var key = getPjaxCacheKey(url);
    if (key === getCurrentPjaxCacheKey() || pjaxCache.has(key) || pjaxInflight.has(key) || pjaxPrefetchQueued.has(key)) {
      return;
    }

    pjaxPrefetchQueued.add(key);
    if (immediate) {
      prefetchPjaxPage(url);
      return;
    }

    if (pjaxPrefetchQueue.length >= PJAX_PREFETCH_LIMIT) {
      pjaxPrefetchQueued.delete(key);
      return;
    }

    pjaxPrefetchQueue.push(url);
    schedulePjaxPrefetch();
  }

  function warmPjaxPrefetchLinks(scope) {
    if (!canPrefetchPjax()) {
      return;
    }

    var selectors = [
      ".tagcloud a[href]",
      ".post-metas a[href*=\"/tags/\"]",
      ".index-btm a[href*=\"/tags/\"]",
      ".pagination a[href]",
      "#navbar a[href]"
    ].join(",");
    var links = Array.prototype.slice.call((scope || document).querySelectorAll(selectors));
    var warmed = 0;

    links.some(function(link) {
      if (warmed >= PJAX_PREFETCH_LIMIT) {
        return true;
      }

      var url = getPjaxEligibleUrl(link);
      if (!url) {
        return false;
      }

      link.dataset.retroPjaxUrl = url.href;
      queuePjaxPrefetch(url, false);
      warmed++;
      return false;
    });
  }

  function initPjaxPrefetch() {
    if (root.dataset.retroPjaxPrefetchBound !== "true") {
      root.dataset.retroPjaxPrefetchBound = "true";

      ["mouseover", "focusin", "touchstart"].forEach(function(type) {
        document.addEventListener(type, function(event) {
          var link = event.target.closest("a[href]");
          var url = getPjaxEligibleUrl(link);
          if (!url) {
            return;
          }

          link.dataset.retroPjaxUrl = url.href;
          queuePjaxPrefetch(url, true);
        }, { passive: true });
      });
    }

    warmPjaxPrefetchLinks(document);
  }

  function syncHeader(nextDoc) {
    var currentHeader = document.querySelector(".header-inner");
    var nextHeader = nextDoc.querySelector(".header-inner");
    if (currentHeader && nextHeader) {
      currentHeader.className = nextHeader.className;
      currentHeader.setAttribute("style", nextHeader.getAttribute("style") || "");
    }

    var currentBanner = document.getElementById("banner");
    var nextBanner = nextDoc.getElementById("banner");
    if (currentBanner && nextBanner) {
      currentBanner.setAttribute("style", nextBanner.getAttribute("style") || "");
      if (nextBanner.hasAttribute("parallax")) {
        currentBanner.setAttribute("parallax", nextBanner.getAttribute("parallax") || "true");
      } else {
        currentBanner.removeAttribute("parallax");
      }
    }

    var currentSubtitle = document.getElementById("subtitle");
    var nextSubtitle = nextDoc.getElementById("subtitle");
    if (currentSubtitle && nextSubtitle) {
      var typedText = nextSubtitle.getAttribute("data-typed-text");
      if (typedText) {
        currentSubtitle.setAttribute("data-typed-text", typedText);
        currentSubtitle.textContent = typedText;
      } else {
        currentSubtitle.removeAttribute("data-typed-text");
        currentSubtitle.textContent = nextSubtitle.textContent || "";
      }
    }
  }

  function refreshAfterPjax() {
    initReveal();
    initPressFeedback();
    initNavbarState();
    initActiveNavbar();
    initSearchModalPlacement();
    initPjaxPrefetch();

    if (window.Fluid && Fluid.boot && typeof Fluid.boot.refresh === "function") {
      Fluid.boot.refresh();
    }
    if (window.Fluid && Fluid.events) {
      if (typeof Fluid.events.registerIndexArticleEvent === "function") {
        Fluid.events.registerIndexArticleEvent();
      }
      if (typeof Fluid.events.registerScrollTopArrowEvent === "function") {
        Fluid.events.registerScrollTopArrowEvent();
      }
    }
  }

  function replaceMainFromDocument(nextDoc) {
    var currentMain = document.querySelector("main");
    var nextMain = nextDoc.querySelector("main");
    if (!currentMain || !nextMain) {
      return false;
    }

    var duplicateSearch = nextMain.querySelector("#modalSearch");
    if (duplicateSearch) {
      duplicateSearch.remove();
    }

    cleanupObservers();
    currentMain.replaceWith(nextMain);
    return true;
  }

  function loadPjaxPage(url, replaceHistory) {
    var currentMain = document.querySelector("main");
    if (!currentMain) {
      window.location.assign(url.href);
      return;
    }

    if (window.NProgress) {
      window.NProgress.start();
    }
    root.classList.add("retro-pjax-loading");
    currentMain.classList.add("retro-pjax-leaving");

    fetchPjaxHtml(url)
      .then(function(html) {
        var nextDoc = new DOMParser().parseFromString(html, "text/html");
        document.title = nextDoc.title || document.title;
        syncHeader(nextDoc);

        if (!replaceMainFromDocument(nextDoc)) {
          throw new Error("PJAX response has no main content");
        }

        if (replaceHistory) {
          window.history.pushState({ retroPjax: true }, document.title, url.href);
        }

        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        var newMain = document.querySelector("main");
        if (newMain) {
          newMain.classList.add("retro-pjax-entering");
          window.setTimeout(function() {
            newMain.classList.remove("retro-pjax-entering");
          }, 380);
        }
        refreshAfterPjax();
      })
      .catch(function() {
        window.location.assign(url.href);
      })
      .finally(function() {
        root.classList.remove("retro-pjax-loading");
        if (window.NProgress) {
          window.NProgress.done();
        }
      });
  }

  function initLightPjax() {
    if (document.documentElement.dataset.retroPjaxBound === "true") {
      return;
    }
    document.documentElement.dataset.retroPjaxBound = "true";

    var lastLocation = window.location.pathname + window.location.search;

    document.addEventListener("click", function(event) {
      var link = event.target.closest("a[href]");
      if (!isPjaxEligibleLink(link, event)) {
        return;
      }

      var url = new URL(link.dataset.retroPjaxUrl);
      event.preventDefault();
      lastLocation = url.pathname + url.search;
      loadPjaxPage(url, true);
    });

    window.addEventListener("popstate", function() {
      var currentLocation = window.location.pathname + window.location.search;
      if (currentLocation === lastLocation) {
        return;
      }
      lastLocation = currentLocation;

      var url = new URL(window.location.href);
      if (isSafePjaxPath(normalizePath(url.href))) {
        loadPjaxPage(url, false);
      } else {
        window.location.reload();
      }
    });
  }

  function initVisibilityPause() {
    if (root.dataset.retroVisibilityBound === "true") {
      return;
    }
    root.dataset.retroVisibilityBound = "true";

    document.addEventListener("visibilitychange", function() {
      root.classList.toggle("retro-paused", document.hidden);
    });
  }

  ready(function() {
    document.body.classList.add("retro-game-ui");
    initDecorations();
    initReveal();
    initPressFeedback();
    initNavbarState();
    initActiveNavbar();
    initSearchModalPlacement();
    initScrollTopButton();
    initLightPjax();
    initPjaxPrefetch();
    initVisibilityPause();
  });
})();
