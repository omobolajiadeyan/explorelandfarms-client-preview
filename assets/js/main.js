(function () {
  "use strict";

  // Branded loading state with a guaranteed escape hatch
  var finishLoading = function () {
    document.body.classList.add("is-ready");
  };
  if (document.readyState === "complete") {
    window.setTimeout(finishLoading, 250);
  } else {
    window.addEventListener("load", function () {
      window.setTimeout(finishLoading, 250);
    }, { once: true });
  }
  window.setTimeout(finishLoading, 2200);

  // Header scroll state
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        document.body.classList.remove("nav-open");
        navLinks.querySelectorAll(".nav-group[open]").forEach(function (group) {
          group.removeAttribute("open");
        });
      });
    });
  }

  // Scroll-reveal
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Quiet loading treatment for lazy images
  document.querySelectorAll("img[loading='lazy']").forEach(function (img) {
    var frame = img.closest(".pillar-media, .property-media, .insight-media, .gallery-card");
    if (!frame) return;
    frame.classList.add("image-loading");
    var markReady = function () {
      frame.classList.add("image-ready");
      window.setTimeout(function () {
        frame.classList.remove("image-loading");
      }, 500);
    };
    if (img.complete) markReady();
    else {
      img.addEventListener("load", markReady, { once: true });
      img.addEventListener("error", markReady, { once: true });
    }
  });

  // Stagger children automatically within [data-stagger]
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var step = parseInt(group.getAttribute("data-stagger"), 10) || 80;
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--reveal-delay", i * step + "ms");
    });
  });

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Active nav link — highlight whichever section of the site we're in
  var path = window.location.pathname.replace(/\/index\.html$/, "/");
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    var hrefPath = href.split("#")[0];
    if (hrefPath === "/" ? path === "/" : path.indexOf(hrefPath) === 0) {
      a.classList.add("is-active");
    }
  });

  // Promote an active submenu item to its parent category.
  document.querySelectorAll(".nav-group").forEach(function (group) {
    if (group.querySelector(".nav-submenu .is-active")) {
      var summary = group.querySelector("summary");
      if (summary) summary.classList.add("is-active");
    }
  });

  // Keep desktop dropdowns tidy and keyboard-dismissible.
  document.addEventListener("click", function (event) {
    document.querySelectorAll(".nav-group[open]").forEach(function (group) {
      if (!group.contains(event.target)) group.removeAttribute("open");
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".nav-group[open]").forEach(function (group) {
      group.removeAttribute("open");
    });
  });

  // Homepage reading progress — a lightweight replacement for plugin-era effects
  var progressBar = document.querySelector(".page-progress span");
  if (progressBar) {
    var updateProgress = function () {
      var pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = pageHeight > 0 ? Math.min(window.scrollY / pageHeight, 1) : 0;
      progressBar.style.transform = "scaleX(" + progress + ")";
    };
    document.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  // Animate verified site facts when the sustainability proof points enter view
  var countEls = document.querySelectorAll("[data-count]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (countEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var startedAt = performance.now();
        var duration = 1100;
        el.textContent = "0";

        var tick = function (now) {
          var elapsed = Math.min((now - startedAt) / duration, 1);
          var eased = 1 - Math.pow(1 - elapsed, 3);
          el.textContent = Math.round(target * eased).toString();
          if (elapsed < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.65 });

    countEls.forEach(function (el) { countObserver.observe(el); });
  }

  // Automated "On the Land" gallery with manual and pause controls
  var landGallery = document.getElementById("land-gallery");
  if (landGallery) {
    var galleryItems = Array.prototype.slice.call(landGallery.querySelectorAll(".gallery-card"));
    var galleryPrev = document.querySelector(".gallery-prev");
    var galleryNext = document.querySelector(".gallery-next");
    var galleryToggle = document.querySelector(".gallery-toggle");
    var galleryToggleIcon = galleryToggle ? galleryToggle.querySelector("i") : null;
    var galleryProgress = document.querySelector(".gallery-progress span");
    var galleryTimer = null;
    var galleryPaused = reduceMotion;
    var galleryInView = false;
    var galleryInteracting = false;

    var updateGalleryProgress = function () {
      if (!galleryProgress) return;
      var maxScroll = landGallery.scrollWidth - landGallery.clientWidth;
      var value = maxScroll > 0 ? landGallery.scrollLeft / maxScroll : 0;
      galleryProgress.style.transform = "scaleX(" + Math.max(0, Math.min(value, 1)) + ")";
    };

    var updateGalleryToggle = function () {
      if (!galleryToggle) return;
      galleryToggle.classList.toggle("is-paused", galleryPaused);
      galleryToggle.setAttribute(
        "aria-label",
        galleryPaused ? "Start automatic gallery" : "Pause automatic gallery"
      );
      if (galleryToggleIcon) {
        galleryToggleIcon.className = galleryPaused ? "bi bi-play-fill" : "bi bi-pause-fill";
      }
    };

    var galleryStep = function () {
      if (galleryItems.length < 2) return landGallery.clientWidth * 0.8;
      return galleryItems[1].offsetLeft - galleryItems[0].offsetLeft;
    };

    var moveGallery = function (direction) {
      var step = galleryStep();
      var maxScroll = landGallery.scrollWidth - landGallery.clientWidth;
      var nextLeft = landGallery.scrollLeft + step * direction;
      if (direction > 0 && nextLeft >= maxScroll - 4) nextLeft = 0;
      if (direction < 0 && nextLeft <= 4) nextLeft = maxScroll;
      landGallery.scrollTo({
        left: nextLeft,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    };

    var scheduleGallery = function () {
      window.clearTimeout(galleryTimer);
      if (galleryPaused || !galleryInView || galleryInteracting || document.hidden) return;
      galleryTimer = window.setTimeout(function () {
        moveGallery(1);
        scheduleGallery();
      }, 3200);
    };

    if (galleryPrev) {
      galleryPrev.addEventListener("click", function () {
        moveGallery(-1);
        scheduleGallery();
      });
    }
    if (galleryNext) {
      galleryNext.addEventListener("click", function () {
        moveGallery(1);
        scheduleGallery();
      });
    }
    if (galleryToggle) {
      galleryToggle.addEventListener("click", function () {
        galleryPaused = !galleryPaused;
        updateGalleryToggle();
        scheduleGallery();
      });
    }

    landGallery.addEventListener("scroll", updateGalleryProgress, { passive: true });
    landGallery.addEventListener("mouseenter", function () {
      galleryInteracting = true;
      scheduleGallery();
    });
    landGallery.addEventListener("mouseleave", function () {
      galleryInteracting = false;
      scheduleGallery();
    });
    landGallery.addEventListener("focusin", function () {
      galleryInteracting = true;
      scheduleGallery();
    });
    landGallery.addEventListener("focusout", function () {
      galleryInteracting = false;
      scheduleGallery();
    });
    landGallery.addEventListener("pointerdown", function () {
      galleryInteracting = true;
      scheduleGallery();
    });
    window.addEventListener("pointerup", function () {
      galleryInteracting = false;
      scheduleGallery();
    });
    window.addEventListener("resize", updateGalleryProgress);
    document.addEventListener("visibilitychange", scheduleGallery);

    if ("IntersectionObserver" in window) {
      var galleryObserver = new IntersectionObserver(function (entries) {
        galleryInView = entries[0].isIntersecting;
        scheduleGallery();
      }, { threshold: 0.2 });
      galleryObserver.observe(landGallery);
    } else {
      galleryInView = true;
    }

    updateGalleryToggle();
    updateGalleryProgress();
    scheduleGallery();
  }

  // Subtle depth in the hero; pointer-capable devices only
  var heroVisual = document.querySelector(".hero-visual");
  if (heroVisual && window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    heroVisual.addEventListener("pointermove", function (event) {
      var bounds = heroVisual.getBoundingClientRect();
      var x = (event.clientX - bounds.left) / bounds.width - 0.5;
      var y = (event.clientY - bounds.top) / bounds.height - 0.5;
      heroVisual.style.setProperty("--pointer-x", (-x * 10).toFixed(2) + "px");
      heroVisual.style.setProperty("--pointer-y", (-y * 10).toFixed(2) + "px");
    });
    heroVisual.addEventListener("pointerleave", function () {
      heroVisual.style.setProperty("--pointer-x", "0px");
      heroVisual.style.setProperty("--pointer-y", "0px");
    });
  }

  // One compact support hub: instant site guidance with a clear WhatsApp handoff
  var hubMarkup = [
    '<aside class="contact-hub" aria-label="ExploreLand Farms help">',
      '<section class="contact-hub-panel" id="contact-hub-panel" role="dialog" aria-modal="false" aria-labelledby="contact-hub-heading" aria-hidden="true">',
        '<header class="contact-hub-head">',
          '<span class="contact-hub-avatar"><img src="/assets/img/brand/leaf-mark.png" alt=""></span>',
          '<span class="contact-hub-title">',
            '<strong id="contact-hub-heading">Ask ExploreLand</strong>',
            '<span>Instant guide · WhatsApp handoff</span>',
          '</span>',
        '</header>',
        '<div class="contact-hub-messages" aria-live="polite" aria-label="Conversation">',
          '<div class="hub-message">Hello! I can quickly help with our properties, farm produce, forestry, cattle, or planning a visit.</div>',
        '</div>',
        '<div class="contact-hub-quick" aria-label="Popular questions">',
          '<button type="button" data-hub-topic="properties">Properties</button>',
          '<button type="button" data-hub-topic="markets">Farm produce</button>',
          '<button type="button" data-hub-topic="forestry">Forestry</button>',
          '<button type="button" data-hub-topic="location">Visit us</button>',
        '</div>',
        '<form class="contact-hub-form">',
          '<label class="visually-hidden" for="contact-hub-input">Ask a question</label>',
          '<input id="contact-hub-input" type="text" maxlength="180" autocomplete="off" placeholder="Type a question...">',
          '<button class="contact-hub-send" type="submit" aria-label="Send question"><i class="bi bi-send-fill" aria-hidden="true"></i></button>',
        '</form>',
        '<div class="contact-hub-actions">',
          '<a class="contact-hub-whatsapp" href="https://wa.me/2348148164213?text=Hello%20ExploreLand%20Farms%2C%20I%20have%20an%20enquiry." target="_blank" rel="noopener noreferrer"><i class="bi bi-whatsapp" aria-hidden="true"></i> WhatsApp team</a>',
          '<a class="contact-hub-contact" href="/contact/">Contact page</a>',
        '</div>',
        '<p class="contact-hub-note">Instant website guide, not a live agent. Use WhatsApp for a personal response.</p>',
      '</section>',
      '<button class="contact-hub-launcher" type="button" aria-label="Open ExploreLand help" aria-expanded="false" aria-controls="contact-hub-panel">',
        '<i class="bi bi-chat-dots-fill hub-icon-chat" aria-hidden="true"></i>',
        '<i class="bi bi-x-lg hub-icon-close" aria-hidden="true"></i>',
        '<span class="contact-hub-status-dot" aria-hidden="true"></span>',
      '</button>',
    '</aside>'
  ].join("");

  document.body.insertAdjacentHTML("beforeend", hubMarkup);

  var contactHub = document.querySelector(".contact-hub");
  var hubPanel = document.querySelector(".contact-hub-panel");
  var hubLauncher = document.querySelector(".contact-hub-launcher");
  var hubMessages = document.querySelector(".contact-hub-messages");
  var hubForm = document.querySelector(".contact-hub-form");
  var hubInput = document.getElementById("contact-hub-input");

  var hubResponses = {
    properties: "We currently feature four homes in Lagos, including terrace, semidetached, and detached duplex options. Open the Properties page for prices and features, then WhatsApp the team to confirm availability.",
    markets: "Exploreland Markets connects families with locally grown vegetables, fresh meat, and dairy through our farm-to-table approach. WhatsApp the team for current availability and ordering.",
    forestry: "Our forestry work focuses on responsible planting, long-term woodland management, Gmelina cultivation, timber value, and future eco-tourism experiences.",
    cattle: "Our cattle are raised with traditional knowledge and modern welfare practices in natural, low-stress conditions for quality beef and dairy.",
    location: "ExploreLand Farms is at 20 Tewogbade, Felele, Ibadan, Oyo State, Nigeria. Please contact the team before travelling so your visit can be confirmed.",
    human: "For a personal response, use the WhatsApp team button below, call +234 814 816 4213, or open the Contact page.",
    greeting: "Hello! What would you like to explore—properties, farm produce, forestry, cattle, or visiting the farm?",
    fallback: "I can help with properties, farm produce, forestry, cattle, and visits. For anything more specific, send the team a WhatsApp message below."
  };

  var getHubResponse = function (question, preferredTopic) {
    if (preferredTopic && hubResponses[preferredTopic]) return hubResponses[preferredTopic];
    var words = question.toLowerCase();
    if (/(property|properties|house|home|duplex|estate|price|bedroom)/.test(words)) return hubResponses.properties;
    if (/(market|produce|vegetable|food|order|meat|dairy|milk|farm.to.table)/.test(words)) return hubResponses.markets;
    if (/(forest|tree|timber|gmelina|wood|tourism)/.test(words)) return hubResponses.forestry;
    if (/(cattle|cow|beef|livestock|herd)/.test(words)) return hubResponses.cattle;
    if (/(address|location|visit|direction|where)/.test(words)) return hubResponses.location;
    if (/(human|person|agent|call|phone|contact|whatsapp|staff)/.test(words)) return hubResponses.human;
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(words)) return hubResponses.greeting;
    return hubResponses.fallback;
  };

  var appendHubMessage = function (text, fromUser) {
    var message = document.createElement("div");
    message.className = "hub-message" + (fromUser ? " hub-message-user" : "");
    message.textContent = text;
    hubMessages.appendChild(message);
    hubMessages.scrollTop = hubMessages.scrollHeight;
  };

  var answerHubQuestion = function (question, preferredTopic) {
    appendHubMessage(question, true);
    window.setTimeout(function () {
      appendHubMessage(getHubResponse(question, preferredTopic), false);
    }, reduceMotion ? 0 : 280);
  };

  var setHubOpen = function (open) {
    contactHub.classList.toggle("is-open", open);
    hubLauncher.setAttribute("aria-expanded", open ? "true" : "false");
    hubLauncher.setAttribute("aria-label", open ? "Close ExploreLand help" : "Open ExploreLand help");
    hubPanel.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      window.setTimeout(function () { hubInput.focus(); }, reduceMotion ? 0 : 180);
    }
  };

  hubLauncher.addEventListener("click", function () {
    setHubOpen(!contactHub.classList.contains("is-open"));
  });
  hubForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var question = hubInput.value.trim();
    if (!question) return;
    hubInput.value = "";
    answerHubQuestion(question);
  });
  contactHub.querySelectorAll("[data-hub-topic]").forEach(function (button) {
    button.addEventListener("click", function () {
      answerHubQuestion(button.textContent, button.getAttribute("data-hub-topic"));
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && contactHub.classList.contains("is-open")) {
      setHubOpen(false);
      hubLauncher.focus();
    }
  });
  if (window.location.hash === "#chat") setHubOpen(true);
  window.addEventListener("hashchange", function () {
    if (window.location.hash === "#chat") setHubOpen(true);
  });
})();
