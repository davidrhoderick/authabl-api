import app from "../src/index";

describe("Clients", () => {
	it("creates a client", async () => {
		const client = {
			name: "Test",
			allowedOrigins: ["http://test.com"],
			accessTokenValidity: 3600,
			refreshTokenValidity: 1209600,
			disableRefreshToken: false,
			refreshRefreshToken: true,
		};

		const response = await app.request("/clients", {
			method: "post",
			body: JSON.stringify(client),
		});

		expect(response).toStrictEqual(client);
	});
});
