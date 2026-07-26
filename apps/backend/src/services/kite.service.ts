import { KiteConnect } from "kiteconnect";
import { env } from "../config/env.js";
import { cacheService } from "./cache.service.js";
import {
  MarginInfo,
  HoldingInfo,
  PositionInfo,
  OrderInfo,
} from "@trading-lab/shared";

export class KiteService {
  private getKiteClient(accessToken: string): KiteConnect {
    const kc = new KiteConnect({ api_key: env.KITE_API_KEY });
    kc.setAccessToken(accessToken);
    return kc;
  }

  public async getMargins(accessToken: string): Promise<MarginInfo> {
    const cacheKey = `margins:${accessToken}`;
    const cached = await cacheService.get<MarginInfo>(cacheKey);
    if (cached) return cached;

    let margins: MarginInfo;

    if (
      accessToken === "mock_kite_access_token_xyz789" ||
      env.NODE_ENV === "test"
    ) {
      margins = { available: 284350.0, utilized: 15650.0 };
    } else {
      const kc = this.getKiteClient(accessToken);
      interface RawMargins {
        equity?: {
          available?: {
            cash?: number;
          };
          utilized?: {
            debits?: number;
          };
        };
      }
      const raw = (await kc.getMargins()) as unknown as RawMargins;
      margins = {
        available: Number(raw?.equity?.available?.cash || 0),
        utilized: Number(raw?.equity?.utilized?.debits || 0),
      };
    }

    await cacheService.set(cacheKey, margins, 5); // 5s TTL
    return margins;
  }

  public async getHoldings(accessToken: string): Promise<HoldingInfo[]> {
    const cacheKey = `holdings:${accessToken}`;
    const cached = await cacheService.get<HoldingInfo[]>(cacheKey);
    if (cached) return cached;

    let holdings: HoldingInfo[];

    if (
      accessToken === "mock_kite_access_token_xyz789" ||
      env.NODE_ENV === "test"
    ) {
      holdings = [
        {
          tradingsymbol: "RELIANCE",
          exchange: "NSE",
          quantity: 50,
          averagePrice: 2450.0,
          lastPrice: 2510.5,
          pnl: 3025.0,
        },
        {
          tradingsymbol: "TCS",
          exchange: "NSE",
          quantity: 20,
          averagePrice: 3200.0,
          lastPrice: 3180.0,
          pnl: -400.0,
        },
        {
          tradingsymbol: "INFY",
          exchange: "NSE",
          quantity: 30,
          averagePrice: 1500.0,
          lastPrice: 1530.0,
          pnl: 900.0,
        },
      ];
    } else {
      const kc = this.getKiteClient(accessToken);
      interface RawHolding {
        tradingsymbol: string;
        exchange: string;
        quantity: number;
        average_price: number;
        last_price: number;
        pnl: number;
      }
      const raw = (await kc.getHoldings()) as RawHolding[];
      holdings = raw.map((item) => ({
        tradingsymbol: item.tradingsymbol,
        exchange: item.exchange,
        quantity: Number(item.quantity),
        averagePrice: Number(item.average_price),
        lastPrice: Number(item.last_price),
        pnl: Number(item.pnl),
      }));
    }

    await cacheService.set(cacheKey, holdings, 60); // 60s TTL
    return holdings;
  }

  public async getPositions(accessToken: string): Promise<PositionInfo[]> {
    const cacheKey = `positions:${accessToken}`;
    const cached = await cacheService.get<PositionInfo[]>(cacheKey);
    if (cached) return cached;

    let positions: PositionInfo[];

    if (
      accessToken === "mock_kite_access_token_xyz789" ||
      env.NODE_ENV === "test"
    ) {
      positions = [
        {
          tradingsymbol: "SBIN",
          exchange: "NSE",
          quantity: 100,
          averagePrice: 650.5,
          lastPrice: 660.2,
          pnl: 970.0,
          realized: 0,
          unrealized: 970.0,
        },
        {
          tradingsymbol: "TATASTEEL",
          exchange: "NSE",
          quantity: 0,
          averagePrice: 120.0,
          lastPrice: 125.5,
          pnl: 2750.0,
          realized: 2750.0,
          unrealized: 0,
        },
      ];
    } else {
      const kc = this.getKiteClient(accessToken);
      interface RawPosition {
        tradingsymbol: string;
        exchange: string;
        quantity: number;
        average_price: number;
        last_price: number;
        pnl: number;
        realised: number;
        unrealised: number;
      }
      interface RawPositionsResponse {
        net?: RawPosition[];
      }
      const rawData =
        (await kc.getPositions()) as unknown as RawPositionsResponse;
      const raw = (rawData?.net || []) as RawPosition[];
      positions = raw.map((item) => ({
        tradingsymbol: item.tradingsymbol,
        exchange: item.exchange,
        quantity: Number(item.quantity),
        averagePrice: Number(item.average_price),
        lastPrice: Number(item.last_price),
        pnl: Number(item.pnl),
        realized: Number(item.realised),
        unrealized: Number(item.unrealised),
      }));
    }

    await cacheService.set(cacheKey, positions, 5); // 5s TTL
    return positions;
  }

