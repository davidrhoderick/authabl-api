import { compareSync, hashSync } from "bcrypt-edge";
import type { ClientMetadata, ClientValue } from "../clients/types";
import { combineClientMetadata } from "../clients/utils";
import type { User, UserMetadata, UserValue } from "../users/types";
import { combineUserMetadata } from "../users/utils";
import {
  CLIENT_PREFIX,
  EMAIL_PREFIX,
  USERNAME_PREFIX,
  USER_PREFIX,
  VERIFICATIONCODE_PREFIX,
} from "./constants";

export const getClient = async ({
  kv,
  clientId,
}: {
  kv: KVNamespace;
  clientId: string;
}) => {
  const response = await kv.getWithMetadata<ClientValue, ClientMetadata>(
    `${CLIENT_PREFIX}:${clientId}`,
    "json",
  );

  if (response?.value === null || response?.metadata === null) return false;

  // @ts-expect-error We know this isn't null now
  return combineClientMetadata(response);
};

export const hashPassword = async (password: string) => {
  try {
    const hashedPassword = hashSync(password, 8);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
) => {
  try {
    const isMatch = await compareSync(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Error verifying password:", error);
    throw error;
  }
};

export const getUser = async ({
  kv,
  clientId,
  email,
  username,
}: {
  kv: KVNamespace;
  clientId: string;
  email?: string;
  username?: string;
}): Promise<ReturnType<typeof combineUserMetadata> | undefined> => {
  const id = email
    ? await kv.get(`${EMAIL_PREFIX}:${clientId}:${email}`, "text")
    : username
      ? await kv.get(`${USERNAME_PREFIX}:${clientId}:${username}`, "text")
      : false;

  if (!id) return;

  const user = await kv.getWithMetadata<UserValue, UserMetadata>(
    `${USER_PREFIX}:${clientId}:${id}`,
    "json",
  );

  if (!user?.value || !user?.metadata) return;

  return combineUserMetadata({
    id,
    value: user.value,
    metadata: user.metadata,
  });
};

export const loginVerification = async ({
  kv,
  email,
  username,
  clientId,
  password,
}: {
  kv: KVNamespace;
  email?: string;
  username?: string;
  clientId: string;
  password: string;
}): Promise<User | undefined> => {
  const user = await getUser({ kv, email, username, clientId });

  if (!user?.password) return;

  const valid = await verifyPassword(password, user?.password);

  if (!valid) return;

  const { password: _password, ...rest } = user;

  return rest;
};

export const generateVerificationCode = () => {
  let verificationCode = "";

  for (let i = 0; i < 6; i++) {
    verificationCode += Math.floor(Math.random() * 9);
  }

  return verificationCode;
};

export const generateEmailVerificationCode = async ({
  kv,
  clientId,
  userId,
}: {
  kv: KVNamespace;
  clientId: string;
  userId: string;
}) => {
  const verificationCode = generateVerificationCode();

  await kv.put(
    `${VERIFICATIONCODE_PREFIX}:${clientId}:${userId}`,
    verificationCode,
    { expirationTtl: 60 * 15 },
  );

  return verificationCode;
};

export const getUserByProperty = async ({
  property,
  identifier,
  clientId,
  kv,
}: {
  property: "id" | "email" | "username";
  identifier: string;
  clientId: string;
  kv: KVNamespace;
}) => {
  if (property === "id") {
    const user = await kv.getWithMetadata<UserValue, UserMetadata>(
      `${USER_PREFIX}:${clientId}:${identifier}`,
      "json",
    );

    if (!user?.value || !user?.metadata) return;

    return combineUserMetadata({
      id: identifier,
      value: user.value,
      metadata: user.metadata,
    });
  }

  return getUser({
    clientId,
    kv,
    email: property === "email" ? identifier : undefined,
    username: property === "username" ? identifier : undefined,
  });
};