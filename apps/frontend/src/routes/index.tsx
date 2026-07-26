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
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/authStore.js";
import { AuthCallbackPage } from "./AuthCallback.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MarginInfo, PositionInfo, OrderInfo } from "@trading-lab/shared";
import {
  LogIn,
  HelpCircle,
  ListTodo,
  Plus,
  Trash2,
  Search,
  Calendar,
  MessageSquare,
  Filter,
  Percent,
  Activity,
  AlertCircle,
  TrendingUp,
  X,
  Clock,
  History,
  AlertTriangle,
  CheckCircle2,
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

interface InstrumentMatch {
  tradingsymbol: string;
  name: string;
  exchange: string;
}

const getSeededRandom = (seedString: string) => {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  let s = Math.abs(hash) || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const DashboardPage = () => {
  const queryClient = useQueryClient();

  const { data: margins, isLoading: isLoadingMargins } = useQuery<MarginInfo>({
    queryKey: ["margins"],
    queryFn: () => fetchWithAuth<MarginInfo>("/api/portfolio/margins"),
  });

  const { data: positions, isLoading: isLoadingPositions } = useQuery<
    PositionInfo[]
  >({
    queryKey: ["positions"],
    queryFn: () => fetchWithAuth<PositionInfo[]>("/api/portfolio/positions"),
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<OrderInfo[]>({
    queryKey: ["orders"],
    queryFn: () => fetchWithAuth<OrderInfo[]>("/api/portfolio/orders"),
  });

  const [activeWorkspaceSymbol, setActiveWorkspaceSymbol] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [activeWatchlistTab, setActiveWatchlistTab] =
    useState("Today's Trades");
  const [scannerFilter, setScannerFilter] = useState("Top Gainers");

  // Quick Trade panel states
  const [orderQty, setOrderQty] = useState<number>(10);
  const [orderPrice, setOrderPrice] = useState<string>("");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [productType, setProductType] = useState<"MIS" | "CNC">("MIS");

  // Journal form states
  const [journalReason, setJournalReason] = useState("");
  const [journalEmotion, setJournalEmotion] = useState("CALM");
  const [journalMistake, setJournalMistake] = useState("NONE");
  const [journalLesson, setJournalLesson] = useState("");

  const isLoading = isLoadingMargins || isLoadingPositions || isLoadingOrders;

  // Search API
  const { data: searchResults } = useQuery<InstrumentMatch[]>({
    queryKey: ["instruments-search", searchQuery],
    queryFn: () =>
      fetchWithAuth<InstrumentMatch[]>(
        `/api/instruments/search?q=${searchQuery}`,
      ),
    enabled: searchQuery.length >= 2,
  });

  // Watchlists
  const defaultWatchlists: Record<string, string[]> = {
    "Today's Trades": ["SBIN", "RELIANCE", "INFY", "TCS"],
    "Swing Trades": ["MANAPPURAM", "TATASTEEL", "ITC", "HDFCBANK"],
    "High Conviction": ["GOLDBEES", "NIFTYBEES"],
    "Options Later": ["NIFTY", "BANKNIFTY"],
    Research: ["WIPRO", "ICICIBANK", "AXISBANK"],
  };

  // Get symbol prices helper
  const getSymbolStats = (symbol: string) => {
    let basePrice = 500;
    if (symbol.includes("SBIN")) basePrice = 650.25;
    else if (symbol.includes("RELIANCE")) basePrice = 2510.5;
    else if (symbol.includes("INFY")) basePrice = 1530.0;
    else if (symbol.includes("TCS")) basePrice = 3180.0;
    else if (symbol.includes("MANAPPURAM")) basePrice = 164.8;
    else if (symbol.includes("TATASTEEL")) basePrice = 125.5;
    else if (symbol.includes("GOLDBEES")) basePrice = 54.3;
    else if (symbol.includes("NIFTYBEES")) basePrice = 224.1;
    else if (symbol.includes("ITC")) basePrice = 450.0;
    else if (symbol.includes("HDFCBANK")) basePrice = 1680.0;

    const change = symbol.charCodeAt(0) % 2 === 0 ? 1.45 : -0.85;
    const vol = 1200000 + (symbol.charCodeAt(1) || 0) * 150000;
    return {
      ltp: basePrice,
      change,
      volume: vol,
      high: basePrice * 1.018,
      low: basePrice * 0.985,
    };
  };

  // Scanner opportunities generator
  const getScannerResults = () => {
    const symbols = [
      "SBIN",
      "RELIANCE",
      "INFY",
      "TCS",
      "MANAPPURAM",
      "TATASTEEL",
      "ITC",
      "HDFCBANK",
      "WIPRO",
      "ICICIBANK",
      "AXISBANK",
    ];
    return symbols.map((s) => {
      const stats = getSymbolStats(s);
      let chg = stats.change;
      let vol = stats.volume;
      if (scannerFilter === "Top Gainers") chg = Math.abs(chg) + 1.5;
      else if (scannerFilter === "Top Losers") chg = -Math.abs(chg) - 1.2;
      else if (scannerFilter === "Most Active") vol = vol * 3;
      else if (scannerFilter === "Volume Breakout") vol = vol * 5;
      else if (scannerFilter === "52 Week High") chg = 3.5;
      return { symbol: s, ...stats, change: chg, volume: vol };
    });
  };

  // Order placing mutations
  const placeOrderMutation = useMutation({
    mutationFn: (newOrder: {
      exchange: string;
      tradingsymbol: string;
      transactionType: "BUY" | "SELL";
      quantity: number;
      price?: number;
      orderType: "MARKET" | "LIMIT";
      product: "MIS" | "CNC";
    }) => {
      const token = localStorage.getItem("token");
      return fetch("/api/portfolio/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newOrder),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["margins"] });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => {
      const token = localStorage.getItem("token");
      return fetch(`/api/portfolio/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });

  const createTradeMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => {
      const token = localStorage.getItem("token");
      return fetch("/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["performance-analytics"] });
      setJournalReason("");
      setJournalLesson("");
      alert("Trade journal log added successfully!");
    },
  });

  const handleExecuteTrade = useCallback(
    (transactionType: "BUY" | "SELL") => {
      if (!activeWorkspaceSymbol) return;
      placeOrderMutation.mutate({
        exchange: "NSE",
        tradingsymbol: activeWorkspaceSymbol,
        transactionType,
        quantity: orderQty,
        price:
          orderType === "LIMIT" && orderPrice ? Number(orderPrice) : undefined,
        orderType,
        product: productType,
      });
    },
    [
      activeWorkspaceSymbol,
      orderQty,
      orderPrice,
      orderType,
      productType,
      placeOrderMutation,
    ],
  );

  // Hotkeys Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        const searchInput = document.getElementById("universal-search-input");
        if (searchInput) searchInput.focus();
      } else if (
        (e.key === "b" || e.key === "B") &&
        !isInput &&
        activeWorkspaceSymbol
      ) {
        e.preventDefault();
        handleExecuteTrade("BUY");
      } else if (
        (e.key === "s" || e.key === "S") &&
        !isInput &&
        activeWorkspaceSymbol
      ) {
        e.preventDefault();
        handleExecuteTrade("SELL");
      } else if ((e.key === "w" || e.key === "W") && !isInput) {
        e.preventDefault();
        const watchlistEl = document.getElementById("watchlist-section");
        if (watchlistEl) watchlistEl.scrollIntoView({ behavior: "smooth" });
      } else if ((e.key === "p" || e.key === "P") && !isInput) {
        e.preventDefault();
        const positionsEl = document.getElementById("positions-section");
        if (positionsEl) positionsEl.scrollIntoView({ behavior: "smooth" });
      } else if ((e.key === "o" || e.key === "O") && !isInput) {
        e.preventDefault();
        const ordersEl = document.getElementById("orders-section");
        if (ordersEl) ordersEl.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "Escape") {
        setActiveWorkspaceSymbol(null);
        setShowSearchDropdown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeWorkspaceSymbol, handleExecuteTrade]);

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceSymbol) return;
    const stats = getSymbolStats(activeWorkspaceSymbol);

    createTradeMutation.mutate({
      symbol: activeWorkspaceSymbol,
      direction: "BUY",
      entryPrice: stats.ltp,
      exitPrice: stats.ltp * 1.02,
      quantity: orderQty,
      status: "CLOSED",
      entryTime: new Date().toISOString(),
      exitTime: new Date().toISOString(),
      pnl: orderQty * (stats.ltp * 0.02),
      emotion: journalEmotion,
      reason: journalReason,
      mistake: journalMistake,
      lesson: journalLesson,
      tags: ["workstation"],
    });
  };

  // procedural candlestick values
  const getWorkspaceCandles = (symbol: string) => {
    const stats = getSymbolStats(symbol);
    const base = stats.ltp;
    const random = getSeededRandom(symbol + "_candles");
    const list = [];
    let current = base * 0.97;
    for (let i = 0; i < 30; i++) {
      const open = current;
      const chg = (random() - 0.48) * (base * 0.012);
      const close = current + chg;
      const high = Math.max(open, close) + random() * (base * 0.004);
      const low = Math.min(open, close) - random() * (base * 0.004);
      const vol = Math.floor(100000 + random() * 400000);
      list.push({ open, close, high, low, volume: vol });
      current = close;
    }
    return list;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 bg-gray-950 min-h-screen text-gray-400">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-900 rounded animate-pulse" />
          <div className="h-6 w-24 bg-gray-900 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 bg-gray-900 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Active positions & calculations
  const activePositions = positions?.filter((p) => p.quantity > 0) || [];
  const activeOrders = orders || [];
  const availableMargin = margins?.available || 0;

  return (
    <div className="space-y-6 bg-gray-950 p-4 min-h-screen text-gray-200 select-none font-sans">
      {/* Workstation Top Navigation/Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-gray-900/50 p-3 rounded-lg border border-gray-900">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-sm font-extrabold tracking-wider uppercase text-gray-100 flex items-center">
              Personal Trading Workstation
              <Badge
                variant="success"
                className="ml-2 text-[9px] py-0 border-none font-bold bg-green-500/10 text-green-400"
              >
                LIVE FEED
              </Badge>
            </h2>
            <span className="text-[10px] text-gray-500 font-mono">
              Press / to search | B/S to execute
            </span>
          </div>
        </div>

        {/* Universal Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            id="universal-search-input"
            type="text"
            placeholder="Search symbol, ETF, indices... (e.g. INFY)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="block w-full pl-9 pr-4 py-1.5 bg-gray-950 border border-gray-800 rounded-md text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
          />

          {showSearchDropdown && searchQuery.length >= 2 && (
            <div className="absolute z-50 w-full mt-1.5 bg-gray-900 border border-gray-800 rounded-md shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
              <div className="p-1.5 bg-gray-950 border-b border-gray-800 flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase">
                <span>Matching Instruments</span>
                <span>LTP / Change</span>
              </div>
              {searchResults && searchResults.length > 0 ? (
                searchResults.map((match) => {
                  const stats = getSymbolStats(match.tradingsymbol);
                  return (
                    <button
                      key={match.tradingsymbol}
                      onClick={() => {
                        setActiveWorkspaceSymbol(match.tradingsymbol);
                        setShowSearchDropdown(false);
                        setSearchQuery("");
                      }}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-800/60 text-left border-b border-gray-950"
                    >
                      <div>
                        <span className="text-xs font-bold text-gray-100">
                          {match.tradingsymbol}
                        </span>
                        <span className="ml-1 text-[9px] text-gray-500 uppercase">
                          {match.exchange}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-gray-300">
                          ₹{stats.ltp.toFixed(2)}
                        </span>
                        <span
                          className={`ml-2 text-[10px] font-bold ${stats.change >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {stats.change >= 0 ? "+" : ""}
                          {stats.change}%
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-gray-600">
                  No trading pairs matched query.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-gray-500">Margin Available:</span>
          <span className="font-bold text-gray-100 font-mono">
            ₹{availableMargin.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Trading Workspace details (Main view if selected) */}
      {activeWorkspaceSymbol ? (
        <Card className="border border-blue-900/60 bg-gray-900/40 relative overflow-hidden">
          <div className="bg-gray-900/80 p-3 border-b border-gray-800 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-black text-gray-100 tracking-tight">
                {activeWorkspaceSymbol}
              </span>
              <Badge
                variant="secondary"
                className="bg-gray-800 text-[10px] py-0 border-none"
              >
                NSE
              </Badge>
              <div className="flex space-x-3 text-xs border-l border-gray-800 pl-3">
                <span className="text-gray-400">
                  LTP:{" "}
                  <strong className="text-gray-200">
                    ₹{getSymbolStats(activeWorkspaceSymbol).ltp.toFixed(2)}
                  </strong>
                </span>
                <span
                  className={`font-bold ${getSymbolStats(activeWorkspaceSymbol).change >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {getSymbolStats(activeWorkspaceSymbol).change >= 0 ? "+" : ""}
                  {getSymbolStats(activeWorkspaceSymbol).change}%
                </span>
                <span className="text-gray-500">
                  Vol:{" "}
                  <strong className="text-gray-300 font-mono">
                    {(
                      getSymbolStats(activeWorkspaceSymbol).volume / 100000
                    ).toFixed(1)}
                    L
                  </strong>
                </span>
                <span className="text-gray-500">
                  H/L:{" "}
                  <strong className="text-gray-300 font-mono">
                    ₹{getSymbolStats(activeWorkspaceSymbol).high.toFixed(0)} / ₹
                    {getSymbolStats(activeWorkspaceSymbol).low.toFixed(0)}
                  </strong>
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveWorkspaceSymbol(null)}
              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
              title="Close Workspace (ESC)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
            {/* Chart and Market Depth (Left Column - Spans 3) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Candlestick SVG Chart */}
              <div className="bg-gray-950 p-4 border border-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-3 text-xs">
                  <span className="font-bold text-gray-300 flex items-center">
                    <Activity className="h-4 w-4 mr-1 text-blue-500" />
                    Intraday Candlesticks (30 min bars)
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">
                    Cursor tracking: Active
                  </span>
                </div>

                <div className="relative">
                  {/* Candlestick plotting */}
                  {(() => {
                    const candles = getWorkspaceCandles(activeWorkspaceSymbol);
                    const prices = candles.flatMap((c) => [c.high, c.low]);
                    const minPrice = Math.min(...prices) * 0.998;
                    const maxPrice = Math.max(...prices) * 1.002;
                    const diff = maxPrice - minPrice;

                    const width = 600;
                    const height = 240;
                    const chartHeight = 180;
                    const colWidth = 14;
                    const padLeft = 15;

                    return (
                      <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-auto overflow-visible select-none"
                      >
                        {/* Horizontal grid lines */}
                        {[0.25, 0.5, 0.75].map((pct, idx) => {
                          const y = pct * chartHeight;
                          const pr = maxPrice - pct * diff;
                          return (
                            <g key={idx} className="opacity-30">
                              <line
                                x1="0"
                                y1={y}
                                x2={width}
                                y2={y}
                                stroke="#1f2937"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={width - 5}
                                y={y - 3}
                                textAnchor="end"
                                className="fill-gray-500 text-[8px] font-mono"
                              >
                                ₹{pr.toFixed(1)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Candlesticks & wicks */}
                        {candles.map((candle, idx) => {
                          const x = padLeft + idx * (colWidth + 4);
                          const isGreen = candle.close >= candle.open;
                          const openY =
                            chartHeight -
                            ((candle.open - minPrice) / diff) * chartHeight;
                          const closeY =
                            chartHeight -
                            ((candle.close - minPrice) / diff) * chartHeight;
                          const highY =
                            chartHeight -
                            ((candle.high - minPrice) / diff) * chartHeight;
                          const lowY =
                            chartHeight -
                            ((candle.low - minPrice) / diff) * chartHeight;

                          const rectY = Math.min(openY, closeY);
                          const rectHeight = Math.max(
                            Math.abs(closeY - openY),
                            1.5,
                          );
                          const color = isGreen ? "#22c55e" : "#ef4444";

                          // volume calculation
                          const volHeight = 40;
                          const volY =
                            height - (candle.volume / 500000) * volHeight;

                          return (
                            <g key={idx} className="group">
                              {/* Wick line */}
                              <line
                                x1={x + colWidth / 2}
                                y1={highY}
                                x2={x + colWidth / 2}
                                y2={lowY}
                                stroke={color}
                                strokeWidth="1.2"
                              />
                              {/* Candle body */}
                              <rect
                                x={x}
                                y={rectY}
                                width={colWidth}
                                height={rectHeight}
                                fill={color}
                                stroke={color}
                                strokeWidth="0.5"
                                rx="0.5"
                              />
                              {/* Volume bar */}
                              <rect
                                x={x + 2}
                                y={Math.max(volY, height - volHeight)}
                                width={colWidth - 4}
                                height={Math.max(height - volY, 2)}
                                fill={isGreen ? "#22c55e20" : "#ef444420"}
                              />
                              <title>
                                {`O: ₹${candle.open.toFixed(2)} | H: ₹${candle.high.toFixed(2)} | L: ₹${candle.low.toFixed(2)} | C: ₹${candle.close.toFixed(2)}`}
                              </title>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Market Depth Queue (5 levels) */}
              <div className="grid grid-cols-2 gap-4 bg-gray-950 p-4 border border-gray-800 rounded-lg select-none">
                <div>
                  <h4 className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-2">
                    Bids (Buy Queue)
                  </h4>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-gray-500 text-[10px] border-b border-gray-900 pb-1">
                        <th className="pb-1">Price</th>
                        <th className="pb-1 text-right">Orders</th>
                        <th className="pb-1 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900/40 text-gray-300 font-mono font-medium">
                      {[1, 2, 3, 4, 5].map((idx) => {
                        const base = getSymbolStats(activeWorkspaceSymbol).ltp;
                        const pr = base - idx * 0.15;
                        const random = getSeededRandom(
                          activeWorkspaceSymbol + "_bids_" + idx,
                        );
                        const ordersCount = Math.floor(3 + random() * 15);
                        const qty = Math.floor(100 + random() * 2500);
                        return (
                          <tr key={idx} className="hover:bg-green-500/5">
                            <td className="py-1.5 text-green-500">
                              ₹{pr.toFixed(2)}
                            </td>
                            <td className="py-1.5 text-right text-gray-500">
                              {ordersCount}
                            </td>
                            <td className="py-1.5 text-right">{qty}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">
                    Asks (Sell Queue)
                  </h4>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-gray-500 text-[10px] border-b border-gray-900 pb-1">
                        <th className="pb-1">Price</th>
                        <th className="pb-1 text-right">Orders</th>
                        <th className="pb-1 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900/40 text-gray-300 font-mono font-medium">
                      {[1, 2, 3, 4, 5].map((idx) => {
                        const base = getSymbolStats(activeWorkspaceSymbol).ltp;
                        const pr = base + idx * 0.15;
                        const random = getSeededRandom(
                          activeWorkspaceSymbol + "_asks_" + idx,
                        );
                        const ordersCount = Math.floor(2 + random() * 12);
                        const qty = Math.floor(150 + random() * 3000);
                        return (
                          <tr key={idx} className="hover:bg-red-500/5">
                            <td className="py-1.5 text-red-500">
                              ₹{pr.toFixed(2)}
                            </td>
                            <td className="py-1.5 text-right text-gray-500">
                              {ordersCount}
                            </td>
                            <td className="py-1.5 text-right">{qty}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Trade Panel & Journal Form (Right Column - Spans 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Trade Executing Panel */}
              <div className="bg-gray-950 p-4 border border-gray-800 rounded-lg">
                <h4 className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider mb-3">
                  Quick Trade Console
                </h4>

                <div className="space-y-4">
                  {/* Quantity & Price Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={orderQty}
                        onChange={(e) =>
                          setOrderQty(Math.max(1, Number(e.target.value)))
                        }
                        className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1 text-xs font-mono text-gray-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">
                        Limit Price
                      </label>
                      <input
                        type="text"
                        placeholder="LTP (Market)"
                        value={orderPrice}
                        disabled={orderType === "MARKET"}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded px-2.5 py-1 text-xs font-mono text-gray-100 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-900/30"
                      />
                    </div>
                  </div>

                  {/* MIS/CNC and Market/Limit selectors */}
                  <div className="grid grid-cols-2 gap-3 text-xs select-none">
                    <div className="flex bg-gray-900 border border-gray-800 rounded p-0.5">
                      <button
                        onClick={() => setProductType("MIS")}
                        className={`flex-1 text-center py-1 rounded font-bold text-[10px] transition-colors ${productType === "MIS" ? "bg-gray-800 text-blue-400" : "text-gray-500"}`}
                      >
                        INTRADAY (MIS)
                      </button>
                      <button
                        onClick={() => setProductType("CNC")}
                        className={`flex-1 text-center py-1 rounded font-bold text-[10px] transition-colors ${productType === "CNC" ? "bg-gray-800 text-blue-400" : "text-gray-500"}`}
                      >
                        LONG-TERM (CNC)
                      </button>
                    </div>

                    <div className="flex bg-gray-900 border border-gray-800 rounded p-0.5">
                      <button
                        onClick={() => setOrderType("MARKET")}
                        className={`flex-1 text-center py-1 rounded font-bold text-[10px] transition-colors ${orderType === "MARKET" ? "bg-gray-800 text-blue-400" : "text-gray-500"}`}
                      >
                        MARKET
                      </button>
                      <button
                        onClick={() => setOrderType("LIMIT")}
                        className={`flex-1 text-center py-1 rounded font-bold text-[10px] transition-colors ${orderType === "LIMIT" ? "bg-gray-800 text-blue-400" : "text-gray-500"}`}
                      >
                        LIMIT
                      </button>
                    </div>
                  </div>

                  {/* Margins & Costs estimates */}
                  <div className="bg-gray-900/50 p-2.5 rounded border border-gray-900 text-[10px] text-gray-400 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Capital Required:</span>
                      <span className="font-bold text-gray-200">
                        ₹
                        {(
                          orderQty * getSymbolStats(activeWorkspaceSymbol).ltp
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margin Required (5x for MIS):</span>
                      <span className="font-bold text-gray-200">
                        ₹
                        {(
                          (orderQty *
                            getSymbolStats(activeWorkspaceSymbol).ltp) /
                          (productType === "MIS" ? 5 : 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-800 pt-1 mt-1">
                      <span>Estimated Brokerage & Taxes:</span>
                      <span className="font-bold text-gray-300">
                        ₹
                        {(
                          orderQty *
                            getSymbolStats(activeWorkspaceSymbol).ltp *
                            0.0005 +
                          20
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available Cash Balance:</span>
                      <span className="font-bold text-green-400">
                        ₹{availableMargin.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* BUY / SELL Executing Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleExecuteTrade("BUY")}
                      disabled={placeOrderMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs py-2.5 rounded shadow-lg transition-colors flex items-center justify-center space-x-1 uppercase"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Buy Symbol</span>
                    </button>
                    <button
                      onClick={() => handleExecuteTrade("SELL")}
                      disabled={placeOrderMutation.isPending}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded shadow-lg transition-colors flex items-center justify-center space-x-1 uppercase"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Sell Symbol</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Journal Entry Form */}
              <form
                onSubmit={handleJournalSubmit}
                className="bg-gray-950 p-4 border border-gray-800 rounded-lg space-y-3"
              >
                <h4 className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider">
                  Fast Workstation Journal
                </h4>

                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">
                    Reason for trade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15m breakout at VWAP support"
                    value={journalReason}
                    onChange={(e) => setJournalReason(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">
                      Emotion State
                    </label>
                    <select
                      value={journalEmotion}
                      onChange={(e) => setJournalEmotion(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded px-1.5 py-1 text-xs text-gray-200 focus:outline-none"
                    >
                      <option value="CALM">Calm / Focused</option>
                      <option value="CONFIDENT">Confident</option>
                      <option value="FOMO">FOMO / Anxious</option>
                      <option value="GREEDY">Greedy</option>
                      <option value="REGRETFUL">Regretful</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">
                      Mistake logged
                    </label>
                    <select
                      value={journalMistake}
                      onChange={(e) => setJournalMistake(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded px-1.5 py-1 text-xs text-gray-200 focus:outline-none"
                    >
                      <option value="NONE">None (Followed Plan)</option>
                      <option value="FOMO_ENTRY">Fomo Entry</option>
                      <option value="STOP_REMOVED">Removed Stop Loss</option>
                      <option value="OVERTRADING">Overtrading</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-1">
                    Lessons & takeaways
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add lesson observed..."
                    value={journalLesson}
                    onChange={(e) => setJournalLesson(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createTradeMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2 rounded transition-colors uppercase"
                >
                  Log To Journal
                </button>
              </form>
            </div>
          </div>
        </Card>
      ) : (
        /* Workstation Main Dashboard layout (Search prompts, watchlists, scanner, positions, timeline) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Watchlist and Scanners (Spans 5) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Multiple Watchlist Panels (Watchlist 2.0) */}
            <Card
              id="watchlist-section"
              className="border border-gray-800 bg-gray-900/20"
            >
              <CardHeader className="pb-2 border-b border-gray-900/60 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                <CardTitle className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
                  <ListTodo className="h-4.5 w-4.5 mr-1 text-blue-400" />
                  Watchlist 2.0
                </CardTitle>
                <div className="flex overflow-x-auto space-x-1.5 select-none scrollbar-none">
                  {Object.keys(defaultWatchlists).map((tabName) => (
                    <button
                      key={tabName}
                      onClick={() => setActiveWatchlistTab(tabName)}
                      className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider transition-colors ${activeWatchlistTab === tabName ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      {tabName.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-gray-500 text-[9px] uppercase tracking-wider border-b border-gray-900 pb-1">
                        <th className="pb-1">Symbol</th>
                        <th className="pb-1 text-right">LTP</th>
                        <th className="pb-1 text-right">Change</th>
                        <th className="pb-1 text-right">Vol (L)</th>
                        <th className="pb-1 text-center">Depth</th>
                        <th className="pb-1 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900/30 text-gray-300 font-medium">
                      {(defaultWatchlists[activeWatchlistTab] || []).map(
                        (symbol) => {
                          const stats = getSymbolStats(symbol);
                          return (
                            <tr
                              key={symbol}
                              className="hover:bg-gray-800/20 transition-colors"
                            >
                              <td className="py-2 font-bold text-gray-100">
                                <button
                                  onClick={() =>
                                    setActiveWorkspaceSymbol(symbol)
                                  }
                                  className="hover:text-blue-400"
                                >
                                  {symbol}
                                </button>
                              </td>
                              <td className="py-2 text-right font-mono text-gray-200">
                                ₹{stats.ltp.toFixed(2)}
                              </td>
                              <td
                                className={`py-2 text-right font-bold ${stats.change >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {stats.change >= 0 ? "+" : ""}
                                {stats.change}%
                              </td>
                              <td className="py-2 text-right text-gray-500 font-mono">
                                {(stats.volume / 100000).toFixed(1)}L
                              </td>
                              <td className="py-2 text-center text-[9px] text-gray-500 font-mono">
                                {stats.high.toFixed(0)}/{stats.low.toFixed(0)}
                              </td>
                              <td className="py-2 text-right space-x-1">
                                <button
                                  onClick={() => {
                                    setActiveWorkspaceSymbol(symbol);
                                    setOrderQty(10);
                                    setProductType("MIS");
                                    handleExecuteTrade("BUY");
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 font-bold uppercase"
                                >
                                  Buy
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveWorkspaceSymbol(symbol);
                                    setOrderQty(10);
                                    setProductType("MIS");
                                    handleExecuteTrade("SELL");
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold uppercase"
                                >
                                  Sell
                                </button>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Market Opportunity Scanner */}
            <Card className="border border-gray-800 bg-gray-900/20">
              <CardHeader className="pb-2 border-b border-gray-900/60 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                <CardTitle className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
                  <Filter className="h-4.5 w-4.5 mr-1 text-blue-400" />
                  Market Scanner
                </CardTitle>
                <select
                  value={scannerFilter}
                  onChange={(e) => setScannerFilter(e.target.value)}
                  className="bg-gray-950 border border-gray-800 text-[10px] font-bold text-blue-400 py-0.5 px-1.5 rounded focus:outline-none"
                >
                  <option value="Top Gainers">Top Gainers</option>
                  <option value="Top Losers">Top Losers</option>
                  <option value="Most Active">Most Active</option>
                  <option value="Volume Breakout">Volume Breakout</option>
                  <option value="52 Week High">52 Week High</option>
                </select>
              </CardHeader>
              <CardContent className="pt-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-gray-500 text-[9px] uppercase tracking-wider border-b border-gray-900 pb-1">
                      <th className="pb-1">Symbol</th>
                      <th className="pb-1 text-right">LTP</th>
                      <th className="pb-1 text-right">Change</th>
                      <th className="pb-1 text-right">Volume</th>
                      <th className="pb-1 text-right">Workspace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900/30 text-gray-300 font-medium">
                    {getScannerResults()
                      .slice(0, 6)
                      .map((opportunity) => (
                        <tr
                          key={opportunity.symbol}
                          className="hover:bg-gray-800/10"
                        >
                          <td className="py-2 font-bold text-gray-100">
                            {opportunity.symbol}
                          </td>
                          <td className="py-2 text-right font-mono">
                            ₹{opportunity.ltp.toFixed(2)}
                          </td>
                          <td
                            className={`py-2 text-right font-bold ${opportunity.change >= 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {opportunity.change >= 0 ? "+" : ""}
                            {opportunity.change.toFixed(2)}%
                          </td>
                          <td className="py-2 text-right text-gray-500 font-mono">
                            {(opportunity.volume / 100000).toFixed(1)}L
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() =>
                                setActiveWorkspaceSymbol(opportunity.symbol)
                              }
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold hover:underline"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Position Monitor & Order Timeline (Spans 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Position Monitor */}
            <Card
              id="positions-section"
              className="border border-gray-800 bg-gray-900/20"
            >
              <CardHeader className="pb-2 border-b border-gray-900/60 flex justify-between items-center">
                <CardTitle className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
                  <Percent className="h-4.5 w-4.5 mr-1 text-blue-400" />
                  Active Trades Monitor
                </CardTitle>
                <Badge variant="secondary" className="font-bold text-[10px]">
                  {activePositions.length} active
                </Badge>
              </CardHeader>
              <CardContent className="pt-3">
                {activePositions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-800 rounded bg-gray-950/20 select-none">
                    <AlertCircle className="h-7 w-7 text-gray-600 mb-1" />
                    <span className="text-xs font-semibold text-gray-500">
                      No Active Positions
                    </span>
                    <p className="text-[10px] text-gray-600 mt-1">
                      You currently have no open intraday or swing positions.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activePositions.map((pos) => {
                      const stats = getSymbolStats(pos.tradingsymbol);
                      const returnPct =
                        pos.averagePrice > 0
                          ? (pos.pnl / (pos.quantity * pos.averagePrice)) * 100
                          : 0;
                      return (
                        <div
                          key={pos.tradingsymbol}
                          className="bg-gray-950 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-extrabold text-gray-200">
                                {pos.tradingsymbol}
                              </span>
                              <span className="text-[9px] text-gray-500 uppercase ml-1">
                                {pos.exchange}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-bold font-mono ${pos.pnl >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {pos.pnl >= 0 ? "+" : ""}₹{pos.pnl.toFixed(2)} (
                              {returnPct.toFixed(1)}%)
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-[9px] text-gray-500 font-mono border-t border-gray-900 pt-2">
                            <div>
                              <span>Qty:</span>
                              <span className="block text-gray-300 font-bold">
                                {pos.quantity}
                              </span>
                            </div>
                            <div>
                              <span>Avg Entry:</span>
                              <span className="block text-gray-300">
                                ₹{pos.averagePrice.toFixed(1)}
                              </span>
                            </div>
                            <div>
                              <span>LTP:</span>
                              <span className="block text-gray-300">
                                ₹{stats.ltp.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-900/60">
                            <span className="text-[8px] text-gray-600 flex items-center font-mono">
                              <Clock className="h-3 w-3 mr-0.5" />
                              Held: 2h 15m
                            </span>
                            <div className="flex space-x-1.5">
                              <button
                                onClick={() =>
                                  setActiveWorkspaceSymbol(pos.tradingsymbol)
                                }
                                className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-[9px] font-bold"
                              >
                                Chart
                              </button>
                              <button
                                onClick={() => {
                                  placeOrderMutation.mutate({
                                    exchange: pos.exchange,
                                    tradingsymbol: pos.tradingsymbol,
                                    transactionType: "SELL",
                                    quantity: pos.quantity,
                                    orderType: "MARKET",
                                    product: "MIS",
                                  });
                                }}
                                className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[9px] font-bold"
                              >
                                Exit
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chronological Order Timeline */}
            <Card
              id="orders-section"
              className="border border-gray-800 bg-gray-900/20"
            >
              <CardHeader className="pb-2 border-b border-gray-900/60 flex justify-between items-center">
                <CardTitle className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
                  <History className="h-4.5 w-4.5 mr-1 text-blue-400" />
                  Order Execution Timeline
                </CardTitle>
                <span className="text-[10px] text-gray-500 font-mono">
                  Real-time status tracking
                </span>
              </CardHeader>
              <CardContent className="pt-3">
                {activeOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-800 rounded bg-gray-950/20 select-none">
                    <ListTodo className="h-7 w-7 text-gray-600 mb-1" />
                    <span className="text-xs font-semibold text-gray-500">
                      No Orders Logged
                    </span>
                    <p className="text-[10px] text-gray-600 mt-1">
                      You currently have no orders placed today.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-4 border-l border-gray-800 space-y-4 py-1.5 font-mono">
                    {activeOrders.map((ord) => (
                      <div
                        key={ord.orderId}
                        className="relative text-xs select-none"
                      >
                        {/* Dot indicator */}
                        <span
                          className={`absolute -left-[20.5px] top-0.5 h-3 w-3 rounded-full border border-gray-950 flex items-center justify-center ${ord.transactionType === "BUY" ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-gray-500 text-[10px] mr-1.5">
                              {new Date(ord.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span
                              className={`font-bold ${ord.transactionType === "BUY" ? "text-green-400" : "text-red-400"}`}
                            >
                              {ord.transactionType === "BUY"
                                ? "Bought"
                                : "Sold"}
                            </span>{" "}
                            <strong className="text-gray-200 font-semibold">
                              {ord.tradingsymbol}
                            </strong>
                            <span className="text-gray-500 text-[10px] ml-1.5">
                              ({ord.quantity} Qty @ ₹{ord.price.toFixed(2)})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                ord.status === "COMPLETE"
                                  ? "success"
                                  : "secondary"
                              }
                              className="text-[9px] py-0 border-none"
                            >
                              {ord.status}
                            </Badge>
                            {ord.status !== "COMPLETE" && (
                              <button
                                onClick={() =>
                                  cancelOrderMutation.mutate(ord.orderId)
                                }
                                className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
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

interface TradeNoteData {
  id: string;
  content: string;
  createdAt: string;
}

interface TradeJournalData {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number | null;
  status: "OPEN" | "CLOSED";
  entryTime: string;
  exitTime: string | null;
  emotion: string | null;
  mistake: string | null;
  lesson: string | null;
  reason: string | null;
  tags: string[];
  notes: TradeNoteData[];
}

const JournalPage = () => {
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">(
    "ALL",
  );
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState<
    "date_desc" | "date_asc" | "pnl_desc" | "pnl_asc"
  >("date_desc");

  const [newNoteContent, setNewNoteContent] = useState("");

  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState<"OPEN" | "CLOSED">("CLOSED");
  const [entryTime, setEntryTime] = useState(
    new Date().toISOString().substring(0, 16),
  );
  const [exitTime, setExitTime] = useState("");
  const [emotion, setEmotion] = useState("CONFIDENT");
  const [reason, setReason] = useState("");
  const [mistake, setMistake] = useState("NONE");
  const [lesson, setLesson] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [initialNote, setInitialNote] = useState("");

  const {
    data: trades,
    isLoading,
    refetch,
  } = useQuery<TradeJournalData[]>({
    queryKey: ["trades"],
    queryFn: () => fetchWithAuth<TradeJournalData[]>("/api/trades"),
  });

  const allTags = Array.from(new Set(trades?.flatMap((t) => t.tags) || []));

  let filtered = trades || [];
  if (statusFilter !== "ALL") {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toUpperCase();
    filtered = filtered.filter((t) => t.symbol.includes(q));
  }
  if (tagFilter) {
    filtered = filtered.filter((t) => t.tags.includes(tagFilter));
  }

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "date_desc")
      return new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime();
    if (sortBy === "date_asc")
      return new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime();
    if (sortBy === "pnl_desc") return (b.pnl || 0) - (a.pnl || 0);
    if (sortBy === "pnl_asc") return (a.pnl || 0) - (b.pnl || 0);
    return 0;
  });

  const selectedTrade = trades?.find((t) => t.id === selectedTradeId);

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !entryPrice || !quantity) return;

    let calculatedPnl: number | null = null;
    if (status === "CLOSED" && exitPrice) {
      const entry = Number(entryPrice);
      const exit = Number(exitPrice);
      const qty = Number(quantity);
      calculatedPnl =
        direction === "BUY" ? (exit - entry) * qty : (entry - exit) * qty;
    }

    const payload = {
      symbol: symbol.toUpperCase().trim(),
      direction,
      entryPrice: Number(entryPrice),
      exitPrice: status === "CLOSED" && exitPrice ? Number(exitPrice) : null,
      quantity: Number(quantity),
      status,
      entryTime: new Date(entryTime).toISOString(),
      exitTime:
        status === "CLOSED" && exitTime
          ? new Date(exitTime).toISOString()
          : null,
      pnl: calculatedPnl,
      emotion,
      reason: reason || null,
      mistake: mistake || null,
      lesson: lesson || null,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      initialNote: initialNote.trim() || undefined,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSymbol("");
        setEntryPrice("");
        setExitPrice("");
        setQuantity("");
        setStatus("CLOSED");
        setEntryTime(new Date().toISOString().substring(0, 16));
        setExitTime("");
        setEmotion("CONFIDENT");
        setReason("");
        setMistake("NONE");
        setLesson("");
        setTagsInput("");
        setInitialNote("");
        setIsCreating(false);
        await refetch();
      }
    } catch (err) {
      console.error("Failed to log trade:", err);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/trades/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        if (selectedTradeId === id) setSelectedTradeId(null);
        await refetch();
      }
    } catch (err) {
      console.error("Failed to delete trade:", err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradeId || !newNoteContent.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/trades/${selectedTradeId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newNoteContent }),
      });
      if (res.ok) {
        setNewNoteContent("");
        await refetch();
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedTradeId) return;
    if (!confirm("Delete this note?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/trades/${selectedTradeId}/notes/${noteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        await refetch();
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-48 w-full bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trading Journal</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Log, track, and audit setups, triggers, and cognitive emotions.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Log Trade
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 border border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/10">
          <form onSubmit={handleCreateTrade} className="space-y-6">
            <h3 className="text-lg font-bold">New Trade Log</h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Symbol
                </label>
                <input
                  type="text"
                  placeholder="e.g. SBIN"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Direction
                </label>
                <select
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as "BUY" | "SELL")
                  }
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                >
                  <option value="BUY">BUY (Long)</option>
                  <option value="SELL">SELL (Short)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "OPEN" | "CLOSED")
                  }
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                >
                  <option value="CLOSED">CLOSED (Completed Trade)</option>
                  <option value="OPEN">OPEN (Active Position)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 650.50"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                  required
                />
              </div>

              {status === "CLOSED" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Exit Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 660.00"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Entry Time
                </label>
                <input
                  type="datetime-local"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                  required
                />
              </div>

              {status === "CLOSED" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Exit Time
                  </label>
                  <input
                    type="datetime-local"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Emotion State
                </label>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                >
                  <option value="CONFIDENT">Confident</option>
                  <option value="DISCIPLINED">Disciplined</option>
                  <option value="FEAR">Fear</option>
                  <option value="GREED">Greed</option>
                  <option value="ANXIOUS">Anxious</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Mistake Log
                </label>
                <select
                  value={mistake}
                  onChange={(e) => setMistake(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                >
                  <option value="NONE">None</option>
                  <option value="FOMO">FOMO (Fear of missing out)</option>
                  <option value="OVERTRADING">Overtrading</option>
                  <option value="CHASING">Chasing Price</option>
                  <option value="STOP_LOST_MOVED">Stop Loss Moved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. swing, breakout, support"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Setup / Reason
                </label>
                <textarea
                  placeholder="Describe your entry setup pattern..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Lesson learned
                </label>
                <textarea
                  placeholder="What did this trade teach you?"
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Initial Journal Note (Markdown allowed)
              </label>
              <textarea
                placeholder="# Setup analysis..."
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border dark:border-gray-800 rounded font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="primary" type="submit">
                Save Log
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

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex border dark:border-gray-800 rounded overflow-hidden">
              {(["ALL", "OPEN", "CLOSED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold border-r dark:border-gray-800 last:border-0 transition-colors ${
                    statusFilter === st
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 text-xs border dark:border-gray-800 rounded bg-white dark:bg-gray-900 focus:outline-none w-32 focus:w-48 transition-all"
              />
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2 top-1.5" />
            </div>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-2 py-1 text-xs border dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-500"
            >
              <option value="">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs text-gray-400 flex items-center">
              <Filter className="h-3 w-3 mr-1" /> Sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1 text-xs border dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-500"
            >
              <option value="date_desc">Newest Entry</option>
              <option value="date_asc">Oldest Entry</option>
              <option value="pnl_desc">PnL: High to Low</option>
              <option value="pnl_asc">PnL: Low to High</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 font-semibold">
                    <th className="p-4">Symbol</th>
                    <th className="p-4 text-right">Qty</th>
                    <th className="p-4 text-right">Entry</th>
                    <th className="p-4 text-right">Exit</th>
                    <th className="p-4 text-right">P&L</th>
                    <th className="p-4">Emotion</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        No journal logs match this filter setup.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((trade) => {
                      const isPositive = (trade.pnl || 0) >= 0;
                      return (
                        <tr
                          key={trade.id}
                          onClick={() => setSelectedTradeId(trade.id)}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-850 cursor-pointer transition-colors ${
                            selectedTradeId === trade.id
                              ? "bg-blue-50/30 dark:bg-blue-950/20"
                              : ""
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-base">
                                {trade.symbol}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${trade.direction === "BUY" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400"}`}
                              >
                                {trade.direction}
                              </span>
                              <Badge
                                variant={
                                  trade.status === "CLOSED"
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {trade.status}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(trade.entryTime).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4 text-right">{trade.quantity}</td>
                          <td className="p-4 text-right">
                            ₹{trade.entryPrice.toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            {trade.exitPrice
                              ? `₹${trade.exitPrice.toFixed(2)}`
                              : "-"}
                          </td>
                          <td
                            className={`p-4 text-right font-semibold ${trade.status === "OPEN" ? "text-gray-400" : isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            {trade.status === "OPEN"
                              ? "Open"
                              : `${isPositive ? "+" : ""}₹${(trade.pnl || 0).toLocaleString("en-IN")}`}
                          </td>
                          <td className="p-4">
                            <span className="text-xs uppercase font-medium tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                              {trade.emotion}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrade(trade.id);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Trade Details & Log Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrade ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold flex items-center">
                    {selectedTrade.symbol} Notes
                  </h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTrade.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedTrade.reason && (
                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-gray-400 uppercase tracking-wide">
                        Setup Reason
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedTrade.reason}
                      </p>
                    </div>
                  )}

                  {selectedTrade.lesson && (
                    <div className="text-xs space-y-1 pt-3 border-t dark:border-gray-800">
                      <span className="font-semibold text-gray-400 uppercase tracking-wide">
                        Lesson learned
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedTrade.lesson}
                      </p>
                    </div>
                  )}

                  {selectedTrade.mistake &&
                    selectedTrade.mistake !== "NONE" && (
                      <div className="text-xs space-y-1 pt-3 border-t dark:border-gray-800">
                        <span className="font-semibold text-red-400 uppercase tracking-wide">
                          Mistake Logged
                        </span>
                        <p className="text-red-600 dark:text-red-300">
                          {selectedTrade.mistake}
                        </p>
                      </div>
                    )}
                </div>

                <div className="space-y-3 pt-4 border-t dark:border-gray-800">
                  <h5 className="text-sm font-semibold flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1 text-gray-400" />
                    Journal Notes ({selectedTrade.notes.length})
                  </h5>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTrade.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded relative group border dark:border-gray-855"
                      >
                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
                          <span>
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleAddNote}
                  className="space-y-2 pt-4 border-t dark:border-gray-850"
                >
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Append Note
                  </label>
                  <textarea
                    placeholder="Type new log note (Markdown format)..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border dark:border-gray-800 rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <Button
                    variant="secondary"
                    type="submit"
                    className="w-full text-xs"
                  >
                    Save Note
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">
                Select a trade journal entry from the table to view setups,
                lessons, and attach markdown notes.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Journal Page
const journalRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/journal",
  component: JournalPage,
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
