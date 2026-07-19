declare module "kiteconnect" {
  export interface KiteSession {
    access_token: string;
    user_id: string;
    user_name: string;
    email: string;
    public_token: string;
    refresh_token?: string;
  }

  export interface KiteConnectOptions {
    api_key: string;
  }

  export class KiteConnect {
    constructor(options: KiteConnectOptions);
    public getLoginURL(): string;
    public generateSession(
      request_token: string,
      api_secret: string,
    ): Promise<KiteSession>;
    public setAccessToken(access_token: string): void;
    public getMargins(): Promise<unknown>;
    public getHoldings(): Promise<unknown>;
    public getPositions(): Promise<unknown>;
    public getOrders(): Promise<unknown>;
  }
}
