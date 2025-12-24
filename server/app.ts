import { createRequestHandler } from "@react-router/express";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import express from "express";
import postgres from "postgres";
import "react-router";
import { createContext, RouterContextProvider } from "react-router";

import { DatabaseContext } from "~/database/context";
import * as schema from "~/database/schema";

export const VALUE_FROM_EXPRESS = createContext<string>("VALUE_FROM_EXPRESS");

export const app = express();

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

declare global {
  // eslint-disable-next-line no-var
  var __postgresClient__: ReturnType<typeof postgres> | undefined;

  // eslint-disable-next-line no-var
  var __drizzleDb__: PostgresJsDatabase<typeof schema> | undefined;
}

// Create/reuse client
let client: ReturnType<typeof postgres>;
let db: PostgresJsDatabase<typeof schema>;

if (process.env.NODE_ENV === "production") {
  client = postgres(process.env.DATABASE_URL);
  db = drizzle(client, { schema });
} else {
  if (!global.__postgresClient__) {
    global.__postgresClient__ = postgres(process.env.DATABASE_URL);
  }
  client = global.__postgresClient__;

  if (!global.__drizzleDb__) {
    global.__drizzleDb__ = drizzle(client, { schema });
  }
  db = global.__drizzleDb__;
}

// Attach db to AsyncLocalStorage per request
app.use((req, res, next) => {
  DatabaseContext.run(db, () => next());
});

app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
    getLoadContext() {
      const context = new RouterContextProvider();
      context.set(VALUE_FROM_EXPRESS, "Hello from Express");
      return context;
    },
  })
);
