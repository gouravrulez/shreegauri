import { createHash, timingSafeEqual } from "crypto";

type PhonePeEnv = "SANDBOX" | "PRODUCTION";

type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
  key: string;
};

let tokenCache: TokenCache | null = null;

function config() {
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1";
  const env = (process.env.PHONEPE_ENV || "SANDBOX").toUpperCase() as PhonePeEnv;

  if (!clientId || !clientSecret) {
    throw new Error("PhonePe credentials are not configured.");
  }
  if (env !== "SANDBOX" && env !== "PRODUCTION") {
    throw new Error("PHONEPE_ENV must be SANDBOX or PRODUCTION.");
  }

  const authUrl =
    env === "PRODUCTION"
      ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
  const pgBase =
    env === "PRODUCTION"
      ? "https://api.phonepe.com/apis/pg"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox";

  return { clientId, clientSecret, clientVersion, env, authUrl, pgBase };
}

async function getAccessToken() {
  const c = config();
  const cacheKey = `${c.env}:${c.clientId}:${c.clientVersion}`;
  if (
    tokenCache &&
    tokenCache.key === cacheKey &&
    tokenCache.expiresAtMs > Date.now() + 60_000
  ) {
    return tokenCache.accessToken;
  }

  const form = new URLSearchParams({
    client_id: c.clientId,
    client_version: c.clientVersion,
    client_secret: c.clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(c.authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.message || "Unable to authenticate with PhonePe.");
  }

  const expiresAtRaw = Number(data.expires_at || 0);
  const expiresInRaw = Number(data.expires_in || 0);
  const expiresAtMs = expiresAtRaw
    ? expiresAtRaw > 10_000_000_000
      ? expiresAtRaw
      : expiresAtRaw * 1000
    : Date.now() + Math.max(300, expiresInRaw || 900) * 1000;

  tokenCache = {
    accessToken: String(data.access_token),
    expiresAtMs,
    key: cacheKey,
  };
  return tokenCache.accessToken;
}

async function phonePeFetch(path: string, init: RequestInit) {
  const c = config();
  const accessToken = await getAccessToken();
  const response = await fetch(`${c.pgBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `O-Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.message || data?.errorCode || `PhonePe request failed (${response.status}).`,
    );
  }
  return data;
}

export async function createPhonePePayment(args: {
  merchantOrderId: string;
  amountPaise: number;
  redirectUrl: string;
}) {
  return phonePeFetch("/checkout/v2/pay", {
    method: "POST",
    body: JSON.stringify({
      merchantOrderId: args.merchantOrderId,
      amount: Math.round(args.amountPaise),
      expireAfter: 900,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Complete your Shree Gauri payment",
        merchantUrls: { redirectUrl: args.redirectUrl },
      },
    }),
  });
}

export async function getPhonePeOrderStatus(merchantOrderId: string) {
  return phonePeFetch(
    `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=true&errorContext=true`,
    { method: "GET" },
  );
}

export function validatePhonePeCallback(authorization: string | null) {
  const username = process.env.PHONEPE_CALLBACK_USERNAME;
  const password = process.env.PHONEPE_CALLBACK_PASSWORD;
  if (!username || !password) {
    throw new Error("PhonePe callback credentials are not configured.");
  }
  const expected = createHash("sha256")
    .update(`${username}:${password}`)
    .digest("hex");
  const actual = String(authorization || "");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
