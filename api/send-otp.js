export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { celular } = req.body;
  if (!celular) return res.status(400).json({ error: 'Número de celular requerido' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  try {
    // Enviar SMS via Twilio REST API directamente (sin SDK)
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    const to = `+57${celular.replace(/\D/g, '')}`;

    const body = `HuellasSanas: Tu código de verificación es ${otp}. Válido por 10 minutos. No lo compartas.`;

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ To: to, From: from, Body: body })
      }
    );

    if (!twilioRes.ok) {
      const err = await twilioRes.json();
      throw new Error(err.message || 'Error Twilio');
    }

    // Guardar OTP en Supabase via REST
    const supabaseRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/otp_verificaciones`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          celular: celular.replace(/\D/g, ''),
          otp_hash: Buffer.from(otp).toString('base64'),
          expira_en: expira,
          usado: false
        })
      }
    );

    if (!supabaseRes.ok) throw new Error('Error al guardar OTP');

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Error al enviar SMS' });
  }
}
