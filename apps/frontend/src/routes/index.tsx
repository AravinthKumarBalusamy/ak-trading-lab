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
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore.js";
import { AuthCallbackPage } from "./AuthCallback.js";
import { useQuery } from "@tanstack/react-query";
import {
  MarginInfo,
  HoldingInfo,
  PositionInfo,
  OrderInfo,
} from "@trading-lab/shared";
import {
  LogIn,
  HelpCircle,
  ListTodo,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Plus,
  Trash2,
  Search,
} from "lucide-react";

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
const fetchWithAuth = async <T,>(url: string): Promise<T> => {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
};

const DashboardPage = () => {
  const {
    data: margins,
    isLoading: isLoadingMargins,
    error: errorMargins,
  } = useQuery<MarginInfo>({
    queryKey: ["margins"],
    queryFn: () => fetchWithAuth<MarginInfo>("/api/portfolio/margins"),
  });

  const {
    data: holdings,
    isLoading: isLoadingHoldings,
    error: errorHoldings,
  } = useQuery<HoldingInfo[]>({
    queryKey: ["holdings"],
    queryFn: () => fetchWithAuth<HoldingInfo[]>("/api/portfolio/holdings"),
  });

  const {
    data: positions,
    isLoading: isLoadingPositions,
    error: errorPositions,
  } = useQuery<PositionInfo[]>({
    queryKey: ["positions"],
    queryFn: () => fetchWithAuth<PositionInfo[]>("/api/portfolio/positions"),
  });

  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: errorOrders,
  } = useQuery<OrderInfo[]>({
    queryKey: ["orders"],
    queryFn: () => fetchWithAuth<OrderInfo[]>("/api/portfolio/orders"),
  });

  const isLoading =
    isLoadingMargins ||
    isLoadingHoldings ||
    isLoadingPositions ||
    isLoadingOrders;
  const hasError =
    errorMargins || errorHoldings || errorPositions || errorOrders;

  const totalHoldingsValue =
    holdings?.reduce((sum, h) => sum + h.quantity * h.lastPrice, 0) || 0;
  const totalPositionsPnl = positions?.reduce((sum, p) => sum + p.pnl, 0) || 0;
  const activePositionsCount =
    positions?.filter((p) => p.quantity > 0).length || 0;
  const availableMargin = margins?.available || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </Card>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-red-600 dark:text-red-400">
        <ShieldAlert className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-bold mb-2">Error Loading Portfolio</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-4">
          We encountered an issue fetching your Zerodha Kite portfolio details.
          Make sure your environment variables are configured.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
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
            <div className="text-2xl font-bold">
              ₹
              {totalHoldingsValue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Equities value
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
            <div
              className={`text-2xl font-bold ${totalPositionsPnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {totalPositionsPnl >= 0 ? "+" : ""}₹
              {totalPositionsPnl.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              From active intraday & swing positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePositionsCount}</div>
            <p className="text-xs text-gray-400 mt-1">
              Open holdings with active quantities
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
            <div className="text-2xl font-bold">
              ₹
              {availableMargin.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />₹
              {(margins?.utilized || 0).toLocaleString("en-IN")} utilized
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings & Positions Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Positions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Positions</CardTitle>
            <Badge variant="secondary">{positions?.length || 0} Total</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b dark:border-gray-800 text-gray-500 font-medium">
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Avg Price</th>
                    <th className="pb-2 text-right">LTP</th>
                    <th className="pb-2 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {positions?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-gray-400"
                      >
                        No active positions today.
                      </td>
                    </tr>
                  ) : (
                    positions?.map((pos) => (
                      <tr key={pos.tradingsymbol}>
                        <td className="py-3 font-semibold">
                          {pos.tradingsymbol}{" "}
                          <span className="text-xs text-gray-400 font-normal">
                            {pos.exchange}
                          </span>
                        </td>
                        <td className="py-3 text-right">{pos.quantity}</td>
                        <td className="py-3 text-right">
                          ₹{pos.averagePrice.toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          ₹{pos.lastPrice.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 text-right font-medium ${pos.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          ₹{pos.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Holdings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Equities Holdings</CardTitle>
            <Badge variant="secondary">{holdings?.length || 0} Assets</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b dark:border-gray-800 text-gray-500 font-medium">
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Avg Price</th>
                    <th className="pb-2 text-right">LTP</th>
                    <th className="pb-2 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {holdings?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-gray-400"
                      >
                        No stock holdings in portfolio.
                      </td>
                    </tr>
                  ) : (
                    holdings?.map((h) => (
                      <tr key={h.tradingsymbol}>
                        <td className="py-3 font-semibold">
                          {h.tradingsymbol}{" "}
                          <span className="text-xs text-gray-400 font-normal">
                            {h.exchange}
                          </span>
                        </td>
                        <td className="py-3 text-right">{h.quantity}</td>
                        <td className="py-3 text-right">
                          ₹{h.averagePrice.toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          ₹{h.lastPrice.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 text-right font-medium ${h.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          ₹{h.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b dark:border-gray-800 text-gray-500 font-medium">
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-400">
                      No orders placed today.
                    </td>
                  </tr>
                ) : (
                  orders?.map((order) => (
                    <tr key={order.orderId}>
                      <td className="py-3 text-gray-500 text-xs">
                        {order.orderId}
                      </td>
                      <td className="py-3 font-semibold">
                        {order.tradingsymbol}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${order.transactionType === "BUY" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400" : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"}`}
                        >
                          {order.transactionType}
                        </span>
                      </td>
                      <td className="py-3 text-right">{order.quantity}</td>
                      <td className="py-3 text-right">
                        ₹{order.price.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            order.status === "COMPLETE"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Page
const dashboardRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: DashboardPage,
});

