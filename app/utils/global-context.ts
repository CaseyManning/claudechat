import { AsyncLocalStorage } from "node:async_hooks";
import { getAuthSessionFromContext } from "~/auth/auth.server";
import { getUserByEmail } from "~/auth/user.server";
import type { Session, MiddlewareFunction } from "react-router";
import type { InferSelectModel } from "drizzle-orm";
import * as schema from "~/database/schema";

type User = Pick<InferSelectModel<typeof schema.users>, "email" | "id">;

type GlobalStorage = {
  authSession: Session;
  user: User | null;
};

const globalStorage = new AsyncLocalStorage<GlobalStorage>();

const getGlobalStorage = () => {
  const storage = globalStorage.getStore();

  if (!storage) {
    throw new Error("Storage unavailable");
  }

  return storage;
};

export const getAuthSession = () => {
  const storage = getGlobalStorage();
  return storage.authSession;
};

export const getOptionalUser = () => {
  const storage = getGlobalStorage();
  return storage.user;
};

export const getUser = () => {
  const user = getOptionalUser();
  if (!user) {
    throw new Error("User should be available here");
  }
  return user;
};

export const globalStorageMiddleware: MiddlewareFunction<Response> = async (
  { context },
  next
) => {
  const authSession = getAuthSessionFromContext(context);
  const userData = authSession.get("user");
  const user = userData?.email ? await getUserByEmail(userData.email) : null;
  return new Promise((resolve) => {
    globalStorage.run(
      {
        authSession,
        user: user ?? null,
      },
      () => {
        resolve(next());
      }
    );
  });
};
