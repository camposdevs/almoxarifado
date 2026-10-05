// Roteador mínimo: associa método + caminho a uma cadeia de handlers (middlewares + controller).
export class Router {
  #rotas = [];

  adicionar(metodo, caminho, ...handlers) {
    const nomes = [];
    const padrao = caminho.replace(/:([A-Za-z]+)/g, (_, nome) => {
      nomes.push(nome);
      return '([^/]+)';
    });
    this.#rotas.push({ metodo, regex: new RegExp(`^${padrao}/?$`), nomes, handlers });
    return this;
  }

  get(caminho, ...handlers) { return this.adicionar('GET', caminho, ...handlers); }
  post(caminho, ...handlers) { return this.adicionar('POST', caminho, ...handlers); }
  put(caminho, ...handlers) { return this.adicionar('PUT', caminho, ...handlers); }
  delete(caminho, ...handlers) { return this.adicionar('DELETE', caminho, ...handlers); }

  resolver(metodo, caminho) {
    let caminhoExiste = false;
    for (const rota of this.#rotas) {
      const encontrado = rota.regex.exec(caminho);
      if (!encontrado) continue;
      caminhoExiste = true;
      if (rota.metodo !== metodo) continue;
      const params = {};
      rota.nomes.forEach((nome, i) => { params[nome] = encontrado[i + 1]; });
      return { handlers: rota.handlers, params };
    }
    return caminhoExiste ? { metodoNaoPermitido: true } : { naoEncontrada: true };
  }
}
