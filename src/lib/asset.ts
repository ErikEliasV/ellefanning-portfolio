const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset<T extends string | undefined>(path: T): T {
  if (!path || !path.startsWith("/")) return path;
  return `${BASE_PATH}${path}` as T;
}
