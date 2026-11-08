const axios = require('axios');

exports.consultarCep = async (req, res, next) => {
  try {
    const { cep } = req.params;
    const cepLimpo = String(cep).replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return res.status(400).json({ mensagem: 'Formato de CEP inválido.' });
    }

    const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    
    if (response.data.erro) {
      return res.status(404).json({ mensagem: 'CEP não encontrado.' });
    }

    return res.status(200).json({
      cep: response.data.cep,
      logradouro: response.data.logradouro,
      bairro: response.data.bairro,
      cidade: response.data.localidade,
      uf: response.data.uf,
    });
  } catch (error) {
    next(error);
  }
};