import { createHash } from "node:crypto";
import type { UserLoginData } from "./login.schema";
import type { NewUserData } from "./register.schema";
import { database } from "~/database/context";
import * as schema from "~/database/schema";
import { and, eq } from "drizzle-orm";
import { getAuthSession } from "~/utils/global-context";

export async function getUserByEmail(email: string) {
  const db = database();

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
    columns: {
      id: true,
      email: true,
    },
  });
  return user;
}

export async function registerUser(userData: NewUserData) {
  const db = database();

  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    return {
      errors: {
        email: {
          message: "an account with this email already exists",
          type: "custom",
        },
      },
    };
  }

  const hashedPassword = createHash("sha256")
    .update(userData.password)
    .digest("hex");

  const newUser = (
    await db
      .insert(schema.users)
      .values({
        email: userData.email,
        passwordHash: hashedPassword,
        username: userData.email,
      })
      .returning()
  )[0];

  const authSession = getAuthSession();
  authSession.set("user", {
    id: newUser.id,
    email: newUser.email,
  });
  return {
    errors: null,
  };
}

export async function loginUser(loginData: UserLoginData) {
  const db = database();
  const userExists = await getUserByEmail(loginData.email);
  if (!userExists) {
    return {
      errors: {
        email: {
          message: "This email does not exist",
        },
      },
    };
  }

  const loggedInUser = await db.query.users.findFirst({
    where: and(
      eq(schema.users.email, loginData.email),
      eq(
        schema.users.passwordHash,
        createHash("sha256").update(loginData.password).digest("hex")
      )
    ),
  });

  if (!loggedInUser) {
    return {
      errors: {
        email: {
          message: "This password is incorrect",
        },
      },
    };
  }

  const authSession = getAuthSession();
  authSession.set("user", {
    email: loggedInUser.email,
    id: loggedInUser.id,
  });
  return {
    errors: null,
  };
}

export async function signoutUser() {
  return null;
}
