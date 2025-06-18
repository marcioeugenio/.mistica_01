// chat.js com carta grátis imediata após resposta afirmativa

import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const { message, userId = "default", historico = [], etapa = 0, respostasExtras = 0 } = req.body;
  const userMessage = message.toLowerCase();
  let novaEtapa = etapa;
  let novaRespostasExtras = respostasExtras;

  const frasesPagamento = ["paguei", "fiz o pix", "realizei o pagamento", "comprei"];
  const pagamentoDetectado = frasesPagamento.some(f => userMessage.includes(f));

  const sortearCarta = (filtro) => {
    const baralho = Object.entries(tarotDeck).filter(([nome]) =>
      filtro === "maiores" ? nome.match(/^(O |A )/) : true
    );
    const [nome, dados] = baralho[Math.floor(Math.random() * baralho.length)];
    const posicao = Math.random() < 0.5 ? "normal" : "inverted";
    return { nome, posicao, significado: dados[posicao], imagem: dados.image };
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
          { role: "system", content: "Você é Mística, uma sacerdotisa espiritual que responde com linguagem simbólica, intuitiva e mística." },
          { role: "user", content: entrada }
        ]
      })
    });
    const data = await completions.json();
    return data.choices[0].message.content;
  };

  if (etapa === 0) {
    novaEtapa = 1;
    return res.status(200).json({ etapa: novaEtapa, respostasExtras: 0, sequencia: [
      { texto: "✨ Bem-vindo ao oráculo de Mística.", delay: 1000 },
      { texto: "Deseja receber uma carta gratuita de orientação espiritual?", delay: 1500 }
    ] });
  }

  if (etapa === 1) {
    const resposta = await respostaIA(userMessage);
    if (resposta.toLowerCase().includes("sim")) {
      const carta = sortearCarta("maiores");
      novaEtapa = 3;
      return res.status(200).json({ etapa: novaEtapa, respostasExtras: 0, sequencia: [
        { texto: `A carta que saiu para você foi <strong>${carta.nome}</strong> (${carta.posicao}):<br><img src="${carta.imagem}" width="120">`, delay: 2000 },
        { texto: `<em>${carta.significado}</em>`, delay: 3000 },
        { texto: "Se desejar uma leitura mais profunda, posso te apresentar outros caminhos...", delay: 2000 }
      ] });
    } else {
      return res.status(200).json({ etapa, respostasExtras, sequencia: [{ texto: resposta, delay: 1500 }] });
    }
  }

  if (etapa === 3) {
    novaEtapa = 4;
    return res.status(200).json({ etapa: novaEtapa, respostasExtras: 0, sequencia: [
      {
        texto: `Escolha um dos caminhos espirituais:<br><br>
1 - Visão Mística (3 cartas) - R$39,90<br>
2 - Pacote Místico Completo (5 cartas) - R$69,90<br><br>
Após o pagamento, digite 1 ou 2 para iniciar.`,
        delay: 2500
      }
    ] });
  }

  if (etapa === 4) {
    novaEtapa = 5;
    return res.status(200).json({ etapa: novaEtapa, respostasExtras: 0, sequencia: [
      {
        texto: "🌑 A sessão gratuita foi encerrada. Para novas revelações, selecione um dos caminhos místicos e realize o pagamento.",
        delay: 2000
      }
    ] });
  }

  if (etapa === 5 && (message.includes("1") || message.includes("2") || await respostaIA(userMessage).then(r => r.toLowerCase().includes("paguei")))) {
    novaEtapa = 6;
    novaRespostasExtras = 0;

    const total = message.includes("2") ? 5 : 3;
    const filtro = message.includes("2") ? "todos" : "maiores";

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
    const finalMsg = await respostaIA(resumos);

    const sequencia = cartas.flatMap((carta, i) => [
      { texto: `Carta ${i + 1}: <strong>${carta.nome}</strong> (${carta.posicao})<br><img src="${carta.imagem}" width="120">`, delay: 1000 },
      { texto: `<em>${carta.significado}</em>`, delay: 3000 }
    ]);

    sequencia.push({ texto: `🔮 Mística está conectando com as forças superiores...`, delay: 1500 });
    sequencia.push({ texto: finalMsg, delay: 3000 });

    return res.status(200).json({ etapa: novaEtapa, respostasExtras: novaRespostasExtras, sequencia });
  }

  if (etapa === 6 && respostasExtras < 3) {
    novaRespostasExtras = respostasExtras + 1;
    const extra = await respostaIA(message);
    return res.status(200).json({ etapa, respostasExtras: novaRespostasExtras, sequencia: [{ texto: extra, delay: 2000 }] });
  }

  if (etapa === 6 && respostasExtras >= 3) {
    novaEtapa = 4;
    return res.status(200).json({ etapa: novaEtapa, respostasExtras: 0, sequencia: [
      { texto: "🌑 A consulta foi concluída. Para mais respostas, reinicie sua jornada espiritual.", delay: 2000 }
    ] });
  }

  const fallback = await respostaIA(message);
  return res.status(200).json({ etapa, respostasExtras, sequencia: [{ texto: fallback, delay: 1500 }] });
}
