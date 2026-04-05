export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { celular, otp } = req.body;
  if (!celular || !otp) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const celularLimpio = celular.replace(/\D/g, '');
    const otpHash = Buffer.from(otp).toString('base64');

    const supabaseRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/otp_verificaciones?celular=eq.${celularLimpio}&otp_hash=eq.${otpHash}&usado=eq.false&expira_en=gt.${new Date().toISOString()}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
        }
      }
    );

    const data = await supabaseRes.json();
    if (!data?.length) return res.status(400).json({ error: 'Código inválido o expirado' });

    // Marcar como usado
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/otp_verificaciones?id=eq.${data[0].id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usado: true })
      }
    );

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar código' });
  }
}
