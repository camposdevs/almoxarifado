import { criarApp } from './app.js';
import { carregarConfig } from './config/env.js';
import { criarBanco } from './database/connection.js';

const config = carregarConfig();
const db = criarBanco(config.dbPath);
const servidor = criarApp({ db, config });

servidor.listen(config.port, () => {
  console.log(`API do almoxarifado em http://localhost:${config.port}`);
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => servidor.close(() => { db.close(); process.exit(0); }));
}
