const SEGREDO_PADRAO = 'troque-este-segredo-em-producao';

export function carregarConfig(env = process.env) {
  const config = {
    port: Number(env.PORT ?? 3001),
    dbPath: env.DB_PATH ?? 'almoxarifado.db',
    jwtSecret: env.JWT_SECRET ?? SEGREDO_PADRAO,
    jwtExpiresInSeconds: Number(env.JWT_EXPIRES_IN ?? 8 * 60 * 60),
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
  };

  if (env.NODE_ENV === 'production' && config.jwtSecret === SEGREDO_PADRAO) {
    throw new Error('Defina JWT_SECRET antes de iniciar em produção.');
  }
  return config;
}
