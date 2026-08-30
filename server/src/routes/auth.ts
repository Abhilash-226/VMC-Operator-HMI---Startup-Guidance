import { Router } from 'express';
import { pool } from '../db/pool.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { pin } = req.body;
  const expectedPin = process.env.DEMO_PIN || '1234';

  if (!pin || String(pin) !== String(expectedPin)) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  try {
    const result = await pool.query('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active session found. Please run the seed script.' });
    }

    const session = result.rows[0];

    // Set a cookie that client can read (SameSite=None; Secure in production for cross-origin hosting)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('sessionId', session.id, {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: false,
      path: '/',
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd
    });

    return res.json({
      success: true,
      token: session.id,
      sessionId: session.id,
      session
    });
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
