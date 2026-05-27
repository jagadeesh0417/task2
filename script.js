const NEWS_API_KEY = "your_api_key_here";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showLoader() { $("#loader").classList.remove("hidden"); }
function hideLoader() { $("#loader").classList.add("hidden"); }

// Tab switching
$$(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab").forEach((b) => b.classList.remove("active"));
    $$(".tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    $(`#${btn.dataset.tab}`).classList.add("active");
  });
});

// ==================== WEATHER ====================

async function fetchWeather(city, forecast = false) {
  showLoader();
  const el = $("#weatherResult");
  try {
    const days = forecast ? 3 : 0;
    const resp = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1&days=${days}`
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const area = data.nearest_area[0].areaName[0].value;
    const cur = data.current_condition[0];

    if (forecast) {
      let html = `<div class="weather-main"><div class="weather-temp">${cur.temp_C}°C</div>
        <div><strong>${area}</strong><br>${cur.weatherDesc[0].value}</div></div>
        <div class="forecast-grid">`;
      data.weather.forEach((d) => {
        html += `<div class="forecast-day">
          <div class="date">${d.date}</div>
          <div class="temp">${d.mintempC}–${d.maxtempC}°C</div>
          <div class="desc">${d.hourly[0].weatherDesc[0].value}</div>
        </div>`;
      });
      html += "</div>";
      el.innerHTML = html;
    } else {
      el.innerHTML = `
        <div class="weather-main">
          <div class="weather-temp">${cur.temp_C}°C</div>
          <div>
            <strong>${area}</strong><br>
            ${cur.weatherDesc[0].value}
          </div>
        </div>
        <div class="weather-details">
          <div class="weather-detail"><div class="label">Feels Like</div><div class="value">${cur.FeelsLikeC}°C</div></div>
          <div class="weather-detail"><div class="label">Humidity</div><div class="value">${cur.humidity}%</div></div>
          <div class="weather-detail"><div class="label">Wind</div><div class="value">${cur.windspeedKmph} km/h</div></div>
          <div class="weather-detail"><div class="label">UV Index</div><div class="value">${cur.uv_index}</div></div>
        </div>`;
    }
  } catch (err) {
    el.innerHTML = `<div class="error">Error: ${err.message}</div>`;
  }
  hideLoader();
}

$("#weatherBtn").addEventListener("click", () => {
  fetchWeather($("#cityInput").value || "London");
});

$("#forecastBtn").addEventListener("click", () => {
  fetchWeather($("#cityInput").value || "London", true);
});

// Enter key for weather
$("#cityInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchWeather(e.target.value || "London");
});

// ==================== CRYPTO ====================

async function fetchCrypto(filter = "") {
  showLoader();
  const el = $("#cryptoResult");
  try {
    const resp = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false"
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    let coins = await resp.json();

    if (filter) {
      const q = filter.toLowerCase();
      coins = coins.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    if (!coins.length) {
      el.innerHTML = `<div class="empty">No coins found matching "${filter}"</div>`;
      hideLoader();
      return;
    }

    const top = coins.slice(0, 10);
    let html = `<table class="crypto-table">
      <thead><tr>
        <th>#</th><th>Name</th><th>Price</th><th>24h Change</th><th>Market Cap</th>
      </tr></thead><tbody>`;
    top.forEach((c, i) => {
      const ch = c.price_change_percentage_24h;
      const cls = ch >= 0 ? "positive" : "negative";
      const sign = ch >= 0 ? "+" : "";
      html += `<tr>
        <td>${i + 1}</td>
        <td><span class="name">${c.name}</span> <span class="symbol">${c.symbol.toUpperCase()}</span></td>
        <td class="price">$${c.current_price.toLocaleString()}</td>
        <td class="change ${cls}">${sign}${ch?.toFixed(2) || "N/A"}%</td>
        <td>$${(c.market_cap / 1e9).toFixed(2)}B</td>
      </tr>`;
    });
    html += "</tbody></table>";
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = `<div class="error">Error: ${err.message}</div>`;
  }
  hideLoader();
}

$("#cryptoBtn").addEventListener("click", () => fetchCrypto());
$("#cryptoSearchBtn").addEventListener("click", () => {
  fetchCrypto($("#cryptoSearch").value);
});
$("#cryptoSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchCrypto(e.target.value);
});

// ==================== NEWS ====================

async function fetchNews(query = "", category = "general") {
  showLoader();
  const el = $("#newsResult");

  if (NEWS_API_KEY === "your_api_key_here") {
    el.innerHTML = `<div class="error">NewsAPI key not configured. Get a free key at <a href="https://newsapi.org" target="_blank" style="color:#60a5fa">newsapi.org</a> and set it in <code>script.js</code>.</div>`;
    hideLoader();
    return;
  }

  try {
    let url;
    if (query) {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=10&apiKey=${NEWS_API_KEY}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=10&apiKey=${NEWS_API_KEY}`;
    }
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    if (!data.articles?.length) {
      el.innerHTML = `<div class="empty">No articles found.</div>`;
      hideLoader();
      return;
    }

    let html = "";
    data.articles.forEach((a) => {
      const date = a.publishedAt ? a.publishedAt.slice(0, 10) : "";
      html += `<div class="news-item">
        <div class="source">${a.source?.name || "Unknown"}</div>
        <div class="title"><a href="${a.url}" target="_blank" rel="noopener">${a.title}</a></div>
        <div class="meta">${date}</div>
      </div>`;
    });
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = `<div class="error">Error: ${err.message}</div>`;
  }
  hideLoader();
}

$("#newsBtn").addEventListener("click", () => {
  fetchNews("", $("#categorySelect").value);
});
$("#newsSearchBtn").addEventListener("click", () => {
  fetchNews($("#newsQuery").value);
});
$("#newsQuery").addEventListener("keydown", (e) => {
  if (e.key === "Enter") fetchNews(e.target.value);
});

// ==================== LOAD ====================

fetchWeather("London");
