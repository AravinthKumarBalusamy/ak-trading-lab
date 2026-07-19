import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ListTodo,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Watchlist", path: "/watchlist", icon: ListTodo },
    { name: "Trading Journal", path: "/journal", icon: BookOpen },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={`h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 h-16">
        {!collapsed && (
          <div className="flex items-center space-x-2 font-bold text-xl text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-6 w-6" />
            <span>TradingLab</span>
          </div>
        )}
        {collapsed && (
          <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hidden md:block"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            activeProps={{
              className:
                "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold",
            }}
            inactiveProps={{
              className:
                "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
            }}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors group"
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
