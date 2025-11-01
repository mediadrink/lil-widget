// components/LilWidgetTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LilWidgetTabs({ widgetId }: { widgetId?: string | null }) {
  const pathname = usePathname();
  const settingsHref = widgetId
    ? `/dashboard/widgets/${widgetId}/admin-console`
    : "/dashboard"; // safe fallback while loading

  const tabs = [
    { name: "Dashboard", href: "/dashboard/conversations" },
    { name: "Settings", href: settingsHref },
  ];

  return (
    <nav className="flex gap-6 border-b mb-6">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`pb-2 ${active ? "border-b-2 border-black font-semibold" : "text-gray-500 hover:text-black"}`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
