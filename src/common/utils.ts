import { compareSync, hashSync } from "bcrypt-edge";
import type { ClientMetadata, ClientValue } from "../clients/types";
import { combineMetadata } from "../clients/utils";
import type { User, UserMetadata, UserValue } from "../users/types";
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
}) => {
	const id = email
		? await kv.get(`${EMAIL_PREFIX}:${clientId}:${email}`, "text")
		: username
			? await kv.get(`${USERNAME_PREFIX}:${clientId}:${username}`, "text")
			: false;

	if (!id) return undefined;

	return {
		id,
		...(await kv.getWithMetadata<UserValue, UserMetadata>(
			`${USER_PREFIX}:${clientId}:${id}`,
			"json",
		)),
	};
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
	const userResponse = await getUser({ kv, email, username, clientId });

	if (!userResponse?.value?.password) return false;

	const valid = await verifyPassword(password, userResponse.value?.password);

	if (!valid) return false;

	return { id: userResponse.id, ...userResponse.metadata } as User;
};

export const generateEmailVerificationCode = async ({
	kv,
	clientId,
	id,
}: {
	kv: KVNamespace;
	clientId: string;
	id: string;
}) => {
	let verificationCode = "";

	for (let i = 0; i < 6; i++) {
		verificationCode += Math.floor(Math.random() * 9);
	}

	await kv.put(
		`${VERIFICATIONCODE_PREFIX}:${clientId}:${id}`,
		verificationCode,
		{ expirationTtl: 60 * 15 },
	);

	return verificationCode;
};
