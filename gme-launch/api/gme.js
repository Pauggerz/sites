// Live NYSE quote proxy — the browser can't call Yahoo cross-origin, so this
// same-domain function fetches it server-side. Cached 5 min at the edge.
export default async function handler(req, res) {
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GME?range=1d&interval=1d', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    });
    const j = await r.json();
    const m = j.chart.result[0].meta;
    if (!(m.regularMarketPrice > 1 && m.regularMarketPrice < 1000)) throw new Error('price out of sanity band');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ price: m.regularMarketPrice, prevClose: m.chartPreviousClose, t: m.regularMarketTime });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
