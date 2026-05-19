/** Production backend on Vercel (always used when app is built for deploy). */
export const BACKEND_PRODUCTION = "https://italian-chatbot-backend.vercel.app";

function resolveBackendUrl() {
  if (import.meta.env.PROD) {
    return BACKEND_PRODUCTION;
  }

  const fromEnv = import.meta.env.VITE_SOCKET_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  return BACKEND_PRODUCTION;
}

export const BACKEND_URL = resolveBackendUrl();
