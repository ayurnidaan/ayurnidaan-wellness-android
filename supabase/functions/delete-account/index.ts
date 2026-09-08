import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info' };
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return Response.json({ error: 'Authentication required' }, { status: 401, headers });
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return Response.json({ error: 'Invalid session' }, { status: 401, headers });
    const body = await request.json();
    if (body.confirmation !== 'DELETE_MY_ACCOUNT') return Response.json({ error: 'Confirmation required' }, { status: 400, headers });
    // Only the verified token owner can be deleted; never accept a user ID from the request.
    for (const bucket of ['avatars', 'doctor-intake-files']) {
      async function removeFolder(prefix: string): Promise<void> {
        while (true) {
          const { data: files, error: listError } = await admin.storage.from(bucket).list(prefix, { limit: 100 });
          if (listError) throw listError;
          if (!files?.length) break;
          for (const file of files) {
            const path = `${prefix}/${file.name}`;
            if (!file.id) await removeFolder(path);
            else {
              const { error: removeError } = await admin.storage.from(bucket).remove([path]);
              if (removeError) throw removeError;
            }
          }
        }
      }
      await removeFolder(user.id);
    }
    // Auth deletion cascades to profiles, assessments, appointments, orders and plans.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
    return Response.json({ deleted: true }, { headers });
  } catch (error) {
    console.error('Account deletion failed', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Could not finish deleting your account. Please try again.' }, { status: 500, headers });
  }
});
