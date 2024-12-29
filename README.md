# oauthabl

## Development

```
yarn
yarn dev
```

## Deployment

```
yarn deploy
```

## Roadmap

### Current Development Tasks

1. **Replace Sessions When Logging In Twice**
   - Replace the existing session with a new one if a user logs in again from the same device/browser.

2. **Implement Logout**
   - Add a `POST /oauth/logout` endpoint to clear tokens (stored as cookies) and terminate the current session.

3. **Add Functionality to Clear All Sessions**
   - Add a route (e.g., `POST /oauth/sessions/clear`) to log out and terminate all active sessions for a user.

4. **Add Functionality to Clear a Single Session**
   - Add a route (e.g., `POST /oauth/sessions/{sessionId}/clear`) to log out and terminate a specific session.

5. **Implement Cookie Security**
   - **OpenAPI Security Strategy:**
     - Specify that user-specific endpoints require cookies containing secure JWTs.
   - **Middleware in Hono:**
     - Validate the JWT token in cookies.
     - Check if:
       - The `userId` in the URL matches the `userId` in the JWT.
       - The `role` in the JWT matches `admin` or `superadmin` for admin-level access.

6. **Add User Metadata Endpoint**
   - Add a `GET /users/{userId}` endpoint to retrieve user metadata like verified email addresses and profile details.

7. **Implement Forgotten Password Flow**
   - Add endpoints for requesting and confirming password resets.

8. **Support Email and Username Management**
   - Enforce a rule that users can only have **one username**.
   - Allow users to associate **multiple email addresses** with their account.

9. **Add Roles or Permissions**
   - Implement role-based access control by adding a `role` field and role-checking middleware.

---

### Future Enhancements

- **Session Archival**
  - Maintain a log of cleared sessions for audit purposes, including details like `id`, `userAgent`, `ip`, `loggedInAt`, and `clearedAt`.

- **Archived Sessions Endpoint**
  - Add a route to retrieve a list of archived sessions with filtering options, such as by date range.

---

This roadmap outlines the tasks and features in progress or planned for the OAuth2 server. Contributions and feedback are welcome!
