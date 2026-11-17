"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePlanProgress } from "@/lib/use-plan-progress";
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings, 
  ChevronRight,
  Moon,
  X,
  CalendarDays
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/quran", label: "القرآن الكريم", icon: BookOpen },
  { href: "/plan", label: "الخطة التفصيلية", icon: CalendarDays },
  { href: "/stats", label: "الإحصائيات", icon: BarChart3 },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { allDays, khatmaDate, record } = usePlanProgress();

  // استنتاج مدة الخطة من تاريخ البداية وتاريخ الختمة (بالأشهر)
  const planMonths = (() => {
    try {
      const start = new Date(record.startDate);
      const end = new Date(khatmaDate);
      const diffMonths =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return diffMonths > 0 ? diffMonths : Math.round(allDays.length / 30);
    } catch {
      return Math.round(allDays.length / 30);
    }
  })();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-sidebar border-l border-sidebar-border",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Moon className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-sidebar-foreground font-serif">
                    حافظ
                  </h1>
                  <p className="text-xs text-sidebar-foreground/60">
                    برنامج حفظ القرآن
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-sidebar-foreground"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-sidebar-accent",
                    isActive 
                      ? "bg-sidebar-primary/10 text-sidebar-primary border-r-2 border-sidebar-primary" 
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-sidebar-primary" : ""
                  )} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 mr-auto text-sidebar-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="p-4 rounded-lg bg-gold/10 border border-gold/20">
              <p className="text-sm text-sidebar-foreground font-medium">
                الهدف: {planMonths} أشهر
              </p>
              <p className="text-xs text-sidebar-foreground/60 mt-1">
                {khatmaDate ? `الختمة: ${khatmaDate}` : "ابدأ رحلتك في حفظ القرآن الكريم"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
