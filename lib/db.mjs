import { neon } from "@neondatabase/serverless";

let cachedSql;

export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

export function getSql() {
  const url = databaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!cachedSql) {
    cachedSql = neon(url);
  }

  return cachedSql;
}
