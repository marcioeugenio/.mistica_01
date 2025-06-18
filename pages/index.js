import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [mensagem, setMensagem] = useState("");
  const [chat, setChat] = useState([]);
  const [digitando, setDigitando] = useState(false);
  const [planoAtivo, setPlanoAtivo] = useState(false);
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
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

  const exibirSequencia = (sequencia) => {
    if (!sequencia || sequencia.length === 0) return;

    let index = 0;
    const mostrarProxima = () => {
      if (index >= sequencia.length) {
        setDigitando(false);
        return;
      }

      const passo = sequencia[index];
      setDigitando(true);

      setTimeout(() => {
        setChat((prevChat) => [
          ...prevChat,
          { remetente: "mística", texto: passo.texto },
        ]);
        index++;
        mostrarProxima();
      }, passo.delay || 1000);
    };

    mostrarProxima();
  };

  const enviarMensagem = async () => {
    if (!mensagem.trim()) return;
    const novaMensagem = { remetente: "você", texto: mensagem };
    setChat([...chat, novaMensagem]);
    setMensagem("");
    setDigitando(true);

    const resposta = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: mensagem,
        userId: userIdRef.current,
        planoAtivo,
        historico: chat.map((m) => ({
          role: m.remetente === "você" ? "user" : "assistant",
          content: m.texto,
        })),
      }),
    });

    const data = await resposta.json();
    if (data.sequencia) {
      exibirSequencia(data.sequencia);
    } else {
      setChat((prevChat) => [
        ...prevChat,
        { remetente: "mística", texto: data.text },
      ]);
      setDigitando(false);
    }
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
        <img
          src="/camila_perfil.jpg"
          alt="Mística"
          style={{
            width: "100px",
            borderRadius: "50%",
            border: "2px solid #d63384",
            marginBottom: "1rem",
          }}
        />
        <h2>Mística 🌙</h2>
        <p style={{ fontSize: "14px" }}>Sacerdotisa do oráculo espiritual</p>
      </div>

      <div
        ref={chatRef}
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "1rem",
          height: "55vh",
          overflowY: "auto",
          marginBottom: "1rem",
        }}
      >
        {chat.map((msg, i) => (
          <div key={i} style={{ marginBottom: "0.5rem" }}>
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

      {planoAtivo && (
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p>✨ Conteúdo desbloqueado ✨</p>
          {[...Array(6)].map((_, i) => (
            <img
              key={i}
              src={`/mistica_oraculo/mistica_${i + 1}.jpg`}
              alt={`mistica_${i + 1}`}
              style={{
                width: "80px",
                margin: "0.25rem",
                borderRadius: "4px",
              }}
            />
          ))}
          <p style={{ marginTop: "1rem" }}>
            <a
              href="/mistica_ritual.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0dcaf0" }}
            >
              📄 Ver PDF Místico
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
