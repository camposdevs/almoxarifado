import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navegar } from '../routes.js';

// Rota privada: exige login e, opcionalmente, um dos perfis informados.
// (A segurança real é aplicada pela API; aqui apenas evitamos telas indevidas.)
export default function PrivateRoute({ perfis, children }) {
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) navegar('/login');
  }, [usuario]);

  if (!usuario) return null;
  if (perfis && !perfis.includes(usuario.perfil)) {
    return (
      <div className="card" role="alert">
        <h2>Acesso negado</h2>
        <p>Seu perfil ({usuario.perfil === 'ADMIN' ? 'Administrador' : 'Operador'}) não tem permissão para acessar esta página.</p>
      </div>
    );
  }
  return children;
}
