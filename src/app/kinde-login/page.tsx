"use client";

import { useEffect } from "react";

export default function KindeLogin() {
  useEffect(() => {
    const returnTo =
      new URLSearchParams(window.location.search).get("returnTo") || "/";

    // 🚀 Hard redirect (avoids CORS, avoids prefetch)
    window.location.assign(
      `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    );
  }, []);

  return (
    <div className="w-full mt-24 flex justify-center">
      <div className="flex flex-col items-center gap-2">
        <h3 className="font-semibold text-xl">Redirecting to login...</h3>
      </div>
    </div>
  );
}
