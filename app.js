const STORAGE_KEY = "resonance-library-state-v3";

const modalities = ["MDMA", "Psilocybin", "Ketamine", "Cannabis", "Breathwork", "Meditation"];
const qualities = ["vocal", "instrumental", "ambient", "rhythmic", "classical", "ceremonial", "electronic", "acoustic"];
const warningOptions = ["contains lyrics", "religious content", "dark/intense", "sudden transitions", "explicit lyrics"];
const defaultCreateCurve = [1, 2, 3, 4, 3, 2];
const arcLabels = ["Start", "Early", "Middle", "High", "Late", "End"];
const validInvites = ["BETA-2026", "GUIDE-2026", "BREATH-2026"];

const seedState = {
  currentUserId: null,
  favorites: [],
  follows: [],
  redeemedInvites: [],
  users: [
    {
      id: "u-maya",
      username: "mayachen",
      displayName: "Maya Chen",
      practice: "Somatic therapist",
      location: "Portland, OR",
      bio: "Works with relational repair, nervous-system pacing, and quieter post-session integration.",
      initials: "MC",
      inviteCount: 3,
      followerCount: 42
    },
    {
      id: "u-elias",
      username: "mesa-listener",
      displayName: "",
      practice: "Integration guide",
      location: "Santa Fe, NM",
      bio: "Builds long-form playlists for ceremonial, clinical-adjacent, and integration settings.",
      initials: "ML",
      inviteCount: 2,
      followerCount: 67
    },
    {
      id: "u-nadia",
      username: "nadia-breath",
      displayName: "Nadia Stone",
      practice: "Breathwork facilitator",
      location: "",
      bio: "Group breathwork facilitator interested in activation curves, clear landings, and lyric-aware sequencing.",
      initials: "NS",
      inviteCount: 4,
      followerCount: 58
    }
  ],
  playlists: [
    {
      id: "p-warm-horizon",
      title: "Warm Horizon",
      creatorId: "u-maya",
      modality: "MDMA",
      energyCurve: [1, 1, 2, 2, 3, 2, 2, 1],
      duration: "2h 14m",
      qualities: ["instrumental", "acoustic", "ambient"],
      warnings: {
        "contains lyrics": 3
      },
      savedCount: 48,
      createdAt: "2026-08-18T12:30:00.000Z",
      coverA: "#2c7a78",
      coverB: "#e6b56a",
      notes: "Gentle pacing with spacious transitions and a soft landing. Best suited to quieter dyad work or late-session emotional repair.",
      links: {
        spotify: "https://open.spotify.com/",
        youtube: "https://music.youtube.com/",
        apple: "https://music.apple.com/"
      },
      tracks: [
        { title: "Sun Through Linen", artist: "Lena Vale" },
        { title: "Held In The Room", artist: "North Meadow Ensemble" },
        { title: "No Rush", artist: "Arbor Glass" },
        { title: "Blue Window", artist: "Ari Sol" },
        { title: "Return Path", artist: "Mikael Dawn" }
      ],
      comments: [
        {
          id: "c-1",
          userId: "u-elias",
          body: "The last third worked beautifully for integration journaling after a longer somatic pass."
        }
      ]
    },
    {
      id: "p-mesa-arc",
      title: "Mesa Arc",
      creatorId: "u-elias",
      modality: "Psilocybin",
      energyCurve: [1, 2, 3, 5, 5, 4, 2, 1],
      duration: "4h 42m",
      qualities: ["ceremonial", "ambient", "rhythmic"],
      warnings: {
        "religious content": 2,
        "dark/intense": 5
      },
      savedCount: 63,
      createdAt: "2026-08-28T09:20:00.000Z",
      coverA: "#607749",
      coverB: "#685074",
      notes: "Wide arc with a stronger middle section. I keep this for clients who have explicitly asked for a more mythic and textured sound field.",
      links: {
        spotify: "https://open.spotify.com/",
        youtube: "https://music.youtube.com/"
      },
      tracks: [
        { title: "Low Mesa", artist: "Desert Choral" },
        { title: "Pulse Under Stone", artist: "Joana Kade" },
        { title: "Cave Lantern", artist: "The Listening Field" },
        { title: "Thread Of Gold", artist: "Pala River" },
        { title: "After Rain", artist: "Wind Archive" }
      ],
      comments: [
        {
          id: "c-2",
          userId: "u-nadia",
          body: "I would flag the transition into track three. It is gorgeous, but it can arrive abruptly in a quiet room."
        }
      ]
    },
    {
      id: "p-soft-dissolve",
      title: "Soft Dissolve",
      creatorId: "u-maya",
      modality: "Ketamine",
      energyCurve: [1, 2, 4, 4, 3, 2],
      duration: "1h 08m",
      qualities: ["ambient", "electronic", "instrumental"],
      warnings: {
        "sudden transitions": 2
      },
      savedCount: 31,
      createdAt: "2026-08-09T15:10:00.000Z",
      coverA: "#527d93",
      coverB: "#c7897e",
      notes: "Compact container with few lyrics and a steady suspended middle. Useful when the session time box is tight.",
      links: {
        spotify: "https://open.spotify.com/",
        apple: "https://music.apple.com/"
      },
      tracks: [
        { title: "Floating Hall", artist: "Dim Atlas" },
        { title: "Low Gravity", artist: "June Machine" },
        { title: "Glass Harbor", artist: "Orris" },
        { title: "Reentry", artist: "Pale Circuit" }
      ],
      comments: []
    },
    {
      id: "p-bellows",
      title: "Bellows",
      creatorId: "u-nadia",
      modality: "Breathwork",
      energyCurve: [2, 3, 5, 5, 4, 2, 1],
      duration: "58m",
      qualities: ["rhythmic", "electronic", "vocal"],
      warnings: {
        "explicit lyrics": 4,
        "sudden transitions": 3
      },
      savedCount: 75,
      createdAt: "2026-08-31T17:45:00.000Z",
      coverA: "#bb5b4f",
      coverB: "#c18a2b",
      notes: "Designed around clear activation and release. The middle section is intentionally strong, so I use it only when the group frame is already energetic.",
      links: {
        spotify: "https://open.spotify.com/",
        youtube: "https://music.youtube.com/",
        apple: "https://music.apple.com/"
      },
      tracks: [
        { title: "Open Rib", artist: "Tara North" },
        { title: "Fast Current", artist: "Bronze Room" },
        { title: "The Exhale", artist: "Body Signal" },
        { title: "Quiet Skin", artist: "Aster Plain" }
      ],
      comments: [
        {
          id: "c-3",
          userId: "u-maya",
          body: "The activation curve is very clear. I would not use this for a first-timer without careful orientation."
        }
      ]
    },
    {
      id: "p-greenhouse",
      title: "Greenhouse Window",
      creatorId: "u-elias",
      modality: "Cannabis",
      energyCurve: [1, 1, 2, 2, 2, 1],
      duration: "1h 36m",
      qualities: ["acoustic", "vocal", "ambient"],
      warnings: {
        "contains lyrics": 2
      },
      savedCount: 22,
      createdAt: "2026-07-23T11:00:00.000Z",
      coverA: "#72906b",
      coverB: "#d2a15c",
      notes: "Warm, conversational, and grounded. I like this for creative reflection where the music should feel present but not directive.",
      links: {
        youtube: "https://music.youtube.com/"
      },
      tracks: [
        { title: "Greenhouse Window", artist: "Mara Wren" },
        { title: "Hearth Tone", artist: "Cedar Cove" },
        { title: "Little Lamp", artist: "Sofie Vale" },
        { title: "Late Afternoon", artist: "The Slow Porch" }
      ],
      comments: []
    },
    {
      id: "p-quiet-body",
      title: "Quiet Body Practice",
      creatorId: "u-nadia",
      modality: "Meditation",
      energyCurve: [1, 1, 1, 1, 1],
      duration: "42m",
      qualities: ["instrumental", "classical", "ambient"],
      warnings: {},
      savedCount: 39,
      createdAt: "2026-08-02T08:15:00.000Z",
      coverA: "#8b7d65",
      coverB: "#7aa0a3",
      notes: "Sparse and steady. Mostly useful before or after deeper work, especially for groups that need a low-stimulus reset.",
      links: {
        spotify: "https://open.spotify.com/",
        apple: "https://music.apple.com/"
      },
      tracks: [
        { title: "One Bowl", artist: "Elian Reed" },
        { title: "Room Tone", artist: "Clara Pines" },
        { title: "Still Bell", artist: "Winter Method" },
        { title: "A Long Chair", artist: "J. Mori" }
      ],
      comments: []
    }
  ]
};

