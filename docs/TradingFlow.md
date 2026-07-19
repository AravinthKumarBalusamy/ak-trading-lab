# Trading Integration & Authentication Flow

This document details the authentication and data flow for the Zerodha Kite Connect integration.

## Kite Connect OAuth Authentication Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Trader as User / Trader
    participant SPA as React Frontend (SPA)
    participant API as Express Backend
    participant Redis as Redis Cache
    participant Kite as Zerodha Kite API

    Trader->>SPA: Click "Connect Zerodha Kite"
    SPA->>API: Request Login Initiation
    API->>SPA: Redirect to Zerodha Login URL
    SPA->>Kite: Load Zerodha Login Screen
    Trader->>Kite: Input Zerodha Credentials & OTP
    Kite->>SPA: Redirect to redirect_url with ?request_token=xyz
    SPA->>API: Send request_token to `/auth/callback`
    API->>Kite: Exchange request_token + api_secret for access_token
    Kite-->>API: Return access_token & user details
    API->>Redis: Cache access_token (expires at end of day)
    API->>SPA: Return JWT session token (for SPA -> API calls)
    SPA->>Trader: Show Connected Dashboard
```

---

## Token Cache & Session Strategy

1. **Access Token Lifespan**:
   - Zerodha Kite Connect access tokens expire daily (around 6:00 AM IST).
   - A new login token must be fetched at the beginning of each trading day.

2. **Session Storage**:
   - Active sessions are saved securely.
   - Redis stores the active `access_token` mapped to the user session, avoiding roundtrips to Zerodha for every API call.
   - Client-side auth is maintained using a secure JWT cookie or HTTP header.
