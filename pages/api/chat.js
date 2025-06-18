// chat.js atualizado com lógica inteligente por etapas definidas por Marcio

import tarotDeck from "../../lib/tarotDeck";

let clientes = {};

export default async function handler(req, res) {
  const { message, userId = "default", historico = [] } = req.body;
  const userMessage = message.toLowerCase();

  // Estado do cliente
  if (!clientes[userId]) {
    clientes[userId] = {
      etapa: 0,
      cartaGratis: null,
      pacotePago: false,
      respostasExtras: 0
    };
  }

  const estado = clientes[userId];

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
          { role: "system", content: "Você é Mística, uma sacerdotisa mística que responde com simbolismo e espiritualidade." },
          { role: "user", content: entrada }
        ]
      })
    });
    const data = await completions.json();
    return data.choices[0].message.content;
  };

  // Etapas definidas
  if (estado.etapa === 0) {
    estado.etapa = 1;
    return res.status(200).json({
      sequencia: [
        { texto: "✨ Bem-vindo ao oráculo de Mística.", delay: 1000 },
        { texto: "Deseja receber uma carta gratuita de orientação espiritual?", delay: 1500 }
      ]
    });
  }

  if (estado.etapa === 1) {
    const resposta = await respostaIA(userMessage);
    if (resposta.toLowerCase().includes("sim") || resposta.toLowerCase().includes("claro") || resposta.toLowerCase().includes("desejo")) {
      estado.etapa = 2;
      return res.status(200).json({
        sequencia: [
          { texto: "Perfeito. Antes de iniciarmos, diga seu nome e idade.", delay: 1500 }
        ]
      });
    } else {
      return res.status(200).json({ sequencia: [{ texto: resposta, delay: 1500 }] });
    }
  }

  if (estado.etapa === 2) {
    const carta = sortearCarta("maiores");
    estado.cartaGratis = carta;
    estado.etapa = 3;
    return res.status(200).json({
      sequencia: [
        { texto: `A carta que saiu para você foi <strong>${carta.nome}</strong> (${carta.posicao}):<br><img src="${carta.imagem}" width="120">`, delay: 2000 },
        { texto: `<em>${carta.significado}</em>`, delay: 3000 },
        { texto: "Se tiver alguma dúvida sobre essa mensagem, estou aqui para esclarecer.", delay: 2000 }
      ]
    });
  }

  if (estado.etapa === 3) {
    estado.etapa = 4;
    return res.status(200).json({
      sequencia: [
        {
          texto: `Se desejar uma leitura mais profunda, posso te oferecer dois caminhos:<br><br>
1 - Visão Mística (3 cartas) - R$39,90<br>
2 - Pacote Místico Completo (5 cartas) - R$69,90<br><br>
Digite 1 ou 2 após o pagamento.`,
          delay: 2500
        }
      ]
    });
  }

  if (estado.etapa === 4) {
    estado.etapa = 5;
    return res.status(200).json({
      sequencia: [
        {
          texto: "🌒 A sessão gratuita foi encerrada. Para continuar, selecione um dos pacotes espirituais e realize o pagamento.",
          delay: 2000
        }
      ]
    });
  }

  if (estado.etapa === 5 && (message.includes("1") || message.includes("2") || await respostaIA(userMessage).then(r => r.toLowerCase().includes("paguei")))) {
    estado.etapa = 6;
    estado.pacotePago = true;
    estado.respostasExtras = 0;

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
      { texto: `<em>${carta.significado}</em>`, delay: 2000 }
    ]);

    sequencia.push({ texto: `🔮 Mística consultando os planos superiores...`, delay: 1500 });
    sequencia.push({ texto: finalMsg, delay: 3000 });

    return res.status(200).json({ sequencia });
  }

  if (estado.etapa === 6 && estado.respostasExtras < 3) {
    estado.respostasExtras++;
    const extra = await respostaIA(message);
    return res.status(200).json({
      sequencia: [
        { texto: extra, delay: 2000 }
      ]
    });
  }

  if (estado.etapa === 6 && estado.respostasExtras >= 3) {
    estado.etapa = 4;
    return res.status(200).json({
      sequencia: [
        { texto: "🌑 A sessão espiritual foi encerrada. Para novas respostas, inicie uma nova consulta.", delay: 2000 }
      ]
    });
  }

  // fallback
  const fallback = await respostaIA(message);
  return res.status(200).json({
    sequencia: [{ texto: fallback, delay: 1500 }]
  });
}
