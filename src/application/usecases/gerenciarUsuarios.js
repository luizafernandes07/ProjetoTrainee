function criarGerenciadorUsuarios({ Usuario, bcrypt }) {
  function erro(mensagem, status = 400) {
    return Object.assign(new Error(mensagem), { status });
  }

  const dadosPublicos = (usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    ativo: usuario.ativo,
    criado_em: usuario.createdAt || usuario.criado_em,
  });

  async function listar() {
    return Usuario.findAll({
      attributes: { exclude: ['senha_hash', 'token_recuperacao', 'token_recuperacao_expira'] },
      order: [['nome', 'ASC']],
    });
  }

  async function buscar(id) {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) throw erro('Usuário não encontrado.', 404);
    return usuario;
  }

  async function criarVoluntario(dados = {}) {
    const { nome, email, senha } = dados;
    const emailNormalizado = String(email || '').trim().toLowerCase();
    if (typeof nome !== 'string' || !nome.trim() || typeof email !== 'string' || typeof senha !== 'string' || senha.length < 8) {
      throw erro('Informe nome, e-mail e senha com pelo menos 8 caracteres.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) throw erro('Informe um e-mail válido.');
    if (await Usuario.findOne({ where: { email: emailNormalizado } })) {
      throw erro('Este e-mail já está cadastrado.', 409);
    }

    const usuario = await Usuario.create({
      nome: nome.trim(),
      email: emailNormalizado,
      senha_hash: await bcrypt.hash(senha, 12),
      perfil: 'VOLUNTARIO',
    });
    return dadosPublicos(usuario);
  }

  async function atualizar(id, dados = {}) {
    const usuario = await buscar(id);
    const { nome, email, senha, ativo } = dados;
    const atualizacao = {};

    if (nome !== undefined) {
      if (typeof nome !== 'string' || !nome.trim()) throw erro('O nome deve ser um texto não vazio.');
      atualizacao.nome = nome.trim();
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw erro('Informe um e-mail válido.');
      }
      const emailNormalizado = email.trim().toLowerCase();
      const emUso = await Usuario.findOne({ where: { email: emailNormalizado } });
      if (emUso && emUso.id !== usuario.id) throw erro('Este e-mail já está cadastrado.', 409);
      atualizacao.email = emailNormalizado;
    }
    if (ativo !== undefined) {
      if (typeof ativo !== 'boolean') throw erro('O campo ativo deve ser booleano.');
      atualizacao.ativo = ativo;
    }
    if (senha !== undefined) {
      if (typeof senha !== 'string' || senha.length < 8) throw erro('A senha deve possuir pelo menos 8 caracteres.');
      atualizacao.senha_hash = await bcrypt.hash(senha, 12);
    }

    // O perfil não é editável nesta operação para impedir elevação indevida de privilégio.
    await usuario.update(atualizacao);
    return dadosPublicos(usuario);
  }

  async function desativar(id, usuarioSolicitanteId) {
    if (id === usuarioSolicitanteId) throw erro('O administrador não pode desativar a própria conta.');
    const usuario = await buscar(id);
    await usuario.update({ ativo: false });
    return dadosPublicos(usuario);
  }

  return { listar, buscar: async (id) => dadosPublicos(await buscar(id)), criarVoluntario, atualizar, desativar };
}

module.exports = criarGerenciadorUsuarios;
