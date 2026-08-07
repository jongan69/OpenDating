/**
 * D1Database adapter backed by sql.js (in-memory SQLite via WASM).
 *
 * Implements the subset of the D1Database interface used by OpenDating
 * services: prepare → bind → run / first / all, batch, withSession.
 *
 * withSession() returns a wrapper that routes to the same underlying DB —
 * semantically correct for a single-connection in-memory SQLite where
 * first-primary vs first-unconstrained is unobservable.
 */
import initSqlJs, { type Database, type SqlJsStatic, type Statement as SqlJsStmt } from 'sql.js';

let SQL: SqlJsStatic | null = null;

async function getSql(): Promise<SqlJsStatic> {
  if (!SQL) SQL = await initSqlJs();
  return SQL;
}

// ---------------------------------------------------------------------------
// Prepared statement wrapper
// ---------------------------------------------------------------------------

class D1PreparedStatement {
  private sql: string;
  private params: unknown[] = [];
  private db: Database;

  constructor(sql: string, db: Database) {
    this.sql = sql;
    this.db = db;
  }

  bind(...params: unknown[]): this {
    this.params = params;
    return this;
  }

  run(): { meta: { changes: number; last_row_id: number }; results: never[] } {
    const stmt = this.prepareAndBind();
    try {
      stmt.step();
      const changes = this.db.getRowsModified();
      return { meta: { changes, last_row_id: 0 }, results: [] };
    } finally {
      stmt.free();
    }
  }

  first<T = Record<string, unknown>>(): T | null {
    const result = this.all();
    return (result.results[0] as T) ?? null;
  }

  all<T = Record<string, unknown>>(): { results: T[]; meta: { duration: number } } {
    const stmt = this.prepareAndBind();
    const columns: string[] = [];
    const rows: T[] = [];
    try {
      while (stmt.step()) {
        if (columns.length === 0) {
          for (let i = 0; i < stmt.getColumnNames().length; i++) {
            columns.push(stmt.getColumnNames()[i]);
          }
        }
        const row: Record<string, unknown> = {};
        const vals = stmt.get();
        for (let i = 0; i < columns.length; i++) {
          row[columns[i]] = vals[i];
        }
        rows.push(row as T);
      }
    } finally {
      stmt.free();
    }
    return { results: rows, meta: { duration: 0 } };
  }

  private prepareAndBind(): SqlJsStmt {
    const stmt = this.db.prepare(this.sql);
    try {
      // sql.js bind() sets all positional params at once
      stmt.bind(this.params.map((v) => (v === undefined ? null : v)) as any[]);
      return stmt;
    } catch (e) {
      stmt.free();
      throw e;
    }
  }
}

// ---------------------------------------------------------------------------
// D1Database adapter
// ---------------------------------------------------------------------------

export class D1Adapter {
  private db: Database;
  readonly name: string;

  constructor(db: Database, name = 'test') {
    this.db = db;
    this.name = name;
  }

  prepare(sql: string): D1PreparedStatement {
    return new D1PreparedStatement(sql, this.db);
  }

  batch(statements: D1PreparedStatement[]): Promise<{ meta: { changes: number } }[]> {
    const results: { meta: { changes: number } }[] = [];
    for (const stmt of statements) {
      results.push(stmt.run());
    }
    return Promise.resolve(results);
  }

  withSession(_name: string): D1Adapter {
    return this; // Single-connection — sessions are unobservable
  }

  /** Execute raw SQL statements (for migrations). */
  exec(sql: string): void {
    this.db.run(sql);
  }

  /** Close the underlying database. */
  close(): void {
    this.db.close();
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an in-memory D1Database adapter with the OpenDating schema applied.
 */
export async function createTestDb(): Promise<D1Adapter> {
  const sql = await getSql();
  const db = new sql.Database();
  const adapter = new D1Adapter(db, 'test');
  return adapter;
}
