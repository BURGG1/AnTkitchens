// Db.ts — local SQLite database (expo-sqlite)
import * as SQLite from "expo-sqlite";
import { CostItem, DaySales, PRODUCTS, Product, Week, addDays } from "./Data";

/* ---------------------------------------------------------------
   Open + migrate (runs once, on first use)
---------------------------------------------------------------- */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

async function init() {
  const db = await SQLite.openDatabaseAsync("ant.db");
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total REAL NOT NULL,
          cash REAL NOT NULL,
          change_amount REAL NOT NULL,
          created_at TEXT NOT NULL,          -- ISO string (UTC)
          synced INTEGER NOT NULL DEFAULT 0  -- for syncing to your backend later
        );
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL,
          name TEXT NOT NULL,
          unit_price REAL NOT NULL,
          unit_cost REAL NOT NULL DEFAULT 0, -- cost snapshot at time of sale
          qty INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cost_items (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          unit_cost REAL NOT NULL,
          qty INTEGER NOT NULL DEFAULT 1
        );
        CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
      `);

      await db.execAsync("PRAGMA user_version = 1;");
    });
  }

  if (version < 2) {
    await db.withTransactionAsync(async () => {
      // new installs get the table without a description column
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          variants TEXT,                     -- JSON array like [5,10], or NULL
          badge TEXT,
          unit TEXT NOT NULL DEFAULT 'per piece',
          image TEXT NOT NULL DEFAULT ''
        );
      `);

      // seed the built-in menu so existing products keep showing up
      for (const p of PRODUCTS) {
        await db.runAsync(
          "INSERT OR IGNORE INTO products (id, name, price, variants, badge, unit, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
          p.id,
          p.name,
          p.price,
          p.variants ? JSON.stringify(p.variants) : null,
          p.badge ?? null,
          p.unit,
          p.image
        );
      }

      await db.execAsync("PRAGMA user_version = 2;");
    });
  }

  if (version < 3) {
    // existing installs: rebuild the products table without the description column
    const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(products)");
    const hasDescription = cols.some((c) => c.name === "description");

    await db.withTransactionAsync(async () => {
      if (hasDescription) {
        await db.execAsync(`
          CREATE TABLE products_new (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            variants TEXT,
            badge TEXT,
            unit TEXT NOT NULL DEFAULT 'per piece',
            image TEXT NOT NULL DEFAULT ''
          );
          INSERT INTO products_new (id, name, price, variants, badge, unit, image)
            SELECT id, name, price, variants, badge, unit, image FROM products ORDER BY rowid;
          DROP TABLE products;
          ALTER TABLE products_new RENAME TO products;
        `);
      }
      await db.execAsync("PRAGMA user_version = 3;");
    });
  }

  if (version < 4) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS admin_users (
          username TEXT PRIMARY KEY NOT NULL,
          password TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sales_overrides (
          day TEXT PRIMARY KEY NOT NULL,     -- local date, YYYY-MM-DD
          amount REAL NOT NULL,
          updated_at TEXT NOT NULL           -- ISO string (UTC)
        );
      `);

      // default admin account
      await db.runAsync(
        "INSERT OR IGNORE INTO admin_users (username, password) VALUES (?, ?)",
        "admin",
        "admin123"
      );

      await db.execAsync("PRAGMA user_version = 4;");
    });
  }

  return db;
}

/* ---------------------------------------------------------------
   Admin login
---------------------------------------------------------------- */
export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ ok: number }>(
    "SELECT 1 AS ok FROM admin_users WHERE LOWER(username) = LOWER(?) AND password = ? LIMIT 1",
    username.trim(),
    password
  );
  return !!r;
}

/* ---------------------------------------------------------------
   Products (menu)
---------------------------------------------------------------- */
export async function getProducts(): Promise<Product[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    price: number;
    variants: string | null;
    badge: string | null;
    unit: string;
    image: string;
  }>("SELECT id, name, price, variants, badge, unit, image FROM products ORDER BY rowid");

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    variants: r.variants ? (JSON.parse(r.variants) as number[]) : undefined,
    badge: r.badge ?? undefined,
    unit: r.unit,
    image: r.image,
  }));
}

export async function addProduct(p: Product) {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO products (id, name, price, variants, badge, unit, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
    p.id,
    p.name,
    p.price,
    p.variants ? JSON.stringify(p.variants) : null,
    p.badge ?? null,
    p.unit,
    p.image
  );
}

export async function updateProduct(p: Product) {
  const db = await getDb();
  await db.runAsync(
    "UPDATE products SET name = ?, price = ?, unit = ?, image = ? WHERE id = ?",
    p.name,
    p.price,
    p.unit,
    p.image,
    p.id
  );
}

export async function deleteProduct(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM products WHERE id = ?", id);
}

/* ---------------------------------------------------------------
   Orders
---------------------------------------------------------------- */
export type OrderLine = { productId: string; name: string; price: number; qty: number };

export async function saveOrder(lines: OrderLine[], total: number, cash: number) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      "INSERT INTO orders (total, cash, change_amount, created_at) VALUES (?, ?, ?, ?)",
      total, cash, Math.max(0, cash - total), new Date().toISOString()
    );
    const orderId = res.lastInsertRowId;

    for (const l of lines) {
      // match the costing item by id, or by name (custom items have their own ids)
      const c = await db.getFirstAsync<{ unit_cost: number }>(
        "SELECT unit_cost FROM cost_items WHERE id = ? OR LOWER(name) = LOWER(?) LIMIT 1",
        l.productId, l.name
      );
      await db.runAsync(
        "INSERT INTO order_items (order_id, product_id, name, unit_price, unit_cost, qty) VALUES (?, ?, ?, ?, ?, ?)",
        orderId, l.productId, l.name, l.price, c?.unit_cost ?? 0, l.qty
      );
    }
  });
}

/* ---------------------------------------------------------------
   Costing list
---------------------------------------------------------------- */
export async function getCostItems(): Promise<CostItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; name: string; unit_cost: number; qty: number }>(
    "SELECT id, name, unit_cost, qty FROM cost_items ORDER BY rowid"
  );
  return rows.map((r) => ({ id: r.id, name: r.name, unitCost: r.unit_cost, qty: r.qty }));
}

export async function addCostItem(item: CostItem) {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO cost_items (id, name, unit_cost, qty) VALUES (?, ?, ?, ?)",
    item.id, item.name, item.unitCost, item.qty
  );
}

export async function setCostQty(id: string, qty: number) {
  const db = await getDb();
  await db.runAsync("UPDATE cost_items SET qty = ? WHERE id = ?", qty, id);
}

export async function deleteCostItem(id: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM cost_items WHERE id = ?", id);
}

/** Wipes every order, costing item and manual sales entry. Use while developing. (Products and admin login are kept.) */
export async function resetAllData() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      "DELETE FROM order_items; DELETE FROM orders; DELETE FROM cost_items; DELETE FROM sales_overrides;"
    );
  });
}

/* ---------------------------------------------------------------
   Sales reports
---------------------------------------------------------------- */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const mondayOf = (d: Date) => {
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dow);
};

/** Today's sales. A manually entered amount (if any) replaces the total from orders. */
export async function getTodaySalesInfo(): Promise<{ amount: number; manual: boolean }> {
  const db = await getDb();
  const day = ymd(new Date());

  const o = await db.getFirstAsync<{ amount: number }>(
    "SELECT amount FROM sales_overrides WHERE day = ?",
    day
  );
  if (o) return { amount: o.amount, manual: true };

  const r = await db.getFirstAsync<{ s: number | null }>(
    "SELECT SUM(total) AS s FROM orders WHERE date(created_at, 'localtime') = ?",
    day
  );
  return { amount: r?.s ?? 0, manual: false };
}

export async function getTodaySales(): Promise<number> {
  return (await getTodaySalesInfo()).amount;
}

/** Saves a manual total for today (replaces any earlier manual entry). */
export async function saveTodaySales(amount: number) {
  const db = await getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO sales_overrides (day, amount, updated_at) VALUES (?, ?, ?)",
    ymd(new Date()),
    amount,
    new Date().toISOString()
  );
}

/** Removes today's manual total, so sales come from orders again. */
export async function clearTodaySales() {
  const db = await getDb();
  await db.runAsync("DELETE FROM sales_overrides WHERE day = ?", ymd(new Date()));
}

export async function getWeek(start: Date): Promise<Week> {
  const db = await getDb();
  const from = ymd(start);
  const to = ymd(addDays(start, 6));

  const sales = await db.getAllAsync<{ day: string; sales: number }>(
    `SELECT date(created_at, 'localtime') AS day, SUM(total) AS sales
       FROM orders
      WHERE date(created_at, 'localtime') BETWEEN ? AND ?
      GROUP BY day`,
    from, to
  );
  const costs = await db.getAllAsync<{ day: string; costing: number }>(
    `SELECT date(o.created_at, 'localtime') AS day, SUM(i.unit_cost * i.qty) AS costing
       FROM order_items i JOIN orders o ON o.id = i.order_id
      WHERE date(o.created_at, 'localtime') BETWEEN ? AND ?
      GROUP BY day`,
    from, to
  );
  const overrides = await db.getAllAsync<{ day: string; amount: number }>(
    "SELECT day, amount FROM sales_overrides WHERE day BETWEEN ? AND ?",
    from, to
  );

  const days: DaySales[] = Array.from({ length: 7 }, (_, i) => {
    const key = ymd(addDays(start, i));
    return {
      // a manual total wins over the total from orders
      sales: overrides.find((o) => o.day === key)?.amount ?? sales.find((s) => s.day === key)?.sales ?? 0,
      costing: costs.find((c) => c.day === key)?.costing ?? 0,
    };
  });
  return { start, days };
}

/** index 0 = current week, then previous weeks */
export async function getRecentWeeks(count = 4): Promise<Week[]> {
  const first = mondayOf(new Date());
  return Promise.all(Array.from({ length: count }, (_, i) => getWeek(addDays(first, -7 * i))));
}