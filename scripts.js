const Cite = require("citation-js");

const CONFIG = {
    bibPath: "static/pub.bib",
    thumbnailPath: "static/thumbnail/",
    mySurname: "Wu",
    myGivenName: "Zexuan",
    journalAliases: {
        "\\aj": "<i>AJ</i>",
        "\\apj": "<i>ApJ</i>",
        "\\apjl": "<i>ApJL</i>",
        "\\apjs": "<i>ApJS</i>",
        "\\aap": "<i>A&A</i>",
        "\\aaps": "<i>A&AS</i>",
        "\\mnras": "<i>MNRAS</i>",
        "\\pasp": "<i>PASP</i>",
        "\\araa": "<i>ARA&A</i>",
        "\\nat": "<i>Nature</i>",
        "\\sci": "<i>Science</i>",
        "arXiv e-prints": "<i>arXiv e-prints</i>",
    },
};

const ani_path = "./static/ani/";
const videosGeneral = [
    // { title: "A Saturn-mass free-floating-planet event", src: "ffp_en.mp4" },
    { title: "Free-floating Planet event", src: "ffp_art.mp4" },
    { title: "Single-lens event", src: "pspl.mp4" },
    { title: "Binary-lens event ASASSN-22av", src: "22av.mp4" },
];

const videosFFP = [
    {
        title: "FFP: Earth-like lens + Sun-like source",
        src: "1Me_1Rsun_murel5.0_Dl6.mp4",
    },
    {
        title: "FFP: Earth-like lens + Giant source",
        src: "1Me_10Rsun_murel5.0_Dl6.mp4",
    },
    {
        title: "FFP: Neptune-like lens + Sun-like source",
        src: "10Me_1Rsun_murel5.0_Dl6.mp4",
    },
    {
        title: "FFP: Neptune-like lens + Giant source",
        src: "10Me_10Rsun_murel5.0_Dl6.mp4",
    },
];

// 2. Initialize
document.addEventListener("DOMContentLoaded", function () {
    loadPublications();

    // Render the two rows separately
    renderVideoRow("video-row-general", videosGeneral);
    renderVideoRow("video-row-ffp", videosFFP);
});

function renderVideoRow(containerId, videoList) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = videoList
        .map(
            (video) => `
        <div class="video-wrapper">
            <video controls preload="metadata">
                <source src="${ani_path + video.src}" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div class="video-title">${video.title}</div>
        </div>
    `,
        )
        .join("");
}

// 1. Fetch and Parse Data
async function loadPublications() {
    try {
        const response = await fetch(CONFIG.bibPath);
        if (!response.ok) throw new Error("File not found");

        const text = await response.text();
        const citations = new Cite(text); // Assumes Cite is loaded via CDN
        renderPublications(citations.data);
    } catch (error) {
        console.error("Error loading bibtex:", error);
        document.getElementById("publications-container").innerHTML =
            `<p>Error loading publications. Please try again later.</p>`;
    }
}

// 2. Render Loop
function renderPublications(publications) {
    const container = document.getElementById("publications-container");
    container.innerHTML = publications
        .map((pub) => createPublicationHTML(pub))
        .join("");
}

// 3. HTML Generator (Template Literals)
function createPublicationHTML(pub) {
    const thumbSrc = `${CONFIG.thumbnailPath}${pub.id}.png`;
    const venue = replaceJournalAlias(pub["container-title"]);
    const year = pub.issued["date-parts"][0][0];
    console.log(pub);
    const doiLink = pub.DOI
        ? `<a href="https://doi.org/${pub.DOI}" target="_blank">doi: ${pub.DOI}</a>`
        : "";

    return `
        <div class="publication-item">
            <div class="pub-thumbnail" onclick="openModal('${thumbSrc}')">
                <img src="${thumbSrc}" alt="${pub.title}" onerror="this.style.display='none'">
            </div>
            <div class="pub-content">
                <div class="pub-title">${pub.title}</div>
                <div class="pub-authors">${formatAuthors(pub.author)}</div>
                <div class="pub-venue-container">
                    <span class="pub-venue">${pub.venue || ""}</span> </div>
                <div class="pub-journals">
                    ${venue}, ${year}, ${doiLink}
                </div>
            </div>
        </div>
    `;
}

// 4. Helper: Format Authors
function formatAuthors(authors) {
    if (!authors) return "";

    // 1. CLEANUP: Remove collaborations or invalid names first
    const validAuthors = authors.filter((a) => {
        // Must have a 'given' name property
        // Must not be the placeholder "--"
        // Must not be a 'literal' (usually group names like "OGLE Collaboration")
        return a.given && a.given !== "--" && !a.literal;
    });

    const MAX_DISPLAY = 5;

    // 2. Map the CLEAN list
    const authorList = validAuthors.slice(0, MAX_DISPLAY).map((a) => {
        const name = `${a.given} ${a.family}`;
        const isMe =
            a.family === CONFIG.mySurname && a.given === CONFIG.myGivenName;
        return isMe ? `<span class="highlight-name">${name}</span>` : name;
    });

    let result = authorList.join(", ");

    // 3. Handle "et al." logic using the CLEAN list length
    if (validAuthors.length > MAX_DISPLAY) {
        const iAmInList = validAuthors
            .slice(0, MAX_DISPLAY)
            .some(
                (a) =>
                    a.family === CONFIG.mySurname &&
                    a.given === CONFIG.myGivenName,
            );

        // Calculate remaining count based on valid authors only
        const remainingCount = validAuthors.length - MAX_DISPLAY;

        result += iAmInList
            ? `, and ${remainingCount} authors.`
            : `, and ${remainingCount} authors including <span class="highlight-name">Z. Wu</span>.`;
    } else {
        result += ".";
    }

    return result;
}

// 5. Helper: Journal Aliases
function replaceJournalAlias(journal) {
    return CONFIG.journalAliases[journal] || journal || "";
}

// 6. Modal Logic
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");

function openModal(src) {
    modal.style.display = "flex"; // Changed to flex for centering in CSS
    modalImg.src = src;
    // Small delay to allow display:flex to apply before adding opacity class
    requestAnimationFrame(() => modal.classList.add("show"));
}

function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300); // Matches CSS transition time
}

// Close on background click
window.onclick = (e) => {
    if (e.target === modal) closeModal();
};