let state = loadState();
let filters = {
  search: "",
  modality: "All",
  qualities: [],
  hideWarnings: false,
  sort: "recommended"
};

const elements = {
  accountBar: document.querySelector("#accountBar"),
  searchInput: document.querySelector("#searchInput"),
  viewRoot: document.querySelector("#viewRoot"),
  accountDialog: document.querySelector("#accountDialog"),
  accountForm: document.querySelector("#accountForm"),
  accountError: document.querySelector("#accountError"),
  createPage: document.querySelector("#createPage"),
  playlistForm: document.querySelector("#playlistForm"),
  playlistError: document.querySelector("#playlistError"),
  playlistModalitySelect: document.querySelector("#playlistModalitySelect"),
  arcBuilder: document.querySelector("#arcBuilder"),
  arcPreview: document.querySelector("#arcPreview"),
  qualityChoices: document.querySelector("#qualityChoices"),
  warningChoices: document.querySelector("#warningChoices")
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(seedState);

  try {
    const parsed = JSON.parse(stored);
    return {
      ...structuredClone(seedState),
      ...parsed,
      users: parsed.users || seedState.users,
      playlists: parsed.playlists || seedState.playlists
    };
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initializeCreateForm() {
  elements.playlistModalitySelect.innerHTML = modalities.map((modality) => `
    <option value="${modality}">${modality}</option>
  `).join("");
  renderArcBuilder(defaultCreateCurve);
  elements.qualityChoices.innerHTML = qualities.map((quality) => choicePill("quality", quality)).join("");
  elements.warningChoices.innerHTML = warningOptions.map((warning) => choicePill("warning", warning)).join("");
}

function choicePill(name, value) {
  return `
    <label class="pill-button">
      <input class="sr-only" type="checkbox" name="${name}" value="${value}">
      ${titleCase(value)}
    </label>
  `;
}

function bindEvents() {
  window.addEventListener("hashchange", render);

  elements.searchInput.addEventListener("input", (event) => {
    filters.search = event.target.value;
    if (currentRoute().view !== "library") {
      location.hash = "#library";
      return;
    }
    render();
  });

  elements.accountBar.addEventListener("click", (event) => {
    if (event.target.closest("[data-open-account]")) openAccountDialog();

    if (event.target.closest("[data-sign-out]")) {
      state.currentUserId = null;
      saveState();
      render();
    }

    if (event.target.closest("[data-seed-user]")) {
      state.currentUserId = "u-maya";
      saveState();
      render();
    }
  });

  elements.viewRoot.addEventListener("click", (event) => {
    const modalityButton = event.target.closest("[data-modality]");
    const qualityButton = event.target.closest("[data-quality-filter]");
    const clearButton = event.target.closest("[data-clear-filters]");
    const favoriteButton = event.target.closest("[data-favorite]");
    const followButton = event.target.closest("[data-follow]");
    const warningButton = event.target.closest("[data-add-warning]");
    const accountButton = event.target.closest("[data-open-account]");
    const cardLink = event.target.closest("[data-card-href]");

    if (modalityButton) {
      filters.modality = modalityButton.dataset.modality;
      render();
      return;
    }

    if (qualityButton) {
      toggleArrayValue(filters.qualities, qualityButton.dataset.qualityFilter);
      render();
      return;
    }

    if (clearButton) {
      clearFilters();
      render();
      return;
    }

    if (favoriteButton) {
      event.preventDefault();
      toggleFavorite(favoriteButton.dataset.favorite);
      return;
    }

    if (followButton) {
      event.preventDefault();
      toggleFollow(followButton.dataset.follow);
      return;
    }

    if (warningButton) {
      addWarning(warningButton.dataset.playlistId, warningButton.dataset.addWarning);
      return;
    }

    if (accountButton) {
      openAccountDialog();
      return;
    }

    if (cardLink && !event.target.closest("a, button, input, select, textarea")) {
      location.hash = cardLink.dataset.cardHref;
    }
  });

  elements.viewRoot.addEventListener("change", (event) => {
    if (event.target.matches("[data-hide-warnings]")) {
      filters.hideWarnings = event.target.checked;
      render();
    }

    if (event.target.matches("[data-sort-select]")) {
      filters.sort = event.target.value;
      render();
    }
  });

  elements.viewRoot.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("a, button, input, select, textarea")) return;
    const cardLink = event.target.closest("[data-card-href]");
    if (!cardLink) return;
    event.preventDefault();
    location.hash = cardLink.dataset.cardHref;
  });

  elements.viewRoot.addEventListener("submit", (event) => {
    if (event.target.matches("[data-warning-form]")) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const warning = String(formData.get("warning") || "").trim();
      addWarning(event.target.dataset.warningForm, warning);
      event.target.reset();
      return;
    }

    if (!event.target.matches("[data-comment-form]")) return;
    event.preventDefault();

    if (!getCurrentUser()) {
      openAccountDialog();
      return;
    }

    const formData = new FormData(event.target);
    const body = String(formData.get("comment") || "").trim();
    const playlist = getPlaylist(event.target.dataset.commentForm);
    if (!body || !playlist) return;

    playlist.comments.push({
      id: `c-${Date.now()}`,
      userId: state.currentUserId,
      body
    });
    saveState();
    event.target.reset();
    render();
  });

  elements.accountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.accountForm);
    const invite = String(formData.get("invite") || "").trim().toUpperCase();
    const username = cleanUsername(formData.get("username"));
    const displayName = String(formData.get("displayName") || "").trim();
    const practice = String(formData.get("practice") || "").trim();
    const locationValue = String(formData.get("location") || "").trim();
    const bio = String(formData.get("bio") || "").trim();

    if (!username) {
      elements.accountError.textContent = "Choose a username.";
      return;
    }

    if (state.users.some((user) => user.username === username)) {
      elements.accountError.textContent = "That username is already taken in this prototype.";
      return;
    }

    if (!validInvites.includes(invite)) {
      elements.accountError.textContent = "Invite code not found.";
      return;
    }

    if (state.redeemedInvites.includes(invite)) {
      elements.accountError.textContent = "Invite code already redeemed in this browser.";
      return;
    }

    const user = {
      id: `u-${Date.now()}`,
      username,
      displayName,
      practice,
      location: locationValue,
      bio,
      initials: initialsFor(displayName || username),
      inviteCount: 3,
      followerCount: 0
    };

    state.users.push(user);
    state.currentUserId = user.id;
    state.redeemedInvites.push(invite);
    saveState();
    elements.accountForm.reset();
    elements.accountDialog.close();
    render();
    showToast("Account created");
  });

  elements.playlistForm.addEventListener("input", (event) => {
    if (!event.target.matches("[data-arc-point]")) return;
    syncArcBuilderPreview();
  });

  elements.playlistForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      openAccountDialog();
      return;
    }

    const formData = new FormData(elements.playlistForm);
    const selectedQualities = formData.getAll("quality");
    const selectedWarnings = formData.getAll("warning");
    const title = String(formData.get("title") || "").trim();
    const hours = Number(formData.get("durationHours"));
    const minutes = Number(formData.get("durationMinutes"));
    if (!Number.isInteger(hours) || hours < 0 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59 || hours * 60 + minutes <= 0) {
      elements.playlistError.textContent = "Enter a duration of at least one minute.";
      return;
    }
    const duration = hours ? `${hours}h${minutes ? ` ${minutes}m` : ""}` : `${minutes}m`;
    const serviceLink = String(formData.get("serviceLink") || "").trim();
    const energyCurve = getArcBuilderValues();

    if (!title || selectedQualities.length === 0) {
      elements.playlistError.textContent = "Add a title and at least one quality.";
      return;
    }

    const playlist = {
      id: `p-${Date.now()}`,
      title,
      creatorId: currentUser.id,
      modality: String(formData.get("modality")),
      energyCurve,
      duration,
      qualities: selectedQualities,
      warnings: warningMapFrom(selectedWarnings),
      savedCount: 0,
      createdAt: new Date().toISOString(),
      coverA: randomCoverColor(),
      coverB: randomCoverColor(),
      notes: String(formData.get("notes") || "").trim() || "No notes added yet.",
      links: linkMapFrom(serviceLink),
      tracks: [],
      comments: []
    };

    state.playlists.unshift(playlist);
    saveState();
    elements.playlistForm.reset();
    resetChoicePills();
    elements.playlistError.textContent = "";
    renderArcBuilder(defaultCreateCurve);
    location.hash = `#playlist/${playlist.id}`;
    render();
    showToast("Playlist saved");
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  document.querySelectorAll(".form-pills").forEach((group) => {
    group.addEventListener("change", (event) => {
      const label = event.target.closest(".pill-button");
      if (label) label.classList.toggle("active", event.target.checked);
    });
  });
}

