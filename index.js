const fetch = require("node-fetch");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const [kalshiRes, polyRes] = await Promise.all([
      fetch("https://api.elections.kalshi.com/trade-api/v2/markets?limit=100&status=open"),
      fetch("https://clob.polymarket.com/markets?limit=100"),
    ]);

    const kalshiData = await kalshiRes.json();
    const polyData = await polyRes.json();

    const kalshi = (kalshiData.markets || []).map(m => ({
      title: m.title,
      yes_price: m.last_price ?? m.yes_ask ?? 0.5,
      closes: m.close_time,
      category: m.category,
    }));

    const polymarket = (polyData.data || []).map(m => ({
      question: m.question,
      price: parseFloat(m.tokens?.[0]?.price ?? 0.5),
      closes: m.end_date_iso,
    }));

    res.json({ kalshi, polymarket });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

