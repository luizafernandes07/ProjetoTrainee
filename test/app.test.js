const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

const server = app.listen(0);
const baseUrl = new Promise((resolve) => {
  server.once('listening', () => {
    const { port } = server.address();
    resolve(`http://127.0.0.1:${port}`);
  });
});

after(() => new Promise((resolve, reject) => {
  server.close((error) => error ? reject(error) : resolve());
}));

test('GET / retorna status da API', async () => {
  const response = await fetch(`${await baseUrl}/`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.nome, 'AgnusGestao API');
});

test('GET /api/docs retorna especificação OpenAPI', async () => {
  const response = await fetch(`${await baseUrl}/api/docs`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.openapi || body.swagger);
  assert.ok(body.paths);
});

test('rota desconhecida retorna 404 padronizado', async () => {
  const response = await fetch(`${await baseUrl}/rota-inexistente`);
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.mensagem, 'Endpoint não encontrado.');
});
