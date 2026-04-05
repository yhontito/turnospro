const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { celular, otp } = req.body;
  if (!celular || !otp) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const celularLimpio = celular.replace(/\D/g, '');
    const otpHash = Buffer.from(otp).toString('base64');

    // Buscar OTP válido
    const { data, error } = await supabase
      .from('otp_verificaciones')
      .select('*')
      .eq('celular', celularLimpio)
      .eq('otp_hash', otpHash)
      .eq('usado', false)
      .gt('expira_en', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return res.status(400).json({ error: 'Código inválido o expirado' });

    // Marcar como usado
    await supabase.from('otp_verificaciones').update({ usado: true }).eq('id', data.id);

    res.status(200).json({ ok: true, celular: celularLimpio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar código' });
  }
}
