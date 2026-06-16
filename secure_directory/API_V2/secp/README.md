
# SECP Search Dashboard

Production-style SECP API Dashboard.

## Features

- Searchable Data Table
- Pagination
- Bulk CNIC Upload
- CSV Export
- Excel Export
- Secure Backend Proxy
- Token Isolation
- Rate Limiting
- Auto Token Cache Structure

---

## Installation

```bash
npm install
```

---

## Setup

Create `.env`

```env
PORT=3020

# Option 1: manual token mode
SECP_TOKEN=YOUR_TOKEN

# Option 2: auto-refresh mode (recommended)
# SECP_AUTH_URL=https://leap1b-keycloak.secp.gov.pk/realms/LEAPKeyCloakRealm-realm/protocol/openid-connect/token
# SECP_CLIENT_ID=secpleapapp
# SECP_CLIENT_SECRET=
# SECP_SCOPE=
# SECP_USERNAME=YOUR_USER_ID
# SECP_PASSWORD=YOUR_PASSWORD
```

---

## Run

```bash
npm start
```

---

## Open

```text
http://localhost:3020
```

---

## Bulk Upload

Upload:
- TXT
- CSV

One CNIC per line.

---

## Security Notes

Never expose bearer tokens in frontend code.

Always:
- use backend proxy
- use HTTPS
- rotate tokens
- enable logging
- enable token auto-refresh via `.env` credentials in production

---

## Recommended Next Upgrades

- React Frontend
- Redis Cache
- JWT Refresh Endpoint
- Docker Deployment
- VPS Deployment
- Admin Login
- Swagger Docs
- Audit Logs
