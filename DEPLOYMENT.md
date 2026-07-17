# Secure deployment

This repository is public. Production credentials must never be stored in it.

## Production shape

The game is a static Vite build. Production receives only the generated contents of `dist/`:

- no `.git` history
- no source `.env` files
- no SSH keys
- no CI configuration or repository checkout
- no source maps
- no runtime application secrets

Nginx serves a versioned release directory through a `current` symlink. Switching the symlink makes deployments atomic and keeps rollback simple.

## Local release

1. Export deployment details only in the current shell or a password manager-backed environment:

   ```bash
   export DEPLOY_HOST='your-server'
   export DEPLOY_USER='your-deploy-user'
   export DEPLOY_KEY="$HOME/.ssh/path/to/deploy-key"
   ```

2. Verify and build:

   ```bash
   npm ci
   npm test
   npm run build
   npm run check:bundle
   npm run check:secrets
   ```

3. Audit `dist/` before upload. It must not contain `.env`, keys, certificates, or source maps.

   `npm run check:secrets` enforces this artifact check and scans tracked files for common credential signatures. CI runs the same gate.

4. Upload only `dist/` to a new server-side release directory, validate Nginx, then atomically update `current`.

Keep deployment commands and host inventory outside the repository when they contain infrastructure details.

## GitHub Actions later

Store sensitive values under repository **Settings → Secrets and variables → Actions**:

- `DEPLOY_SSH_KEY`: dedicated deployment private key
- `DEPLOY_KNOWN_HOSTS`: pinned SSH host key
- `DEPLOY_HOST`: server hostname or address
- `DEPLOY_USER`: restricted deployment user

Workflow YAML may reference `${{ secrets.NAME }}` but must never contain secret values. Use a dedicated key with minimum server permissions; do not reuse a personal administrator key. Protect the production environment with required reviewers. Never print secrets, run `set -x`, upload `.env` as an artifact, or disable SSH host verification.

## Browser environment variables

Any Vite variable prefixed `VITE_` is compiled into browser JavaScript and is public. Never place a password, private API key, database credential, or signing secret in a `VITE_` variable. If a future feature needs a secret, keep it in a server-side API and let the browser call that API.

## Rotation

If a secret is ever committed, deleting it in a later commit is insufficient because Git history retains it. Revoke/rotate it immediately, remove it from history, then audit forks, CI logs, releases, and artifacts.
