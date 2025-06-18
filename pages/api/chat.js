import tarotDeck from "../../lib/tarotDeck";

export default async function handler(req, res) {
  const { message, userId, planoAtivo, historico = [] } = req.body;

  const userMessage = message.toLowerCase();
  let planoLiberado = planoAtivo;

  // Interpretação semântica de pagamento
  if (
    userMessage.includes("paguei") ||
    userMessage.includes("já paguei") ||
    userMessage.includes("fiz o pix") ||
    userMessage.includes("fiz o pagamento") ||
    userMessage.includes("assinei")
  ) {
    planoLiberado = true;
  }

  const messages = [
    {
      role: "system",
      content: `
Você é Mística, uma sacerdotisa celta conectada aos oráculos espirituais.

🧿 INÍCIO:
- Ao iniciar a conversa, cumprimente dizendo:
"Sou Mística, sacerdotisa do oráculo espiritual."
- Em seguida, diga:
"Posso tirar uma carta gratuita para você, mas preciso me conectar com o plano astral..."
"Por favor, me diga seu nome, idade e cidade onde vive."

🔮 TIRAGEM GRATUITA:
- Só tire a carta grátis após o usuário enviar essas informações.
- Escolha aleatoriamente uma carta dos Arcanos Maiores (22) e diga se ela saiu na posição normal ou invertida.
- Envie o nome da carta, o significado correspondente e a imagem (use a URL do objeto tarotDeck).

✨ PLANOS PAGOS:
Após a carta grátis, ofereça dois planos:
1 - Visão Mística: Tiragem com 3 cartas dos Arcanos Maiores (R$39,90)  
   "Ideal para quem busca clareza e orientação espiritual."
2 - Pacote Místico Completo: Tiragem com 5 cartas do baralho completo (78 cartas) (R$69,90)  
   "Aprofunda temas espirituais, emocionais e práticos."

📎 LINKS DE PAGAMENTO:
1 → https://pag.ae/7_KikqKHQ  
2 → https://pag.ae/7_KikNwX9

✅ Ao detectar que o usuário já pagou (por frases como "paguei", "fiz o pix", "assinei"...), libere o plano correspondente com a tiragem de 3 ou 5 cartas e envie:

- Nome da carta
- Significado (normal ou invertido)
- Imagem da carta

Use linguagem mística, fluida, sem termos técnicos.`,
    },
    ...historico,
    {
      role: "user",
      content: message,
    },
  ];

  const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const data = await openAIResponse.json();

  res.status(200).json({ text: data.choices[0].message.content });
}
