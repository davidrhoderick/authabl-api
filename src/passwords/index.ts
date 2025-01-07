import { OpenAPIHono } from "@hono/zod-openapi";
import type { Bindings } from "../common/types";
import { clientAuthentication } from "../middleware/client-authentication";
import { forgotPasswordRoute, resetPasswordRoute } from "./routes";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.use("/:clientId/*", clientAuthentication);

app
	// TODO
	.openapi(forgotPasswordRoute, async (c) => {
		// Validate the input

		// Look up the user by the email address
		// Return if not found

		// Delete previous code if exists (for resending)

		// Create a unique code by user ID/email address

		// Return it to the resource server
		return c.json({ code: 200, message: "Email sent" }, 200);
	})
	// TODO Update completely for reset password
	.openapi(resetPasswordRoute, async (c) => {
		// Validate the input

		// Look up the user by the email address
		// Return if not found

		// Look up the code by user ID/email address
		// Return if not found

		// Validate the code

		// Update the user

		// Return success
		return c.json({ code: 200, message: "Email sent" }, 200);
	});

export default app;
