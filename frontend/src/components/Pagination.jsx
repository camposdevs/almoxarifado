export default function Pagination({ page, totalPages, total, onChange }) {
  return (
    <div className="paginacao">
      <span>{total} registro(s)</span>
      <div>
        <button className="btn btn-secundario" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </button>
        <span className="pagina-atual">Página {page} de {totalPages}</span>
        <button className="btn btn-secundario" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Próxima
        </button>
      </div>
    </div>
  );
}
