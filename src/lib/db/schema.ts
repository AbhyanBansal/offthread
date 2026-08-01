import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Conventions
 * - Money is stored as INTEGER paise (1 rupee = 100). Never floats.
 * - Timestamps are timezone-aware (UTC).
 * - camelCase fields map to snake_case columns via `casing: "snake_case"`.
 */

// ── Shared types ───────────────────────────────────────────────
export type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

/** Structured product spec rendered on the product page. All optional. */
export type ProductDetails = {
  fabric?: string;
  gsm?: number;
  fit?: string;
  neck?: string;
  sleeves?: string;
  frontPrint?: string;
  backPrint?: string;
  keyFeatures?: string[];
  washCare?: string[];
};

// ── Enums ──────────────────────────────────────────────────────
export const userRole = pgEnum("user_role", ["customer", "admin"]);
export const productStatus = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "failed",
  "fulfilled",
  "cancelled",
  "refunded",
]);

// ── Auth.js tables (Drizzle adapter shape) ─────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  role: userRole("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ── Catalog ────────────────────────────────────────────────────
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    color: text("color"),
    status: productStatus("status").notNull().default("draft"),
    basePrice: integer("base_price").notNull(), // paise
    currency: text("currency").notNull().default("INR"),
    details: jsonb("details").$type<ProductDetails>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("products_status_idx").on(t.status)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // We store the S3 object KEY only. Public URLs are built at render time
    // from NEXT_PUBLIC_CDN_URL — the raw bucket is never exposed.
    s3Key: text("s3_key").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const variants = pgTable(
  "variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    size: text("size").notNull(),
    color: text("color"),
    priceOverride: integer("price_override"), // paise, nullable
    stockQty: integer("stock_qty").notNull().default(0),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

// ── Cart ───────────────────────────────────────────────────────
export const carts = pgTable("carts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    qty: integer("qty").notNull().default(1),
  },
  (t) => [unique("cart_items_cart_variant_uq").on(t.cartId, t.variantId)],
);

// ── Orders ─────────────────────────────────────────────────────
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    status: orderStatus("status").notNull().default("pending"),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    currency: text("currency").notNull().default("INR"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_razorpay_order_idx").on(t.razorpayOrderId),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // Nullable so deleting a product never destroys order history; the
    // human-readable snapshot below keeps the record intact.
    variantId: uuid("variant_id").references(() => variants.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    variantLabel: text("variant_label").notNull(),
    unitPrice: integer("unit_price").notNull(),
    qty: integer("qty").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    country: text("country").notNull().default("IN"),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

// ── Relations (for Drizzle's relational query API) ─────────────
export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  variants: many(variants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const variantsRelations = relations(variants, ({ one }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
}));

export const cartsRelations = relations(carts, ({ many, one }) => ({
  items: many(cartItems),
  user: one(users, { fields: [carts.userId], references: [users.id] }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(variants, {
    fields: [cartItems.variantId],
    references: [variants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(variants, {
    fields: [orderItems.variantId],
    references: [variants.id],
  }),
}));
