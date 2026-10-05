import { useAuth } from '../contexts/AuthContext.jsx';

export default function Navbar({ rota }) {
  const { usuario, sair, ehAdmin } = useAuth();
  const links = [
    ['/produtos', 'Produtos'],
    ['/movimentacoes', 'Movimentações'],
    ...(ehAdmin ? [['/usuarios', 'Usuários']] : []),
  ];

  return (
    <header className="navbar">
      <strong className="brand">Almoxarifado</strong>
      <nav>
        {links.map(([caminho, rotulo]) => (
          <a key={caminho} href={`#${caminho}`} className={rota === caminho ? 'ativo' : ''}>
            {rotulo}
          </a>
        ))}
      </nav>
      <div className="usuario">
        <span>{usuario.nome}</span>
        <span className={`badge ${ehAdmin ? 'badge-admin' : ''}`}>{ehAdmin ? 'Administrador' : 'Operador'}</span>
        <button className="btn btn-secundario" onClick={sair}>Sair</button>
      </div>
    </header>
  );
}
