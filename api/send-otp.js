const twilio = require('twilio');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { celular } = req.body;
  if (!celular) return res.status(400).json({ error: 'Número de celular requerido' });

  // Generar OTP de 6 dígitos
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `HuellasSanas: Tu código de verificación es ${otp}. Válido por 10 minutos. No lo compartas con nadie.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+57${celular.replace(/\D/g, '')}`
    });

    // Guardar OTP hasheado en Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    await supabase.from('otp_verificaciones').insert({
      celular: celular.replace(/\D/g, ''),
      otp_hash: Buffer.from(otp).toString('base64'),
      expira_en: expira,
      usado: false
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar SMS' });
  }
}
