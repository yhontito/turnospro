export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, rol } = req.body;
  if (!email || !password || !rol) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    // Crear usuario via Admin API de Supabase
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { rol }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.msg || 'Error al crear usuario');

    // Asignar rol en user_roles
    const rolRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/user_roles`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: data.id, rol })
    });

    if (!rolRes.ok) throw new Error('Error al asignar rol');

    res.status(200).json({ ok: true, id: data.id, email: data.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
