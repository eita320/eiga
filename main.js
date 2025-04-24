const apiKey = "e014af4af6a8ccab0745c1d7569ab64f";

// JSON設定値
const appConfig = {
  "displaySettings": {
    "maxRanking": 10,
    "maxRelated": 5,
    "defaultImage": "./no-image.jpg",
    "messages": {
      "noResults": "映画が見つかりませんでした",
      "fetchError": "データの取得に失敗しました",
      "existFavorite": "この映画はすでにお気に入りに登録されています",
      "addFavorite": "をお気に入りに追加しました"
    }
  }
};

// 🎬 検索履歴の最大保存数（追加）
const MAX_HISTORY = 10;

// 🎬 共通ユーティリティ関数
const checkPoster = (path) => {
  return path ? `https://image.tmdb.org/t/p/w300${path}` : appConfig.displaySettings.defaultImage;
};

// 🎬 Enterキーで検索できるようにする
const searchInput = document.getElementById("movieTitle");
if (searchInput) {
  searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchButton.click();
    }
  });
}

// 🎬 検索履歴関連の関数群（追加）
const saveSearchHistory = (title) => {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  history = history.filter(item => item !== title);
  history.unshift(title);
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem("searchHistory", JSON.stringify(history));
  displaySearchHistory();
};

const displaySearchHistory = () => {
  const historyContainer = document.getElementById("searchHistory");
  if (!historyContainer) return;
  const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  historyContainer.innerHTML = history.length
    ? history.map(title => `<li onclick="searchFromHistory('${title.replace(/'/g, "\\'")}')">${title}</li>`).join("")
    : "<p>検索履歴がありません</p>";
};

const searchFromHistory = (title) => {
  document.getElementById("movieTitle").value = title;
  searchMovie(title);
};

// 🎬 検索処理を関数化（変更）
const searchMovie = (title) => {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=ja`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.results?.length > 0) {
        const movie = data.results[0];
        displayMovie(movie);
        fetchRelatedMovies(movie.id);
      } else {
        showMessage(appConfig.displaySettings.messages.noResults);
      }
    })
    .catch(error => {
      console.error("エラー:", error);
      showMessage(appConfig.displaySettings.messages.fetchError);
    });
};

// 🎬 検索ボタンのイベント修正（変更）
const searchButton = document.getElementById("searchButton");
if (searchButton) {
  searchButton.addEventListener("click", function () {
    const title = document.getElementById("movieTitle").value.trim();
    if (!title) return;
    saveSearchHistory(title);
    searchMovie(title);
  });
}
// 🎬 メッセージ表示
const showMessage = (message) => {
  const infoArea = document.getElementById("movieInfo");
  if (infoArea) infoArea.innerHTML = `<p class="message">${message}</p>`;
};

// 🎬 映画情報表示（追加が必要）
const displayMovie = (movie) => {
    const movieInfo = document.getElementById("movieInfo");
    const relatedSection = document.getElementById("relatedSection");
    
    if (!movieInfo) return;
  
    // 関連作品セクションを表示
    relatedSection.style.display = 'block';
  
    movieInfo.innerHTML = `
      <div class="movie-card">
        <h2>${movie.title} (${movie.release_date?.substring(0,4) || "未公開"})</h2>
        <img src="${checkPoster(movie.poster_path)}" alt="${movie.title}">
        <p><strong>評価:</strong> ${movie.vote_average}/10</p>
        <p><strong>あらすじ:</strong> ${movie.overview || "あらすじがありません"}</p>
        <button onclick="addToFavorites(
          ${movie.id}, 
          '${movie.title.replace(/'/g, "\\'")}', 
          '${movie.poster_path}'
        )">💖 お気に入り追加</button>
      </div>
    `;
  };
  
// 🎬 お気に入り追加
const addToFavorites = (id, title, posterPath) => {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  
  if (!favorites.some(movie => movie.id === id)) {
    favorites.push({ id, title, posterPath });
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert(`${title} ${appConfig.displaySettings.messages.addFavorite}`);
    if (document.getElementById("favoritesList")) displayFavorites();
  } else {
    alert(appConfig.displaySettings.messages.existFavorite);
  }
};

// 🎬 お気に入り表示
const displayFavorites = () => {
  const favoritesList = document.getElementById("favoritesList");
  if (!favoritesList) return;

  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favoritesList.innerHTML = favorites.length > 0
    ? favorites.map(movie => `
        <div class="movie-card">
          <h3>${movie.title}</h3>
          <img src="${checkPoster(movie.posterPath)}" alt="${movie.title}">
          <button onclick="removeFromFavorites(${movie.id})">❌ 削除</button>
        </div>
      `).join("")
    : "<p>お気に入りがありません</p>";
};

// 🎬 お気に入り削除
const removeFromFavorites = (id) => {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter(movie => movie.id !== id);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  displayFavorites();
};

// 🎬 ランキング取得
const fetchPopularMovies = () => {
  const rankingList = document.getElementById("rankingList");
  if (!rankingList) return;

  rankingList.innerHTML = '<div class="loading">読み込み中...</div>';

  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=ja&page=1`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      rankingList.innerHTML = data.results
        ?.slice(0, appConfig.displaySettings.maxRanking)
        ?.map(movie => `
          <div class="movie-card">
            <h3>${movie.title} (${movie.release_date?.substring(0,4)})</h3>
            <img src="${checkPoster(movie.poster_path)}" alt="${movie.title}">
            <p>評価: ${movie.vote_average}/10</p>
          </div>
        `).join("") || '<p>データが見つかりませんでした</p>';
    })
    .catch(error => {
      console.error("エラー:", error);
      rankingList.innerHTML = '<p>データの取得に失敗しました</p>';
    });
};

// 🎬 関連作品取得
const fetchRelatedMovies = (movieId) => {
  const relatedMovies = document.getElementById("relatedMovies");
  if (!relatedMovies) return;

  relatedMovies.innerHTML = '<div class="loading">読み込み中...</div>';

  const url = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${apiKey}&language=ja`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      relatedMovies.innerHTML = data.results
        ?.slice(0, appConfig.displaySettings.maxRelated)
        ?.map(movie => `
          <div class="movie-card">
            <h3>${movie.title}</h3>
            <img src="${checkPoster(movie.poster_path)}" alt="${movie.title}">
            <p>評価: ${movie.vote_average}/10</p>
          </div>
        `).join("") || '<p>関連作品が見つかりませんでした</p>';
    })
    .catch(error => {
      console.error("エラー:", error);
      relatedMovies.innerHTML = '<p>データの取得に失敗しました</p>';
    });
};

// 🎬 ページ初期化
window.onload = () => {
  if (window.location.pathname.includes('favorites.html')) {
    displayFavorites();
  } else if (window.location.pathname.includes('ranking.html')) {
    fetchPopularMovies();
  }
};