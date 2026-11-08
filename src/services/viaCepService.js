const axios = require('axios');

class ViaCepService {
  static async buscarEnderecoPorCep(cep) {
    // Sanitizar o CEP removendo traços ou caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      throw new Error('CEP inválido. O CEP deve conter 8 dígitos.');
    }

    // Chamada à API pública do ViaCEP
    const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (response.data.erro) {
      throw new Error('CEP não encontrado na base de dados dos Correios.');
    }

    return {
      cep: response.data.cep,
      logradouro: response.data.logradouro || '',
      bairro: response.data.bairro || '',
      cidade: response.data.localidade,
      uf: response.data.uf,
    };
  }
}

module.exports = ViaCepService;