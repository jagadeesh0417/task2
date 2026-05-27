import requests
import json
import sys
from datetime import datetime


WEATHER_URL = "https://wttr.in"
CRYPTO_URL = "https://api.coingecko.com/api/v3"
NEWS_API_KEY = "your_api_key_here"
NEWS_URL = "https://newsapi.org/v2"


def get_weather(city="London", forecast=False):
    params = {"format": "j1"}
    if forecast:
        params["days"] = 3
    else:
        params["days"] = 0
    try:
        resp = requests.get(f"{WEATHER_URL}/{city}", params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        current = data["current_condition"][0]
        return {
            "city": data["nearest_area"][0]["areaName"][0]["value"],
            "temp_c": current["temp_C"],
            "temp_f": current["temp_F"],
            "humidity": current["humidity"],
            "condition": current["weatherDesc"][0]["value"],
            "wind_speed": current["windspeedKmph"],
        }
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


def list_crypto(currency="usd", filter_keyword=None):
    try:
        params = {"vs_currency": currency, "order": "market_cap_desc", "per_page": 50, "page": 1}
        resp = requests.get(f"{CRYPTO_URL}/coins/markets", params=params, timeout=10)
        resp.raise_for_status()
        coins = resp.json()
        if filter_keyword:
            coins = [c for c in coins if filter_keyword.lower() in c["name"].lower() or filter_keyword.lower() in c["symbol"].lower()]
        results = []
        for c in coins:
            results.append({
                "name": c["name"],
                "symbol": c["symbol"].upper(),
                "price": c["current_price"],
                "market_cap": c["market_cap"],
                "change_24h": c["price_change_percentage_24h"],
            })
        return results
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


def get_news(query=None, category="general"):
    if NEWS_API_KEY == "your_api_key_here":
        return {"error": "NewsAPI key not configured. Set NEWS_API_KEY in the script."}
    try:
        params = {"apiKey": NEWS_API_KEY, "pageSize": 10}
        if query:
            params["q"] = query
            endpoint = f"{NEWS_URL}/everything"
        else:
            params["category"] = category
            endpoint = f"{NEWS_URL}/top-headlines"
        resp = requests.get(endpoint, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        articles = []
        for a in data.get("articles", []):
            articles.append({
                "title": a["title"],
                "source": a["source"]["name"],
                "url": a["url"],
                "published": a["publishedAt"][:10],
            })
        return articles
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


def display_header(title):
    print()
    print("=" * 60)
    print(f"  {title}")
    print("=" * 60)


def main():
    while True:
        print()
        print("=" * 60)
        print("  API INTEGRATION DASHBOARD")
        print("=" * 60)
        print("  1. Weather (current)")
        print("  2. Weather (3-day forecast)")
        print("  3. Crypto (top 50)")
        print("  4. Crypto (search/filter)")
        print("  5. News (top headlines)")
        print("  6. News (search)")
        print("  7. Exit")
        print("=" * 60)
        choice = input("  Select option: ").strip()

        if choice == "1":
            city = input("  Enter city name: ").strip() or "London"
            data = get_weather(city)
            if "error" in data:
                print(f"  Error: {data['error']}")
            else:
                display_header(f"Weather in {data['city']}")
                print(f"  Condition:   {data['condition']}")
                print(f"  Temperature: {data['temp_c']} C / {data['temp_f']} F")
                print(f"  Humidity:    {data['humidity']}%")
                print(f"  Wind:        {data['wind_speed']} km/h")

        elif choice == "2":
            city = input("  Enter city name: ").strip() or "London"
            print(f"\n  Fetching 3-day forecast for {city}...")
            params = {"format": "j1", "days": 3}
            try:
                resp = requests.get(f"{WEATHER_URL}/{city}", params=params, timeout=10)
                resp.raise_for_status()
                data = resp.json()
                display_header(f"3-Day Forecast: {data['nearest_area'][0]['areaName'][0]['value']}")
                for i, day in enumerate(data["weather"]):
                    date = day["date"]
                    maxtemp = day["maxtempC"]
                    mintemp = day["mintempC"]
                    desc = day["hourly"][0]["weatherDesc"][0]["value"]
                    print(f"  {date}: {desc}, {mintemp}-{maxtemp} C")
            except requests.exceptions.RequestException as e:
                print(f"  Error: {e}")

        elif choice == "3":
            print("  Loading top 50 cryptocurrencies...")
            coins = list_crypto()
            if isinstance(coins, dict) and "error" in coins:
                print(f"  Error: {coins['error']}")
            else:
                display_header("Top 50 Cryptocurrencies")
                print(f"  {'Name':<20} {'Symbol':<8} {'Price (USD)':<15} {'24h Change':<10}")
                print("  " + "-" * 53)
                for c in coins[:10]:
                    change = f"{c['change_24h']:.2f}%" if c['change_24h'] else "N/A"
                    print(f"  {c['name']:<20} {c['symbol']:<8} ${c['price']:<12,.2f} {change:<10}")

        elif choice == "4":
            keyword = input("  Enter coin name/symbol to filter: ").strip()
            if not keyword:
                print("  No keyword entered.")
                continue
            coins = list_crypto(filter_keyword=keyword)
            if isinstance(coins, dict) and "error" in coins:
                print(f"  Error: {coins['error']}")
            elif not coins:
                print(f"  No coins found matching '{keyword}'.")
            else:
                display_header(f"Crypto matching '{keyword}'")
                print(f"  {'Name':<20} {'Symbol':<8} {'Price (USD)':<15} {'24h Change':<10}")
                print("  " + "-" * 53)
                for c in coins:
                    change = f"{c['change_24h']:.2f}%" if c['change_24h'] else "N/A"
                    print(f"  {c['name']:<20} {c['symbol']:<8} ${c['price']:<12,.2f} {change:<10}")

        elif choice == "5":
            category = input("  Category (business/tech/sports/entertainment/general): ").strip() or "general"
            articles = get_news(category=category)
            if isinstance(articles, dict) and "error" in articles:
                print(f"  Error: {articles['error']}")
            else:
                display_header(f"Top News - {category.title()}")
                for i, a in enumerate(articles, 1):
                    print(f"  {i}. [{a['source']}] {a['title']}")
                    print(f"     {a['url']} ({a['published']})")

        elif choice == "6":
            query = input("  Search news: ").strip()
            if not query:
                print("  No search term entered.")
                continue
            articles = get_news(query=query)
            if isinstance(articles, dict) and "error" in articles:
                print(f"  Error: {articles['error']}")
            else:
                display_header(f"News matching '{query}'")
                for i, a in enumerate(articles, 1):
                    print(f"  {i}. [{a['source']}] {a['title']}")
                    print(f"     {a['url']} ({a['published']})")

        elif choice == "7":
            print("\n  Goodbye!")
            sys.exit(0)

        else:
            print("  Invalid option. Try again.")


if __name__ == "__main__":
    main()
