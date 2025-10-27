"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      // pas connecté → on renvoie vers /login
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}
