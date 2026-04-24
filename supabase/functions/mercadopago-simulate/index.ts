import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Configuração do backend incompleta." }, 500);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    const { userId, planId, status = "approved", amount = 19.9 } = body;

    if (!userId || !planId) {
      return json({ error: "userId e planId são obrigatórios." }, 400);
    }

    // Create a transaction record
    const { data: transaction, error: transactionError } = await adminClient
      .from("transactions")
      .insert([
        {
          user_id: userId,
          amount: amount,
          description: `SIMULAÇÃO: Cathedra PRO - ${planId}`,
          status: status,
        },
      ])
      .select()
      .single();

    if (transactionError) {
      console.error("Simulation transaction creation error:", transactionError);
      return json({ error: "Falha ao criar transação de simulação." }, 500);
    }

    // Activate PRO access when status is approved
    if (status === "approved") {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ is_premium: true })
        .eq("id", userId);

      if (profileError) {
        console.error("Simulation profile update error:", profileError);
      }
    }

    return json({
      ok: true,
      transactionId: transaction.id,
      status: status,
      premium: status === "approved",
    });
  } catch (error) {
    console.error("mercadopago-simulate error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Erro inesperado na simulação." },
      500,
    );
  }
});
