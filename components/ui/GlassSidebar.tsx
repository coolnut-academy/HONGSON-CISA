"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  LucideIcon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface GlassSidebarProps {
  navItems: NavItem[];
  title: string;
  subtitle?: string;
  accentColor?: "blue" | "purple" | "emerald";
  user?: {
    name?: string;
    email?: string;
    photoURL?: string;
    role?: string;
  };
  onLogout?: () => void;
  logo?: React.ReactNode;
}

const accentColors = {
  blue: {
    active: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    activeIcon: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-600 to-indigo-600",
    dot: "bg-blue-500",
  },
  purple: {
    active: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    activeIcon: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-600 to-pink-600",
    dot: "bg-purple-500",
  },
  emerald: {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    activeIcon: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-600 to-cyan-600",
    dot: "bg-emerald-500",
  },
};

export function GlassSidebar({
  navItems,
  title,
  subtitle,
  accentColor = "blue",
  user,
  onLogout,
  logo,
}: GlassSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const colors = accentColors[accentColor];

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-[var(--glass-border-subtle)]">
        <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "w-0 opacity-0")}>
          {logo || (
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex-shrink-0", colors.gradient)} />
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-[var(--text-primary)] truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-[var(--text-tertiary)] truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors hidden md:flex"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-glass">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? colors.active
                  : "text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                size={22}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive ? colors.activeIcon : "group-hover:text-[var(--text-primary)]"
                )}
              />
              {!collapsed && (
                <span className="font-medium truncate">{item.name}</span>
              )}
              {!collapsed && isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className={cn("absolute right-3 w-1.5 h-1.5 rounded-full", colors.dot)}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="p-3 border-t border-[var(--glass-border-subtle)]">
          {!collapsed ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-bg)]">
              <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] flex-shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)] font-bold">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user.name || user.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">{user.role}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:text-[var(--accent-danger)] transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-3 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--accent-danger)] transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-3 rounded-xl glass md:hidden"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-72 h-full glass-solid flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)]"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col glass-solid h-screen sticky top-0 z-40"
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}

export default GlassSidebar;
