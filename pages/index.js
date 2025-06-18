import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [mensagem, setMensagem] = useState("");
  const [chat, setChat] = useState([]);
  const [planoAtivo, setPlanoAtivo] = useState(false);
  const [digitando, setDigitando] = useState(false);
  const [modalImagem, setModalImagem] = useState(null);

  const chatRef = useRef(null);
  const userIdRef = useRef(
    typeof window !== "undefined"
      ? localStorage.getItem("userId") || crypto.randomUUID()
      : ""
  );

  useEffect(() => {
    const plano = localStorage.getItem("planoAtivo");
    if (plano === "true") setPlanoAtivo(true);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat]);

  const limparTexto = (texto) =>
    texto
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/(https?:\/\/[^\s]+(?:\.jpg|\.jpeg|\.png|\.gif))/g, '<br><img src="$1" alt="Carta do Tarô" style="max-width:100px;border-radius:8px;border:1px solid #555;margin-top:5px;" /><br>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

  const enviarMensagem = async () => {
    if (!mensagem.trim()) return;
    const novaMensagem = { remetente: "você", texto: mensagem };
    setChat((prev) => [...prev, novaMensagem]);
    setMensagem("");
    setDigitando(true);

    setTimeout(async () => {
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: mensagem,
          userId: userIdRef.current,
          planoAtivo,
          historico: chat
            .filter((m) => m.remetente !== "sistema")
            .map((m) => ({
              role: m.remetente === "você" ? "user" : "assistant",
              content: m.texto,
            })),
        }),
      });

      const data = await resposta.json();
      const texto = data.text;

      // Detectar se houve liberação de plano
      if (
        texto.toLowerCase().includes("tiragem de 3 cartas") ||
        texto.toLowerCase().includes("tiragem com 5 cartas") ||
        texto.toLowerCase().includes("liberado") ||
        texto.toLowerCase().includes("vamos começar")
      ) {
        setPlanoAtivo(true);
        localStorage.setItem("planoAtivo", "true");
      }

      setChat((prev) => [...prev, { remetente: "mística", texto }]);
      setDigitando(false);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  return (
    <main
      className="container"
      style={{
        maxWidth: "100%",
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "#d63384" }}>Mística 🌙</h2>
        <p style={{ fontSize: "14px", color: "#ccc" }}>
          Sacerdotisa do oráculo espiritual
        </p>
      </div>

      <div
        id="chat"
        ref={chatRef}
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "1rem",
          height: "60vh",
          overflowY: "auto",
          marginBottom: "1rem",
        }}
      >
        {chat.map((msg, index) => (
          <div key={index} style={{ marginBottom: "1rem" }}>
            <strong
              style={{
                color: msg.remetente === "você" ? "#0d6efd" : "#d63384",
              }}
            >
              {msg.remetente}:
            </strong>{" "}
            <span
              dangerouslySetInnerHTML={{ __html: limparTexto(msg.texto) }}
            />
          </div>
        ))}
        {digitando && (
          <p style={{ color: "#888", fontStyle: "italic" }}>
            Mística está digitando...
          </p>
        )}
      </div>

      <textarea
        rows="2"
        className="form-control"
        placeholder="Digite sua mensagem..."
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          resize: "none",
          background: "#222",
          color: "#fff",
          border: "1px solid #444",
        }}
      />
      <button
        className="btn btn-primary"
        style={{ marginTop: "1rem" }}
        onClick={enviarMensagem}
      >
        Enviar
      </button>

      {modalImagem && (
        <div
          onClick={() => setModalImagem(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <img
            src={modalImagem}
            alt="Carta"
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "10px" }}
          />
        </div>
      )}
    </main>
  );
}