function render() {
  renderAccount();

  const route = currentRoute();
  elements.createPage.hidden = route.view !== "create";
  elements.viewRoot.hidden = route.view === "create";
  if (route.view === "create") return;
  if (route.view === "playlist") {
    renderPlaylistDetail(route.id);
    return;
  }

  if (route.view === "profile") {
    renderProfileDetail(route.id);
    return;
  }

  if (route.view === "profiles") {
    renderProfilesView();
    return;
  }

  renderLibrary();
}

function renderAccount() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    elements.accountBar.innerHTML = `
      <button type="button" class="ghost-button" data-seed-user>Preview as @mayachen</button>
      <button type="button" class="primary-button" data-open-account>Join</button>
    `;
    return;
  }

  elements.accountBar.innerHTML = `
    <a class="mini-profile" href="#profile/${currentUser.id}">
      <div class="avatar">${escapeHtml(currentUser.initials)}</div>
      <div>
        <strong>${escapeHtml(displayUserName(currentUser))}</strong>
        <span>@${escapeHtml(currentUser.username)}</span>
      </div>
    </a>
    <button type="button" class="ghost-button small-button" data-sign-out>Sign out</button>
  `;
}

function renderLibrary() {
  const playlists = filteredPlaylists();

  elements.viewRoot.innerHTML = `
    <div class="library-layout">
      <aside class="filters-panel" aria-label="Playlist filters">
        <section class="filter-section">
          <div class="section-heading">
            <h2>Modality</h2>
            <button type="button" class="ghost-button small-button" data-clear-filters>Clear</button>
          </div>
          <div class="segmented-list">
            ${["All", ...modalities].map((modality) => modalityButton(modality)).join("")}
          </div>
        </section>

        <section class="filter-section">
          <h2>Music Qualities</h2>
          <div class="pill-list">
            ${qualities.map((quality) => filterPill(quality, filters.qualities.includes(quality))).join("")}
          </div>
        </section>

        <section class="filter-section">
          <h2>Warnings</h2>
          <label class="toggle-row">
            <input data-hide-warnings type="checkbox" ${filters.hideWarnings ? "checked" : ""}>
            <span>Hide warning-tagged</span>
          </label>
        </section>
      </aside>

      <section class="playlist-column" aria-label="Playlists">
        <div class="column-toolbar">
          <div>
            <p class="eyebrow">${playlists.length} ${playlists.length === 1 ? "playlist" : "playlists"}</p>
            <h2>Browse Library</h2>
          </div>
          <div class="toolbar-actions">
            <label for="sortSelect" class="sr-only">Sort playlists</label>
            <select id="sortSelect" data-sort-select>
              <option value="recommended" ${filters.sort === "recommended" ? "selected" : ""}>Recommended</option>
              <option value="newest" ${filters.sort === "newest" ? "selected" : ""}>Newest</option>
              <option value="favorites" ${filters.sort === "favorites" ? "selected" : ""}>Most saved</option>
              <option value="comments" ${filters.sort === "comments" ? "selected" : ""}>Most discussed</option>
            </select>
            <a class="primary-button" href="#create">Create</a>
          </div>
        </div>

        <div class="playlist-grid">
          ${playlists.length ? playlists.map(playlistCard).join("") : `<div class="empty-state">No matches.</div>`}
        </div>
      </section>
    </div>
  `;
}

