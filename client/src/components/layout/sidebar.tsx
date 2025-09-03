import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  FileText, 
  GitBranch, 
  FolderOpen, 
  Clock, 
  Users, 
  Shield, 
  Settings,
  CheckSquare2
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/forms", label: "Form Management", icon: FileText },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/approvals", label: "Pending Approvals", icon: Clock },
];

const adminItems = [
  { href: "/users", label: "User Management", icon: Users },
  { href: "/roles", label: "Roles & Permissions", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard" && (location === "/" || location === "/dashboard")) {
      return true;
    }
    return location.startsWith(href) && href !== "/dashboard";
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col shadow-sm" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckSquare2 className="text-primary-foreground w-4 h-4" />
          </div>
          <span className="text-lg font-semibold text-foreground">ApprovalFlow</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={cn(
                  "sidebar-item flex items-center space-x-3 px-3 py-2 rounded-md transition-all cursor-pointer",
                  isActive(item.href) && "active"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        <div className="pt-4 border-t border-border mt-4">
          {adminItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "sidebar-item flex items-center space-x-3 px-3 py-2 rounded-md transition-all cursor-pointer",
                    isActive(item.href) && "active"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <Users className="text-muted-foreground w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Administrator</p>
          </div>
          <button 
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-logout"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
