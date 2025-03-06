"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import LogDashboard from "./LogDashboard";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login"); // Redirect if not logged in
      } else {
        setUser(data.user);
      }
    };

    fetchUser();
  }, [router]);

  if (!user) return <p>Loading...</p>;

  return <LogDashboard />;
}
