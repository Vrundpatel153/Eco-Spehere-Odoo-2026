import { Link, useLocation } from "wouter";
import {
  Home, Leaf, Users, ShieldCheck, Trophy, BarChart2,
  Settings, ChevronLeft, ChevronRight, MapPin, UserCog, Bell,
} from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "@/store/AuthContext";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthContext();
  const { data: notifications } = useStore<any>("esg_notifications");
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Leaf, label: "Environmental", path: "/environmental" },
    { icon: Users, label: "Social", path: "/social" },
    { icon: ShieldCheck, label: "Governance", path: "/governance" },
    { icon: Trophy, label: "Gamification", path: "/gamification" },
    { icon: BarChart2, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: MapPin, label: "Platform Overview", path: "/layout-overview" },
  ];

  const adminItems = [
    { icon: UserCog, label: "User Management", path: "/admin/users" },
  ];

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const roleColor =
    user?.role === "admin" ? "bg-primary text-primary-foreground" :
    user?.role === "manager" ? "bg-[#3b82f6] text-white" : "bg-[#f59e0b] text-background";

  const isActive = (path: string) => path === "/" ? location === "/" : location.startsWith(path);

  return (
    <div className={cn(
      "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col z-20 sticky top-0",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">ES</div>
            <span className="font-bold text-sidebar-foreground truncate tracking-wide">EcoSphere</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mx-auto">ES</div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 flex flex-col gap-0.5 overflow-y-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const showBell = item.path === "/notifications" && unreadCount > 0;
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors relative",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}>
                <item.icon className={cn("w-5 h-5 shrink-0", active && "text-primary")} />
                {!collapsed && <span className="text-sm">{item.label}</span>}
                {showBell && (
                  <span className={cn(
                    "rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center",
                    collapsed ? "absolute top-1 right-1 w-4 h-4" : "ml-auto w-5 h-5"
                  )}>{unreadCount}</span>
                )}
              </div>
            </Link>
          );
        })}

        {/* Notifications (quick access) */}
        <Link href="/notifications">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors relative",
            location === "/notifications" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <Bell className={cn("w-5 h-5 shrink-0", location === "/notifications" && "text-primary")} />
            {!collapsed && <span className="text-sm">Notifications</span>}
            {unreadCount > 0 && (
              <span className={cn(
                "rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center",
                collapsed ? "absolute top-1 right-1 w-4 h-4" : "ml-auto w-5 h-5"
              )}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </div>
        </Link>

        {/* Admin section */}
        {user?.role === "admin" && (
          <>
            {!collapsed && (
              <div className="mt-3 mb-1 px-3">
                <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">Admin</p>
              </div>
            )}
            {collapsed && <div className="border-t border-sidebar-border my-2 mx-2" />}
            {adminItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
                    active ? "bg-destructive/20 text-destructive font-medium" : "text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"
                  )}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* User card */}
      <div className="p-3 border-t border-sidebar-border flex flex-col gap-2">
        {user && (
          <Link href="/profile">
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors border border-transparent hover:border-sidebar-border group",
              collapsed ? "justify-center" : ""
            )}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", roleColor)} title={collapsed ? user.name : undefined}>
                {getInitials(user.name)}
              </div>
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-sidebar-foreground truncate group-hover:text-primary transition-colors">{user.name}</span>
                  <span className="text-xs text-sidebar-foreground/50 capitalize truncate">{user.role}</span>
                </div>
              )}
            </div>
          </Link>
        )}
        <Button
          variant="ghost" size="sm"
          className="w-full flex justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground mt-0.5"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
