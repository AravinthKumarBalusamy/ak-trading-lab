import fs from "fs";
import path from "path";
const DATA_DIR = path.join(__dirname, "../../data");
const CSV_PATH = path.join(DATA_DIR, "instruments.csv");

export interface Instrument {
  tradingsymbol: string;
  name: string;
  exchange: string;
}

export class InstrumentService {
  private instruments: Instrument[] = [];
  private isLoaded = false;

  private fallbackInstruments: Instrument[] = [
    {
      tradingsymbol: "RELIANCE",
      name: "RELIANCE INDUSTRIES LTD",
      exchange: "NSE",
    },
    {
      tradingsymbol: "TCS",
      name: "TATA CONSULTANCY SERVICES LTD",
      exchange: "NSE",
    },
    { tradingsymbol: "INFY", name: "INFOSYS LTD", exchange: "NSE" },
    { tradingsymbol: "SBIN", name: "STATE BANK OF INDIA", exchange: "NSE" },
    { tradingsymbol: "HDFCBANK", name: "HDFC BANK LTD", exchange: "NSE" },
    { tradingsymbol: "ICICIBANK", name: "ICICI BANK LTD", exchange: "NSE" },
    {
      tradingsymbol: "BHARTIAIRTEL",
      name: "BHARTI AIRTEL LTD",
      exchange: "NSE",
    },
    { tradingsymbol: "ITC", name: "ITC LTD", exchange: "NSE" },
    { tradingsymbol: "LTIM", name: "LTIMINDTREE LTD", exchange: "NSE" },
    { tradingsymbol: "LT", name: "LARSEN & TOUBRO LTD", exchange: "NSE" },
    { tradingsymbol: "TATASTEEL", name: "TATA STEEL LTD", exchange: "NSE" },
    { tradingsymbol: "AXISBANK", name: "AXIS BANK LTD", exchange: "NSE" },
    {
      tradingsymbol: "KOTAKBANK",
      name: "KOTAK MAHINDRA BANK LTD",
      exchange: "NSE",
    },
    {
      tradingsymbol: "MARUTI",
      name: "MARUTI SUZUKI INDIA LTD",
      exchange: "NSE",
    },
    { tradingsymbol: "WIPRO", name: "WIPRO LTD", exchange: "NSE" },
    { tradingsymbol: "HCLTECH", name: "HCL TECHNOLOGIES LTD", exchange: "NSE" },
    {
      tradingsymbol: "SUNPHARMA",
      name: "SUN PHARMACEUTICAL INDUSTRIES LTD",
      exchange: "NSE",
    },
    { tradingsymbol: "ASIANPAINT", name: "ASIAN PAINTS LTD", exchange: "NSE" },
    {
      tradingsymbol: "ULTRACEMCO",
      name: "ULTRATECH CEMENT LTD",
      exchange: "NSE",
    },
  ];

  public async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      let csvContent = "";
      let isCacheValid = false;

      if (fs.existsSync(CSV_PATH)) {
        const stats = fs.statSync(CSV_PATH);
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        if (ageHours < 24) {
          isCacheValid = true;
        }
      }

      if (isCacheValid) {
        console.log("📂 Loading instruments from local cache...");
        csvContent = fs.readFileSync(CSV_PATH, "utf8");
      } else {
        console.log("🌐 Downloading daily instruments CSV from Zerodha...");
        try {
          const res = await fetch("https://api.kite.trade/instruments");
          if (!res.ok) throw new Error(`HTTP status ${res.status}`);
          csvContent = await res.text();
          fs.writeFileSync(CSV_PATH, csvContent, "utf8");
          console.log("✅ Instruments CSV saved successfully.");
        } catch (downloadError) {
          console.warn(
            "⚠️ Failed to download instruments from Kite, checking local cache:",
            downloadError,
          );
          if (fs.existsSync(CSV_PATH)) {
            console.log(
              "📂 Loading instruments from expired local cache as fallback...",
            );
            csvContent = fs.readFileSync(CSV_PATH, "utf8");
          } else {
            console.log(
              "🌱 No cached CSV found, seeding with default NSE instruments...",
            );
            this.instruments = [...this.fallbackInstruments];
            this.isLoaded = true;
            return;
          }
        }
      }

      this.parseCsv(csvContent);
      this.isLoaded = true;
      console.log(
        `🚀 Loaded ${this.instruments.length} instruments in-memory.`,
      );
    } catch (err) {
      console.error(
        "❌ Failed to initialize instruments search service, falling back:",
        err,
      );
      this.instruments = [...this.fallbackInstruments];
      this.isLoaded = true;
    }
  }

  private parseCsv(content: string): void {
    const lines = content.split("\n");
    const parsed: Instrument[] = [];

    // Skip headers
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",");
      if (cols.length < 12) continue;

      const tradingsymbol = cols[2];
      const name = cols[3];
      const exchange = cols[11];

      // Keep NSE/BSE stocks
      if (exchange === "NSE" || exchange === "BSE") {
        parsed.push({
          tradingsymbol: tradingsymbol.replace(/"/g, ""),
          name: name.replace(/"/g, ""),
          exchange: exchange.replace(/"/g, ""),
        });
      }
    }

    this.instruments =
      parsed.length > 0 ? parsed : [...this.fallbackInstruments];
  }

  public async search(query: string, limit = 10): Promise<Instrument[]> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    const q = query.toUpperCase().trim();
    if (!q) return [];

    const matches: Instrument[] = [];
    for (const inst of this.instruments) {
      if (
        inst.tradingsymbol.includes(q) ||
        inst.name.toUpperCase().includes(q)
      ) {
        matches.push(inst);
        if (matches.length >= limit) break;
      }
    }

    return matches;
  }
}

export const instrumentService = new InstrumentService();
