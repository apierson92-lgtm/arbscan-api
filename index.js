const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

const POLITICS_KEYWORDS = ["president", "election", "congress", "senate", "house", "vote", "fed", "rate", "inflation", "gdp", "recession", "unemployment", "trump", "biden", "harris", "republican", "democrat", "government", "shutdown", "debt", "ceasefire", "war", "ukraine", "russia", "china", "tariff", "trade", "supreme court", "legislation", "bill", "policy", "mayor", "governor", "prime minister"];

function isPolitics(text) {
  const t = text.toLowerCase();
  return POLITICS_KEYWORDS.some(k => t.includes(k));
}

app.get("/markets", async (req, res) => {
  try {
    const [kalshiRes, polyRes] = await Promise.all([
      fetch("https://api.elections.kalshi.com/trade-api/v2/markets?limit=200&status=open"),
      fetch("https://gamma-api.polymarket.com/markets?active=true&limit=200"),
    ]);

    const kalshiData = await kalshiRes.json();
    const polyData = await polyRes.json();

    const now = new Date();

    const kalshi = (kalshiData.markets || [])
      .filter(m => m.close_time && new Date(m.close_time) > now && isPolitics(m.title || ""))
      .map(m => ({
        title: m.title,
        yes_price: m.last_price ?? m.yes_ask ?? 0.5,
        closes: m.close_time,
        category: m.category,
      }));

    const polymarket = (Array.isArray(polyData) ? polyData : [])
      .filter(m => m.endDate && new Date(m.endDate) > now && isPolitics(m.question || ""))
      .map(m => ({
        question: m.question,
        price: parseFloat(m.outcomePrices?.[0] ?? m.bestBid ?? 0.5),
        closes: m.endDate,
      }));

    res.json({ kalshi, polymarket });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Running!"));