function renderProfilesView() {
  const users = [...state.users].sort((a, b) => creatorPlaylists(b.id).length - creatorPlaylists(a.id).length);

  elements.viewRoot.innerHTML = `
    <section class="profiles-page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">${users.length} profiles</p>
          <h2>Practitioners</h2>
        </div>
      </div>
      <div class="profile-grid">
        ${users.map(userCard).join("")}
      </div>
    </section>
  `;
}

function renderPlaylistDetail(playlistId) {
  const playlist = getPlaylist(playlistId);
  if (!playlist) {
    renderNotFound("Playlist not found");
    return;
  }

  const creator = getUser(playlist.creatorId);
  const isFavorite = state.favorites.includes(playlist.id);
  const isFollowing = state.follows.includes(playlist.creatorId);
  const allTags = [playlist.modality, ...playlist.qualities];
  const commentRows = playlist.comments.map(commentRow).join("");

  elements.viewRoot.innerHTML = `
    <article class="detail-page playlist-detail">
      <div class="detail-hero">
        <div class="detail-cover large-cover" style="--cover-a: ${playlist.coverA}; --cover-b: ${playlist.coverB};"></div>
        <div class="detail-hero-body">
          <a class="back-link" href="#library">Back to library</a>
          <p class="eyebrow">${escapeHtml(playlist.modality)}</p>
          <div class="detail-title-row">
            <div>
              <h2>${escapeHtml(playlist.title)}</h2>
              <div class="detail-stats">
                <span>${escapeHtml(playlist.duration)}</span>
                <span>${playlist.savedCount + (isFavorite ? 1 : 0)} saved</span>
                <span>${playlist.comments.length} comments</span>
              </div>
            </div>
            <button type="button" class="save-button ${isFavorite ? "active" : ""}" data-favorite="${playlist.id}" aria-label="Favorite ${escapeHtml(playlist.title)}">
              ${isFavorite ? "Saved" : "Save"}
            </button>
          </div>

          <div class="creator-row compact">
            <a class="mini-profile" href="#profile/${creator?.id || ""}">
              <div class="avatar">${escapeHtml(creator?.initials || "?")}</div>
              <div>
                <strong>${escapeHtml(displayUserName(creator))}</strong>
                <span>@${escapeHtml(creator?.username || "unknown")}</span>
              </div>
            </a>
            <button type="button" class="ghost-button small-button" data-follow="${playlist.creatorId}">
              ${isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          <div class="tag-row">
            ${allTags.map((tag) => tagChip(tag, playlist)).join("")}
          </div>
        </div>
      </div>

      <div class="detail-content">
        <section class="detail-main">
          <section class="detail-section">
            <h3>Energy Arc</h3>
            ${energyChart(playlist.energyCurve, "large")}
          </section>

          <section class="detail-section">
            <h3>Notes</h3>
            <p class="notes">${escapeHtml(playlist.notes)}</p>
          </section>

          <section class="detail-section">
            <h3>Community Warnings</h3>
            ${warningPanel(playlist)}
          </section>

          ${playlist.tracks.length ? `<section class="detail-section">
            <h3>Tracklist</h3>
            <ol class="track-list">
              ${playlist.tracks.map(trackRow).join("")}
            </ol>
          </section>` : ""}

          <section class="detail-section">
            <h3>Discussion</h3>
            <div class="comment-list">
              ${commentRows || `<div class="empty-state">No comments yet.</div>`}
            </div>
            ${getCurrentUser() ? commentForm(playlist.id) : `<button type="button" class="primary-button" data-open-account>Join to comment</button>`}
          </section>
        </section>

        <aside class="detail-sidebar">
          <section class="detail-section">
            <h3>Listen</h3>
            <div class="service-row">
              ${serviceLink("Spotify", playlist.links.spotify)}
              ${serviceLink("YouTube", playlist.links.youtube)}
              ${serviceLink("Apple", playlist.links.apple)}
            </div>
          </section>
        </aside>
      </div>
    </article>
  `;
}

