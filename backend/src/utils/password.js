import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const TAMANHO_HASH = 64;

// Senhas nunca são guardadas em texto puro: scrypt + salt aleatório por usuário.
export async function gerarHash(senha) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(senha, salt, TAMANHO_HASH);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function conferirSenha(senha, armazenado) {
  const [algoritmo, saltB64, hashB64] = String(armazenado).split('$');
  if (algoritmo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const esperado = Buffer.from(hashB64, 'base64');
  const calculado = await scryptAsync(senha, Buffer.from(saltB64, 'base64'), esperado.length);
  return timingSafeEqual(calculado, esperado);
}
