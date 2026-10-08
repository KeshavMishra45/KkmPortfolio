(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------------------------------------------------------
     Typewriter helpers
     The full text is kept in an invisible "ghost" span so the
     layout never jumps while the live span types over it.
     --------------------------------------------------------- */
  function prepTypeTarget(el) {
    const text = el.textContent.replace(/\s+/g, " ").trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const ghost = document.createElement("span");
    ghost.className = "tw-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = text;
    const live = document.createElement("span");
    live.className = "tw-live";
    live.setAttribute("aria-hidden", "true");
    el.append(ghost, live);
    el._tw = { text, live, done: false };
  }

  function typeInto(el, speed) {
    const tw = el._tw;
    if (!tw || tw.done) return Promise.resolve();
    tw.done = true;
    if (reduceMotion) {
      tw.live.textContent = tw.text;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let i = 0;
      el.classList.add("typing");
      (function tick() {
        i += 1;
        tw.live.textContent = tw.text.slice(0, i);
        if (i < tw.text.length) {
          const ch = tw.text[i - 1];
          const pause = ch === "," || ch === "." ? speed * 6 : 0;
          setTimeout(tick, speed + Math.random() * speed * 0.6 + pause);
        } else {
          el.classList.remove("typing");
          resolve();
        }
      })();
    });
  }

  document.querySelectorAll("[data-type], [data-type-hero]").forEach(prepTypeTarget);

  /* Section headings type themselves once when scrolled into view */
  const headingObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                typeInto(entry.target, 45);
                headingObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.6 }
        )
      : null;

  document.querySelectorAll("[data-type]").forEach((el) => {
    if (headingObserver) headingObserver.observe(el);
    else typeInto(el, 0);
  });

  /* ---------------------------------------------------------
     Boot screen, then hero sequence
     --------------------------------------------------------- */
  const loader = document.getElementById("loader");

  async function runBoot() {
    if (!loader) return;
    const lines = Array.from(loader.querySelectorAll("[data-loader-line]"));
    const bar = loader.querySelector(".loader-bar span");
    const texts = lines.map((l) => l.textContent);
    lines.forEach((l) => (l.textContent = ""));
    for (let i = 0; i < lines.length; i += 1) {
      if (reduceMotion) {
        lines[i].textContent = texts[i];
      } else {
        for (let c = 1; c <= texts[i].length; c += 1) {
          lines[i].textContent = texts[i].slice(0, c);
          await sleep(16);
        }
      }
      if (bar) bar.style.width = ((i + 1) / lines.length) * 100 + "%";
      await sleep(reduceMotion ? 0 : 140);
    }
    await sleep(reduceMotion ? 0 : 250);
  }

  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });

  /* Rotating role line: types, pauses, deletes, repeats */
  async function runRoles() {
    const roleEl = document.getElementById("role");
    if (!roleEl) return;
    let roles = [];
    try {
      roles = JSON.parse(roleEl.getAttribute("data-roles") || "[]");
    } catch (e) {
      roles = [];
    }
    if (reduceMotion || roles.length < 2) return;
    // The markup holds the first role as a no-JS fallback; start from empty.
    let idx = 0;
    roleEl.textContent = "";
    for (;;) {
      const role = roles[idx % roles.length];
      for (let c = 1; c <= role.length; c += 1) {
        roleEl.textContent = role.slice(0, c);
        await sleep(55 + Math.random() * 40);
      }
      await sleep(1700);
      for (let c = role.length - 1; c >= 0; c -= 1) {
        roleEl.textContent = role.slice(0, c);
        await sleep(28);
      }
      await sleep(300);
      idx += 1;
    }
  }

  async function runHero() {
    const get = (k) => document.querySelector('[data-type-hero="' + k + '"]');
    const hello = get("hello");
    const name = get("name");
    const summary = get("summary");
    if (hello) await typeInto(hello, 55);
    if (name) await typeInto(name, 70);
    runRoles();
    if (summary) await typeInto(summary, 11);
    startCounters();
  }

  Promise.all([runBoot(), pageLoaded]).then(() => {
    if (loader) loader.classList.add("hide");
    runHero();
  });

  /* ---------------------------------------------------------
     Stat counters
     --------------------------------------------------------- */
  let countersStarted = false;
  function startCounters() {
    if (countersStarted) return;
    countersStarted = true;
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      const duration = 1400;
      const start = performance.now();
      (function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(frame);
      })(start);
    });
  }

  /* ---------------------------------------------------------
     Smooth scroll for in-page links
     --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]:not([data-pending])').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------- */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  function setNav(open) {
    if (!navToggle || !navLinks) return;
    navLinks.classList.toggle("show", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });
    navLinks.addEventListener("click", (e) => {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav")) setNav(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNav(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) setNav(false);
    });
  }

  /* ---------------------------------------------------------
     Scroll: progress bar, active nav link, back-to-top
     --------------------------------------------------------- */
  const progress = document.querySelector(".scroll-progress span");
  const toTop = document.querySelector(".to-top");
  const sections = document.querySelectorAll("main section[id]");
  const navAnchors = document.querySelectorAll(".nav-links a");
  let ticking = false;

  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    if (toTop) toTop.hidden = window.scrollY < 600;

    let currentId = "";
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 140 && rect.bottom >= 140) currentId = section.id;
    });
    navAnchors.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === "#" + currentId);
    });
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  window.addEventListener("load", onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------
     Reveal on scroll (staggered inside grids)
     --------------------------------------------------------- */
  const revealEls = document.querySelectorAll(
    ".hero-panel, .stats, .section-content, .card, .timeline-item"
  );

  const revealObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12 }
        )
      : null;

  revealEls.forEach((el) => {
    // .timeline-item wraps a .card; reveal only the outer item
    if (el.classList.contains("card") && el.closest(".timeline-item")) return;
    const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
    el.style.setProperty("--d", Math.min(siblings.indexOf(el), 4) * 90 + "ms");
    el.classList.add("reveal");
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add("visible");
  });

  /* ---------------------------------------------------------
     Card spotlight follows the pointer
     --------------------------------------------------------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-spot]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* ---------------------------------------------------------
     Project links: "Live Demo" buttons without a URL yet
     --------------------------------------------------------- */
  const toast = document.querySelector(".toast");
  let toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  /* ---------------------------------------------------------
     Project screenshot slideshows
     - desktop: plays while hovered / focused
     - touch: plays while on screen, swipe or tap dots to navigate
     --------------------------------------------------------- */
  document.querySelectorAll("[data-slides]").forEach((box) => {
    const slides = Array.from(box.querySelectorAll(".shots-track img"));
    const dotsEl = box.querySelector(".shots-dots");
    const countEl = box.querySelector(".shots-count");
    if (slides.length < 2) return;
    const canHover = window.matchMedia("(hover: hover)").matches;
    const DELAY = 1700;
    let index = 0;
    let timer = null;
    let inView = false;
    let hovering = false;

    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Show screenshot " + (i + 1));
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        show(i);
        restart();
      });
      dotsEl.appendChild(b);
      return b;
    });
    dotsEl.removeAttribute("aria-hidden");

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
      dots.forEach((d, n) => d.classList.toggle("is-active", n === index));
      if (countEl) countEl.textContent = index + 1 + " / " + slides.length;
    }
    function stop() {
      clearInterval(timer);
      timer = null;
    }
    function start() {
      if (reduceMotion || timer) return;
      timer = setInterval(() => show(index + 1), DELAY);
    }
    function restart() {
      stop();
      if ((canHover && hovering) || (!canHover && inView)) start();
    }
    function warm() {
      slides.forEach((s) => (s.loading = "eager"));
    }

    show(0);

    if (canHover) {
      box.addEventListener("pointerenter", () => {
        hovering = true;
        warm();
        show(index + 1);
        start();
      });
      box.addEventListener("pointerleave", () => {
        hovering = false;
        stop();
        show(0);
      });
    } else if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            inView = en.isIntersecting;
            if (inView) {
              warm();
              start();
            } else stop();
          });
        },
        { threshold: 0.6 }
      ).observe(box);
    }

    box.addEventListener("focus", () => {
      warm();
      start();
    });
    box.addEventListener("blur", () => restart());
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { show(index + 1); restart(); }
      if (e.key === "ArrowLeft") { show(index - 1); restart(); }
    });

    // swipe on touch screens
    let sx = 0, sy = 0, tracking = false;
    box.addEventListener("touchstart", (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    box.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        show(dx < 0 ? index + 1 : index - 1);
        restart();
      }
    }, { passive: true });
  });

  document.querySelectorAll("[data-pending]").forEach((a) => {
    a.classList.add("is-pending");
    a.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("Live demo link coming soon.");
    });
  });


  /* ---------------------------------------------------------
     Easter egg: tap the profile photo three times for Tic Tac Toe
     --------------------------------------------------------- */
  (function ticTacToe() {
    const overlay = document.getElementById("game");
    const boardEl = document.getElementById("board");
    const statusEl = document.getElementById("game-status");
    const menuEl = document.getElementById("game-menu");
    const photo = document.querySelector(".hero-photo");
    if (!overlay || !boardEl || !photo) return;

    const LINES = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    const score = { you: 0, draw: 0, cpu: 0 };
    const scoreEls = {
      you: document.getElementById("score-you"),
      draw: document.getElementById("score-draw"),
      cpu: document.getElementById("score-cpu"),
    };
    const inertTargets = document.querySelectorAll("header, main, footer");
    let cells = [];
    let board = [];
    let over = false;
    let busy = false;
    let cpuTimer;

    // Build the 3x3 grid once
    for (let i = 0; i < 9; i += 1) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cell";
      b.setAttribute("role", "gridcell");
      b.addEventListener("click", () => playerMove(i));
      boardEl.appendChild(b);
      cells.push(b);
    }

    function label(i, v) {
      const pos = "Row " + (Math.floor(i / 3) + 1) + ", column " + ((i % 3) + 1);
      return pos + ", " + (v ? v : "empty");
    }

    function reset() {
      clearTimeout(cpuTimer);
      board = Array(9).fill("");
      over = false;
      busy = false;
      cells.forEach((c, i) => {
        c.textContent = "";
        c.className = "cell";
        c.disabled = false;
        c.setAttribute("aria-label", label(i, ""));
      });
      menuEl.hidden = true;
      statusEl.textContent = "Your move.";
    }

    function winnerLine(b) {
      for (const line of LINES) {
        const [x, y, z] = line;
        if (b[x] && b[x] === b[y] && b[x] === b[z]) return line;
      }
      return null;
    }

    function place(i, mark) {
      board[i] = mark;
      const c = cells[i];
      c.textContent = mark;
      c.classList.add(mark.toLowerCase(), "pop");
      c.disabled = true;
      c.setAttribute("aria-label", label(i, mark));
    }

    function finish(result, line) {
      over = true;
      if (line) line.forEach((i) => cells[i].classList.add("win"));
      cells.forEach((c) => (c.disabled = true));
      score[result] += 1;
      scoreEls[result].textContent = score[result];
      statusEl.textContent =
        result === "you" ? "You win! Nicely played." : result === "cpu" ? "I win this round." : "It's a draw.";
      setTimeout(
        () => {
          menuEl.hidden = false;
          const back = document.getElementById("game-back");
          if (back && !overlay.hidden) back.focus();
        },
        reduceMotion ? 0 : 700
      );
    }

    function check(mark) {
      const line = winnerLine(board);
      if (line) {
        finish(mark === "X" ? "you" : "cpu", line);
        return true;
      }
      if (board.every(Boolean)) {
        finish("draw", null);
        return true;
      }
      return false;
    }

    function findLineMove(mark) {
      for (const line of LINES) {
        const vals = line.map((i) => board[i]);
        if (vals.filter((v) => v === mark).length === 2 && vals.includes("")) {
          return line[vals.indexOf("")];
        }
      }
      return -1;
    }

    // Smart but beatable: sometimes plays a random square
    function cpuChoice() {
      const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      if (Math.random() < 0.22) return empty[Math.floor(Math.random() * empty.length)];
      let m = findLineMove("O");
      if (m < 0) m = findLineMove("X");
      if (m < 0 && !board[4]) m = 4;
      if (m < 0) {
        const corners = [0, 2, 6, 8].filter((i) => !board[i]);
        if (corners.length) m = corners[Math.floor(Math.random() * corners.length)];
      }
      return m >= 0 ? m : empty[Math.floor(Math.random() * empty.length)];
    }

    function playerMove(i) {
      if (over || busy || board[i]) return;
      place(i, "X");
      if (check("X")) return;
      busy = true;
      statusEl.textContent = "Thinking...";
      cpuTimer = setTimeout(
        () => {
          place(cpuChoice(), "O");
          busy = false;
          if (!check("O")) statusEl.textContent = "Your move.";
        },
        reduceMotion ? 0 : 450
      );
    }

    function openGame() {
      reset();
      overlay.hidden = false;
      document.body.style.overflow = "hidden";
      inertTargets.forEach((el) => el.setAttribute("inert", ""));
      const first = cells[0];
      if (first) first.focus();
    }

    function closeGame() {
      clearTimeout(cpuTimer);
      overlay.hidden = true;
      document.body.style.overflow = "";
      inertTargets.forEach((el) => el.removeAttribute("inert"));
    }

    document.getElementById("game-back").addEventListener("click", closeGame);
    document.getElementById("game-again").addEventListener("click", () => {
      reset();
      cells[0].focus();
    });
    overlay.querySelector(".game-exit").addEventListener("click", closeGame);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) closeGame();
    });

    // Triple tap / triple click on the photo (each tap within 650ms of the last)
    let taps = 0;
    let tapTimer;
    photo.addEventListener("click", () => {
      taps += 1;
      clearTimeout(tapTimer);
      if (taps >= 3) {
        taps = 0;
        openGame();
        return;
      }
      tapTimer = setTimeout(() => (taps = 0), 650);
    });

    // Footer clue: tapping the copyright line reveals it on touch screens
    const copy = document.querySelector(".footer-copy");
    const clue = document.querySelector(".clue");
    if (copy && clue) {
      copy.addEventListener("click", () => clue.classList.toggle("show"));
    }
  })();

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Contact form: opens the mail client with a pre-filled message
     --------------------------------------------------------- */
  window.handleContactSubmit = function (event) {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    const subject = encodeURIComponent("Portfolio contact from " + (name || "Visitor"));
    const body = encodeURIComponent(
      [
        "Name: " + (name || "N/A"),
        "Email: " + (email || "N/A"),
        "",
        "Message:",
        message || "(No message provided)",
      ].join("\n")
    );

    window.location.href =
      "mailto:keshavmishradeoghar2021@gmail.com?subject=" + subject + "&body=" + body;
    return false;
  };
})();
