# authabl

## Development

```
yarn
yarn dev
```

## Deployment

This repository is deployed by GitHub actions. However, you can run the following commands to deploy from a local machine

```
wrangler login
yarn deploy
```

## Testing

Testing is run in GitHub actions before deployment using the following command.

```
yarn test
```

It can also be run locally, as well as with the following command to watch tests:

```
yarn test:watch
```

Using the "Coverage Gutters" extension might work (there's an issue with the `test:watch` script) as well as the Vitest plugin (which works well).

## Roadmap

### Current Development Tasks

1. **Set up authabl Admin Client**
   - Add a special, protected admin client to manage:
     - `superadmin` creation (manual initial setup of first user).
     - Client creation and management.
     - When seeding, make sure to save the `clientSecret` to Doppler.

2. **Add Role-Based Endpoint Security**

   - Ensure endpoint-level access restrictions:f
     - `superadmin`-only endpoints (e.g., creating clients, managing `superadmin` users)
     - Ensure that `users` (and all others) can only access their own resources via the `:userId` URL parameter.

3. **Add Roles or Permissions**
   - Implement role-based access control by adding a `role` field and role-checking middleware.
     - **`superadmin`**: Full control across all clients
     - **`user` (or any resource server defined value, such as `admin` or `editor`)**: Role for resource servers/client usage (user is the fallback if `undefined`).

### Future Enhancements

- **Track User Agent and IP Address on Sessions**

  - Enhance session tracking to store:
    - User agent
    - IP address

- **Enhanced Refresh Token Security**

  - Add IP/device validation for refresh token usage:
    - Validate tokens against the stored user agent and IP address (or a device hash).
    - Allow IP changes within a safe threshold (e.g., same subnet).

### Third-party Features

- **Add `clientadmin` role for per client management** 
  - `clientadmin`-only endpoints (e.g., managing a client and users for a client) via the `:clientId` URL parameter.

- **Implement invitation flow**
  - Invite a user per client:
    1.  Create an `invitation` entity with a code, email, and role
    2.  Return code and email to the resource server
    3.  Resource server sends an email to the address returned with the code
    4.  The user is redirected to the site with the form on it to confirm or change the email address, add a password, and submit the code
    5.  A user is created if all the data is valid and the invitation is deleted.  If the email address submitted matches the one from the invitation, mark the email address as verified.

- **Support for Authorization Token Request Flow**
  - Implement the standard OAuth2 authorization code flow for additional client use cases.
    - Focus on a child function React component implementation that allows complete stylistic control over the inputs.
    - Make sure to keep front-end and back-end (SDK fetch client) implementation simple (probably through dog-fooding).
