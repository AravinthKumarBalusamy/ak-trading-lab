import { useState, useEffect } from "react";
import { Button } from "@trading-lab/ui";
import { HealthCheckResponse } from "@trading-lab/shared";

function App() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("API check failed");
        return res.json() as Promise<HealthCheckResponse>;
      })
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-extrabold mb-4 text-center tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Trading Lab
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Production-grade personal stock trading dashboard.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="font-semibold text-lg mb-2">
              Backend Connection Status:
            </h2>
            {loading && <p className="text-yellow-600">Checking API...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {health && (
              <div className="text-sm space-y-1">
                <p>
                  Status:{" "}
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {health.status}
                  </span>
                </p>
                <p>Timestamp: {new Date(health.timestamp).toLocaleString()}</p>
                <p>Uptime: {health.uptime.toFixed(1)}s</p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-2">
            <Button variant="primary" onClick={() => alert("Button Clicked!")}>
              Primary Action
            </Button>
            <Button
              variant="secondary"
              onClick={() => alert("Secondary Action Clicked!")}
            >
              Secondary Action
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