function renderProfileDetail(userId) {
  const user = getUser(userId);
  if (!user) {
    renderNotFound("Profile not found");
    return;
  }

  const playlists = creatorPlaylists(user.id);
  const isFollowing = state.follows.includes(user.id);
  const followerCount = user.followerCount + (isFollowing ? 1 : 0);
  const totalSaves = playlists.reduce((sum, playlist) => sum + playlist.savedCount, 0);

  elements.viewRoot.innerHTML = `
    <article class="profile-page">
      <div class="profile-hero">
        <a class="back-link" href="#profiles">Back to profiles</a>
        <div class="profile-heading-row">
          <div class="profile-identity">
            <div class="avatar profile-avatar">${escapeHtml(user.initials)}</div>
            <div>
              <p class="eyebrow">@${escapeHtml(user.username)}</p>
              <h2>${escapeHtml(displayUserName(user))}</h2>
              <p class="meta-line">${escapeHtml([user.practice, user.location].filter(Boolean).join(" - "))}</p>
            </div>
          </div>
          <button type="button" class="ghost-button" data-follow="${user.id}">
            ${isFollowing ? "Following" : "Follow"}
          </button>
        </div>
        <p class="profile-bio">${escapeHtml(user.bio || "No bio yet.")}</p>
        <div class="profile-stats">
          <span>${playlists.length} playlists</span>
          <span>${totalSaves} saves</span>
          <span>${followerCount} followers</span>
        </div>
      </div>

      <section class="profile-playlists">
        <div class="page-heading">
          <div>
            <p class="eyebrow">Shared by @${escapeHtml(user.username)}</p>
            <h2>Playlists</h2>
          </div>
        </div>
        <div class="playlist-grid">
          ${playlists.length ? playlists.map(playlistCard).join("") : `<div class="empty-state">No playlists yet.</div>`}
        </div>
      </section>
    </article>
  `;
}

