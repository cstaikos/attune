export function pageWindow(total: number, requested: number, size: number) {
  const pageSize = Number.isFinite(size) ? Math.max(1, Math.floor(size)) : 12;
  const count = Math.max(0, Math.floor(total));
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const page = Math.min(
    pages,
    Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : 1),
  );
  const offset = (page - 1) * pageSize;
  return {
    page,
    pages,
    offset,
    start: count ? offset + 1 : 0,
    end: Math.min(offset + pageSize, count),
  };
}
