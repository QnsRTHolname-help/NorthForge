import { useMemo, useState, type ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { cx } from '@/utils/format';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  hideOnMobile?: boolean;
}

export function DataTable<T extends { id: string }>({
  rows, columns, searchKeys, searchPlaceholder = 'Search…', onRowClick, filters, pageSize = 10, empty,
}: {
  rows: T[]; columns: Column<T>[]; searchKeys?: ((row: T) => string)[]; searchPlaceholder?: string;
  onRowClick?: (row: T) => void; filters?: ReactNode; pageSize?: number; empty?: ReactNode;
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let out = rows;
    if (q && searchKeys) {
      const t = q.toLowerCase();
      out = out.filter((r) => searchKeys.some((f) => f(r).toLowerCase().includes(t)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a), bv = col.sortValue!(b);
          const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, q, sort, columns, searchKeys]);

  const pages = Math.ceil(filtered.length / pageSize) || 1;
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const curPage = Math.min(page, pages - 1);

  const toggleSort = (key: string) => {
    setSort((s) => s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' });
  };

  return (
    <div className="card overflow-hidden">
      {(searchKeys || filters) && (
        <div className="flex flex-col sm:flex-row gap-2 p-3 border-b border-line/60">
          {searchKeys && (
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={searchPlaceholder}
                className="input pl-9" />
            </div>
          )}
          {filters}
        </div>
      )}
      {filtered.length === 0 ? (
        <div>{empty || <div className="py-14 text-center text-sm text-muted">No results found.</div>}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/60">
                  {columns.map((c) => (
                    <th key={c.key} className={cx('text-left font-display font-extrabold text-muted text-xs px-4 py-3.5 whitespace-nowrap',
                      c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                      {c.sortValue ? (
                        <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-content transition-colors">
                          {c.header}
                          {sort?.key === c.key ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                        </button>
                      ) : c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} onClick={() => onRowClick?.(row)}
                    className={cx('table-row', onRowClick && 'cursor-pointer')}>
                    {columns.map((c) => (
                      <td key={c.key} className={cx('px-4 py-3 align-middle', c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-line/60 text-xs text-muted">
              <span>{filtered.length} results</span>
              <div className="flex items-center gap-1">
                <button className="btn-outline btn-sm" disabled={curPage === 0} onClick={() => setPage(curPage - 1)}>Prev</button>
                <span className="px-2">Page {curPage + 1} of {pages}</span>
                <button className="btn-outline btn-sm" disabled={curPage >= pages - 1} onClick={() => setPage(curPage + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