function renderNotFound(message) {
  elements.viewRoot.innerHTML = `
    <section class="not-found">
      <h2>${escapeHtml(message)}</h2>
      <a class="primary-button button-link" href="#library">Go to library</a>
    </section>
  `;
}

function modalityButton(modality) {
  const count = modality === "All"
    ? state.playlists.length
    : state.playlists.filter((playlist) => playlist.modality === modality).length;

  return `
    <button type="button" class="segmented-button ${filters.modality === modality ? "active" : ""}" data-modality="${modality}">
      <strong>${escapeHtml(modality)}</strong>
      <span>${count}</span>
    </button>
  `;
}

function filterPill(value, active) {
  return `
    <button type="button" class="pill-button ${active ? "active" : ""}" data-quality-filter="${escapeAttribute(value)}">
      ${titleCase(value)}
    </button>
  `;
}

function playlistCard(playlist) {
  const creator = getUser(playlist.creatorId);
  const isFavorite = state.favorites.includes(playlist.id);
  const tags = [playlist.modality, ...playlist.qualities.slice(0, 3)];
  const warningsHtml = warningEntries(playlist).slice(0, 2).map(([tag, count]) => `<span class="tag warning">${titleCase(tag)} ${count}</span>`).join("");

  return `
    <article class="playlist-card clickable-card" data-card-href="playlist/${playlist.id}" tabindex="0" role="link" aria-label="Open ${escapeAttribute(playlist.title)}">
      <div class="cover-art" style="--cover-a: ${playlist.coverA}; --cover-b: ${playlist.coverB};"></div>
      <div class="card-body">
        <div>
          <div class="card-title-row">
            <div>
              <h3>${escapeHtml(playlist.title)}</h3>
              <p class="meta-line">
                <a href="#profile/${creator?.id || ""}">${escapeHtml(displayUserName(creator))}</a>
                <span>-</span>
                <span>${escapeHtml(playlist.duration)}</span>
              </p>
            </div>
            <button type="button" class="save-button ${isFavorite ? "active" : ""}" data-favorite="${playlist.id}" aria-label="Favorite ${escapeHtml(playlist.title)}">
              ${isFavorite ? "Saved" : "Save"}
            </button>
          </div>
        </div>
        <div class="mini-chart-wrap">
          ${energyChart(playlist.energyCurve, "mini")}
        </div>
        <div class="tag-row">
          ${tags.map((tag, index) => `<span class="tag ${index === 0 ? "modality" : ""}">${titleCase(tag)}</span>`).join("")}
          ${warningsHtml}
        </div>
        <div class="card-actions">
          <div class="card-stats">
            <span>${playlist.savedCount + (isFavorite ? 1 : 0)} saved</span>
            <span>${playlist.comments.length} comments</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

function userCard(user) {
  const playlists = creatorPlaylists(user.id);
  const followerCount = user.followerCount + (state.follows.includes(user.id) ? 1 : 0);

  return `
    <article class="user-card">
      <a class="user-card-main" href="#profile/${user.id}">
        <div class="avatar profile-avatar">${escapeHtml(user.initials)}</div>
        <div>
          <p class="eyebrow">@${escapeHtml(user.username)}</p>
          <h3>${escapeHtml(displayUserName(user))}</h3>
          <p class="meta-line">${escapeHtml([user.practice, user.location].filter(Boolean).join(" - "))}</p>
        </div>
      </a>
      <p>${escapeHtml(user.bio || "No bio yet.")}</p>
      <div class="card-stats">
        <span>${playlists.length} playlists</span>
        <span>${followerCount} followers</span>
      </div>
    </article>
  `;
}

function tagChip(tag, playlist) {
  const className = tag === playlist.modality
      ? "tag modality"
      : "tag";
  return `<span class="${className}">${titleCase(tag)}</span>`;
}

function trackRow(track, index) {
  return `
    <li>
      <span class="track-number">${index + 1}</span>
      <div>
        <strong>${escapeHtml(track.title)}</strong>
        <span>${escapeHtml(track.artist)}</span>
      </div>
    </li>
  `;
}

function commentRow(comment) {
  const user = getUser(comment.userId);
  return `
    <div class="comment">
      <a href="#profile/${user?.id || ""}"><strong>${escapeHtml(displayUserName(user))}</strong></a>
      <p>${escapeHtml(comment.body)}</p>
    </div>
  `;
}

function commentForm(playlistId) {
  return `
    <form class="comment-form" data-comment-form="${playlistId}">
      <label class="sr-only" for="comment-${playlistId}">Add comment</label>
      <textarea id="comment-${playlistId}" name="comment" placeholder="Context, warnings, adaptations"></textarea>
      <button type="submit" class="primary-button">Comment</button>
    </form>
  `;
}

function warningPanel(playlist) {
  const entries = warningEntries(playlist);
  const existing = new Set(entries.map(([label]) => label));
  const quickWarnings = warningOptions.filter((warning) => !existing.has(warning));

  return `
    <div class="warning-panel">
      <div class="warning-list">
        ${entries.length ? entries.map(([label, count]) => `
          <button type="button" class="warning-chip" data-playlist-id="${playlist.id}" data-add-warning="${escapeAttribute(label)}">
            <span>${titleCase(label)}</span>
            <strong>${count}</strong>
          </button>
        `).join("") : `<div class="empty-state">No warnings added yet.</div>`}
      </div>

      <div class="quick-warning-list">
        ${quickWarnings.map((warning) => `
          <button type="button" class="pill-button" data-playlist-id="${playlist.id}" data-add-warning="${escapeAttribute(warning)}">
            ${titleCase(warning)}
          </button>
        `).join("")}
      </div>

      <form class="input-action-row warning-form" data-warning-form="${playlist.id}">
        <label class="sr-only" for="warning-${playlist.id}">Add warning</label>
        <input id="warning-${playlist.id}" name="warning" placeholder="Custom warning">
        <button type="submit" class="ghost-button">Add</button>
      </form>
    </div>
  `;
}

function energyChart(values, size = "large") {
  const curve = sanitizeEnergyCurve(values);
  const width = size === "mini" ? 260 : 720;
  const height = size === "mini" ? 68 : 190;
  const padX = size === "mini" ? 8 : 24;
  const padY = size === "mini" ? 9 : 22;
  const usableWidth = width - padX * 2;
  const usableHeight = height - padY * 2;
  const points = curve.map((value, index) => {
    const x = padX + (curve.length === 1 ? usableWidth / 2 : (index / (curve.length - 1)) * usableWidth);
    const y = padY + ((5 - value) / 4) * usableHeight;
    return { x, y };
  });
  const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;
  const grid = [1, 2, 3, 4, 5].map((value) => {
    const y = padY + ((5 - value) / 4) * usableHeight;
    return `<line x1="${padX}" y1="${y.toFixed(1)}" x2="${width - padX}" y2="${y.toFixed(1)}"></line>`;
  }).join("");
  const dots = size === "mini" ? "" : points.map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4"></circle>`).join("");

  return `
    <figure class="energy-chart ${size === "mini" ? "mini-chart" : ""}">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Energy curve from start to finish">
        <g class="chart-grid">${grid}</g>
        <polygon class="chart-area" points="${area}"></polygon>
        <polyline class="chart-line" points="${line}"></polyline>
        <g class="chart-dots">${dots}</g>
      </svg>
      ${size === "mini" ? "" : `<figcaption><span>Start</span><span>Middle</span><span>Finish</span></figcaption>`}
    </figure>
  `;
}

