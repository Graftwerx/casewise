"use client";

import { useEffect } from "react";

export default function KindeLogin() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "/";

    // Kinde login URL + returnTo
    window.location.href = `/kinde-auth/login?returnTo=${encodeURIComponent(
      returnTo
    )}`;
  }, []);

  return (
    <div className="w-full mt-24 flex justify-center">
      <div className="flex flex-col items-center gap-2">
        <h3 className="font-semibold text-xl">Redirecting you to login...</h3>
        <p>Please wait just a moment.</p>
      </div>
    </div>
  );
}
