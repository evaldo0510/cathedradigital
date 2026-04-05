import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { title, price, email } = await req.json();

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!accessToken) {
      throw new Error("Token não encontrado");
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: title,
            quantity: 1,
            unit_price: Number(price),
          },
        ],
        payer: {
          email: email,
        },
        external_reference: email,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify({ init_point: data.init_point }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        erro: error.message,
      }),
      {
        status: 500,
      },
    );
  }
});
