import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const { message, userId, planoAtivo, historico = [] } = req.body;

  const userMessage = message.toLowerCase();
  const jaRecebeuCartaGratis = historico.some(h =>
    h.content?.toLowerCase().includes("a carta que saiu para você")
  );

  // Detectar frases que indicam pagamento
  const frasesPagamento = [
    "paguei",
    "já paguei",
    "fiz o pix",
    "assinei",
    "comprei",
    "enviei",
    "transferi",
    "paguei agora",
    "fiz o pagamento"
  ];

  const pagamentoDetectado = frasesPagamento.some(f =>
    userMessage.includes(f)
  );

  // Sorteia uma carta dos Arcanos Maiores
  const arcanosMaiores = Object.keys(tarotDeck).filter(
    (nome) => tarotDeck[nome].image.includes("TarotRWS-0")
  );

  const sortearCarta = () => {
    const nomes = Object.keys(tarotDeck);
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const carta = tarotDeck[nome];
    const posicao = Math.random() < 0.5 ? "normal" : "inverted";
    const significado = carta[posicao];
    const imagem = carta.image;

    return {
      nome,
      posicao,
      significado,
      imagem,
    };
  };

  // Tiragem grátis (caso ainda não tenha feito)
  if (!jaRecebeuCartaGratis && userMessage.includes("idade")) {
    const carta = sortearCarta();

    const resposta = `
Sou Mística, sacerdotisa do oráculo espiritual.<br><br>
Posso sentir sua energia agora... A carta que saiu para você foi <strong>${carta.nome}</strong> na posição <strong>${carta.posicao}</strong>.<br><br>
<em>${carta.significado}</em><br><br>
<img src="${carta.imagem}" width="120" style="border-radius:8px;border:1px solid #555;margin-top:8px;" /><br><br>
Se desejar uma leitura mais profunda, posso te oferecer dois planos:<br><br>
1 - Visão Mística: 3 cartas dos Arcanos Maiores (R$39,90)<br>
2 - Pacote Místico Completo: 5 cartas do baralho completo (R$69,90)<br><br>
Envie "1" ou "2" se quiser seguir adiante. 🌙
`;

    return res.status(200).json({ text: resposta });
  }

  // Se detectou pagamento
  if (pagamentoDetectado) {
    const quantidade = userMessage.includes("2") ? 5 : 3;

    const tiradas = [];
    const usadas = new Set();

    while (tiradas.length < quantidade) {
      const carta = sortearCarta();
      if (!usadas.has(carta.nome)) {
        usadas.add(carta.nome);
        tiradas.push(carta);
      }
    }

    const partes = tiradas
      .map(
        (c, i) =>
          `<strong>Carta ${i + 1}: ${c.nome}</strong> (${c.posicao})<br>` +
          `${c.significado}<br><img src="${c.imagem}" width="120" style="border-radius:8px;border:1px solid #555;margin-bottom:10px;" /><br><br>`
      )
      .join("");

    const textoFinal = `
✨ Tiragem realizada com sucesso!<br><br>
${partes}
Se desejar outra leitura futuramente, estarei aqui, conectada ao plano espiritual. 🌌
`;

    return res.status(200).json({ text: textoFinal });
  }

  // Fallback: usar IA (OpenAI)
  const messages = [
    {
      role: "system",
      content: `
Você é Mística, sacerdotisa do oráculo espiritual. Use linguagem mística, calma, e acolhedora. Oriente a pessoa a fazer a tiragem gratuita ou escolher um dos dois planos:
1 - Visão Mística (3 cartas dos Arcanos Maiores)
2 - Pacote Místico (5 cartas do baralho completo)

Nunca use links externos ou imagens externas. As imagens já serão exibidas por código. Apenas diga os nomes das cartas e seus significados.

Se a pessoa disser "paguei" ou similar, diga que a tiragem será feita e aguarde o sistema responder com as cartas.
      `
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
  const text = data.choices[0].message.content;

  return res.status(200).json({ text });
}
