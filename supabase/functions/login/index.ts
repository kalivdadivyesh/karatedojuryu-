import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, password } = await req.json();

    if (!name || !password) {
      return new Response(JSON.stringify({ error: 'Name and password are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find user by name
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid name or password' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sign in via Supabase Auth
    const fakeEmail = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@karate.local`;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    });

    if (signInError) {
      return new Response(JSON.stringify({ error: 'Invalid name or password' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        hex_id: user.hex_id,
        name: user.name,
        age: user.age,
        belt_level: user.belt_level,
        role: user.role || (roleData?.role === 'admin' ? 'admin' : 'student'),
        code: user.code || user.hex_id
      },
      session: signInData.session,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
