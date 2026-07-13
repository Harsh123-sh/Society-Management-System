import { useEffect } from "react";

function readOAuthPayload() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const params = hash.toString() ? hash : query;

  return {
    accessToken: params.get("access_token") || "",
    error: params.get("error") || "",
    errorDescription: params.get("error_description") || "",
    state: params.get("state") || "",
  };
}

export default function OAuthPopupCallbackPage() {
  useEffect(() => {
    const payload = readOAuthPayload();
    const message = {
      type: "nexora-frontend-oauth-token",
      ...payload,
      success: Boolean(payload.accessToken && !payload.error),
    };

    if (window.opener) {
      window.opener.postMessage(message, window.location.origin);
      window.close();
    }
  }, []);

  return null;
}
