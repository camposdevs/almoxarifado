import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, definirAoExpirarSessao, lerSessao, limparSessao, salvarSessao } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => lerSessao()?.usuario ?? null);

  const sair = useCallback(() => {
    limparSessao();
    setUsuario(null);
  }, []);

  useEffect(() => definirAoExpirarSessao(sair), [sair]);

  const entrar = useCallback(async (email, senha) => {
    const sessao = await api.post('/auth/login', { email, senha });
    salvarSessao(sessao);
    setUsuario(sessao.usuario);
  }, []);

  const cadastrar = useCallback(
    async (nome, email, senha) => {
      await api.post('/auth/register', { nome, email, senha });
      await entrar(email, senha);
    },
    [entrar],
  );

  const valor = useMemo(
    () => ({ usuario, entrar, cadastrar, sair, ehAdmin: usuario?.perfil === 'ADMIN' }),
    [usuario, entrar, cadastrar, sair],
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
