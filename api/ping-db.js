export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/configuracion?select=clave&limit=1`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
        }
      }
    );
    if (response.ok) {
      res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ error: 'Ping failed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
