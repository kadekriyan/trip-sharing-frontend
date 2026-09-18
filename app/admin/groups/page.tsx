"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GroupsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/areas/groups");
  }, [router]);

  return (
    <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
      <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
      <p className="font-semibold text-slate-600">Mengalihkan ke Grub Armada...</p>
    </div>
  );
}
