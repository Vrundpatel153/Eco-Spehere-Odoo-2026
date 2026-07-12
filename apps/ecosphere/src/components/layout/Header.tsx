import { Bell, Search, UserCircle, Menu } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuthContext } from "@/store/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export function Header() {
  const [location, setLocation] = useLocation();
  const { data: notifications } = useStore<any>("esg_notifications");
  const { user, logout } = useAuthContext();

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const roleColor =
    user?.role === "admin" ? "bg-primary text-primary-foreground" :
    user?.role === "manager" ? "bg-[#3b82f6] text-white" : "bg-[#f59e0b] text-background";

  const breadcrumb = () => {
    if (location === "/") return "Dashboard";
    if (location === "/admin/users") return "User Management";
    if (location === "/layout-overview") return "Platform Overview";
    if (location === "/notifications") return "Notifications";
    const parts = location.split("/").filter(Boolean);
    return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.dispatchEvent(new Event("esg_sidebar_toggle"))}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold capitalize text-foreground">{breadcrumb()}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search EcoSphere…" className="pl-9 bg-card border-card-border h-9" />
        </div>

        {/* Notifications Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-destructive rounded-full text-[9px] text-white flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-card-border">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                [...notifications]
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((n: any) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3 gap-1 cursor-pointer focus:bg-secondary/50">
                      <div className="flex items-center gap-2 w-full">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${n.read ? "bg-muted" : "bg-primary"}`} />
                        <span className="font-medium text-xs capitalize">{n.type}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-4 line-clamp-2">{n.message}</p>
                    </DropdownMenuItem>
                  ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-primary text-xs text-center justify-center cursor-pointer" onClick={() => setLocation("/notifications")}>
              View all notifications →
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
              {user ? (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${roleColor}`}>
                  {getInitials(user.name)}
                </div>
              ) : (
                <UserCircle className="w-6 h-6 text-muted-foreground" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-card-border">
            {user && (
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">{user.xp || 0} XP</Badge>
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <Badge variant="outline" className="text-[10px] capitalize w-fit mt-1">{user.role}</Badge>
                </div>
              </DropdownMenuLabel>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">My Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">Preferences</DropdownMenuItem>
            {user?.role === "admin" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/admin/users")} className="cursor-pointer text-primary">
                  User Management
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