function renderArcBuilder(values = defaultCreateCurve) {
  const curve = sanitizeEnergyCurve(values);
  elements.arcBuilder.innerHTML = arcLabels.map((label, index) => {
    const value = curve[index] || defaultCreateCurve[index] || 1;
    return `
      <label class="arc-control">
        <span>${label}</span>
        <input type="range" name="arcPoint" min="1" max="5" step="1" value="${value}" data-arc-point>
        <output>${value}</output>
      </label>
    `;
  }).join("");
  syncArcBuilderPreview();
}

function syncArcBuilderPreview() {
  elements.arcBuilder.querySelectorAll("[data-arc-point]").forEach((input) => {
    const output = input.closest(".arc-control")?.querySelector("output");
    if (output) {
      output.value = input.value;
      output.textContent = input.value;
    }
  });
  elements.arcPreview.innerHTML = energyChart(getArcBuilderValues(), "mini");
}

function getArcBuilderValues() {
  const values = Array.from(elements.arcBuilder.querySelectorAll("[data-arc-point]"))
    .map((input) => Number(input.value))
    .filter((value) => Number.isFinite(value));
  return values.length ? values : defaultCreateCurve;
}

function filteredPlaylists() {
  const query = normalize(filters.search);
  const rows = state.playlists.filter((playlist) => {
    const creator = getUser(playlist.creatorId);
    const searchable = normalize([
      playlist.title,
      creator?.username,
      displayUserName(creator),
      creator?.practice,
      playlist.modality,
      playlist.notes,
      playlist.qualities.join(" "),
      warningEntries(playlist).map(([tag]) => tag).join(" "),
      playlist.tracks.map((track) => `${track.artist} ${track.title}`).join(" ")
    ].join(" "));

    const matchesSearch = !query || searchable.includes(query);
    const matchesModality = filters.modality === "All" || playlist.modality === filters.modality;
    const matchesQuality = filters.qualities.length === 0 || filters.qualities.every((quality) => playlist.qualities.includes(quality));
    const matchesWarnings = !filters.hideWarnings || warningEntries(playlist).length === 0;

    return matchesSearch && matchesModality && matchesQuality && matchesWarnings;
  });

  return rows.sort((a, b) => {
    if (filters.sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (filters.sort === "favorites") return b.savedCount - a.savedCount;
    if (filters.sort === "comments") return b.comments.length - a.comments.length;
    return (b.savedCount + b.comments.length * 4) - (a.savedCount + a.comments.length * 4);
  });
}

function clearFilters() {
  filters = {
    search: "",
    modality: "All",
    qualities: [],
    hideWarnings: false,
    sort: "recommended"
  };
  elements.searchInput.value = "";
}

function toggleFavorite(playlistId) {
  const playlist = getPlaylist(playlistId);
  if (!playlist) return;

  if (!getCurrentUser()) {
    openAccountDialog();
    return;
  }

  const existed = state.favorites.includes(playlistId);
  toggleArrayValue(state.favorites, playlistId);
  playlist.savedCount = Math.max(0, playlist.savedCount + (existed ? -1 : 1));
  saveState();
  render();
}

function toggleFollow(userId) {
  if (!getCurrentUser()) {
    openAccountDialog();
    return;
  }

  if (userId === state.currentUserId) {
    showToast("That is your profile");
    return;
  }

  toggleArrayValue(state.follows, userId);
  saveState();
  render();
}

function addWarning(playlistId, label) {
  const playlist = getPlaylist(playlistId);
  if (!playlist) return;
  const warning = cleanWarning(label);
  if (!warning) return;

  playlist.warnings = {
    ...warningMapFrom(playlist.cautions || []),
    ...(playlist.warnings || {})
  };
  playlist.warnings[warning] = (playlist.warnings[warning] || 0) + 1;
  delete playlist.cautions;
  saveState();
  render();
  showToast("Warning added");
}

function serviceLink(label, href) {
  if (!href) {
    return `<span class="service-link unavailable" aria-disabled="true">${label}</span>`;
  }
  return `<a class="service-link" href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${label}</a>`;
}

function openAccountDialog() {
  elements.accountError.textContent = "";
  elements.accountDialog.showModal();
}

function resetChoicePills() {
  elements.playlistForm.querySelectorAll(".form-pills input").forEach((input) => {
    input.checked = false;
    input.closest(".pill-button").classList.remove("active");
  });
}

function sanitizeEnergyCurve(values) {
  if (!Array.isArray(values) || values.length === 0) return [1, 2, 3, 4, 3, 2];
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.max(1, Math.min(5, value)));
}

