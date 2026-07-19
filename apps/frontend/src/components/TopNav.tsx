import { Sun, Moon, LogOut, User as UserIcon } from "lucide-react";
import { useThemeStore } from "../store/themeStore.js";
import { useAuthStore } from "../store/authStore.js";
import { useRouter } from "@tanstack/react-router";

export const TopNav = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const currentPath = router.state.location.pathname;
  const getPageTitle = (path: string) => {
    if (path === "/") return "Dashboard";
    if (path.startsWith("/watchlist")) return "Watchlist";
    if (path.startsWith("/journal")) return "Trading Journal";
    if (path.startsWith("/settings")) return "Settings";
    return "Page";
  };

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/auth/login" }).catch((err) => {
      console.error("Failed to navigate on logout:", err);
    });
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center space-x-2">
        <span className="text-gray-400">/</span>
        <h1 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
          {getPageTitle(currentPath)}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-800 pl-4">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.name || "Trader Joe"}
            </span>
            <span className="text-xs text-gray-400">
              {user?.email || "trader.joe@trading.lab"}
            </span>
          </div>

          <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            <UserIcon className="h-5 w-5" />
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