  public async getOrders(accessToken: string): Promise<OrderInfo[]> {
    const cacheKey = `orders:${accessToken}`;
    const cached = await cacheService.get<OrderInfo[]>(cacheKey);
    if (cached) return cached;

    let orders: OrderInfo[];

    if (
      accessToken === "mock_kite_access_token_xyz789" ||
      env.NODE_ENV === "test"
    ) {
      orders = [
        {
          orderId: "202607190001",
          tradingsymbol: "SBIN",
          transactionType: "BUY",
          quantity: 100,
          price: 650.5,
          status: "COMPLETE",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          orderId: "202607190002",
          tradingsymbol: "TATASTEEL",
          transactionType: "SELL",
          quantity: 500,
          price: 125.5,
          status: "COMPLETE",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
      ];
    } else {
      const kc = this.getKiteClient(accessToken);
      interface RawOrder {
        order_id: string;
        tradingsymbol: string;
        transaction_type: "BUY" | "SELL";
        quantity: number;
        price: number;
        status: string;
        order_timestamp: string;
      }
      const raw = (await kc.getOrders()) as RawOrder[];
      orders = raw.map((item) => ({
        orderId: item.order_id,
        tradingsymbol: item.tradingsymbol,
        transactionType: item.transaction_type,
        quantity: Number(item.quantity),
        price: Number(item.price),
        status: item.status,
        timestamp: item.order_timestamp,
      }));
    }

    await cacheService.set(cacheKey, orders, 5); // 5s TTL
    return orders;
  }

  public async placeOrder(
    accessToken: string,
    params: {
      exchange: string;
      tradingsymbol: string;
      transactionType: "BUY" | "SELL";
      quantity: number;
      price?: number;
      orderType: "MARKET" | "LIMIT";
      product: "MIS" | "CNC";
    },
  ): Promise<{ orderId: string }> {
    if (
      accessToken === "mock_kite_access_token_xyz789" ||
      env.NODE_ENV === "test"
    ) {
      const orderId = `MOCK_ORD_${Math.floor(100000 + Math.random() * 900000)}`;
      await cacheService.del(`orders:${accessToken}`);
      await cacheService.del(`positions:${accessToken}`);
      return { orderId };
    } else {
      const kc = this.getKiteClient(accessToken);
      const res = (await kc.placeOrder("regular", {
        exchange: params.exchange,
        tradingsymbol: params.tradingsymbol,
        transaction_type: params.transactionType,
        quantity: params.quantity,
        order_type: params.orderType,
        product: params.product,
        price: params.price,
        validity: "DAY",
      })) as { order_id?: string };
      await cacheService.del(`orders:${accessToken}`);
      await cacheService.del(`positions:${accessToken}`);
      return { orderId: res.order_id || String(res) };
    }
  }

  public async cancelOrder(
    accessToken: string,
    orderId: string,
  ): Promise<{ orderId: string }> {
    if (
      accessToken === "mock_kite_access_token_xyz789" ||
      env.NODE_ENV === "test"
    ) {
      await cacheService.del(`orders:${accessToken}`);
      return { orderId };
    } else {
      const kc = this.getKiteClient(accessToken);
      await kc.cancelOrder("regular", orderId);
      await cacheService.del(`orders:${accessToken}`);
      return { orderId };
    }
  }
}

export const kiteService = new KiteService();
