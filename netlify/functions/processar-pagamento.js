// Netlify Function — processa pagamento enviado pelo Mercado Pago Bricks
// Recebe token do cartão e finaliza a cobrança via API do MP

exports.handler = async (event) => {
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
    const body = JSON.parse(event.body || '{}');
    const { plano, nome, telefone, ...formData } = body;

    const VALORES = { mensal: 21.90, anual: 209.90 };
    const valor = VALORES[plano] || 21.90;

    // Montar payload de pagamento para o MP
    const payload = {
      transaction_amount: valor,
      description:        `RT Vist — ${plano === 'mensal' ? 'Acesso Mensal' : 'Acesso Anual'} | ${nome} | ${telefone}`,
      statement_descriptor: 'RT VIST',
      ...formData,
      payer: {
        ...(formData.payer || {}),
        first_name: nome.split(' ')[0],
        last_name:  nome.split(' ').slice(1).join(' ') || nome.split(' ')[0],
        phone: {
          area_code: telefone.replace(/\D/g,'').slice(0,2),
          number:    telefone.replace(/\D/g,'').slice(2),
        },
      },
    };

    const resp = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `rtvist-${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status:     data.status,
        statusDetail: data.status_detail,
        id:         data.id,
      }),
    };

  } catch (err) {
    console.error('Erro ao processar pagamento:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
