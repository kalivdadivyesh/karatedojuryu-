import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateHexId(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return '#' + Array.from(bytes).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // Check if user exists
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

    const password_hash = await hashPassword(password);

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

    // Insert user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ hex_id, name, age, password_hash })
      .select()
      .single();

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create role
    await supabase.from('user_roles').insert({ user_id: user.id, role: 'user' });

    // Create attendance & progress records
    await supabase.from('attendance').insert({ user_hex_id: hex_id, attended_dates: [], upcoming_classes: [] });
    await supabase.from('progress').insert({ user_hex_id: hex_id, belt_level: 'White' });

    return new Response(JSON.stringify({
      user: { id: user.id, hex_id: user.hex_id, name: user.name, age: user.age }
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
