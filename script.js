const CLIENT_ID = "6b2220c0";

const API_URL = "https://api.jamendo.com/v3.0/tracks/";

const audio = document.getElementById("audio");

const playBtn = document.getElementById("play");

const nextBtn = document.getElementById("next");

const prevBtn = document.getElementById("prev");

const title = document.getElementById("title");

const artist = document.getElementById("artist");

const cover = document.getElementById("cover");

const progress = document.getElementById("progress");

const volume = document.getElementById("volume");

const volumeIcon = document.getElementById("volumeIcon");

const currentTimeEl = document.getElementById("currentTime");

const durationEl = document.getElementById("duration");

const playlist = document.getElementById("playlist");

const searchInput = document.getElementById("searchInput");

const searchBtn = document.getElementById("searchBtn");

const refreshBtn = document.getElementById("refreshBtn");

const loading = document.getElementById("loading");

const errorMessage = document.getElementById("errorMessage");

const playingAnimation = document.getElementById("playingAnimation");

const songCount = document.getElementById("songCount");

let songs = [];

let currentSong = 0;

let isPlaying = false;

fetchSongs();

async function fetchSongs(searchTerm = "") {
  showLoading();

  hideError();

  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      format: "json",
      limit: "40",
      imagesize: "500",
    });

    if (searchTerm.trim() !== "") {
      params.set("search", searchTerm.trim());
    }

    const url = `${API_URL}?${params.toString()}`;

    console.log("Fetching songs:", searchTerm || "Popular songs");

    console.log("API URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Jamendo Response:", data);

    if (data.headers?.status !== "success") {
      throw new Error(data.headers?.error_message || "Jamendo API error");
    }

    if (!data.results || data.results.length === 0) {
      throw new Error(
        `No songs found${searchTerm ? ` for "${searchTerm}"` : ""}.`,
      );
    }

    songs = data.results.map((song) => ({
      id: song.id,

      title: song.name,

      artist: song.artist_name,

      src: song.audio,

      cover: song.image || song.album_image,

      duration: Number(song.duration) || 0,

      downloadAllowed: song.audiodownload_allowed,
    }));

    console.log("Songs loaded:", songs.length);

    currentSong = 0;

    audio.pause();

    isPlaying = false;

    loadSong(currentSong);
    createPlaylist();
  } catch (error) {
    console.error("Music API Error:", error);

    showError(error.message || "Unable to load music.");
  } finally {
    hideLoading();
  }
}

function loadSong(index) {
  if (!songs[index]) {
    return;
  }

  const song = songs[index];

  title.textContent = song.title;

  artist.textContent = song.artist;

  audio.src = song.src;

  cover.src = song.cover || "https://picsum.photos/500";

  progress.value = 0;

  currentTimeEl.textContent = "0:00";

  durationEl.textContent = formatTime(song.duration);

  playBtn.innerHTML = '<i class="fas fa-play"></i>';

  playingAnimation.classList.remove("active");

  highlightSong();
}

function playSong() {
  if (!audio.src) {
    return;
  }

  audio
    .play()
    .then(() => {
      isPlaying = true;

      playBtn.innerHTML = '<i class="fas fa-pause"></i>';

      playingAnimation.classList.add("active");
    })
    .catch((error) => {
      console.error("Audio playback error:", error);
    });
}

function pauseSong() {
  audio.pause();

  isPlaying = false;

  playBtn.innerHTML = '<i class="fas fa-play"></i>';

  playingAnimation.classList.remove("active");
}

playBtn.addEventListener("click", () => {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
});

nextBtn.addEventListener("click", () => {
  if (songs.length === 0) {
    return;
  }

  currentSong++;

  if (currentSong >= songs.length) {
    currentSong = 0;
  }

  loadSong(currentSong);

  playSong();
});

prevBtn.addEventListener("click", () => {
  if (songs.length === 0) {
    return;
  }

  currentSong--;

  if (currentSong < 0) {
    currentSong = songs.length - 1;
  }

  loadSong(currentSong);

  playSong();
});

audio.addEventListener("ended", () => {
  nextBtn.click();
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration || isNaN(audio.duration)) {
    return;
  }

  const percentage = (audio.currentTime / audio.duration) * 100;

  progress.value = percentage;

  currentTimeEl.textContent = formatTime(audio.currentTime);

  durationEl.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
  if (!audio.duration) {
    return;
  }

  audio.currentTime = (progress.value / 100) * audio.duration;
});

volume.addEventListener("input", () => {
  audio.volume = Number(volume.value);

  updateVolumeIcon();
});

function updateVolumeIcon() {
  const value = Number(volume.value);

  if (value === 0) {
    volumeIcon.className = "fas fa-volume-xmark";
  } else if (value < 0.5) {
    volumeIcon.className = "fas fa-volume-low";
  } else {
    volumeIcon.className = "fas fa-volume-high";
  }
}

function createPlaylist() {
  playlist.innerHTML = "";

  songCount.textContent = `${songs.length} ${
    songs.length === 1 ? "song" : "songs"
  }`;

  songs.forEach((song, index) => {
    const div = document.createElement("div");

    div.classList.add("song");

    div.innerHTML = `

        <div class="song-number">
          ${index + 1}
        </div>

        <img
          src="${song.cover || "https://picsum.photos/100"}"
          alt="${song.title}"
        />

        <div class="song-info">

          <strong>
            ${song.title}
          </strong>

          <small>
            ${song.artist}
          </small>

        </div>

      `;

    div.addEventListener("click", () => {
      currentSong = index;

      loadSong(currentSong);

      playSong();
    });

    playlist.appendChild(div);
  });

  highlightSong();
}

function highlightSong() {
  document.querySelectorAll(".song").forEach((item, index) => {
    item.classList.toggle("active", index === currentSong);
  });
}

searchBtn.addEventListener("click", () => {
  const searchTerm = searchInput.value.trim();

  fetchSongs(searchTerm);
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const searchTerm = searchInput.value.trim();

    fetchSongs(searchTerm);
  }
});

refreshBtn.addEventListener("click", () => {
  searchInput.value = "";

  fetchSongs();
});

function formatTime(time) {
  if (!time || isNaN(time)) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);

  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function showLoading() {
  loading.style.display = "flex";
}

function hideLoading() {
  loading.style.display = "none";
}

function showError(message) {
  errorMessage.textContent = message;

  errorMessage.style.display = "block";
}

function hideError() {
  errorMessage.textContent = "";

  errorMessage.style.display = "none";
}
