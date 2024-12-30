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

2. **Add Functionality to Clear All Sessions**
   - Add route `DELETE /sessions/{clientId}` to log out and terminate all active sessions for a user.

3. **Add Functionality to Clear a Single Session**
   - Add route `DELETE /sessions/{clientId}/{sessionId}` to log out and terminate a specific session.

4. **Implement Cookie Security**
   - **OpenAPI Security Strategy:**
     - Specify that user-specific endpoints require cookies containing secure JWTs.
   - **Middleware in Hono:**
     - Validate the JWT token in cookies.
     - Check if:
       - The `userId` in the URL matches the `userId` in the JWT.
       - The `role` in the JWT matches `admin` or `superadmin` for admin-level access.

5. **Add User Metadata Endpoint**
   - Add a `GET /users/{clientId}/{userId}` endpoint to retrieve user metadata like verified email addresses and profile details.

6. **Implement Forgotten Password Flow**
   - Add endpoints for requesting and confirming password resets.

7. **Add Roles or Permissions**
   - Implement role-based access control by adding a `role` field and role-checking middleware.

### Future Enhancements

- **Session Archival**
  - Maintain a log of cleared sessions for audit purposes, including details like `id`, `userAgent`, `ip`, `loggedInAt`, and `clearedAt`.

- **Archived Sessions Endpoint**
  - Add a route to retrieve a list of archived sessions with filtering options, such as by date range.

