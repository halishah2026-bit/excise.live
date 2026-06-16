
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const USER_LOOKUP_URL = 'https://leap-api-gateway.secp.gov.pk/user-management-service/get-all-users-by-userid';
const TOKEN_EXPIRY_SKEW_MS = 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 30000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')));

let tokenCache = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null
};
let refreshInFlight = null;

function normalizeBearerToken(token) {
    if (!token || typeof token !== 'string') return null;
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    return cleanToken || null;
}

function parseJwtExpiry(token) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const normalizedPayload = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
        const payload = JSON.parse(
            Buffer.from(normalizedPayload, 'base64').toString('utf8')
        );
        if (!payload.exp) return null;
        return payload.exp * 1000;
    } catch {
        return null;
    }
}

function hasAutoAuthConfig() {
    return Boolean(
        process.env.SECP_AUTH_URL &&
        process.env.SECP_USERNAME &&
        process.env.SECP_PASSWORD
    );
}

function isTokenExpired(expiresAt) {
    if (!expiresAt) return false;
    return Date.now() >= (expiresAt - TOKEN_EXPIRY_SKEW_MS);
}

function readTokenFromAuthResponse(data) {
    const accessToken = normalizeBearerToken(data?.access_token);
    if (!accessToken) {
        throw new Error('SECP auth endpoint did not return access_token.');
    }

    const expiresIn = Number(data?.expires_in);
    const expiryFromSeconds = Number.isFinite(expiresIn)
        ? Date.now() + (expiresIn * 1000)
        : null;

    tokenCache.accessToken = accessToken;
    tokenCache.refreshToken = normalizeBearerToken(data?.refresh_token);
    tokenCache.expiresAt = expiryFromSeconds || parseJwtExpiry(accessToken);

    return accessToken;
}

async function fetchTokenWithGrant(grantType) {
    const form = new URLSearchParams();
    form.append('grant_type', grantType);
    form.append('client_id', process.env.SECP_CLIENT_ID || 'secpleapapp');

    if (process.env.SECP_CLIENT_SECRET) {
        form.append('client_secret', process.env.SECP_CLIENT_SECRET);
    }

    if (grantType === 'refresh_token') {
        if (!tokenCache.refreshToken) {
            throw new Error('No refresh token available in cache.');
        }
        form.append('refresh_token', tokenCache.refreshToken);
    } else {
        form.append('username', process.env.SECP_USERNAME);
        form.append('password', process.env.SECP_PASSWORD);
    }

    if (process.env.SECP_SCOPE) {
        form.append('scope', process.env.SECP_SCOPE);
    }

    const response = await axios.post(
        process.env.SECP_AUTH_URL,
        form.toString(),
        {
            timeout: UPSTREAM_TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
            }
        }
    );

    return readTokenFromAuthResponse(response.data);
}

async function refreshAccessToken() {
    if (refreshInFlight) {
        return refreshInFlight;
    }

    refreshInFlight = (async () => {
        if (!hasAutoAuthConfig()) {
            throw new Error(
                'Auto-refresh not configured. Set SECP_AUTH_URL, SECP_USERNAME, and SECP_PASSWORD.'
            );
        }

        if (tokenCache.refreshToken) {
            try {
                return await fetchTokenWithGrant('refresh_token');
            } catch (error) {
                console.warn('Refresh token grant failed, retrying password grant.');
            }
        }

        return fetchTokenWithGrant('password');
    })();

    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

async function getAccessToken({ forceRefresh = false } = {}) {

    if (!forceRefresh && tokenCache.accessToken && !isTokenExpired(tokenCache.expiresAt)) {
        return tokenCache.accessToken;
    }

    if (hasAutoAuthConfig()) {
        return refreshAccessToken();
    }

    if (tokenCache.accessToken && isTokenExpired(tokenCache.expiresAt)) {
        throw new Error(
            'Configured SECP token is expired. Update SECP_TOKEN or enable auto-refresh with SECP_AUTH_URL/SECP_USERNAME/SECP_PASSWORD.'
        );
    }

    throw new Error(
        'No SECP token available. Set SECP_TOKEN or configure SECP_AUTH_URL/SECP_USERNAME/SECP_PASSWORD.'
    );
}

async function fetchUsersFromSecp(userIds, token) {
    return axios.post(
        USER_LOOKUP_URL,
        userIds,
        {
            timeout: UPSTREAM_TIMEOUT_MS,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        }
    );
}

app.post('/api/search-users', async (req, res) => {

    try {

        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'userIds array required'
            });
        }

        const token = await getAccessToken();
        let response;

        try {
            response = await fetchUsersFromSecp(userIds, token);
        } catch (error) {
            const unauthorized = error.response?.status === 401;
            if (!unauthorized || !hasAutoAuthConfig()) {
                throw error;
            }

            const refreshedToken = await getAccessToken({ forceRefresh: true });
            response = await fetchUsersFromSecp(userIds, refreshedToken);
        }

        res.json({
            success: true,
            count: response.data?.length || 0,
            data: response.data
        });

    } catch (error) {

        console.error(error.response?.data || error.message);

        const isTimeout = error.code === 'ECONNABORTED';

        res.status(500).json({
            success: false,
            error: isTimeout
                ? 'Upstream SECP API timeout (30s). Try again.'
                : error.response?.data || error.message
        });
    }
});

const initialToken = normalizeBearerToken(process.env.SECP_TOKEN);
if (initialToken) {
    tokenCache.accessToken = initialToken;
    tokenCache.expiresAt = parseJwtExpiry(initialToken);
}

app.post('/api/export-excel', async (req, res) => {

    try {

        const { rows } = req.body;

        if (!rows || !rows.length) {
            return res.status(400).json({
                success: false,
                message: 'No rows provided'
            });
        }

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(rows);

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx'
        });

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=secp-users.xlsx'
        );

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.send(buffer);

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
