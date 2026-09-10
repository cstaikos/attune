const STORAGE_KEY = "resonance-library-state-v3";

const modalities = ["MDMA", "Psilocybin", "Ketamine", "Cannabis", "Breathwork", "Meditation"];
const qualityGroups = {
  "Sound": ["ambient", "acoustic", "electronic", "classical", "percussive", "nature sounds"],
  "Voice": ["no vocals", "wordless vocals", "sung lyrics", "spoken word"],
  "Mood / texture": ["spacious", "gentle", "warm", "reflective", "uplifting", "melancholic", "tense", "driving"]
};
const listeningGroups = {
  "Sound / delivery": {
    "abrupt transitions": "A sudden change in style, pace, or texture, within a track or between tracks. A smooth change in energy alone does not need this note.",
    "sudden loud sounds": "An unexpected loud entrance, impact, or jump in volume. Identify where it occurs when possible.",
    "sustained high intensity": "An extended passage of forceful, dense, or insistent sound. Use for sustained intensity, rather than a brief peak.",
    "harsh or dissonant sounds": "Prominent distortion, abrasive textures, or clashing tones. This describes the sound, not its musical quality.",
    "distressing human sounds": "Audible screaming, sobbing, or other human expressions of distress. Ordinary singing does not qualify."
  },
  "Content": {
    "explicit language": "Profanity or slurs in sung or spoken words. Add context if a platform’s explicit label is unclear.",
    "religious or devotional content": "Identifiable prayer, worship, devotional lyrics, or religious teaching. Name the tradition if known; do not infer it from an instrument or language.",
    "death or grief themes": "Sung or spoken references to death, dying, bereavement, or mourning. A melancholy mood alone does not qualify.",
    "violence or abuse themes": "Sung or spoken descriptions of violence, threats, or abuse. Give a brief, non-graphic explanation when helpful.",
    "sexual content": "Sung or spoken sexual references or sexual audio. Romantic themes alone do not qualify."
  }
};
const warningOptions = Object.values(listeningGroups).flatMap(Object.keys);
const warningDefinitions = Object.assign({}, ...Object.values(listeningGroups));

// Keep existing browser libraries while normalizing only unambiguous old labels.
function migratePlaylist(playlist) {
  if (playlist.taxonomyVersion === 1) return playlist;
  const aliases = { "religious content": "religious or devotional content", "sudden transitions": "abrupt transitions", "explicit lyrics": "explicit language" };
  const previous = { ...warningMapFrom(playlist.cautions || []), ...(playlist.warnings || {}) };
  const tags = new Set(playlist.qualities || []);
  if (previous["contains lyrics"] || previous["explicit lyrics"]) tags.add("sung lyrics");
  const legacy = [];
  if (tags.delete("instrumental")) legacy.push("Instrumental (vocal presence not reviewed)");
  if (tags.delete("vocal") && !tags.has("sung lyrics")) legacy.push("Vocals (type unspecified)");
  if (tags.delete("rhythmic")) legacy.push("Rhythmic");
  if (tags.delete("ceremonial")) legacy.push("Ceremonial");
  playlist.warnings = {};
  for (const [label, count] of Object.entries(previous)) {
    if (label === "contains lyrics") continue;
    const next = aliases[label] || label;
    playlist.warnings[next] = Math.max(playlist.warnings[next] || 0, Number(count) || 0);
  }
  if ([...tags].some(tag => qualityGroups.Voice.includes(tag) && tag !== "no vocals")) tags.delete("no vocals");
  playlist.qualities = [...tags];
  playlist.legacyQualities = [...(playlist.legacyQualities || []), ...legacy];
  playlist.taxonomyVersion = 1;
  delete playlist.cautions;
  return playlist;
}

function groupedChoices(groups, renderChoice) {
  return Object.entries(groups).map(([heading, values]) => `<fieldset class="choice-group"><legend>${heading}</legend><div class="pill-list">${(Array.isArray(values) ? values : Object.keys(values)).map(renderChoice).join("")}</div></fieldset>`).join("");
}
const defaultCreateCurve = [1, 2, 3, 4, 3, 2];
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
state.playlists = state.playlists.map(migratePlaylist);
// Keep the existing prototype identity model, but scope saved music to that identity.
if (!state.favoritesByUser) {
  state.favoritesByUser = {};
  state.favoritesByUser[state.currentUserId || "u-maya"] = [...state.favorites];
}
let editorKey = null;
let editingId = null;
let libraryView = "cards";
try { libraryView = localStorage.getItem("resonance-library-view") === "list" ? "list" : "cards"; } catch {}
let filtersOpen = false;
let filters = {
  search: "",
  modality: "All",
  qualities: [],
  excludedWarnings: [],
  excludedQualities: [],
  services: [],
  minDuration: "",
  maxDuration: "",
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
  elements.qualityChoices.innerHTML = groupedChoices(qualityGroups, quality => choicePill("quality", quality));
  elements.warningChoices.innerHTML = groupedChoices(listeningGroups, warning => choicePill("warning", warning));
}

