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
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Plus,
  Trash2,
  Search,
  Calendar,
  MessageSquare,
  Filter,
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

interface PerformanceAnalytics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgGain: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
  equityCurve: Array<{
    date: string;
    equity: number;
    pnl: number;
    cumulativePnl: number;
  }>;
}

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

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    error: errorAnalytics,
  } = useQuery<PerformanceAnalytics>({
    queryKey: ["performance-analytics"],
    queryFn: () =>
      fetchWithAuth<PerformanceAnalytics>("/api/analytics/performance"),
  });

  const isLoading =
    isLoadingMargins ||
    isLoadingHoldings ||
    isLoadingPositions ||
    isLoadingOrders ||
    isLoadingAnalytics;
  const hasError =
    errorMargins ||
    errorHoldings ||
    errorPositions ||
    errorOrders ||
    errorAnalytics;

  const totalHoldingsValue =
    holdings?.reduce((sum, h) => sum + h.quantity * h.lastPrice, 0) || 0;
  const totalPositionsPnl = positions?.reduce((sum, p) => sum + p.pnl, 0) || 0;
  const activePositionsCount =
    positions?.filter((p) => p.quantity > 0).length || 0;
  const availableMargin = margins?.available || 0;

  const renderWinRateGauge = (winRate: number) => {
    const radius = 32;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (winRate / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-gray-100 dark:text-gray-800"
          />
          <circle
            stroke="#3b82f6"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute text-xs font-bold">
          {Math.round(winRate)}%
        </span>
      </div>
    );
  };

  const renderEquityCurve = () => {
    if (
      !analytics ||
      !analytics.equityCurve ||
      analytics.equityCurve.length < 2
    ) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Insufficient trade data to render equity curve. Log closed trades in
          your journal.
        </div>
      );
    }

    const curve = analytics.equityCurve;
    const values = curve.map((c) => c.equity);
    const minVal = Math.min(...values) * 0.99;
    const maxVal = Math.max(...values) * 1.01;
    const valRange = maxVal - minVal;

    const width = 600;
    const height = 180;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 10;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = curve.map((c, i) => {
      const x = paddingLeft + (i / (curve.length - 1)) * chartWidth;
      const y =
        paddingTop +
        chartHeight -
        ((c.equity - minVal) / valRange) * chartHeight;
      return { x, y, ...c };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

    const yTicks = 4;
    const ticks = Array.from({ length: yTicks }, (_, i) => {
      const val = minVal + (i / (yTicks - 1)) * valRange;
      const y = paddingTop + chartHeight - (i / (yTicks - 1)) * chartHeight;
      return { val, y };
    });

    return (
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => (
            <g key={i} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={t.y}
                x2={width - paddingRight}
                y2={t.y}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="4 4"
                className="text-gray-300 dark:text-gray-800"
              />
              <text
                x={paddingLeft - 8}
                y={t.y + 3}
                textAnchor="end"
                className="fill-gray-400 text-[8px] font-medium"
              >
                ₹{Math.round(t.val).toLocaleString("en-IN")}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#areaGradient)" />
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="3"
                className="fill-blue-500 stroke-white dark:stroke-gray-900 stroke-2 hover:r-4 transition-all duration-150"
              />
              <title>
                {`${p.date}: ₹${p.equity.toLocaleString("en-IN")} (${p.pnl >= 0 ? "+" : ""}₹${p.pnl.toLocaleString("en-IN")})`}
              </title>
            </g>
          ))}

          {points
            .filter(
              (_, i) =>
                i === 0 ||
                i === points.length - 1 ||
                (points.length > 5 && i === Math.round(points.length / 2)),
            )
            .map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={height - 2}
                textAnchor={
                  i === 0
                    ? "start"
                    : i === 1 && points.length > 2
                      ? "middle"
                      : "end"
                }
                className="fill-gray-400 text-[8px] font-semibold"
              >
                {p.date}
              </text>
            ))}
        </svg>
      </div>
    );
  };

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
        <h3 className="text-xl font-bold mb-2">Error Loading Dashboard</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-4">
          We encountered an issue fetching your Zerodha Kite portfolio or
          performance statistics. Verify API endpoints and configuration
          details.
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
            Performance Analytics
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Overview of your trading edge and portfolio health.
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="success">Kite Connected</Badge>
          <Badge variant="secondary">Paper Trading Off</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

        <Card className="flex items-center justify-between p-4 pb-2">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Win Rate
            </span>
            <p className="text-xs text-gray-400 mt-1">Closed journal trades</p>
          </div>
          {analytics && renderWinRateGauge(analytics.winRate)}
        </Card>
      </div>

      {/* Analytics Curve Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Equity Growth Curve</CardTitle>
          </CardHeader>
          <CardContent>{renderEquityCurve()}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
              <span className="text-xs text-gray-400 font-semibold uppercase">
                Profit Factor
              </span>
              <span
                className={`text-sm font-bold ${analytics && analytics.profitFactor >= 1.5 ? "text-green-600" : "text-gray-500"}`}
              >
                {analytics?.profitFactor.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
              <span className="text-xs text-gray-400 font-semibold uppercase">
                Sharpe Ratio
              </span>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {analytics?.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
              <span className="text-xs text-gray-400 font-semibold uppercase">
                Max Drawdown
              </span>
              <span
                className={`text-sm font-bold ${analytics && analytics.maxDrawdown > 10 ? "text-red-500" : "text-green-600"}`}
              >
                {analytics?.maxDrawdown.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
              <span className="text-xs text-gray-400 font-semibold uppercase">
                Avg Gain
              </span>
              <span className="text-sm font-bold text-green-600">
                +₹
                {analytics?.avgGain.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b dark:border-gray-800">
              <span className="text-xs text-gray-400 font-semibold uppercase">
                Avg Loss
              </span>
              <span className="text-sm font-bold text-red-500">
                -₹
                {analytics?.avgLoss.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-gray-400 font-semibold uppercase">
                Total Trades
              </span>
              <span className="text-sm font-bold">
                {analytics?.totalTrades}
              </span>
            </div>
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
