import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const { message, userId, planoAtivo, historico = [] } = req.body;

  // Função para sortear uma carta aleatória do tarotDeck
  function sortearCartaAleatoria() {
    const cartas = Object.entries(tarotDeck);
    const [nome, dados] = cartas[Math.floor(Math.random() * cartas.length)];
    const invertida = Math.random() < 0.5;

    return {
      nome,
      imagem: dados.image,
      significado: invertida ? dados.inverted : dados.normal,
      invertida,
    };
  }

  // Verifica se a mensagem é uma solicitação de tiragem
  const solicitouTiragemGratis = historico.length > 0 && historico.some(m =>
    m.role === "user" &&
    m.content.toLowerCase().includes("meu nome") &&
    m.content.toLowerCase().includes("idade") &&
    m.content.toLowerCase().includes("cidade")
  );

  if (solicitouTiragemGratis) {
    const carta = sortearCartaAleatoria();

    return res.status(200).json({
      text: `✨ Sua tiragem gratuita foi realizada:<br><strong>${carta.nome}</strong> ${
        carta.invertida ? "(invertida)" : ""
      }<br><img src="${carta.imagem}" width="120"/><br><em>${carta.significado}</em><br><br>
Se desejar uma leitura mais profunda ou um ritual personalizado, posso preparar algo especial. Escolha um plano:<br>
1 - Tiragem Básica (R$39,90)<br>
2 - Ritual + Tiragem em PDF (R$49,90)<br>
3 - Pacote Místico Completo (R$79,90)`
    });
  }

  // Caso contrário, continue com o GPT como assistente místico
  const messages = [
    {
      role: "system",
      content: `Você é Mística, uma sacerdotisa celta conectada aos oráculos espirituais.

INÍCIO:
- Quando a conversa começar, diga:
  "Sou Mística, sacerdotisa do oráculo espiritual."
- Em seguida:
  "Posso tirar uma carta gratuita para você, mas preciso me conectar com o plano astral..."
  "Por favor, me diga seu nome, idade e cidade onde vive."

REGRAS:
- Só depois dessas informações a tiragem gratuita será feita.
- Use linguagem simbólica e espiritual, nunca técnica.
- Após a tiragem, ofereça os planos pagos e links.
- Use sempre uma linguagem mística e envolvente.`,
    },
    ...historico,
    {
      role: "user",
      content: message,
    },
  ];

  const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
    }),
  });

  const data = await resposta.json();

  return res.status(200).json({
    text: data.choices[0].message.content,
  });
}
