// ✅ pages/api/verificar.js
export default async function handler(req, res) {
  return res.status(200).json({
    planoLiberado: false,
    mensagem: "Verificação automática não está habilitada. Use 'paguei' no chat.",
  });
}
