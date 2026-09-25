// Netlify Function — cria preferência de pagamento no Mercado Pago
// Sem dependências npm — usa fetch nativo do Node 18+

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  try {
    const { plano, nome, telefone } = JSON.parse(event.body || '{}');

    if (!plano || !nome || !telefone) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ erro: 'Campos obrigatórios: plano, nome, telefone' }),
      };
    }

    const PLANOS = {
      mensal: {
        titulo: 'RT Vist — Acesso Mensal',
        valor:  21.90,
        desc:   'Acesso completo por 30 dias',
      },
      anual: {
        titulo: 'RT Vist — Acesso Anual',
        valor:  209.90,
        desc:   'Acesso completo por 365 dias (R$17,49/mês)',
      },
    };

    const p = PLANOS[plano];
    if (!p) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ erro: 'Plano inválido' }),
      };
    }

    const ref = `RTVIST-${plano.toUpperCase()}-${Date.now()}`;
    const baseUrl = 'https://bancortvist.netlify.app';

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          title:       p.titulo,
          quantity:    1,
          unit_price:  p.valor,
          currency_id: 'BRL',
          description: `${p.desc} — Tel: ${telefone}`,
        }],
        payer: {
          name: nome,
          phone: {
            area_code: telefone.replace(/\D/g, '').slice(0, 2),
            number:    telefone.replace(/\D/g, '').slice(2),
          },
        },
        payment_methods: {
          installments: plano === 'mensal' ? 1 : 12,
        },
        external_reference: ref,
        statement_descriptor: 'RT VIST',
        back_urls: {
          success: `${baseUrl}/checkout.html?status=aprovado&plano=${plano}&nome=${encodeURIComponent(nome)}`,
          failure: `${baseUrl}/checkout.html?status=erro`,
          pending: `${baseUrl}/checkout.html?status=pendente&plano=${plano}&nome=${encodeURIComponent(nome)}`,
        },
        auto_return: 'approved',
      }),
    });

    const data = await resp.json();

    if (!data.id) {
      console.error('MP error:', JSON.stringify(data));
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ erro: 'Erro ao criar preferência', detalhe: data }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preferenceId: data.id,
        initPoint:    data.init_point,  // fallback: link direto MP
        ref,
      }),
    };

  } catch (err) {
    console.error('Função erro:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ erro: 'Erro interno', detalhe: err.message }),
    };
  }
};
