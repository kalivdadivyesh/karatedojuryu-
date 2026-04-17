import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateHexId(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return '#' + Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, age, password } = await req.json();

    if (!name || !age || !password) {
      return new Response(JSON.stringify({ error: 'Name, age, and password are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user with this name exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'User with this name already exists' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique hex_id
    let hex_id = generateHexId();
    let attempts = 0;
    while (attempts < 10) {
      const { data: hexExists } = await supabase
        .from('users')
        .select('id')
        .eq('hex_id', hex_id)
        .maybeSingle();
      if (!hexExists) break;
      hex_id = generateHexId();
      attempts++;
    }

    // Create Supabase Auth user with fake email
    const fakeEmail = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@karate.local`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authUserId = authData.user.id;

    // Insert user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ 
        hex_id, 
        name, 
        age, 
        password_hash: 'supabase_auth', 
        auth_id: authUserId, 
        belt_level: 'white',
        code: hex_id,
        role: 'student'
      })
      .select()
      .single();

    if (userError) {
      // Cleanup auth user on failure
      await supabase.auth.admin.deleteUser(authUserId);
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create role (legacy table support)
    await supabase.from('user_roles').insert({ user_id: user.id, role: 'user' });

    // Sign in to get session token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    });

    return new Response(JSON.stringify({
      user: { 
        id: user.id, 
        hex_id: user.hex_id, 
        name: user.name, 
        age: user.age, 
        belt_level: user.belt_level, 
        role: 'student',
        code: user.code
      },
      session: signInData?.session || null,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
