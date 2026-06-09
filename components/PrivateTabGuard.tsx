"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const TAB_SESSION_KEY = "ethan-private-tab-session";

export default function PrivateTabGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem(TAB_SESSION_KEY) === "active") return;

    sessionStorage.removeItem(TAB_SESSION_KEY);
    fetch("/api/private/logout", { method: "POST" })
      .catch(() => null)
      .finally(() => {
        router.replace(`/private?next=${encodeURIComponent(pathname)}`);
      });
  }, [pathname, router]);

  return null;
}
