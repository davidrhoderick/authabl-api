import { setCookie } from "hono/cookie";
import {
	ACCESSTOKEN_COOKIE,
	REFRESHTOKEN_COOKIE,
} from "../../common/constants";
import type { Context } from "hono";

export const setCookies = ({
	c,
	accessToken,
	accessTokenValidity,
	refreshToken,
	refreshTokenValidity,
}: {
	c: Context;
	accessToken: string;
	accessTokenValidity: number;
	refreshToken?: string;
	refreshTokenValidity?: number;
}) => {
	const path = "/";

	setCookie(c, ACCESSTOKEN_COOKIE, accessToken, {
		path,
		httpOnly: true,
		maxAge: accessTokenValidity,
		sameSite: "lax",
	});

	if (refreshToken) {
		setCookie(c, REFRESHTOKEN_COOKIE, refreshToken, {
			path,
			httpOnly: true,
			maxAge: refreshTokenValidity,
			sameSite: "lax",
		});
	}
};
