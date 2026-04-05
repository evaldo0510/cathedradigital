import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Método não permitido", { status: 405 });
    }

    const { title, price, email } = await req.json();

    if (!title || !price || !email) {
      return new Response(JSON.stringify({ erro: "Dados incompletos" }), {
        status: 400,
      });
    }

    const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!token) {
      return new Response(JSON.stringify({ erro: "Token não configurado" }), {
        status: 500,
      });
    }

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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

    const data = await mpRes.json();

    if (!data.init_point) {
      return new Response(JSON.stringify(data), { status: 500 });
    }

    return new Response(JSON.stringify({ init_point: data.init_point }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ erro: err.message }), {
      status: 500,
    });
  }
});
