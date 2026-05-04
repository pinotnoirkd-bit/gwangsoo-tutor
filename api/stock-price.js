export default async function handler(req, res) {
  const { code, days } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'code required' });
  }
  const d = parseInt(days || '90');
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - d * 86400;
  const symbols = [code + '.KS', code + '.KQ'];
  
  for (const symbol of symbols) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Vercel)' }
      });
      if (!resp.ok) continue;
      const json = await resp.json();
      const r = json?.chart?.result?.[0];
      if (!r) continue;
      const ts = r.timestamp || [];
      const closes = r.indicators?.quote?.[0]?.close || [];
      const points = [];
      for (let i = 0; i < ts.length; i++) {
        if (closes[i] != null) {
          points.push({
            date: new Date(ts[i] * 1000).toISOString().slice(0, 10),
            close: Math.round(closes[i])
          });
        }
      }
      if (points.length > 0) {
        res.setHeader('Cache-Control', 's-maxage=300');
        return res.status(200).json({ points, symbol });
      }
    } catch (e) { continue; }
  }
  return res.status(404).json({ error: 'not found' });
}