function linkMapFrom(link) {
  const map = {};
  if (!link) return map;
  const lower = link.toLowerCase();
  if (lower.includes("spotify")) map.spotify = link;
  else if (lower.includes("youtube") || lower.includes("youtu.be")) map.youtube = link;
  else if (lower.includes("music.apple") || lower.includes("apple")) map.apple = link;
  else map.spotify = link;
  return map;
}

function serviceNameFromLink(link) {
  const lower = String(link || "").toLowerCase();
  if (lower.includes("youtube") || lower.includes("youtu.be")) return "YouTube";
  if (lower.includes("music.apple") || lower.includes("apple")) return "Apple";
  return "Spotify";
}

function warningEntries(playlist) {
  const warnings = {
    ...warningMapFrom(playlist.cautions || []),
    ...(playlist.warnings || {})
  };

  return Object.entries(warnings)
    .map(([label, count]) => [cleanWarning(label), Number(count) || 0])
    .filter(([label, count]) => label && count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function warningMapFrom(values) {
  return values.reduce((map, value) => {
    const warning = cleanWarning(value);
    if (warning) map[warning] = (map[warning] || 0) + 1;
    return map;
  }, {});
}

function cleanWarning(value) {
  return normalize(value)
    .replace(/\s+/g, " ")
    .slice(0, 42);
}

function currentRoute() {
  const hash = location.hash.replace(/^#/, "") || "library";
  const [view, id] = hash.split("/");
  return { view, id };
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function getUser(userId) {
  return state.users.find((user) => user.id === userId) || null;
}

function getPlaylist(playlistId) {
  return state.playlists.find((playlist) => playlist.id === playlistId) || null;
}

function creatorPlaylists(userId) {
  return state.playlists.filter((playlist) => playlist.creatorId === userId);
}

function displayUserName(user) {
  if (!user) return "Unknown";
  return user.displayName || `@${user.username}`;
}

function cleanUsername(value) {
  return normalize(value)
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function toggleArrayValue(array, value) {
  const index = array.indexOf(value);
  if (index >= 0) {
    array.splice(index, 1);
  } else {
    array.push(value);
  }
}

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function initialsFor(name) {
  return String(name || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";
}

function titleCase(text) {
  return String(text)
    .split(/[\s-]+/)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function slugify(text) {
  return normalize(text).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "playlist";
}

function randomCoverColor() {
  const colors = ["#2c7a78", "#bb5b4f", "#c18a2b", "#607749", "#685074", "#527d93", "#8b7d65", "#c7897e"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function showToast(message) {
  const oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2200);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

if (!location.hash) location.hash = "#library";
initializeCreateForm();
bindEvents();
render();
