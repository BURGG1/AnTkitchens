export const peso = (n: number) => {
  const r = Math.round(n * 100) / 100;
  const [i, d] = r.toString().split(".");
  return `₱${i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${d ? "." + d : ""}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const DAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const fmtShort = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
export const fmtLong = (d: Date) => `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}`;
export const fmtRange = (start: Date) => `${fmtShort(start)} – ${fmtShort(addDays(start, 6))}`;

// ---------- menu ----------
export type Product = {
  id: string;
  name: string;
  price: number;
  variants?: number[]; // e.g. Black Gulaman ₱5 / ₱10
  badge?: string;
  unit: string;
  image: string;
};

export const PRODUCTS: Product[] = [
  { id: "big-siomai", name: "Big Siomai", price: 10, badge: "BEST SELLER", unit: "per piece", image: "https://placehold.co/300x360/d9c9a8/333?text=Big+Siomai" },
  { id: "regular-siomai", name: "Regular Siomai", price: 5, unit: "per piece", image: "https://placehold.co/300x360/d9c9a8/333?text=Siomai" },
  { id: "black-gulaman", name: "Black Gulaman", price: 5, variants: [5, 10], unit: "per order", image: "https://placehold.co/300x360/c7d7b4/333?text=Gulaman" },
  { id: "chowpan-rice", name: "Chowpan Rice", price: 40, unit: "per order", image: "https://placehold.co/300x360/e7d9c0/333?text=Chowpan" },
];

// ---------- cart ----------
export type CartLine = { qty: number; price: number };
export type Cart = Record<string, CartLine>;

export const cartTotals = (cart: Cart) =>
  Object.values(cart).reduce(
    (a, l) => ({ items: a.items + l.qty, total: a.total + l.qty * l.price }),
    { items: 0, total: 0 }
  );

// ---------- costing ----------
export type CostItem = { id: string; name: string; unitCost: number; qty: number };

// ---------- sales (types + helper; real numbers come from db.ts) ----------
export type DaySales = { sales: number; costing: number };
export type Week = { start: Date; days: DaySales[] };

export const sumDays = (days: DaySales[]) => {
  const sales = days.reduce((s, d) => s + d.sales, 0);
  const costing = days.reduce((s, d) => s + d.costing, 0);
  return { sales, costing, revenue: sales - costing };
};