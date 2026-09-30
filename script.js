// Loader screen
const loader = document.getElementById("loader");
window.addEventListener("load", () => {
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add("hide");
  }, 1400);
});

// Smooth scroll for in-page links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const targetId = anchor.getAttribute("href");
    if (!targetId || targetId === "#") return;
    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// Mobile navigation toggle
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.tagName.toLowerCase() === "a") {
      navLinks.classList.remove("show");
    }
  });
}

// Active nav link based on scroll position
const sections = document.querySelectorAll("section[id]");
const navAnchors = document.querySelectorAll(".nav-links a");

function updateActiveNav() {
  let currentId = "";

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 120 && rect.bottom >= 120) {
      currentId = section.id;
    }
  });

  navAnchors.forEach((a) => {
    const hrefId = a.getAttribute("href")?.replace("#", "");
    if (hrefId && hrefId === currentId) {
      a.classList.add("active");
    } else {
      a.classList.remove("active");
    }
  });
}

window.addEventListener("scroll", updateActiveNav);
window.addEventListener("load", updateActiveNav);

// Scroll reveal animations
const revealEls = document.querySelectorAll(
  ".hero-text, .hero-panel, .section, .card"
);

const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.18 }
      )
    : null;

revealEls.forEach((el) => {
  el.classList.add("reveal");
  if (observer) observer.observe(el);
});

// Dynamic footer year
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Contact form: open default mail client with pre-filled content
function handleContactSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  const subject = encodeURIComponent(`Portfolio contact from ${name || "Visitor"}`);
  const bodyLines = [
    `Name: ${name || "N/A"}`,
    `Email: ${email || "N/A"}`,
    "",
    "Message:",
    message || "(No message provided)",
  ];

  const body = encodeURIComponent(bodyLines.join("\n"));

  window.location.href = `mailto:keshavmishradeoghar2021@gmail.com?subject=${subject}&body=${body}`;

  return false;
}

