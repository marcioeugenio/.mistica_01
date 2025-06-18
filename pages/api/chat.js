import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const { message, userId, planoAtivo, historico = [] } = req.body;
  const userMessage = message.toLowerCase();

  const frasesPagamento = ["paguei", "já paguei", "fiz o pix", "assinei", "enviei", "comprei", "fiz o pagamento"];
  const pagamentoDetectado = frasesPagamento.some(f => userMessage.includes(f));
  const tirouCartaGratis = historico.some(h => h.content?.toLowerCase().includes("a carta que saiu para você"));

  const dadosRecebidos = userMessage.includes("nome") && userMessage.includes("idade") && userMessage.includes("cidade");

  const sortearCarta = (filtro) => {
    const baralho = Object.entries(tarotDeck).filter(([nome]) =>
      filtro === "maiores" ? nome.match(/^(O |A )/) : true
    );
    const [nome, dados] = baralho[Math.floor(Math.random() * baralho.length)];
    const posicao = Math.random() < 0.5 ? "normal" : "inverted";
    return { nome, posicao, significado: dados[posicao], imagem: dados.image };
  };

  // 👋 Mensagem inicial da Mística
  if (!tirouCartaGratis && !pagamentoDetectado && historico.length === 0) {
    return res.status(200).json({
      sequencia: [
        { texto: "Sou Mística, sacerdotisa do oráculo espiritual.", delay: 1000 },
        {
          texto: "Posso tirar uma carta gratuita para você. Para isso, diga seu nome, idade e cidade onde vive.",
          delay: 2000
        }
      ]
    });
  }

  // 🃏 Tiragem gratuita
  if (!tirouCartaGratis && dadosRecebidos) {
    const carta = sortearCarta("maiores");
    return res.status(200).json({
      sequencia: [
        { texto: "✨ Conectando-se ao plano astral...", delay: 1500 },
        {
          texto: `A carta que saiu para você foi <strong>${carta.nome}</strong> na posição <strong>${carta.posicao}</strong>:<br><img src="${carta.imagem}" width="120" style="margin-top:10px;" />`,
          delay: 1500
        },
        { texto: `<em>${carta.significado}</em>`, delay: 3000 },
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

  // 💰 Tiragem paga (após plano ou pagamento)
  if (pagamentoDetectado || message === "1" || message === "2") {
    const plano = message === "2" || userMessage.includes("completo") ? "completo" : "visao";
    const total = plano === "completo" ? 5 : 3;
    const filtro = plano === "completo" ? "todos" : "maiores";

    const cartas = [];
    const usadas = new Set();
    while (cartas.length < total) {
      const carta = sortearCarta(filtro);
      if (!usadas.has(carta.nome)) {
        usadas.add(carta.nome);
        cartas.push(carta);
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
        model: "gpt-3.5-turbo",
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
    cartas.forEach((c, i) => {
      sequencia.push(
        {
          texto: `Carta ${i + 1}: <strong>${c.nome}</strong> (${c.posicao})<br><img src="${c.imagem}" width="120" style="margin-top:10px;" />`,
          delay: 1000
        },
        {
          texto: `<em>${c.significado}</em>`,
          delay: 3000
        }
      );
    });

    sequencia.push({ texto: `🔮 Mística está consultando os planos superiores...`, delay: 1500 });
    sequencia.push({ texto: conclusao.replace(/\n/g, "<br>"), delay: 3000 });

    return res.status(200).json({ sequencia });
  }

  // 💬 Fallback: conversa normal com IA
  const messages = [
    {
      role: "system",
      content: `Você é Mística, uma sacerdotisa do oráculo espiritual. Sua função é conduzir tiragens de tarot com linguagem mística, simbólica, espiritual e intuitiva.`
    },
    ...historico,
    { role: "user", content: message }
  ];

  const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model: "gpt-3.5-turbo", messages })
  });

  const data = await resposta.json();
  return res.status(200).json({
    sequencia: [{ texto: data.choices[0].message.content, delay: 1000 }]
  });
}