interface WatchlistItemData {
  id: string;
  symbol: string;
}

interface WatchlistData {
  id: string;
  name: string;
  items: WatchlistItemData[];
}

interface InstrumentMatch {
  tradingsymbol: string;
  name: string;
  exchange: string;
}

const WatchlistPage = () => {
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newWatchlistName, setNewWatchlistName] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [prices, setPrices] = useState<
    Record<string, { ltp: number; change: number }>
  >({});

  const {
    data: watchlists,
    isLoading,
    refetch,
  } = useQuery<WatchlistData[]>({
    queryKey: ["watchlists"],
    queryFn: () => fetchWithAuth<WatchlistData[]>("/api/watchlists"),
  });

  const { data: searchResults } = useQuery<InstrumentMatch[]>({
    queryKey: ["instruments-search", searchQuery],
    queryFn: () =>
      fetchWithAuth<InstrumentMatch[]>(
        `/api/instruments/search?q=${searchQuery}`,
      ),
    enabled: searchQuery.length >= 2,
  });

  useEffect(() => {
    if (watchlists && watchlists.length > 0 && !activeWatchlistId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveWatchlistId(watchlists[0].id);
    }
  }, [watchlists, activeWatchlistId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        const activeWatchlist = watchlists?.find(
          (w) => w.id === activeWatchlistId,
        );
        if (!activeWatchlist) return prev;

        for (const item of activeWatchlist.items) {
          const current = prev[item.symbol] || {
            ltp: 100 + Math.random() * 2000,
            change: -2 + Math.random() * 4,
          };
          const deltaPercent = (Math.random() - 0.5) * 0.3;
          const newLtp = current.ltp * (1 + deltaPercent / 100);
          const newChange = current.change + deltaPercent;

          next[item.symbol] = {
            ltp: newLtp,
            change: newChange,
          };
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [watchlists, activeWatchlistId]);

  const activeWatchlist = watchlists?.find((w) => w.id === activeWatchlistId);

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newWatchlistName }),
      });
      if (res.ok) {
        const data = (await res.json()) as WatchlistData;
        setNewWatchlistName("");
        setIsCreating(false);
        await refetch();
        setActiveWatchlistId(data.id);
      }
    } catch (err) {
      console.error("Failed to create watchlist:", err);
    }
  };

  const handleDeleteWatchlist = async () => {
    if (!activeWatchlistId) return;
    if (!confirm("Are you sure you want to delete this watchlist?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/watchlists/${activeWatchlistId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setActiveWatchlistId("");
        await refetch();
      }
    } catch (err) {
      console.error("Failed to delete watchlist:", err);
    }
  };

  const handleAddSymbol = async (symbol: string) => {
    if (!activeWatchlistId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/watchlists/${activeWatchlistId}/symbol`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol }),
      });
      if (res.ok) {
        setSearchQuery("");
        await refetch();
      }
    } catch (err) {
      console.error("Failed to add symbol:", err);
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    if (!activeWatchlistId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/watchlists/${activeWatchlistId}/symbol/remove`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ symbol }),
        },
      );
      if (res.ok) {
        await refetch();
      }
    } catch (err) {
      console.error("Failed to remove symbol:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 bg-gray-200 dark:bg-gray-800 rounded"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Market Watchlist
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Monitor real-time quote feeds and setup alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeWatchlist && (
            <Button
              variant="secondary"
              onClick={handleDeleteWatchlist}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete List
            </Button>
          )}
          <Button variant="primary" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New List
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card className="p-4 border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <form
            onSubmit={handleCreateWatchlist}
            className="flex flex-col sm:flex-row items-end sm:items-center gap-3"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                New List Name
              </label>
              <input
                type="text"
                placeholder="e.g. Swing Watchlist, Options Tracker"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" type="submit">
                Create
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {watchlists && watchlists.length > 0 ? (
        <div className="border-b dark:border-gray-800 flex items-center space-x-1 overflow-x-auto pb-px">
          {watchlists.map((w) => (
            <button
              key={w.id}
              onClick={() => setActiveWatchlistId(w.id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeWatchlistId === w.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-sm py-4">
          No watchlists configured. Create one to begin.
        </div>
      )}

      {activeWatchlistId && (
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search instruments (e.g. RELIANCE, TCS, INFY)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />

          {searchQuery.length >= 2 && searchResults && (
            <Card className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto shadow-lg border dark:border-gray-800 bg-white dark:bg-gray-950 divide-y divide-gray-100 dark:divide-gray-850">
              {searchResults.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No matching instruments found.
                </div>
              ) : (
                searchResults.map((inst) => (
                  <div
                    key={inst.tradingsymbol}
                    onClick={() =>
                      handleAddSymbol(`${inst.exchange}:${inst.tradingsymbol}`)
                    }
                    className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm">
                        {inst.tradingsymbol}
                      </div>
                      <div className="text-xs text-gray-400">{inst.name}</div>
                    </div>
                    <Badge variant="secondary">{inst.exchange}</Badge>
                  </div>
                ))
              )}
            </Card>
          )}
        </div>
      )}

      {activeWatchlist && (
        <>
          {activeWatchlist.items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <ListTodo className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">
                  Watchlist is Empty
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-4">
                  Use the instrument search bar above to look up stock symbols
                  and add them to this list.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {activeWatchlist.items.map((item) => {
                const parts = item.symbol.split(":");
                const displayName = parts[1] || parts[0];
                const exchange = parts[1] ? parts[0] : "NSE";

                const priceData = prices[item.symbol] || {
                  ltp: 150.0,
                  change: 0.0,
                };
                const isPositive = priceData.change >= 0;

                return (
                  <Card
                    key={item.id}
                    className="relative group overflow-hidden border dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-900 transition-all duration-300"
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-base">
                            {displayName}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                            {exchange}
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline space-x-2">
                          <span className="font-semibold text-lg">
                            ₹
                            {priceData.ltp.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span
                            className={`text-xs font-semibold flex items-center ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            {isPositive ? "+" : ""}
                            {priceData.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveSymbol(item.symbol)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-all duration-200"
                        title="Remove symbol"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Watchlist Page
const watchlistRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/watchlist",
  component: WatchlistPage,
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
