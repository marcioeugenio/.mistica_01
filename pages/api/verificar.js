export default async function handler(req, res) {
  return res.status(200).json({
    planoLiberado: false,
    mensagem: "A verificação automática foi substituída. Diga 'paguei' ou algo semelhante no chat.",
  });
}
