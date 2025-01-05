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

1. **Implement Forgotten Password Flow**
   - Add endpoint for requesting a code.
   - Add endpoint for confirming code and resetting password.

2. **Implement user update endpoint**
   - Add a new endpoint for updating user data:
     - `username`
     - `email` (or emails)
     - `password`
   - Add a new `updatedAt` property

3. **Automatically sign in user on registration or email verification**
   - Sign in a user when they register and there is no email verification required.
   - If email verification is required, sign in the user when they verify their email address.

4. **Add Roles or Permissions**
   - Implement role-based access control by adding a `role` field and role-checking middleware.
     - **`superadmin`**: Full control across all clients
     - **`clientadmin`**: Manage a singular client and associated users.
     - **`user` (or any resource server defined value, such as `admin` or `editor`)**: Role for resource servers/client usage (user is the fallback if `undefined`).

5. **Add Role-Based Endpoint Security**
   - Ensure endpoint-level access restrictions:
     - `superadmin`-only endpoints (e.g., creating clients, managing `superadmin` users)
     - `clientadmin`-only endpoints (e.g., managing users for a client) via the `:clientId` URL parameter.
     - Ensure that `users` (and all others) can only access their own resources via the `:userId` URL parameter.

6. **Set up OAuthabl Admin Client**
   - Add a special, protected admin client to manage:
     - `superadmin` creation (manual initial setup of first user).
     - Client creation and management

### Future Enhancements

- **Track User Agent and IP Address on Sessions**
  - Enhance session tracking to store:
    - User agent
    - IP address

- **Enhanced Refresh Token Security**
  - Add IP/device validation for refresh token usage:
    - Validate tokens against the stored user agent and IP address (or a device hash).
    - Allow IP changes within a safe threshold (e.g., same subnet).

- **Support for Access Token Request Flow**
  - Implement the standard OAuth2 autheroization code flow for additional client use cases.
    - Focus on a child function React component implementation that allows complete stylistic control over the inputs.
    - Make sure to keep front-end and back-end (SDK fetch client) implementation simple (probably through dog-fooding).

