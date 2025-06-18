import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const { message, userId = "default", historico = [], etapa = 0, respostasExtras = 0 } = req.body;
  const userMessage = message.toLowerCase();
  let novaEtapa = etapa;
  let novaRespostasExtras = respostasExtras;

  const frasesPagamento = ["paguei", "fiz o pix", "realizei o pagamento", "comprei"];
  const pagamentoDetectado = frasesPagamento.some(f => userMessage.includes(f));

  const arcanosMaiores = [
    "O Louco", "O Mago", "A Sacerdotisa", "A Imperatriz", "O Imperador", "O Hierofante",
    "Os Enamorados", "O Carro", "A Força", "O Eremita", "A Roda da Fortuna", "A Justiça",
    "O Enforcado", "A Morte", "A Temperança", "O Diabo", "A Torre", "A Estrela", "A Lua",
    "O Sol", "O Julgamento", "O Mundo"
  ];

  const sortearPrimeiraCarta = () => {
    return arcanosMaiores[Math.floor(Math.random() * arcanosMaiores.length)];
  };

  const sortearCarta = (filtro = "todos") => {
    const cartas = Object.keys(tarotDeck);
    const arcanosMaioresSet = new Set(arcanosMaiores);
    const cartasFiltradas = filtro === "maiores"
      ? cartas.filter(c => arcanosMaioresSet.has(c))
      : cartas;
    return cartasFiltradas[Math.floor(Math.random() * cartasFiltradas.length)];
  };

  const respostaIA = async (entrada) => {
    const completions = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Você é Mística, uma sacerdotisa espiritual que responde com empatia, sabedoria e linguagem mística." },
          { role: "user", content: entrada }
        ]
      })
    });
    const data = await completions.json();
    return data.choices[0].message.content;
  };

  if (etapa === 0) {
    novaEtapa = 1;
    return res.status(200).json({
      etapa: novaEtapa, respostasExtras: 0, sequencia: [
        { texto: "✨ Bem-vindo ao oráculo de Mística.", delay: 1000 },
        { texto: "Deseja receber uma carta gratuita de orientação espiritual?", delay: 1500 }
      ]
    });
  }

  if (etapa === 1) {
    if (userMessage.includes("sim")) {
      const carta = sortearPrimeiraCarta();
      novaEtapa = 3;
      return res.status(200).json({
        etapa: novaEtapa,
        respostasExtras: 0,
        sequencia: [
          { texto: `A carta que saiu para você foi <strong>${carta}</strong>:<br><img src="${tarotDeck[carta].image}" width="120">`, delay: 2000 },
          { texto: `Esta carta reflete sua jornada atual. Ela nos fala de um momento de <em>${tarotDeck[carta].normal}</em>. A presença dessa carta pode ser um sinal de que você está em um ponto decisivo da sua vida. Como você está sentindo essas energias agora?`, delay: 3000 },
          { texto: "Como você está se sentindo no momento? Está enfrentando algum desafio pessoal?", delay: 2500 }
        ]
      });
    } else {
      const resposta = await respostaIA(userMessage);
      return res.status(200).json({ etapa, respostasExtras, sequencia: [{ texto: resposta, delay: 1500 }] });
    }
  }

  if (etapa === 3) {
    novaEtapa = 4;

    const respostaEmpatica = await respostaIA(`A pessoa disse: "${userMessage}". Reaja como Mística, uma sacerdotisa espiritual. Dê uma resposta acolhedora e curta, com no máximo 3 frases.`);

    return res.status(200).json({
      etapa: novaEtapa,
      respostasExtras: 0,
      sequencia: [
        { texto: respostaEmpatica, delay: 1500 },
        {
          texto: "✨ Se você deseja aprofundar sua jornada espiritual, posso revelar ainda mais orientações através dos caminhos abaixo:",
          delay: 1500
        },
        {
          texto: "1 - Visão Mística (3 cartas) - R$39,90<br>2 - Pacote Místico Completo (5 cartas) - R$69,90",
          delay: 2000
        },
        {
          texto: "Escolha um plano para te ajudar a entender seu atual momento. Digite o plano desejado.",
          delay: 1500
        }
      ]
    });
  }

  if (etapa === 4) {
    novaEtapa = 5;
    return res.status(200).json({
      etapa: novaEtapa,
      respostasExtras: 0,
      sequencia: [
        {
          texto: "Escolha um plano para te ajudar a entender seu atual momento. Digite o plano desejado (1 ou 2).",
          delay: 1500
        }
      ]
    });
  }

  if (etapa === 5) {
    if (message.trim() === "1" || message.trim() === "2") {
      novaEtapa = 6;
      const planoEscolhido = message.trim() === "2" ? "Pacote Místico Completo (5 cartas)" : "Visão Mística (3 cartas)";
      const linkPagSeguro = message.trim() === "2"
        ? "https://pag.ae/7_LTTA1HQ"
        : "https://pag.ae/7_LTS6xr1";

      return res.status(200).json({
        etapa: novaEtapa,
        respostasExtras: 0,
        sequencia: [
          {
            texto: `Você escolheu o plano: <strong>${planoEscolhido}</strong>.`,
            delay: 1500
          },
          {
            texto: `Para
