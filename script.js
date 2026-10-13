// Footer year, so it never goes stale.
const year = document.getElementById("year");
if (year) {
    year.textContent = new Date().getFullYear();
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

// Add your own scripts below.
