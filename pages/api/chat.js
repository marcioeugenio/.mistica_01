import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const {
    message,
    etapa = 0,
    respostasExtras = 0,
    planoSelecionado = null // ✅ Recebe o plano do frontend
  } = req.body;

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
    if (message.trim() === "1" || message.trim() === "2") {
      novaEtapa = 6;

      const plano = message.trim() === "2" ? {
        nome: "Pacote Místico Completo (5 cartas)",
        total: 5,
        filtro: "todos",
        link: "https://pag.ae/7_LTTA1HQ"
      } : {
        nome: "Visão Mística (3 cartas)",
        total: 3,
        filtro: "maiores",
        link: "https://pag.ae/7_LTS6xr1"
      };

      return res.status(200).json({
        etapa: novaEtapa,
        respostasExtras: 0,
        planoSelecionado: message.trim(), // ✅ Salva o plano (1 ou 2)
        sequencia: [
          { texto: `Você escolheu o plano: <strong>${plano.nome}</strong>.`, delay: 1500 },
          { texto: `Para prosseguir, realize o pagamento pelo link abaixo:<br><a href="${plano.link}" target="_blank">${plano.link}</a>`, delay: 2000 },
          { texto: "Assim que o pagamento for confirmado, Mística revelará suas cartas sagradas. 🌙", delay: 2000 }
        ]
      });
    } else {
      novaEtapa = 5;
      return res.status(200).json({
        etapa: novaEtapa,
        respostasExtras: 0,
        sequencia: [
          { texto: "Escolha um plano para te ajudar a entender seu atual momento. Digite o plano desejado (1 ou 2).", delay: 1500 }
        ]
      });
    }
  }

  if (etapa === 5) {
    if (message.trim() === "1" || message.trim() === "2") {
      novaEtapa = 6;

      const plano = message.trim() === "2" ? {
        nome: "Pacote Místico Completo (5 cartas)",
        total: 5,
        filtro: "todos",
        link: "https://pag.ae/7_LTTA1HQ"
      } : {
        nome: "Visão Mística (3 cartas)",
        total: 3,
        filtro: "maiores",
        link: "https://pag.ae/7_LTS6xr1"
      };

      return res.status(200).json({
        etapa: novaEtapa,
        respostasExtras: 0,
        planoSelecionado: message.trim(),
        sequencia: [
          { texto: `Você escolheu o plano: <strong>${plano.nome}</strong>.`, delay: 1500 },
          { texto: `Para prosseguir, realize o pagamento pelo link abaixo:<br><a href="${plano.link}" target="_blank">${plano.link}</a>`, delay: 2000 },
          { texto: "Assim que o pagamento for confirmado, Mística revelará suas cartas sagradas. 🌙", delay: 2000 }
        ]
      });
    } else {
      return res.status(200).json({
        etapa,
        respostasExtras,
        sequencia: [
          { texto: "Por favor, escolha um dos planos para continuar. Digite 1 ou 2 conforme sua escolha.", delay: 1500 }
        ]
      });
    }
  }

  if (etapa === 6 && pagamentoDetectado) {
    // ✅ Usa planoSelecionado corretamente
    const total = planoSelecionado === "2" ? 5 : 3;
    const filtro = planoSelecionado === "2" ? "todos" : "maiores";

    novaEtapa = 7;
    novaRespostasExtras = 0;

    const cartas = [];
    const usadas = new Set();
    while (cartas.length < total) {
      const carta = sortearCarta(filtro);
      if (!usadas.has(carta)) {
        usadas.add(carta);
        cartas.push(carta);
      }
    }

    const resumos = cartas.map((c, i) => `Carta ${i + 1}: ${c} - ${tarotDeck[c].normal}`).join("\n");
    const finalMsg = await respostaIA(resumos);

    const sequencia = cartas.flatMap((carta, i) => [
      { texto: `Carta ${i + 1}: <strong>${carta}</strong><br><img src="${tarotDeck[carta].image}" width="120">`, delay: 1000 },
      { texto: `<em>${tarotDeck[carta].normal}</em>`, delay: 3000 }
    ]);

    sequencia.push({ texto: `🔮 Mística está conectando com as forças superiores...`, delay: 1500 });
    sequencia.push({ texto: finalMsg, delay: 3000 });

    return res.status(200).json({ etapa: novaEtapa, respostasExtras: novaRespostasExtras, sequencia });
  }

  if (etapa === 7 && respostasExtras < 3) {
    novaRespostasExtras = respostasExtras + 1;
    const extra = await respostaIA(message);
    return res.status(200).json({
      etapa, respostasExtras: novaRespostasExtras,
      sequencia: [{ texto: extra, delay: 2000 }]
    });
  }

  if (etapa === 7 && respostasExtras >= 3) {
    novaEtapa = 4;
    return res.status(200).json({
      etapa: novaEtapa,
      respostasExtras: 0,
      sequencia: [
        { texto: "🌑 A consulta foi concluída. Para mais respostas, reinicie sua jornada espiritual.", delay: 2000 }
      ]
    });
  }

  const fallback = await respostaIA(message);
  return res.status(200).json({ etapa, respostasExtras, sequencia: [{ texto: fallback, delay: 1500 }] });
}
