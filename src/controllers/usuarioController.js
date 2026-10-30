const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

const dadosPublicos = (usuario) => ({
  id: usuario.id,
  nome: usuario.nome,
  email: usuario.email,
  perfil: usuario.perfil,
  ativo: usuario.ativo,
  criado_em: usuario.criado_em,
});

exports.listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['senha_hash', 'token_recuperacao', 'token_recuperacao_expira'] },
      order: [['nome', 'ASC']],
    });
    return res.status(200).json(usuarios);
  } catch (error) {
    return next(error);
  }
};

exports.buscarUsuarioPorId = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    return res.status(200).json(dadosPublicos(usuario));
  } catch (error) {
    return next(error);
  }
};

exports.criarUsuario = async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha || senha.length < 8) {
      return res.status(400).json({ mensagem: 'Informe nome, e-mail e senha com pelo menos 8 caracteres.' });
    }
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) return res.status(409).json({ mensagem: 'Este e-mail já está cadastrado.' });

    const usuario = await Usuario.create({
      nome,
      email,
      senha_hash: await bcrypt.hash(senha, 12),
      perfil: 'VOLUNTARIO',
    });
    return res.status(201).json({ mensagem: 'Voluntário cadastrado.', usuario: dadosPublicos(usuario) });
  } catch (error) {
    return next(error);
  }
};

exports.atualizarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });

    const { nome, email, senha, ativo } = req.body;
    const atualizacao = {};
    if (nome !== undefined) atualizacao.nome = nome;
    if (email !== undefined) atualizacao.email = email;
    if (ativo !== undefined) atualizacao.ativo = Boolean(ativo);
    if (senha !== undefined) {
      if (senha.length < 8) return res.status(400).json({ mensagem: 'A senha deve possuir pelo menos 8 caracteres.' });
      atualizacao.senha_hash = await bcrypt.hash(senha, 12);
    }

    // Perfil não é editável por esta rota; evita transformar voluntário em ADMIN.
    await usuario.update(atualizacao);
    return res.status(200).json({ mensagem: 'Usuário atualizado.', usuario: dadosPublicos(usuario) });
  } catch (error) {
    return next(error);
  }
};

exports.desativarUsuario = async (req, res, next) => {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ mensagem: 'O administrador não pode desativar a própria conta.' });
    }
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    await usuario.update({ ativo: false });
    return res.status(200).json({ mensagem: 'Usuário desativado com sucesso.' });
  } catch (error) {
    return next(error);
  }
};
