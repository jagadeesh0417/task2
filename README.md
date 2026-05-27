# API Dashboard

A web-based dashboard integrating **Weather**, **Cryptocurrency**, and **News** APIs using vanilla HTML, CSS, and JavaScript.

## APIs Used

| Service | API | Key Required |
|---------|-----|-------------|
| Weather | [wttr.in](https://wttr.in) | No |
| Crypto | [CoinGecko](https://www.coingecko.com/en/api) | No |
| News | [NewsAPI](https://newsapi.org) | Yes (free) |

## Setup

1. Clone the repo
2. Open `index.html` in a browser
3. (Optional) For News: get a free API key at [newsapi.org](https://newsapi.org) and set `NEWS_API_KEY` in `script.js`

## Features

- **Weather** — current conditions & 3-day forecast by city
- **Crypto** — top 50 coins by market cap, search/filter by name or symbol
- **News** — top headlines by category, keyword search

## Python Version

A CLI version is also available at `api_integration.py`.
