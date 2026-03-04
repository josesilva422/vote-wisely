const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 1️⃣ Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2️⃣ Garantir que é POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3️⃣ Tentar ler JSON com segurança
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Body inválido ou ausente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { voterName, imageTitle, votedAt } = body;

    // 4️⃣ Validar campos obrigatórios
    if (!voterName || !imageTitle) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5️⃣ Sanitização simples (evita injeção básica de HTML)
    const safeName = String(voterName).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeImage = String(imageTitle).replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // 6️⃣ Formatação da data
    const date = new Date(votedAt || new Date()).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY não configurada.");
      return new Response(
        JSON.stringify({ error: "Configuração de e-mail ausente no servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7️⃣ Enviar para Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Votacao <onboarding@resend.dev>", // troque para domínio verificado em produção
        to: ["conectaveigajardim@gmail.com"],
        subject: "Novo voto recebido no site",
        html: `
          <h1>Novo voto registrado</h1>
          <p><strong>Nome:</strong> ${safeName}</p>
          <p><strong>Votou em:</strong> ${safeImage}</p>
          <p><strong>Data:</strong> ${date}</p>
        `,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Erro na API do Resend:", resendData);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar e-mail" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});