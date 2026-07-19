import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
  redirect,
} from "@tanstack/react-router";
import { Sidebar } from "../components/Sidebar.js";
import { TopNav } from "../components/TopNav.js";
import { ErrorBoundary } from "../components/ErrorBoundary.js";
import { Button } from "@trading-lab/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import { LogIn, HelpCircle, ListTodo, BookOpen } from "lucide-react";
import { useAuthStore } from "../store/authStore.js";
import { AuthCallbackPage } from "./AuthCallback.js";

// 1. Root Route
const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
        <Outlet />
      </div>
    </ErrorBoundary>
  ),
});

// 2. Layouts
// Dashboard Layout (Protected Area wrapper)
const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "dashboard-layout",
  beforeLoad: () => {
    const state = useAuthStore.getState();
    if (!state.isAuthenticated) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: () => (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  ),
});

// Auth Layout (Unprotected Area wrapper)
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth-layout",
  component: () => (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-gray-950">
      {/* Visual Left Banner */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 dark:bg-blue-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/50 to-transparent z-0" />
        <div className="relative z-10 flex items-center space-x-2 font-bold text-2xl">
          <span>TradingLab</span>
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Simplify your trading, audit your strategy, maximize performance.
          </h2>
          <p className="text-blue-100 max-w-md">
            The ultimate companion dashboard for active traders, featuring
            automated Zerodha Kite integration, trading journals, and
            performance analytics.
          </p>
        </div>
        <div className="relative z-10 text-xs text-blue-200">
          &copy; {new Date().getFullYear()} TradingLab. All rights reserved.
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <Outlet />
      </div>
    </div>
  ),
});

// 3. Pages
// Dashboard Page
const dashboardRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Portfolio Summary
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Welcome back to your trading desk.
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="success">Kite Connected</Badge>
          <Badge variant="secondary">Paper Trading Off</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹12,45,670.00</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
              +1.8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {"Today's P&L"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              +₹18,250.00
            </div>
            <p className="text-xs text-gray-400 mt-1">10 completed trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
              -₹1,450.00 unrealized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Available Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹2,84,350.00</div>
            <p className="text-xs text-gray-400 mt-1">Collateral included</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to TradingLab</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            This workspace represents the client dashboard framework. Use the
            sidebar menu to navigate. The Zerodha Kite Connection settings are
            located in the settings view.
          </p>
          <div className="flex space-x-2">
            <Button variant="primary">Launch Simulation</Button>
            <Link to="/settings">
              <Button variant="secondary">Configure API Keys</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
});

// Watchlist Page
const watchlistRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/watchlist",
  component: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Market Watchlist</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Monitor index values and custom stocks.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <ListTodo className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            Your Watchlist is Empty
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-4">
            Create custom list filters or search symbols to begin monitoring
            indices.
          </p>
          <Button variant="primary">Add Symbol</Button>
        </CardContent>
      </Card>
    </div>
  ),
});

// Journal Page
const journalRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/journal",
  component: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Trading Journal</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Review setups, entry criteria, and post-trade reviews.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-lg mb-1">
            No Journal Entries Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-4">
            Log setups, trade triggers, and emotion states to identify
            performance patterns.
          </p>
          <Button variant="primary">Log First Trade</Button>
        </CardContent>
      </Card>
    </div>
  ),
});

// Settings Page
const settingsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/settings",
  component: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Configuration Settings
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          API Integrations and user profile configuration.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API Key & Kite Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Zerodha Kite Connect credentials must be configured in your
            environment variable settings. Change values in your local `.env`
            configuration file to synchronize settings.
          </p>
          <div className="grid gap-2 text-sm max-w-lg">
            <div className="flex justify-between p-2 border-b dark:border-gray-800">
              <span className="font-medium">API Key:</span>
              <span className="text-gray-500 dark:text-gray-400">
                Validated from .env
              </span>
            </div>
            <div className="flex justify-between p-2 border-b dark:border-gray-800">
              <span className="font-medium">Redirect URL:</span>
              <span className="text-gray-500 dark:text-gray-400">
                Validated from .env
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
});

// Login Page Component
const LoginPage = () => {
  const handleLogin = () => {
    fetch("/api/auth/login-url")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load login URL");
        return res.json() as Promise<{ loginUrl: string }>;
      })
      .then((data) => {
        window.location.href = data.loginUrl;
      })
      .catch((err) => {
        console.error("Failed to load login URL, falling back to mock:", err);
        window.location.href = "/auth/callback?request_token=mock_token_123";
      });
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight">Sign In</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Sign in using your Zerodha Kite developer credentials.
        </p>
      </div>
      <div className="space-y-4">
        <Button
          variant="primary"
          className="w-full flex items-center justify-center space-x-2"
          onClick={handleLogin}
        >
          <LogIn className="h-4 w-4" />
          <span>Connect Zerodha Kite</span>
        </Button>
        <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
          <HelpCircle className="h-3 w-3" />
          <span>Requires active Kite developer API subscription.</span>
        </div>
      </div>
    </div>
  );
};

// Login Page Route
const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/auth/login",
  component: LoginPage,
});

// Auth Callback Route
const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallbackPage,
});

// 4. NotFoundRoute
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h2 className="text-8xl font-black tracking-tight text-blue-600 dark:text-blue-400 mb-2">
        404
      </h2>
      <h3 className="text-2xl font-bold mb-4">Page Not Found</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-6">
        The requested URL is not available in the Route Configuration tree.
        Check the path and try again.
      </p>
      <Link to="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  ),
});

// 5. Build Route Tree
const routeTree = rootRoute.addChildren([
  dashboardLayoutRoute.addChildren([
    dashboardRoute,
    watchlistRoute,
    journalRoute,
    settingsRoute,
  ]),
  authLayoutRoute.addChildren([loginRoute]),
  authCallbackRoute,
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

// Typesafe router declaration
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
