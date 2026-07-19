# API Documentation

This document describes the REST API endpoints and error contracts for the TradingLab backend.

## Base URL

All API calls are prefixed with:

```
/api
```

---

## Endpoints

### Health Check

Verifies backend server status and tests PostgreSQL database connectivity by executing a database ping.

- **URL**: `/health`
- **Method**: `GET`
- **Headers**: `Content-Type: application/json`
- **Response (Success - 200 OK)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-07-19T22:33:00.000Z",
    "uptime": 12.35
  }
  ```
- **Response (Database Down - 500 Internal Error)**:
  ```json
  {
    "status": "error",
    "message": "Internal Server Error"
  }
  ```

---

## Error Handling Contract

Errors returned by the server follow a consistent structure.

### Error Response Schema

```json
{
  "status": "error",
  "message": "Detailed description of the error."
}
```

### Standard Status Codes

- **400 Bad Request**: Input validation failures or malformed JSON payloads.
- **401 Unauthorized**: Missing or expired auth token / Zerodha session keys.
- **403 Forbidden**: Access denied to requested resources.
- **404 Not Found**: Resource or route not found.
- **500 Internal Server Error**: Unhandled exceptions (database failures, system crashes). Stack traces are hidden in production and sanitised messages are returned.
