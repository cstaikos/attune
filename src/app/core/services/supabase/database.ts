import { SupabaseClient } from "@supabase/supabase-js";

export async function result<T>(
  request: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}

export async function userId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in to continue.");
  return data.user.id;
}

// PostgREST caps individual responses. Read every page before applying domain filters.
export async function rows<T>(
  client: SupabaseClient,
  table: string,
  columns = "*",
  order = "id",
  filter?: { column: string; value: string },
): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = client.from(table).select(columns);
    if (filter) query = query.eq(filter.column, filter.value);
    for (const column of order.split(",")) query = query.order(column);
    const page = (await result(query.range(offset, offset + 499))) ?? [];
    all.push(...(page as unknown as T[]));
    if (page.length < 500) return all;
  }
}
