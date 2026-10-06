"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Receipt, Users, Ticket, Wrench } from "lucide-react";
import { Card } from "@/src/components/ui/card";

interface FinanceNavTabsProps {
  unsettledDriverCount?: number;
}

export function FinanceNavTabs({ unsettledDriverCount = 0 }: FinanceNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Overview & Laba Rugi",
      href: "/admin/finance",
      icon: TrendingUp,
      isActive: pathname === "/admin/finance",
    },
    {
      label: `Tagihan & Setoran Driver ${
        unsettledDriverCount > 0 ? `(${unsettledDriverCount} Belum Setor)` : ""
      }`,
      href: "/admin/finance/driver-collect",
      icon: Receipt,
      isActive: pathname === "/admin/finance/driver-collect",
    },
    {
      label: "Payroll Driver (2-Mingguan)",
      href: "/admin/finance/driver-payroll",
      icon: Users,
      isActive: pathname === "/admin/finance/driver-payroll",
    },
    {
      label: "Settlement Vendor",
      href: "/admin/finance/vendor-settlement",
      icon: Ticket,
      isActive: pathname === "/admin/finance/vendor-settlement",
    },
    {
      label: "Operasional & Log Armada",
      href: "/admin/finance/operational",
      icon: Wrench,
      isActive: pathname === "/admin/finance/operational",
    },
  ];

  return (
    <Card className="p-2 border border-slate-100 shadow-stitch-card bg-white print:hidden">
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                tab.isActive
                  ? "bg-[#00677d] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
