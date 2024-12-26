import { compareSync, hashSync } from "bcrypt-edge";
import {
  CLIENT_PREFIX,
  EMAIL_PREFIX,
  USER_PREFIX,
  USERNAME_PREFIX,
} from "../common/constants";
import { User, UserMetadata, UserValue } from "./types";
import { ClientMetadata, ClientValue } from "../clients/types";
import { combineMetadata } from "../clients/utils";

export const getClient = async ({
  kv,
  clientId,
}: {
  kv: KVNamespace;
  clientId: string;
}) => {
  const response = await kv.getWithMetadata<ClientValue, ClientMetadata>(
    `${CLIENT_PREFIX}${clientId}`,
    "json"
  );

  if (response?.value === null || response?.metadata === null) return false;

  // @ts-expect-error We know this isn't null now
  return combineMetadata(response);
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
  hashedPassword: string
) => {
  try {
    const isMatch = await compareSync(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Error verifying password:", error);
    throw error;
  }
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
}) => {
  const id = email
    ? await kv.get(`${EMAIL_PREFIX}${clientId}:${email}`, "text")
    : username
    ? await kv.get(`${USERNAME_PREFIX}${clientId}:${username}`, "text")
    : false;

  if (!id) return false;

  const userResponse = await kv.getWithMetadata<UserValue, UserMetadata>(
    `${USER_PREFIX}${clientId}:${id}`,
    "json"
  );

  if (!userResponse?.value?.password) return false;

  const valid = await verifyPassword(password, userResponse.value?.password);

  if (!valid) return false;

  return { id, ...userResponse.metadata } as User;
};
