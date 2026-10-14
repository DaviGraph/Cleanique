import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const siteOrigin = Deno.env.get('SITE_ORIGIN') || '*';

  const corsHeaders = {
    'Access-Control-Allow-Origin': siteOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { reference, token, mime, size } = body;

    // Reject unless mime is image/jpeg, image/png or application/pdf and 0 < size <= 5242880
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (
      !reference ||
      !token ||
      !mime ||
      !allowedMimes.includes(mime) ||
      typeof size !== 'number' ||
      size <= 0 ||
      size > 5242880
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid request payload or file restrictions failed.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Call rpc('verify_booking_access', { p_ref: reference, p_token: token })
    const { data: bookingIdData, error: verifyError } = await supabase.rpc(
      'verify_booking_access',
      {
        p_ref: reference,
        p_token: token,
      }
    );

    let bookingId: string | null = null;
    if (typeof bookingIdData === 'string') {
      bookingId = bookingIdData;
    } else if (bookingIdData && typeof bookingIdData === 'object') {
      if ('booking_id' in bookingIdData) bookingId = (bookingIdData as { booking_id: string }).booking_id;
      else if ('id' in bookingIdData) bookingId = (bookingIdData as { id: string }).id;
      else if (Array.isArray(bookingIdData) && bookingIdData[0]) {
        bookingId =
          typeof bookingIdData[0] === 'string'
            ? bookingIdData[0]
            : bookingIdData[0].booking_id || bookingIdData[0].id;
      }
    }

    if (verifyError || !bookingId) {
      return new Response(JSON.stringify({ error: 'Access denied.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
    const path = `${bookingId}/${crypto.randomUUID()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .createSignedUploadUrl(path);

    if (uploadError || !uploadData) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate signed upload URL.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        path: uploadData.path || path,
        token: uploadData.token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
