// pages/index.js com controle de etapa e respostasExtras

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [etapa, setEtapa] = useState(0);
  const [respostasExtras, setRespostasExtras] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "você", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userId: "usuario1",
          etapa,
          respostasExtras,
          historico: messages.filter(m => m.sender === "você").map(m => ({ role: "user", content: m.content }))
        })
      });

      const data = await response.json();
      const novaEtapa = data.etapa !== undefined ? data.etapa : etapa;
      const novasRespostas = data.respostasExtras !== undefined ? data.respostasExtras : respostasExtras;
      setEtapa(novaEtapa);
      setRespostasExtras(novasRespostas);

      const delays = data.sequencia || [];
      let acumulado = 0;
      for (const item of delays) {
        acumulado += item.delay;
        setTimeout(() => {
          setMessages((prev) => [...prev, { sender: "mística", content: item.texto }]);
        }, acumulado);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "mística", content: "Erro ao obter resposta." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial", backgroundColor: "#000", color: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <img src="/camila_perfil.jpg" alt="Mística" style={{ width: 100, borderRadius: "50%" }} />
        <h1 style={{ color: "magenta" }}>Mística 🌙</h1>
        <p>Sacerdotisa do oráculo espiritual</p>
      </div>

      <div id="chat" style={{ background: "#111", padding: 20, minHeight: 300, marginBottom: 20 }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: 10 }}>
            <strong style={{ color: msg.sender === "você" ? "#00f" : "#f0f" }}>{msg.sender}:</strong> {" "}
            <span dangerouslySetInnerHTML={{ __html: msg.content }} />
          </div>
        ))}
        {isLoading && <p><em>mística está digitando...</em></p>}
      </div>

      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{ flex: 1, padding: 10 }}
          placeholder="Digite sua mensagem..."
        />
        <button onClick={sendMessage} style={{ padding: "10px 20px", marginLeft: 5 }}>Enviar</button>
      </div>
    </div>
  );
}
