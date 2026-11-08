function criarCasosDeAutenticacao({ Usuario, bcrypt, jwt, crypto, emailService, jwtSecret, jwtExpiresIn }) {
  function erro(mensagem, status = 400) {
    return Object.assign(new Error(mensagem), { status });
  }

  function gerarToken(usuario) {
    return jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      jwtSecret,
      { expiresIn: jwtExpiresIn || '7d' }
    );
  }

  async function login(dados = {}) {
    const { email, senha } = dados;
    const emailNormalizado = String(email || '').trim().toLowerCase();
    if (typeof email !== 'string' || typeof senha !== 'string' || !emailNormalizado || !senha) {
      throw erro('E-mail e senha são obrigatórios.');
    }

    const usuario = await Usuario.findOne({ where: { email: emailNormalizado } });
    if (!usuario || usuario.ativo === false) throw erro('Credenciais inválidas.', 401);

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) throw erro('Credenciais inválidas.', 401);

    return {
      token: gerarToken(usuario),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    };
  }

  async function registrar(dados = {}) {
    const { nome, email, senha } = dados;
    const emailNormalizado = String(email || '').trim().toLowerCase();

    if (typeof nome !== 'string' || typeof email !== 'string' || typeof senha !== 'string' ||
        !nome.trim() || !emailNormalizado || !senha) {
      throw erro('Nome, e-mail e senha são obrigatórios.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) throw erro('Informe um e-mail válido.');
    if (senha.length < 8) throw erro('A senha deve possuir pelo menos 8 caracteres.');
    if (await Usuario.findOne({ where: { email: emailNormalizado } })) {
      throw erro('Este e-mail já está em uso.', 409);
    }

    const usuario = await Usuario.create({
      nome: nome.trim(),
      email: emailNormalizado,
      senha_hash: await bcrypt.hash(senha, 10),
      perfil: 'CLIENTE',
    });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }

  async function solicitarRecuperacao(email) {
    const emailNormalizado = String(email || '').trim().toLowerCase();
    if (typeof email !== 'string' || !emailNormalizado) throw erro('E-mail é obrigatório.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) throw erro('Informe um e-mail válido.');

    const mensagem = 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinição de senha.';
    const usuario = await Usuario.findOne({ where: { email: emailNormalizado } });
    if (!usuario) return mensagem;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expira = new Date(Date.now() + 30 * 60 * 1000);

    await usuario.update({
      token_recuperacao: tokenHash,
      token_recuperacao_expira: expira,
    });

    try {
      await emailService.enviarEmailRecuperacao({
        destinatario: usuario.email,
        nome: usuario.nome,
        token,
      });
    } catch (emailError) {
      console.error('Falha no envio do e-mail de recuperação de senha.', {
        code: emailError.code,
        responseCode: emailError.responseCode,
      });
      await usuario.update({
        token_recuperacao: null,
        token_recuperacao_expira: null,
      });
    }

    return mensagem;
  }

  async function redefinirSenha(dados = {}) {
    const { token, nova_senha } = dados;
    if (typeof token !== 'string' || typeof nova_senha !== 'string' || !token || !nova_senha) {
      throw erro('Token e nova_senha são obrigatórios.');
    }
    if (nova_senha.length < 8) throw erro('A nova senha deve possuir pelo menos 8 caracteres.');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const usuario = await Usuario.findOne({ where: { token_recuperacao: tokenHash } });
    if (!usuario || !usuario.token_recuperacao_expira || usuario.token_recuperacao_expira < new Date()) {
      throw erro('Token inválido ou expirado.');
    }

    await usuario.update({
      senha_hash: await bcrypt.hash(nova_senha, 10),
      token_recuperacao: null,
      token_recuperacao_expira: null,
    });
  }

  return { login, registrar, solicitarRecuperacao, redefinirSenha };
}

module.exports = criarCasosDeAutenticacao;
