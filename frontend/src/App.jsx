import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MovimentacoesPage from './pages/MovimentacoesPage.jsx';
import ProdutosPage from './pages/ProdutosPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';
import { navegar, useRota } from './routes.js';

// Tabela de rotas privadas e dos perfis que podem acessá-las.
const ROTAS = {
  '/produtos': { Pagina: ProdutosPage },
  '/movimentacoes': { Pagina: MovimentacoesPage },
  '/usuarios': { Pagina: UsuariosPage, perfis: ['ADMIN'] },
};

export default function App() {
  const rota = useRota();
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario && (rota === '/login' || !ROTAS[rota])) navegar('/produtos');
  }, [usuario, rota]);

  if (rota === '/login' || !usuario) return <LoginPage />;

  const definicao = ROTAS[rota];
  if (!definicao) return null;
  const { Pagina, perfis } = definicao;

  return (
    <>
      <Navbar rota={rota} />
      <main className="container">
        <PrivateRoute perfis={perfis}>
          <Pagina />
        </PrivateRoute>
      </main>
    </>
  );
}
