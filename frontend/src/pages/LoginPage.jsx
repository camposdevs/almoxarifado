import { useState } from 'react';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { navegar } from '../routes.js';

export default function LoginPage() {
  const { entrar, cadastrar } = useAuth();
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      if (modo === 'login') await entrar(form.email, form.senha);
      else await cadastrar(form.nome, form.email, form.senha);
      navegar('/produtos');
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-pagina">
      <form className="card login-card" onSubmit={enviar}>
        <h1>Almoxarifado</h1>
        <p className="muted">{modo === 'login' ? 'Entre com sua conta' : 'Crie sua conta de operador'}</p>
        <Alert tipo="erro">{erro}</Alert>

        {modo === 'cadastro' && (
          <label>Nome
            <input value={form.nome} onChange={alterar('nome')} required minLength={2} />
          </label>
        )}
        <label>E-mail
          <input type="email" value={form.email} onChange={alterar('email')} required autoComplete="username" />
        </label>
        <label>Senha
          <input
            type="password" value={form.senha} onChange={alterar('senha')} required
            minLength={modo === 'cadastro' ? 8 : undefined}
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {modo === 'cadastro' && <small className="muted">Mínimo de 8 caracteres, com letras e números.</small>}

        <button className="btn" disabled={enviando}>{modo === 'login' ? 'Entrar' : 'Cadastrar'}</button>
        <button
          type="button" className="link"
          onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setErro(''); }}
        >
          {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </form>
    </div>
  );
}
