import { SELF } from "cloudflare:test";
import type { Client } from "../src/clients/types";
import type { User } from "../src/users/types";

const email = "test@test.com";
const originalPassword = "Testp4ssw0rd!";
const newPassword = "Newtestpassword12345!";

const bootstrap = async () => {
	const headers = new Headers({
		"Content-Type": "application/json",
	});

	const clientResult: Client = await (
		await SELF.fetch("https://api.oauthabl.com/clients", {
			method: "POST",
			headers,
			body: JSON.stringify({
				name: "Test",
				allowedOrigins: ["http://test.com"],
				accessTokenValidity: 3600,
				refreshTokenValidity: 1209600,
				disableRefreshToken: false,
				refreshRefreshToken: true,
			}),
		})
	).json();

	headers.set("X-OAUTHABL-API-KEY", clientResult.secret);
	const clientId = clientResult.id;

	await SELF.fetch(`https://api.oauthabl.com/users/${clientId}`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			email,
			password: originalPassword,
		}),
	});

	await checkOriginalPassword({ headers, clientId });
	await checkNewPassword({ headers, clientId }, true);

	return { headers, clientId };
};

const checkOriginalPassword = async (
	{ headers, clientId }: { headers: Headers; clientId: string },
	inverse?: boolean,
) => {
	const response = await SELF.fetch(
		`https://api.oauthabl.com/tokens/${clientId}/mobile`,
		{
			headers,
			method: "POST",
			body: JSON.stringify({
				email,
				password: originalPassword,
			}),
		},
	);

	if (inverse) expect(response.status).toBe(401);
	else {
		expect(response.status).toBe(200);

		const result = await response.json();
		expect(result.accessToken).toStrictEqual(expect.any(String));
		expect(result.refreshToken).toStrictEqual(expect.any(String));
	}
};

const checkNewPassword = async (
	{ headers, clientId }: { headers: Headers; clientId: string },
	inverse?: boolean,
) => {
	const response = await SELF.fetch(
		`https://api.oauthabl.com/tokens/${clientId}/mobile`,
		{
			headers,
			method: "POST",
			body: JSON.stringify({
				email,
				password: newPassword,
			}),
		},
	);

	if (inverse) expect(response.status).toBe(401);
	else {
		expect(response.status).toBe(200);

		const result = await response.json();

		expect(result.accessToken).toStrictEqual(expect.any(String));
		expect(result.refreshToken).toStrictEqual(expect.any(String));
	}
};

describe("Passwords", () => {
	it("sends a code that can be used to change a user's password", async () => {
		const { headers, clientId } = await bootstrap();

		const forgottenPasswordResponse = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/forgot`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
				}),
			},
		);

		expect(forgottenPasswordResponse.status).toBe(200);

		const forgottenPasswordResult = await forgottenPasswordResponse.json();

		const passwordResetResponse = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/reset`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
					code: forgottenPasswordResult.code,
					password: newPassword,
				}),
			},
		);

		expect(passwordResetResponse.status).toBe(200);

		await checkOriginalPassword({ headers, clientId }, true);
		await checkNewPassword({ headers, clientId });

		const user: User = await (
			await SELF.fetch(`https://api.oauthabl.com/users/email/${email}`, {
				headers,
			})
		).json();

		expect(user.emailVerified).toBe(true);
	});

	it("returns 404 if the email is incorrect", async () => {
		const { headers, clientId } = await bootstrap();

		const forgottenPasswordResponse = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/forgot`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
				}),
			},
		);

		expect(forgottenPasswordResponse.status).toBe(200);

		const forgottenPasswordResult = await forgottenPasswordResponse.json();

		const passwordResetResponse = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/reset`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email: "bad@test.com",
					code: forgottenPasswordResult.code,
					password: newPassword,
				}),
			},
		);

		expect(passwordResetResponse.status).toBe(401);

		await checkOriginalPassword({ headers, clientId });
		await checkNewPassword({ headers, clientId }, true);
	});

	it("returns 401 if the code is incorrect", async () => {
		const { headers, clientId } = await bootstrap();

		const forgottenPasswordResponse = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/forgot`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
				}),
			},
		);

		expect(forgottenPasswordResponse.status).toBe(200);

		const forgottenPasswordResult = await forgottenPasswordResponse.json();

		const passwordResetResponse = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/reset`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
					code: forgottenPasswordResult.code.split("").reverse().join(""),
					password: newPassword,
				}),
			},
		);

		expect(passwordResetResponse.status).toBe(401);

		await checkOriginalPassword({ headers, clientId });
		await checkNewPassword({ headers, clientId }, true);
	});

	it("sends a new code that can be used to change a user's password if the first expires", async () => {
		const { headers, clientId } = await bootstrap();

		const forgottenPasswordResponse1 = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/forgot`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
				}),
			},
		);

		expect(forgottenPasswordResponse1.status).toBe(200);

		const forgottenPasswordResult1 = await forgottenPasswordResponse1.json();

		const forgottenPasswordResponse2 = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/forgot`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
				}),
			},
		);

		expect(forgottenPasswordResponse2.status).toBe(200);

		const forgottenPasswordResult2 = await forgottenPasswordResponse2.json();

		const passwordResetResponse1 = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/reset`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
					code: forgottenPasswordResult1.code,
					password: newPassword,
				}),
			},
		);

		expect(passwordResetResponse1.status).toBe(401);

		const passwordResetResponse2 = await SELF.fetch(
			`https://api.oauthabl.com/passwords/${clientId}/reset`,
			{
				headers,
				method: "POST",
				body: JSON.stringify({
					email,
					code: forgottenPasswordResult2.code,
					password: newPassword,
				}),
			},
		);

		expect(passwordResetResponse2.status).toBe(200);

		await checkOriginalPassword({ headers, clientId }, true);
		await checkNewPassword({ headers, clientId });
	});
});
