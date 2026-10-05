import { useEffect, useState } from 'react';

const lerHash = () => window.location.hash.replace(/^#/, '') || '/produtos';

export const navegar = (caminho) => { window.location.hash = caminho; };

export function useRota() {
  const [rota, setRota] = useState(lerHash);
  useEffect(() => {
    const atualizar = () => setRota(lerHash());
    window.addEventListener('hashchange', atualizar);
    return () => window.removeEventListener('hashchange', atualizar);
  }, []);
  return rota;
}
