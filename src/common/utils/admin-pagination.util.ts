export interface AdminPaginationOptions {
  skip: number;
  take: number;
  order: Record<string, 'ASC' | 'DESC'>;
}

export function parseAdminPagination(
  start: string = '0',
  end: string = '10',
  sort: string = 'id',
  order: string = 'ASC',
): AdminPaginationOptions {
  const startNum = parseInt(start);
  const endNum = parseInt(end);
  return {
    skip: startNum,
    take: endNum - startNum,
    order: { [sort]: order.toUpperCase() as 'ASC' | 'DESC' },
  };
}