function choicePill(name, value) {
  return `
    <label class="pill-button" title="${escapeAttribute(warningDefinitions[value] || "")}">
      <input class="sr-only" type="checkbox" name="${name}" value="${value}">
      ${titleCase(value)}
    </label>
  `;
}

function bindEvents() {
  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });

  elements.searchInput.addEventListener("input", (event) => {
    filters.search = event.target.value;
    if (!["library", "saved", "contributions"].includes(currentRoute().view)) {
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
    const deleteButton = event.target.closest("[data-delete-playlist]");
    if (deleteButton) { deletePlaylist(deleteButton.dataset.deletePlaylist); return; }
    const viewButton = event.target.closest("[data-library-view]");
    if (viewButton) {
      libraryView = viewButton.dataset.libraryView;
      try { localStorage.setItem("resonance-library-view", libraryView); } catch {}
      renderLibrary();
      elements.viewRoot.querySelector(`[data-library-view="${libraryView}"]`).focus();
      return;
    }
    if (event.target.closest("[data-toggle-filters]")) {
      filtersOpen = !filtersOpen;
      renderLibrary();
      elements.viewRoot.querySelector("[data-toggle-filters]").focus();
      return;
    }
    const modalityButton = event.target.closest("[data-modality]");
    const qualityButton = event.target.closest("[data-quality-filter]");
    const clearButton = event.target.closest("[data-clear-filters]");
    const favoriteButton = event.target.closest("[data-favorite]");
    const followButton = event.target.closest("[data-follow]");
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
      Array.from(elements.viewRoot.querySelectorAll("[data-quality-filter]")).find(button => button.dataset.qualityFilter === qualityButton.dataset.qualityFilter)?.focus();
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

    if (accountButton) {
      openAccountDialog();
      return;
    }

    if (cardLink && !event.target.closest("a, button, input, select, textarea")) {
      location.hash = cardLink.dataset.cardHref;
    }
  });

  elements.viewRoot.addEventListener("change", (event) => {
    for (const [attribute, field] of [["data-service-filter", "services"], ["data-exclude-quality", "excludedQualities"]]) {
      if (!event.target.hasAttribute(attribute)) continue;
      const value = event.target.getAttribute(attribute);
      const values = new Set(filters[field]);
      if (event.target.checked) values.add(value); else values.delete(value);
      filters[field] = [...values];
      render();
      Array.from(elements.viewRoot.querySelectorAll(`[${attribute}]`)).find(input => input.getAttribute(attribute) === value)?.focus();
      return;
    }
    if (event.target.matches("[data-exclude-warning]")) {
      const value = event.target.dataset.excludeWarning;
      toggleArrayValue(filters.excludedWarnings, value);
      render();
      Array.from(elements.viewRoot.querySelectorAll("[data-exclude-warning]")).find(input => input.dataset.excludeWarning === value)?.focus();
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
    if (event.target.matches("[data-duration-filter]")) {
      event.preventDefault();
      const data = new FormData(event.target);
      const min = String(data.get("minDuration") || "").trim();
      const max = String(data.get("maxDuration") || "").trim();
      const error = durationRangeError(min, max);
      if (error) {
        event.target.querySelector('[role="alert"]').textContent = error;
        return;
      }
      filters.minDuration = min;
      filters.maxDuration = max;
      render();
      elements.viewRoot.querySelector('[data-duration-filter] button').focus();
      return;
    }
    if (event.target.matches("[data-listening-form]")) {
      event.preventDefault();
      const data = new FormData(event.target);
      addWarning(event.target.dataset.listeningForm, data.get("warning"), data.get("context"));
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

  elements.playlistForm.addEventListener("click", (event) => {
    if (event.target.closest("[data-editor-back]")) {
      editorKey = null;
      editingId = null;
    }
    const add = event.target.closest("[data-add-arc-point]");
    const remove = event.target.closest("[data-remove-arc-point]");
    if (!add && !remove) return;
    const values = getArcBuilderValues();
    if (add) {
      values.push(values[values.length - 1]);
      renderArcBuilder(values);
      elements.arcBuilder.querySelectorAll("[data-arc-point]")[values.length - 1].focus();
    } else if (values.length > 2) {
      const index = Number(remove.dataset.removeArcPoint);
      values.splice(index, 1);
      renderArcBuilder(values);
      elements.arcBuilder.querySelectorAll("[data-arc-point]")[Math.min(index, values.length - 1)].focus();
    }
  });

  elements.playlistForm.addEventListener("change", (event) => {
    const input = event.target;
    if (input.name !== "quality" || !input.checked || !qualityGroups.Voice.includes(input.value)) return;
    elements.qualityChoices.querySelectorAll('input[name="quality"]').forEach(other => {
      if (other !== input && qualityGroups.Voice.includes(other.value) && (input.value === "no vocals" || other.value === "no vocals")) {
        other.checked = false;
        other.closest(".pill-button").classList.remove("active");
      }
    });
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
    const existing = editingId ? getPlaylist(editingId) : null;
    if (editingId && (!existing || existing.creatorId !== currentUser.id)) {
      elements.playlistError.textContent = "You can only edit your own contributions.";
      return;
    }
    if (!parsePlaylistLink(serviceLink)) {
      elements.playlistError.textContent = "Add a direct playlist link. Service homepages, albums, and individual tracks are not playlist links.";
      return;
    }

    if (!title || selectedQualities.length === 0) {
      elements.playlistError.textContent = "Add a title and at least one tag.";
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
      taxonomyVersion: 1,
      listeningReviewed: formData.get("listeningReviewed") === "on",
      listeningContext: String(formData.get("listeningContext") || "").trim(),
      listeningReports: selectedWarnings.map(label => ({ label, userId: currentUser.id, context: "" })),
      savedCount: 0,
      createdAt: new Date().toISOString(),
      coverA: randomCoverColor(),
      coverB: randomCoverColor(),
      notes: String(formData.get("notes") || "").trim() || "No notes added yet.",
      links: linkMapFrom(serviceLink),
      tracks: [],
      comments: []
    };

    if (existing) {
      // Editing metadata must not erase saves, discussion, or other people's observations.
      const otherReports = (existing.listeningReports || []).filter(report => report.userId !== currentUser.id);
      const ownerBefore = existing.creatorWarningLabels || Object.keys(existing.warnings || {}).filter(label => warningOptions.includes(label) && !(existing.listeningReports || []).some(report => report.label === label && report.userId !== currentUser.id));
      const retainedWarnings = Object.fromEntries(Object.entries(existing.warnings || {}).filter(([label]) => !ownerBefore.includes(label)));
      const oldLink = Object.values(existing.links || {})[0];
      const links = { ...existing.links };
      if (oldLink !== serviceLink) {
        delete links[Object.keys(links)[0]];
        Object.assign(links, playlist.links);
      }
      const ownerReports = playlist.listeningReports.map(report => ({
        ...report,
        context: (existing.listeningReports || []).find(previous => previous.userId === currentUser.id && previous.label === report.label)?.context || ""
      }));
      Object.assign(existing, {
        title, modality: playlist.modality, energyCurve, duration, qualities: selectedQualities,
        notes: playlist.notes, links, listeningReviewed: playlist.listeningReviewed,
        listeningContext: playlist.listeningContext,
        creatorWarningLabels: selectedWarnings,
        warnings: { ...retainedWarnings, ...warningMapFrom(otherReports.map(report => report.label)), ...playlist.warnings },
        listeningReports: [...otherReports, ...ownerReports],
        updatedAt: new Date().toISOString()
      });
    } else {
      playlist.creatorWarningLabels = selectedWarnings;
      state.playlists.unshift(playlist);
    }
    const savedId = existing?.id || playlist.id;
    saveState();
    elements.playlistForm.reset();
    resetChoicePills();
    elements.playlistError.textContent = "";
    renderArcBuilder(defaultCreateCurve);
    editorKey = null;
    editingId = null;
    location.hash = `#playlist/${savedId}`;
    render();
    showToast(existing ? "Changes saved" : "Playlist added");
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
  const isEditor = route.view === "create" || route.view === "edit";
  document.querySelectorAll(".library-nav a").forEach(link => {
    if (link.hash === `#${route.view}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  elements.createPage.hidden = !isEditor;
  elements.viewRoot.hidden = isEditor;
  if (isEditor) { prepareEditor(route); return; }
  if (route.view === "listening-guide") { renderListeningGuide(); return; }
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
  const section = currentRoute().view;
  const personal = section === "saved" || section === "contributions";
  const heading = section === "saved" ? "Saved playlists" : section === "contributions" ? "My contributions" : "Music to hold the space.";
  const description = section === "saved" ? "Your shortlist, ready to revisit." : section === "contributions" ? "Playlists you have added to the library." : "Explore playlists shared by therapists and facilitators.";
  if (personal && !getCurrentUser()) {
    elements.viewRoot.innerHTML = `<section class="personal-empty"><h2>${heading}</h2><p>Use a prototype account to see your playlists.</p><button class="primary-button" data-open-account>Join</button><p>Or use Preview as @mayachen above.</p></section>`;
    return;
  }
  const playlists = filteredPlaylists();
  const filterCount = filters.qualities.length + filters.excludedWarnings.length + filters.excludedQualities.length + filters.services.length + (filters.modality !== "All" ? 1 : 0) + (filters.minDuration !== "" || filters.maxDuration !== "" ? 1 : 0);
  const hasPersonalItems = section === "saved" ? savedPlaylistIds().length > 0 : creatorPlaylists(state.currentUserId).length > 0;
  const emptyMessage = personal && !hasPersonalItems ? (section === "saved" ? 'No saved playlists yet. Choose Save on any playlist to keep it here.<br><a class="text-button" href="#library">Explore the library</a>' : 'You have not added any playlists yet.<br><a class="text-button" href="#create">Add your first playlist</a>') : 'No playlists found. Try another search or clear your filters.<br><button type="button" class="text-button" data-clear-filters>Clear filters</button>';

  elements.viewRoot.innerHTML = `
    <div class="library-layout">
      <header class="library-intro">
        <div><p class="eyebrow">The library</p><h2>${heading}</h2>
        <p>${description}</p></div>
        <a class="primary-button" href="#create">+ Add a playlist</a>
      </header>
      <aside id="libraryFilters" class="filters-panel" ${filtersOpen ? "" : "hidden"} aria-label="Playlist filters">
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
          <h2>Duration</h2>
          <form data-duration-filter>
            <p class="field-hint">Minutes, including both limits. Leave either end blank for no limit.</p>
            <div class="duration-filter-range">
              <label>At least<input name="minDuration" type="number" min="0" step="1" inputmode="numeric" placeholder="Any" value="${escapeAttribute(filters.minDuration)}"></label>
              <label>At most<input name="maxDuration" type="number" min="0" step="1" inputmode="numeric" placeholder="Any" value="${escapeAttribute(filters.maxDuration)}"></label>
            </div>
            <p class="form-error" role="alert"></p>
            <button class="ghost-button small-button" type="submit">Apply duration</button>
          </form>
        </section>
        <section class="filter-section">
          <h2>Music service</h2>
          <p class="field-hint">Match any selected service with a direct playlist link. Entries without a playlist link are excluded.</p>
          ${Object.entries({spotify: "Spotify", youtube: "YouTube", apple: "Apple Music", other: "Other services"}).map(([key, label]) => `<label class="toggle-row"><input type="checkbox" data-service-filter="${key}" ${filters.services.includes(key) ? "checked" : ""}><span>${label}</span></label>`).join("")}
        </section>
        <section class="filter-section">
          <h2>Music tags</h2>
          <p class="field-hint">Match all selected tags.</p>
          ${groupedChoices(qualityGroups, quality => filterPill(quality, filters.qualities.includes(quality)))}
        </section>
        <section class="filter-section">
          <h2>Prefer to exclude…</h2>
          <p class="field-hint">Hide playlists with any selected note. Unreported content may still be present. <a href="#listening-guide">About listening notes</a></p>
          <div class="voice-exclusions">
            ${["sung lyrics", "spoken word"].map(quality => `<label class="toggle-row"><input type="checkbox" data-exclude-quality="${quality}" ${filters.excludedQualities.includes(quality) ? "checked" : ""}><span>${titleCase(quality)}</span></label>`).join("")}
          </div>
          ${[...warningOptions, ...new Set(state.playlists.flatMap(p => warningEntries(p).map(([label]) => label)).filter(label => !warningOptions.includes(label)))].map(warning => `<label class="toggle-row"><input data-exclude-warning="${escapeAttribute(warning)}" type="checkbox" ${filters.excludedWarnings.includes(warning) ? "checked" : ""}><span>${escapeHtml(titleCase(warning))}</span></label>`).join("")}
        </section>
      </aside>

      <section class="playlist-column" aria-label="Playlists">
        <div class="column-toolbar">
          <div>
            <button type="button" class="ghost-button filter-trigger" data-toggle-filters aria-expanded="${filtersOpen}" aria-controls="libraryFilters">Filters${filterCount ? ` · ${filterCount}` : ""}</button>
            <span class="result-count" role="status">${playlists.length} ${playlists.length === 1 ? "playlist" : "playlists"}</span>
          </div>
          <div class="toolbar-actions">
            <label for="sortSelect" class="sr-only">Sort playlists</label>
            <select id="sortSelect" data-sort-select>
              <option value="recommended" ${filters.sort === "recommended" ? "selected" : ""}>Recommended</option>
              <option value="newest" ${filters.sort === "newest" ? "selected" : ""}>Newest</option>
              <option value="favorites" ${filters.sort === "favorites" ? "selected" : ""}>Most saved</option>
              <option value="comments" ${filters.sort === "comments" ? "selected" : ""}>Most discussed</option>
            </select>
            <div class="view-switch" role="group" aria-label="Library view">
              <button type="button" data-library-view="cards" aria-pressed="${libraryView === "cards"}"><span aria-hidden="true">▦</span> Cards</button>
              <button type="button" data-library-view="list" aria-pressed="${libraryView === "list"}"><span aria-hidden="true">☰</span> List</button>
            </div>
          </div>
        </div>

        <div class="playlist-grid ${libraryView === "list" ? "playlist-list" : ""}">
          ${playlists.length ? playlists.map(playlistCard).join("") : `<div class="empty-state">${emptyMessage}</div>`}
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
  const isFavorite = savedPlaylistIds().includes(playlist.id);
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
                <span>${playlist.savedCount} saved</span>
                <span>${playlist.comments.length} comments</span>
              </div>
            </div>
            <button type="button" class="save-button ${isFavorite ? "active" : ""}" data-favorite="${playlist.id}" aria-label="Favorite ${escapeHtml(playlist.title)}">
              ${isFavorite ? "Saved" : "Save"}
            </button>
          </div>

          <div class="playlist-primary-actions">
            ${listeningLinks(playlist)}
            ${playlist.creatorId === state.currentUserId ? `<a class="ghost-button" href="#edit/${playlist.id}">Edit playlist</a><button type="button" class="text-button danger-button" data-delete-playlist="${playlist.id}">Delete playlist</button>` : ""}
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
            <h3>Listening notes</h3>
            ${warningPanel(playlist)}
          </section>

          <section class="detail-section comments-section">
            <h3>Comments</h3>
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
              ${listeningLinks(playlist)}
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
    <button type="button" class="pill-button ${active ? "active" : ""}" aria-pressed="${active}" data-quality-filter="${escapeAttribute(value)}">
      ${titleCase(value)}
    </button>
  `;
}

function playlistCard(playlist) {
  const creator = getUser(playlist.creatorId);
  const isFavorite = savedPlaylistIds().includes(playlist.id);
  const tags = [playlist.modality, ...playlist.qualities.slice(0, 3)];
  const warningsHtml = warningEntries(playlist).slice(0, 2).map(([tag]) => `<span class="tag listening-note">${escapeHtml(titleCase(tag))}${warningOptions.includes(tag) ? "" : " · legacy note"}</span>`).join("");

  return `
    <article class="playlist-card clickable-card" data-card-href="playlist/${playlist.id}" tabindex="0" role="link" aria-label="Open ${escapeAttribute(playlist.title)}">
      <div class="cover-art" style="--cover-a: ${playlist.coverA}; --cover-b: ${playlist.coverB};"></div>
      <div class="card-body">
        <div class="card-identity">
          <div class="card-title-row">
            <div>
              <h3>${escapeHtml(playlist.title)}</h3>
              <p class="meta-line">
                <a href="#profile/${creator?.id || ""}">${escapeHtml(displayUserName(creator))}</a>
                <span aria-hidden="true">·</span>
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
          ${tags.map((tag, index) => `<span class="tag ${index === 0 ? "modality" : ""}">${escapeHtml(titleCase(tag))}</span>`).join("")}
          ${warningsHtml}
        </div>
        <div class="card-actions">
          <div class="card-stats">
            <span>${playlist.savedCount} saved</span>
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
  return `<span class="${className}">${escapeHtml(titleCase(tag))}</span>`;
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
      <textarea id="comment-${playlistId}" name="comment" placeholder="Context, listening notes, adaptations"></textarea>
      <button type="submit" class="primary-button">Comment</button>
    </form>
  `;
}

function warningPanel(playlist) {
  const entries = warningEntries(playlist);
  const reports = playlist.listeningReports || [];
  const available = warningOptions.filter(label => !reports.some(report => report.label === label && report.userId === state.currentUserId));
  return `<div class="warning-panel">
    <p class="field-hint">Specific observations to help you choose. <a href="#listening-guide">How to use listening notes</a></p>
    <div class="warning-list">${entries.length ? entries.map(([label]) => `<span class="tag listening-note" title="${escapeAttribute(warningDefinitions[label] || "Earlier community label; meaning has not been reviewed.")}">${escapeHtml(titleCase(label))}${warningOptions.includes(label) ? "" : " · legacy note"}</span>`).join("") : `<p class="field-hint">${playlist.listeningReviewed ? "Creator reviewed the listening-note categories and marked none." : "No listening notes added yet. This playlist has not been marked as reviewed."}</p>`}</div>
    ${entries.length && playlist.listeningReviewed ? '<p class="field-hint">Creator marked the listening-note categories as reviewed.</p>' : ""}
    ${playlist.listeningContext ? `<p class="listening-context">${escapeHtml(playlist.listeningContext)}</p>` : ""}
    ${playlist.legacyQualities?.length ? `<p class="field-hint">Earlier music tags: ${escapeHtml(playlist.legacyQualities.join(", "))}. Retained for context; not assigned to new categories.</p>` : ""}
    ${reports.filter(report => report.context).map(report => `<p class="listening-context"><strong>${escapeHtml(titleCase(report.label))}</strong> · ${escapeHtml(displayUserName(getUser(report.userId)))}<br>${escapeHtml(report.context)}</p>`).join("")}
    ${getCurrentUser() ? available.length ? `<form class="listening-form" data-listening-form="${playlist.id}">
      <label>Add a listening note<select name="warning">${Object.entries(listeningGroups).map(([group, definitions]) => `<optgroup label="${group}">${Object.keys(definitions).filter(label => available.includes(label)).map(label => `<option value="${label}">${titleCase(label)}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <label>Track or context (optional)<textarea name="context" maxlength="1000" rows="2" placeholder="e.g. Track 3, around 1:20 — a sudden percussion entrance."></textarea></label>
      <button class="primary-button" type="submit">Add listening note</button>
      <p class="field-hint">Each account can add each category once per playlist.</p>
    </form>` : '<p class="field-hint">You have contributed every listening-note category.</p>' : '<button type="button" class="ghost-button" data-open-account>Join to add a listening note</button>'}
  </div>`;
}

function renderListeningGuide() {
  elements.viewRoot.innerHTML = `<article class="listening-guide">
    <a class="back-link" href="#library">Back to library</a>
    <header><p class="eyebrow">A shared vocabulary</p><h2>Listen with more context.</h2><p class="guide-intro">Listening notes describe what is in the music so people can make choices that fit their preferences and setting.</p></header>
    <section><h3>What these notes mean</h3><p>These are the library’s warning tags, expressed as specific, neutral observations. A note is not a rating, a prediction of someone’s reaction, or a clinical safety assessment. Religious or devotional music, for example, may be something a listener seeks or prefers to exclude.</p><p>Music tags describe the overall sound and mood. Voice tags disclose any vocal content present. Listening notes identify particular sounds or subjects that deserve advance context, even if they occur only once.</p></section>
    ${Object.entries(listeningGroups).map(([group, definitions]) => `<section><h3>${group}</h3><dl class="definition-list">${Object.entries(definitions).map(([label, definition]) => `<div><dt>${titleCase(label)}</dt><dd>${definition}</dd></div>`).join("")}</dl></section>`).join("")}
    <section><h3>How to contribute</h3><ol><li>Choose a category based on something you heard. Do not infer content from a title, artist, language, or genre.</li><li>Add a track title, timestamp, or short description when possible. For a transition, name the tracks on either side.</li><li>Keep descriptions factual and brief. Avoid graphic quotations or claims about how everyone will respond.</li></ol><p>For example: “Track 3, around 1:20 — percussion enters much louder than the preceding passage.” Lyrics on their own belong under Sung lyrics; a melancholy mood belongs under Melancholic.</p><p>Creators can mark the categories as reviewed. Community members can contribute one note per category per account. We show the categories and context, without a severity score.</p></section>
    <section><h3>Using exclusions</h3><p>“Prefer to exclude…” hides playlists with any of your selected listening notes. Sung lyrics and Spoken word can be excluded separately using their music tags. Exclusions cannot detect content that has not been reported.</p><p>“No listening notes added” means no information has been submitted. “Creator reviewed” records the creator’s review of these categories; it does not guarantee that a playlist suits every listener. Playlist contents may also change on the linked music service.</p></section>
    <section><h3>Choosing music tags</h3><p>Select the sounds and moods that characterize the playlist overall. Select every voice type that occurs anywhere in it. No vocals cannot be combined with other voice types. Mood words are subjective descriptions, not promised effects.</p><p>Older ambiguous labels, such as Dark/intense, remain visible as legacy notes until reviewed. We do not guess which new category they mean.</p></section>
    <a class="ghost-button" href="#library">Explore the library</a>
  </article>`;
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
  elements.arcBuilder.innerHTML = curve.map((value, index) => {
    const label = index === 0 ? "Start" : index === curve.length - 1 ? "Finish" : `Point ${index + 1}`;
    return `
      <div class="arc-control">
        <label for="arc-point-${index}">${label}</label>
        <output for="arc-point-${index}">${value}</output>
        <input id="arc-point-${index}" type="range" name="arcPoint" min="1" max="5" step="1" value="${value}" data-arc-point>
        <button type="button" class="text-button" data-remove-arc-point="${index}" aria-label="Remove point ${index + 1}, ${label}" ${curve.length <= 2 ? "disabled" : ""}>Remove</button>
      </div>
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

function durationMinutes(value) {
  const match = String(value || "").trim().match(/^(?:(\d+)h)?\s*(?:(\d+)m)?$/);
  if (!match || (!match[1] && !match[2])) return null;
  return Number(match[1] || 0) * 60 + Number(match[2] || 0);
}

function durationRangeError(min, max) {
  if ([min, max].some(value => value !== "" && (!Number.isSafeInteger(Number(value)) || Number(value) < 0))) return "Enter whole minutes of zero or more.";
  if (min !== "" && max !== "" && Number(min) > Number(max)) return "At least must be less than or equal to At most.";
  return "";
}

function filteredPlaylists() {
  const query = normalize(filters.search);
  const rows = state.playlists.filter((playlist) => {
    if (currentRoute().view === "saved" && !savedPlaylistIds().includes(playlist.id)) return false;
    if (currentRoute().view === "contributions" && playlist.creatorId !== state.currentUserId) return false;
    const creator = getUser(playlist.creatorId);
    const searchable = normalize([
      playlist.title,
      creator?.username,
      displayUserName(creator),
      creator?.practice,
      playlist.modality,
      playlist.notes,
      playlist.qualities.join(" "),
      (playlist.legacyQualities || []).join(" "),
      playlist.listeningContext,
      (playlist.listeningReports || []).map(report => report.context).join(" "),
      warningEntries(playlist).map(([tag]) => tag).join(" "),
      playlist.tracks.map((track) => `${track.artist} ${track.title}`).join(" ")
    ].join(" "));

    const matchesSearch = !query || searchable.includes(query);
    const matchesModality = filters.modality === "All" || playlist.modality === filters.modality;
    const matchesQuality = filters.qualities.length === 0 || filters.qualities.every((quality) => playlist.qualities.includes(quality));
    const matchesWarnings = !warningEntries(playlist).some(([label]) => filters.excludedWarnings.includes(label));

    const matchesExcludedQualities = !filters.excludedQualities.some(quality => playlist.qualities.includes(quality));
    const duration = durationMinutes(playlist.duration);
    const hasDurationFilter = filters.minDuration !== "" || filters.maxDuration !== "";
    const matchesDuration = !hasDurationFilter || (duration !== null && (filters.minDuration === "" || duration >= Number(filters.minDuration)) && (filters.maxDuration === "" || duration <= Number(filters.maxDuration)));
    const services = Object.values(playlist.links || {}).map(parsePlaylistLink).filter(Boolean).map(link => link.key);
    const matchesService = !filters.services.length || filters.services.some(service => services.includes(service));

    return matchesSearch && matchesModality && matchesQuality && matchesWarnings && matchesExcludedQualities && matchesDuration && matchesService;
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
    excludedWarnings: [],
  excludedQualities: [],
  services: [],
  minDuration: "",
  maxDuration: "",
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

  const existed = savedPlaylistIds().includes(playlistId);
  toggleArrayValue(savedPlaylistIds(), playlistId);
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

function addWarning(playlistId, label, context = "") {
  const playlist = getPlaylist(playlistId);
  if (!playlist) return;
  if (!getCurrentUser()) { openAccountDialog(); return; }
  const warning = cleanWarning(label);
  if (!warningOptions.includes(warning)) return;
  playlist.listeningReports ||= [];
  if (playlist.listeningReports.some(report => report.label === warning && report.userId === state.currentUserId)) {
    showToast("You already added this listening note");
    return;
  }
  playlist.listeningReports.push({ label: warning, userId: state.currentUserId, context: String(context || "").trim().slice(0, 1000) });
  playlist.warnings[warning] = 1;
  saveState();
  render();
  showToast("Listening note added");
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

function parsePlaylistLink(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    if (host === "open.spotify.com") {
      if (!/^\/(?:intl-[a-z-]+\/)?playlist\/[a-zA-Z0-9]+\/?$/.test(path)) return null;
      return { key: "spotify", label: "Spotify", href: url.href };
    }
    if (["youtube.com", "www.youtube.com", "music.youtube.com", "youtu.be"].includes(host)) {
      if (!url.searchParams.get("list") || !["/playlist", "/watch", "/"].includes(path) && host !== "youtu.be") return null;
      return { key: "youtube", label: "YouTube", href: url.href };
    }
    if (host === "music.apple.com") {
      if (!/^\/(?:[a-z]{2}\/)?playlist\/.+/.test(path)) return null;
      return { key: "apple", label: "Apple Music", href: url.href };
    }
    if (path === "/" || !path) return null;
    return { key: "other", label: host, href: url.href };
  } catch { return null; }
}

function linkMapFrom(link) {
  const parsed = parsePlaylistLink(link);
  return parsed ? { [parsed.key]: parsed.href } : {};
}

function serviceNameFromLink(link) {
  return parsePlaylistLink(link)?.label || "music service";
}

function listeningLinks(playlist) {
  const links = Object.values(playlist.links || {}).map(parsePlaylistLink).filter(Boolean);
  if (!links.length) return '<p class="field-hint">No playable link yet. This entry needs a direct playlist URL.</p>';
  return links.map(link => `<a class="primary-button button-link" href="${escapeAttribute(link.href)}" target="_blank" rel="noopener noreferrer">Open in ${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a>`).join("");
}

function savedPlaylistIds() {
  if (!state.currentUserId) return [];
  return state.favoritesByUser[state.currentUserId] ||= [];
}

function prepareEditor(route) {
  const playlist = route.view === "edit" ? getPlaylist(route.id) : null;
  if (route.view === "edit" && (!playlist || playlist.creatorId !== state.currentUserId)) {
    elements.createPage.hidden = true;
    elements.viewRoot.hidden = false;
    renderNotFound(playlist ? "You can only edit your own contributions" : "Playlist not found");
    return;
  }
  const key = playlist?.id || "create";
  if (editorKey === key) return;
  editorKey = key;
  editingId = playlist?.id || null;
  const form = elements.playlistForm;
  form.reset();
  resetChoicePills();
  elements.playlistError.textContent = "";
  form.querySelector("h2").textContent = playlist ? "Edit playlist" : "Add a playlist";
  form.querySelector('[type="submit"]').textContent = playlist ? "Save changes" : "Add playlist";
  form.querySelectorAll("[data-editor-back]").forEach(link => link.href = playlist ? `#playlist/${playlist.id}` : "#library");
  renderArcBuilder(playlist?.energyCurve || defaultCreateCurve);
  if (!playlist) return;
  const hours = Number(playlist.duration.match(/(\d+)h/)?.[1] || 0);
  const minutes = Number(playlist.duration.match(/(\d+)m/)?.[1] || 0);
  const values = { title: playlist.title, durationHours: hours, durationMinutes: minutes, modality: playlist.modality, notes: playlist.notes, serviceLink: Object.values(playlist.links || {})[0] || "", listeningContext: playlist.listeningContext || "" };
  for (const [name, value] of Object.entries(values)) form.elements.namedItem(name).value = value;
  form.elements.namedItem("listeningReviewed").checked = Boolean(playlist.listeningReviewed);
  const ownerLabels = playlist.creatorWarningLabels || Object.keys(playlist.warnings || {}).filter(label => !(playlist.listeningReports || []).some(report => report.label === label && report.userId !== state.currentUserId));
  form.querySelectorAll('.form-pills input').forEach(input => {
    input.checked = (input.name === "quality" ? playlist.qualities : ownerLabels).includes(input.value);
    input.closest(".pill-button").classList.toggle("active", input.checked);
  });
}

function deletePlaylist(id) {
  const playlist = getPlaylist(id);
  if (!playlist || playlist.creatorId !== state.currentUserId) return;
  if (!window.confirm(`Delete “${playlist.title}” from this browser's library? This cannot be undone.`)) return;
  state.playlists = state.playlists.filter(item => item.id !== id);
  for (const userId of Object.keys(state.favoritesByUser)) {
    state.favoritesByUser[userId] = state.favoritesByUser[userId].filter(savedId => savedId !== id);
  }
  state.favorites = state.favorites.filter(savedId => savedId !== id);
  editorKey = null;
  editingId = null;
  saveState();
  location.hash = "#contributions";
  render();
  showToast("Playlist deleted");
}

function warningEntries(playlist) {
  const warnings = {
    ...warningMapFrom(playlist.cautions || []),
    ...(playlist.warnings || {})
  };

  return Object.entries(warnings)
    .map(([label, count]) => [cleanWarning(label), Number(count) || 0])
    .filter(([label, count]) => label && count > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));
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
