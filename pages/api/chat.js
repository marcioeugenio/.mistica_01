import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const { message, userId, planoAtivo, historico = [] } = req.body;

  const userMessage = message.toLowerCase();
  const frasesPagamento = ["paguei", "já paguei", "fiz o pix", "assinei", "enviei", "comprei", "fiz o pagamento"];
  const pagamentoDetectado = frasesPagamento.some(f => userMessage.includes(f));

  const tirouCartaGratis = historico.some(h => h.content?.toLowerCase().includes("a carta que saiu para você"));

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

  if (!tirouCartaGratis && userMessage.includes("idade")) {
    const carta = sortearCarta("maiores");

    return res.status(200).json({
      sequencia: [
        { texto: `Sou Mística, sacerdotisa do oráculo espiritual.`, delay: 0 },
        {
          texto: `A carta que saiu para você foi <strong>${carta.nome}</strong> na posição <strong>${carta.posicao}</strong>:<br><img src="${carta.imagem}" width="120" style="margin-top:10px;" />`,
          delay: 1000
        },
        {
          texto: `<em>${carta.significado}</em><br><br>Se desejar uma leitura mais profunda, posso te oferecer dois planos:<br><br>
1 - Visão Mística: 3 cartas dos Arcanos Maiores (R$39,90)<br>
2 - Pacote Místico Completo: 5 cartas do baralho completo (R$69,90)<br><br>
Envie "1" ou "2" se quiser seguir adiante. 🌙`,
          delay: 3000
        }
      ]
    });
  }

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
            content: `Você é Mística, uma sacerdotisa espiritual. Interprete as cartas abaixo uma por uma com explicações profundas e depois faça uma conclusão espiritual unindo os significados em uma mensagem final para o consulente. Use linguagem mística, poética e intuitiva.`
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

  // fallback normal com IA
  const messages = [
    {
      role: "system",
      content: `Você é Mística, sacerdotisa do oráculo espiritual. Use linguagem simbólica e mística. Nunca use markdown nem links externos.`
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
    body: JSON.stringify({
      model: "gpt-4",
      messages
    })
  });

  const data = await resposta.json();
  return res.status(200).json({ sequencia: [{ texto: data.choices[0].message.content, delay: 1000 }] });
}
