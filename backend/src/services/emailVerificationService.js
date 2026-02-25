import crypto from 'crypto';
import { getSupabase } from '../config/supabase.js';

export async function createEmailVerification(userId) {
  const supabase = getSupabase();
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

  const { error } = await supabase.from('email_verifications').insert({
    user_id: userId,
    token,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  });

  if (error) throw new Error(error.message);
  return token;
}

export async function consumeEmailVerification(token) {
  const supabase = getSupabase();

  const { data: row, error: selectError } = await supabase
    .from('email_verifications')
    .select('id, user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (selectError || !row) return null;

  const now = new Date();
  const expiresAt = new Date(row.expires_at);
  if (now > expiresAt) {
    await supabase.from('email_verifications').delete().eq('id', row.id);
    return null;
  }

  await supabase.from('email_verifications').delete().eq('id', row.id);
  return row.user_id;
}
