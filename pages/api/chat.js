import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const { message, userId, planoAtivo, historico = [] } = req.body;

  const userMessage = message.toLowerCase();
  const frasesPagamento = ["paguei", "já paguei", "fiz o pix", "assinei", "enviei", "comprei", "fiz o pagamento"];
  const pagamentoDetectado = frasesPagamento.some(f => userMessage.includes(f));

  // Verifica se já tirou a carta grátis anteriormente
  const tirouCartaGratis = historico.some(h =>
    h.content?.toLowerCase().includes("a carta que saiu para você")
  );

  // Regex simples para nome, idade e cidade
  const contemDadosPessoais = /[a-zA-Z]{3,}[\s,]+[0-9]{2}[\s,]+[a-zA-Z]{3,}/.test(message);

  const sortearCarta = (filtro) => {
    const baralho = Object.entries(tarotDeck).filter(([nome]) =>
      filtro === "maiores" ? nome.match(/^(O |A )/) : true
    );
    const [nome, dados] = baralho[Math.floor(Math.random() * baralho.length)];
    const posicao = Math.random() < 0.5 ? "normal" : "inverted";
    return {
      nome,
      posicao,
      significado: dados[posicao],
      imagem: dados.image,
    };
  };

  // ✅ Tiragem gratuita com verificação simplificada
  if (!tirouCartaGratis && contemDadosPessoais) {
    const carta = sortearCarta("maiores");

    return res.status(200).json({
      sequencia: [
        { texto: `✨ Conectando-se ao plano astral...`, delay: 1500 },
        {
          texto: `A carta que saiu para você foi <strong>${carta.nome}</strong> na posição <strong>${carta.posicao}</strong>:<br><img src="${carta.imagem}" width="120" style="margin-top:10px;" />`,
          delay: 1500
        },
        {
          texto: `<em>${carta.significado}</em>`,
          delay: 3000
        },
        {
          texto: `Se desejar uma leitura mais profunda, posso te oferecer dois caminhos espirituais:<br><br>
1 - Visão Mística: Tiragem com 3 cartas dos Arcanos Maiores (R$39,90)<br>
2 - Pacote Místico Completo: Tiragem com 5 cartas do baralho completo (R$69,90)<br><br>
Digite 1 ou 2 para escolher.`,
          delay: 2000
        }
      ]
    });
  }

  // ✅ Tiragem paga (plano 1 ou 2)
  if (pagamentoDetectado || message === "1" || message === "2") {
    const plano = message === "2" || userMessage.includes("completo") ? "completo" : "visao";
    const total = plano === "completo" ? 5 : 3;
    const filtro = plano === "completo" ? "todos" : "maiores";

    const cartas = [];
    const usadas = new Set();

    while (cartas.length < total) {
      const c = sortearCarta(filtro);
      if (!usadas.has(c.nome)) {
        usadas.add(c.nome);
        cartas.push(c);
      }
    }

    const resumos = cartas.map((c, i) => `Carta ${i + 1}: ${c.nome} (${c.posicao}) - ${c.significado}`).join("\n");

    const explicacaoFinal = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Você é Mística, uma sacerdotisa espiritual. Interprete as cartas abaixo com explicações místicas e profundas, uma por uma. Ao final, traga uma conclusão espiritual que una o significado das cartas como uma mensagem final para o consulente.`
          },
          { role: "user", content: resumos }
        ]
      })
    });

    const final = await explicacaoFinal.json();
    const conclusao = final.choices[0].message.content;

    const sequencia = [];

    cartas.forEach((carta, i) => {
      sequencia.push(
        {
          texto: `Carta ${i + 1}: <strong>${carta.nome}</strong> (${carta.posicao})<br><img src="${carta.imagem}" width="120" style="margin-top:10px;" />`,
          delay: 1000
        },
        {
          texto: `<em>${carta.significado}</em>`,
          delay: 3000
        }
      );
    });

    sequencia.push({
      texto: `🔮 Mística está consultando os planos superiores...`,
      delay: 1500
    });

    sequencia.push({
      texto: conclusao.replace(/\n/g, "<br>"),
      delay: 3000
    });

    return res.status(200).json({ sequencia });
  }

  // ✅ Introdução e fallback
  const messages = [
    {
      role: "system",
      content: `
Você é Mística, uma sacerdotisa do oráculo espiritual. Sua função é conduzir tiragens de tarot com linguagem mística, simbólica, espiritual e intuitiva.

Regras:

1. Cumprimente assim:
"Sou Mística, sacerdotisa do oráculo espiritual. Posso sentir que você busca respostas nas cartas do destino."

2. Em seguida:
"Posso tirar uma carta gratuita para você, mas antes preciso me conectar com sua essência. Por favor, diga seu nome, idade e cidade onde vive."

3. Após tirar a carta grátis:
- Explique a carta profundamente, com espiritualidade.
- Use o significado apropriado (normal ou invertido).

4. Depois, ofereça os dois planos:
1 - Visão Mística (R$39,90): 3 cartas dos Arcanos Maiores.  
2 - Pacote Místico Completo (R$69,90): 5 cartas do baralho completo.

5. Se o usuário digitar "1" ou "2", continue com a tiragem correspondente.

6. Se ele disser algo como "paguei", "fiz o pix", "assinei", etc., aceite como confirmação de pagamento.

7. Nunca tire carta grátis sem os dados (nome, idade, cidade). Não use links ou markdown.

🌙
      `.trim()
    },
    ...historico,
    {
      role: "user",
      content: message
    }
  ];

  const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages
    })
  });

  const data = await resposta.json();
  return res.status(200).json({
    sequencia: [{ texto: data.choices[0].message.content, delay: 1000 }]
  });
}
