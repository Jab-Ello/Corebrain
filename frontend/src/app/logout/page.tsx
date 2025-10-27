"use client";

import { useEffect } from "react";
import { clearSession } from "@/lib/session";

export default function LogoutPage() {
  useEffect(() => {
    clearSession();
    window.location.replace("/login");
  }, []);
  return <div className="p-6 text-sm text-gray-500">Déconnexion…</div>;
}
