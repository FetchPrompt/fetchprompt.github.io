// Footer year, so it never goes stale.
const year = document.getElementById("year");
if (year) {
    year.textContent = new Date().getFullYear();
}

// First screen: the hero stretches so the header is at the top and the white
// skills strip sits at the bottom edge. Measure both and hand the height to CSS.
const siteHeader = document.querySelector(".site-header");
const skillsStrip = document.querySelector(".ticker");

function measureChrome() {
    if (!siteHeader || !skillsStrip) return;
    const h = siteHeader.offsetHeight + skillsStrip.offsetHeight;
    document.documentElement.style.setProperty("--chrome-h", h + "px");
}

measureChrome();
window.addEventListener("resize", measureChrome);
window.addEventListener("load", measureChrome);
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureChrome);
}

// Typing effect for the main statement. Every letter is wrapped in a span and
// switched on one by one; highlighted keywords (.kw) swipe their colour in
// when the typing reaches them. Without JS (or with reduced motion) the text
// is simply shown.
const statement = document.querySelector(".statement");
const TYPE_SPEED = 26;      // ms per letter
const TYPE_PAUSE = 150;     // extra ms after , . !

function splitIntoLetters(root) {
    const segmenter = window.Intl && Intl.Segmenter
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
        : null;
    const graphemes = (text) => segmenter
        ? [...segmenter.segment(text)].map((s) => s.segment)
        : Array.from(text);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    const letters = [];
    textNodes.forEach((node) => {
        const insideKeyword = node.parentElement.closest(".kw");
        const frag = document.createDocumentFragment();

        graphemes(node.nodeValue.replace(/\s+/g, " ")).forEach((g) => {
            if (g === " " && !insideKeyword) {
                frag.append(document.createTextNode(g));   // plain space keeps wrapping natural
                return;
            }
            const span = document.createElement("span");
            span.className = "ch";
            span.textContent = g;
            frag.append(span);
            letters.push(span);
        });

        node.replaceWith(frag);
    });
    return letters;
}

function typeStatement() {
    const letters = splitIntoLetters(statement);
    statement.classList.add("typing");

    const caret = document.createElement("span");
    caret.className = "caret";
    caret.setAttribute("aria-hidden", "true");

    let i = 0;
    (function next() {
        if (i >= letters.length) {
            setTimeout(() => caret.remove(), 1800);
            return;
        }
        const letter = letters[i++];
        const keyword = letter.closest(".kw");
        if (keyword) keyword.classList.add("on");
        letter.classList.add("on");
        letter.after(caret);
        setTimeout(next, TYPE_SPEED + (/[,.!]/.test(letter.textContent) ? TYPE_PAUSE : 0));
    })();
}

if (statement && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Start when the statement's reveal animation starts (it waits for the photo),
    // or after a few seconds at the latest.
    let started = false;
    const start = () => {
        if (started) return;
        started = true;
        typeStatement();
    };
    statement.addEventListener("animationstart", start, { once: true });
    setTimeout(start, 4000);
}

// Skills ticker: duplicate the list once so the loop has no gap,
// and number the items so they can appear one after another.
const marquee = document.querySelector(".marquee");
const track = marquee && marquee.querySelector(".marquee-track");

if (track) {
    [...track.children].forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        track.append(copy);
    });

    [...track.children].forEach((item, i) => item.style.setProperty("--i", i));
    marquee.classList.add("is-running");
}

// Reveal on load / scroll. Every element with data-reveal rises in once it is
// visible. On load the photo goes first and everything else waits for it.
const PHOTO_HEAD_START = 900;   // ms between the photo and the rest
const STAGGER = 120;            // ms between neighbouring elements

const revealItems = [...document.querySelectorAll("[data-reveal]")];

if ("IntersectionObserver" in window) {
    let firstBatch = true;

    const seen = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => entry.target)
            .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

        let k = 0;
        visible.forEach((el) => {
            let delay = 0;
            if (el.dataset.reveal !== "photo") {
                delay = (firstBatch ? PHOTO_HEAD_START : 0) + k * STAGGER;
                k++;
            }
            el.style.setProperty("--d", delay + "ms");
            el.classList.add("is-in");
            seen.unobserve(el);
        });

        firstBatch = false;
    }, { threshold: 0.15 });

    revealItems.forEach((el) => seen.observe(el));
} else {
    revealItems.forEach((el) => el.classList.add("is-in"));
}

// Word-by-word rise: wrap each word of [data-words] so CSS can slide it up
// out of a mask (used by the first line of the About text).
document.querySelectorAll("[data-words]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach((word, i) => {
        const outer = document.createElement("span");
        const inner = document.createElement("span");
        outer.className = "w";
        inner.textContent = word;
        inner.style.setProperty("--i", i);
        outer.append(inner);
        el.append(outer);
        if (i < words.length - 1) el.append(" ");
    });
});

// Photo viewer: click the profile photo to see it full screen over a blurred
// page. Close with the X, a click anywhere, or Escape.
const photoButton = document.querySelector(".pfp-button");
const lightbox = document.getElementById("lightbox");

if (photoButton && lightbox) {
    const closeButton = lightbox.querySelector(".lightbox-close");
    let returnFocusTo = null;

    function openLightbox() {
        returnFocusTo = document.activeElement;
        lightbox.hidden = false;
        document.documentElement.classList.add("lightbox-open");
        requestAnimationFrame(() => {      // next frame, so the fade-in can run
            lightbox.classList.add("is-open");
            closeButton.focus();
        });
    }

    function closeLightbox() {
        lightbox.classList.remove("is-open");
        document.documentElement.classList.remove("lightbox-open");
        setTimeout(() => { lightbox.hidden = true; }, 260);   // after the fade-out
        if (returnFocusTo) returnFocusTo.focus();
    }

    photoButton.addEventListener("click", openLightbox);
    lightbox.addEventListener("click", closeLightbox);        // X, photo or dimmed area

    document.addEventListener("keydown", (event) => {
        if (lightbox.hidden) return;
        if (event.key === "Escape") closeLightbox();
        if (event.key === "Tab") {                            // keep focus inside the viewer
            event.preventDefault();
            closeButton.focus();
        }
    });
}

// Add your own scripts below.
