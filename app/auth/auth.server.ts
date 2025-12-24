import {
  createCookieSessionStorage,
  href,
  redirect,
  type MiddlewareFunction,
} from "react-router";
import { createSessionMiddleware } from "remix-utils/middleware/session";

const authSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "session",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secrets: [process.env.SESSION_SECRET ?? "secret"],
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
});

const [authSessionMiddleware, getAuthSessionFromContext] =
  createSessionMiddleware(authSessionStorage);

export { authSessionMiddleware, getAuthSessionFromContext };

export const requireUser: MiddlewareFunction = ({ context }, next) => {
  const authSession = getAuthSessionFromContext(context);
  const session = authSession.get("user");
  if (!session) {
    throw redirect(href("/login"));
  }
  return next();
};
