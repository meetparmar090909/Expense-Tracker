import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis } from "recharts";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  type LucideIcon,
  Receipt, 
  PlusCircle, 
  Settings as SettingsIcon, 
  LogOut, 
  Wallet,
  TrendingDown,
  Target,
  ArrowUpRight,
  FileDown,
  Bell,
  Search,
} from "lucide-react";

// ─── Configuration ────────────────────────────────────────────────
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5001/api";

// ─── Types ────────────────────────────────────────────────────────
type Category = "Food" | "Transport" | "Shopping" | "Bills" | "Health" | "Entertainment" | "Education" | "Other";
type Currency = "USD" | "AED" | "INR" | "EUR" | "GBP";
type ThemePreference = "monochrome" | "forest" | "ivory" | "ocean" | "sunset" | "ruby";
type View = "dashboard" | "expenses" | "add" | "trips" | "settings";

interface User { id: string; name: string; email: string; monthlyBudget: number; currency: Currency; themePreference: ThemePreference; }
interface Expense { _id: string; title: string; amount: number; category: Category; date: string; note?: string; }
interface Stats { categoryBreakdown: { _id: string; total: number; count: number }[]; dailySpending: { _id: number; total: number }[]; totalSpent: number; }
interface ExpenseFormState { title: string; amount: string; category: Category; date: string; note: string; }
interface GoogleCredentialResponse { credential: string; }
interface TripParticipantFormState { name: string; contributedAmount: string; }
interface TripExpenseFormState { title: string; amount: string; paidBy: string; date: string; note: string; }
interface TripFormState {
  title: string;
  destination: string;
  currency: Currency;
  startDate: string;
  endDate: string;
  note: string;
  participants: TripParticipantFormState[];
  expenses: TripExpenseFormState[];
}
interface TripParticipant { name: string; contributedAmount: number; }
interface TripExpense { title: string; amount: number; paidBy: string; date: string; note?: string; }
interface TripSummary {
  totalContributed: number;
  totalSpent: number;
  remainingBalance: number;
  sharePerPerson: number;
  participantCount: number;
  settlements: { name: string; contributedAmount: number; share: number; net: number; status: string }[];
}
interface Trip {
  _id: string;
  title: string;
  destination?: string;
  currency: Currency;
  startDate?: string;
  endDate?: string;
  note?: string;
  participants: TripParticipant[];
  expenses: TripExpense[];
  summary: TripSummary;
  createdAt: string;
  updatedAt: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
            },
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

// ─── Constants ───────────────────────────────────────────────────
const THEME = {
  primary: "var(--theme-primary)",
  secondary: "var(--theme-secondary)",
  accent: "var(--theme-accent)",
  bg: "var(--theme-bg)",
  bgSoft: "var(--theme-bg-soft)",
  surface: "var(--theme-surface)",
  surfaceStrong: "var(--theme-surface-strong)",
  border: "var(--theme-border)",
  borderStrong: "var(--theme-border-strong)",
  textMain: "var(--theme-text-main)",
  textDim: "var(--theme-text-dim)",
  textMuted: "var(--theme-text-muted)",
  buttonBg: "var(--theme-button-bg)",
  buttonText: "var(--theme-button-text)",
  activeBg: "var(--theme-active-bg)",
  activeText: "var(--theme-active-text)",
  glow: "var(--theme-glow)",
};

const THEME_PALETTES: Record<ThemePreference, Record<string, string>> = {
  monochrome: {
    "--theme-primary": "#ffffff",
    "--theme-secondary": "#d6d6d6",
    "--theme-accent": "#f3f3f3",
    "--theme-bg": "#050505",
    "--theme-bg-soft": "#0d0d0d",
    "--theme-surface": "rgba(255, 255, 255, 0.04)",
    "--theme-surface-strong": "rgba(255, 255, 255, 0.08)",
    "--theme-border": "rgba(255, 255, 255, 0.12)",
    "--theme-border-strong": "rgba(255, 255, 255, 0.24)",
    "--theme-text-main": "#ffffff",
    "--theme-text-dim": "rgba(255, 255, 255, 0.64)",
    "--theme-text-muted": "rgba(255, 255, 255, 0.38)",
    "--theme-button-bg": "#ffffff",
    "--theme-button-text": "#000000",
    "--theme-active-bg": "#ffffff",
    "--theme-active-text": "#000000",
    "--theme-glow": "rgba(255,255,255,0.16)",
  },
  forest: {
    "--theme-primary": "#dfffe4",
    "--theme-secondary": "#9de6a8",
    "--theme-accent": "#76d28a",
    "--theme-bg": "#06110a",
    "--theme-bg-soft": "#102017",
    "--theme-surface": "rgba(94, 179, 112, 0.12)",
    "--theme-surface-strong": "rgba(118, 210, 138, 0.18)",
    "--theme-border": "rgba(157, 230, 168, 0.22)",
    "--theme-border-strong": "rgba(157, 230, 168, 0.42)",
    "--theme-text-main": "#f3fff4",
    "--theme-text-dim": "rgba(223, 255, 228, 0.78)",
    "--theme-text-muted": "rgba(223, 255, 228, 0.5)",
    "--theme-button-bg": "#9de6a8",
    "--theme-button-text": "#06250d",
    "--theme-active-bg": "#dfffe4",
    "--theme-active-text": "#06250d",
    "--theme-glow": "rgba(157,230,168,0.18)",
  },
  ivory: {
    "--theme-primary": "#fff6e8",
    "--theme-secondary": "#e8d6b9",
    "--theme-accent": "#d6b985",
    "--theme-bg": "#110d08",
    "--theme-bg-soft": "#1a140d",
    "--theme-surface": "rgba(255, 246, 232, 0.06)",
    "--theme-surface-strong": "rgba(255, 246, 232, 0.12)",
    "--theme-border": "rgba(255, 246, 232, 0.14)",
    "--theme-border-strong": "rgba(255, 246, 232, 0.28)",
    "--theme-text-main": "#fff9f1",
    "--theme-text-dim": "rgba(255, 246, 232, 0.76)",
    "--theme-text-muted": "rgba(255, 246, 232, 0.5)",
    "--theme-button-bg": "#fff6e8",
    "--theme-button-text": "#1a140d",
    "--theme-active-bg": "#fff6e8",
    "--theme-active-text": "#1a140d",
    "--theme-glow": "rgba(255,246,232,0.16)",
  },
  ocean: {
    "--theme-primary": "#dff5ff",
    "--theme-secondary": "#8fd3ff",
    "--theme-accent": "#56b8ff",
    "--theme-bg": "#05111a",
    "--theme-bg-soft": "#0a1c29",
    "--theme-surface": "rgba(86, 184, 255, 0.08)",
    "--theme-surface-strong": "rgba(86, 184, 255, 0.14)",
    "--theme-border": "rgba(143, 211, 255, 0.16)",
    "--theme-border-strong": "rgba(143, 211, 255, 0.34)",
    "--theme-text-main": "#eef9ff",
    "--theme-text-dim": "rgba(223, 245, 255, 0.76)",
    "--theme-text-muted": "rgba(223, 245, 255, 0.5)",
    "--theme-button-bg": "#8fd3ff",
    "--theme-button-text": "#062238",
    "--theme-active-bg": "#dff5ff",
    "--theme-active-text": "#062238",
    "--theme-glow": "rgba(86,184,255,0.18)",
  },
  sunset: {
    "--theme-primary": "#fff0dc",
    "--theme-secondary": "#ffbf7a",
    "--theme-accent": "#ff9252",
    "--theme-bg": "#160904",
    "--theme-bg-soft": "#261008",
    "--theme-surface": "rgba(255, 146, 82, 0.08)",
    "--theme-surface-strong": "rgba(255, 146, 82, 0.14)",
    "--theme-border": "rgba(255, 191, 122, 0.18)",
    "--theme-border-strong": "rgba(255, 191, 122, 0.34)",
    "--theme-text-main": "#fff8f1",
    "--theme-text-dim": "rgba(255, 240, 220, 0.78)",
    "--theme-text-muted": "rgba(255, 240, 220, 0.5)",
    "--theme-button-bg": "#ffbf7a",
    "--theme-button-text": "#2c1308",
    "--theme-active-bg": "#fff0dc",
    "--theme-active-text": "#2c1308",
    "--theme-glow": "rgba(255,146,82,0.18)",
  },
  ruby: {
    "--theme-primary": "#ffe3eb",
    "--theme-secondary": "#ff9bb6",
    "--theme-accent": "#ff6f96",
    "--theme-bg": "#17060d",
    "--theme-bg-soft": "#280b15",
    "--theme-surface": "rgba(255, 111, 150, 0.08)",
    "--theme-surface-strong": "rgba(255, 111, 150, 0.14)",
    "--theme-border": "rgba(255, 155, 182, 0.18)",
    "--theme-border-strong": "rgba(255, 155, 182, 0.34)",
    "--theme-text-main": "#fff2f6",
    "--theme-text-dim": "rgba(255, 227, 235, 0.78)",
    "--theme-text-muted": "rgba(255, 227, 235, 0.5)",
    "--theme-button-bg": "#ff9bb6",
    "--theme-button-text": "#300813",
    "--theme-active-bg": "#ffe3eb",
    "--theme-active-text": "#300813",
    "--theme-glow": "rgba(255,111,150,0.18)",
  },
};

const THEME_OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: "monochrome", label: "Black / White", description: "Sharp monochrome workspace" },
  { value: "forest", label: "Green", description: "Dark green finance theme" },
  { value: "ivory", label: "Warm Light", description: "Soft light dashboard" },
  { value: "ocean", label: "Ocean Blue", description: "Deep blue finance theme" },
  { value: "sunset", label: "Sunset", description: "Warm orange evening palette" },
  { value: "ruby", label: "Ruby", description: "Dark red / pink accent theme" },
];

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#ffffff", Transport: "#d9d9d9", Shopping: "#bfbfbf",
  Bills: "#a3a3a3", Health: "#8a8a8a", Entertainment: "#737373",
  Education: "#5a5a5a", Other: "#404040"
};
const CATEGORY_ICONS: Record<Category, string> = {
  Food: "🍔", Transport: "🚗", Shopping: "🛍️",
  Bills: "⚡", Health: "💊", Entertainment: "🎬",
  Education: "📚", Other: "📦"
};
const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: "$", AED: "د.إ", INR: "₹", EUR: "€", GBP: "£" };
const CURRENCIES: Currency[] = ["USD", "AED", "INR", "EUR", "GBP"];
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// ─── Helpers ─────────────────────────────────────────────────────
const formatCurrency = (currency: Currency, value: number) =>
  `${CURRENCY_SYMBOLS[currency]}${value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

const useViewport = () => {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1100,
  };
};

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const getStoredUser = (): User | null => {
  const savedUser = localStorage.getItem("user");
  if (!savedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(savedUser) as Partial<User>;
    if (!parsedUser.id || !parsedUser.name || !parsedUser.email || !parsedUser.currency) {
      localStorage.removeItem("user");
      return null;
    }

    return {
      id: parsedUser.id,
      name: parsedUser.name,
      email: parsedUser.email,
      monthlyBudget: parsedUser.monthlyBudget ?? 5000,
      currency: parsedUser.currency,
      themePreference: parsedUser.themePreference ?? "monochrome",
    };
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

// ─── Styled Components (Mock) ────────────────────────────────────
const glassStyle: React.CSSProperties = {
  background: THEME.surface,
  backdropFilter: "blur(24px)",
  border: `1px solid ${THEME.border}`,
  borderRadius: "28px",
  boxShadow: "0 24px 120px rgba(0, 0, 0, 0.35)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  background: "rgba(255, 255, 255, 0.03)",
  border: `1px solid ${THEME.border}`,
  borderRadius: "18px",
  color: "#fff",
  fontSize: "15px",
  outline: "none",
};

// ─── Login View ──────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (u: User, token: string) => void }) {
  const { isMobile, isTablet } = useViewport();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; password: string }>({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
        const endpoint = isRegister ? "/auth/register" : "/auth/login";
        const res = await axios.post(`${API_URL}${endpoint}`, form);
        onLogin(res.data.user, res.data.token);
    } catch (error: unknown) {
        setErr(getErrorMessage(error, "Auth failed."));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return;
    }

    const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
      setLoading(true);
      setErr("");

      try {
        const res = await axios.post(`${API_URL}/auth/google`, {
          credential: response.credential,
        });
        onLogin(res.data.user, res.data.token);
      } catch (error: unknown) {
        setErr(getErrorMessage(error, "Google sign-in failed."));
      } finally {
        setLoading(false);
      }
    };

    const renderGoogleButton = () => {
      if (!googleButtonRef.current || !window.google?.accounts.id) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          void handleGoogleCredential(response);
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 340,
        text: "continue_with",
        shape: "pill",
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (window.google?.accounts.id) {
      renderGoogleButton();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton);
    }

    return () => {
      existingScript?.removeEventListener("load", renderGoogleButton);
      window.google?.accounts.id.cancel();
    };
  }, [onLogin]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          `radial-gradient(circle at top left, ${THEME.glow}, transparent 30%), radial-gradient(circle at bottom right, ${THEME.glow}, transparent 28%), ${THEME.bg}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "1120px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "repeat(2, minmax(0, 1fr))",
          gap: "24px",
        }}
      >
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          style={{
            ...glassStyle,
            minHeight: isMobile ? "auto" : "680px",
            padding: isMobile ? "28px" : "42px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
            style={{
              position: "absolute",
              top: "-140px",
              right: "-120px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              border: `1px solid ${THEME.border}`,
              opacity: 0.5,
            }}
          />
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            style={{
              position: "absolute",
              bottom: "72px",
              right: "56px",
              width: "120px",
              height: "120px",
              borderRadius: "24px",
              border: `1px solid ${THEME.border}`,
              background: "rgba(255,255,255,0.03)",
            }}
          />

          <div>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "28px",
                border: `1px solid ${THEME.borderStrong}`,
                background: "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "28px",
              }}
            >
              <Wallet size={40} color="#fff" />
            </motion.div>
            <div style={{ color: THEME.textMuted, fontSize: "12px", letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: "12px" }}>
              Expense Tracker
            </div>
            <h1 style={{ fontSize: "clamp(42px, 6vw, 72px)", lineHeight: 0.95, margin: 0, fontWeight: 900, letterSpacing: "-0.05em" }}>
              Track spending with calm, sharp clarity.
            </h1>
            <p style={{ color: THEME.textDim, fontSize: "17px", maxWidth: "420px", lineHeight: 1.7, marginTop: "22px" }}>
              A monochrome expense dashboard with focused budget control, faster entry, and a cleaner sign-in flow.
            </p>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {[
              "Monitor your spending with intuitive charts",
              "Use email or Google sign-in for the same workspace",
              "Review recent spending and export clean reports",
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  color: THEME.textDim,
                  padding: "14px 16px",
                  borderRadius: "18px",
                  border: `1px solid ${THEME.border}`,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#fff" }} />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.16, duration: 0.7 }}
          style={{ ...glassStyle, padding: isMobile ? "28px 20px" : "40px 34px", alignSelf: "center" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: THEME.textMuted, fontSize: "12px", letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: "10px" }}>
                {isRegister ? "Create Profile" : "Welcome Back"}
              </div>
              <h2 style={{ margin: 0, fontSize: "34px", lineHeight: 1, fontWeight: 900 }}>
                {isRegister ? "Open your budget space" : "Enter your dashboard"}
              </h2>
            </div>
            <div
              style={{
                border: `1px solid ${THEME.border}`,
                background: "rgba(255,255,255,0.03)",
                padding: "6px",
                borderRadius: "999px",
                display: "flex",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                style={{
                  border: "none",
                background: isRegister ? "transparent" : THEME.activeBg,
                  color: isRegister ? THEME.textDim : THEME.activeText,
                  borderRadius: "999px",
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: isMobile ? 1 : undefined,
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                style={{
                  border: "none",
                  background: isRegister ? THEME.activeBg : "transparent",
                  color: isRegister ? THEME.activeText : THEME.textDim,
                  borderRadius: "999px",
                  padding: "10px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: isMobile ? 1 : undefined,
                }}
              >
                Register
              </button>
            </div>
          </div>

          <form onSubmit={handle}>
            <AnimatePresence mode="wait">
              {isRegister && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                  <label style={{ display: "block", color: THEME.textDim, fontSize: "13px", marginBottom: "8px" }}>Full name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Meet Parmar" style={{ ...inputStyle, marginBottom: "16px" }} />
                </motion.div>
              )}
            </AnimatePresence>

            <label style={{ display: "block", color: THEME.textDim, fontSize: "13px", marginBottom: "8px" }}>Email address</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" style={{ ...inputStyle, marginBottom: "16px" }} />

            <label style={{ display: "block", color: THEME.textDim, fontSize: "13px", marginBottom: "8px" }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" style={{ ...inputStyle, marginBottom: "18px" }} />

            <p style={{ color: THEME.textMuted, fontSize: "12px", lineHeight: 1.6, marginTop: 0, marginBottom: "22px" }}>
              Secure encryption for all your financial records and personal data.
            </p>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              style={{
                width: "100%",
                padding: "18px",
                background: THEME.buttonBg,
                border: "none",
                borderRadius: "18px",
                color: THEME.buttonText,
                fontWeight: 900,
                cursor: "pointer",
                fontSize: "16px",
                letterSpacing: "-0.01em",
                boxShadow: "0 10px 40px rgba(255,255,255,0.12)",
              }}
            >
              {loading ? "Syncing..." : isRegister ? "Create account" : "Sign in"}
            </motion.button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0 16px" }}>
            <div style={{ flex: 1, height: "1px", background: THEME.border }} />
            <span style={{ color: THEME.textMuted, fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: THEME.border }} />
          </div>
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleButtonRef} style={{ display: "flex", justifyContent: "center", minHeight: "44px", overflowX: "auto" }} />
          ) : (
            <p style={{ color: THEME.textDim, textAlign: "center", fontSize: "13px" }}>
              Set <code style={{ color: THEME.textMain }}>VITE_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
            </p>
          )}
          <p style={{ textAlign: "center", marginTop: "24px", color: THEME.textDim, fontSize: "14px" }}>
            {isRegister ? "Already registered? " : "Need an account? "}
            <span onClick={() => setIsRegister(!isRegister)} style={{ color: THEME.textMain, fontWeight: 800, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "4px" }}>
              {isRegister ? "Sign in" : "Create one"}
            </span>
          </p>
          {err && <p style={{ color: THEME.textMain, textAlign: "center", marginTop: "16px", fontSize: "13px", padding: "12px 14px", borderRadius: "14px", background: THEME.surfaceStrong, border: `1px solid ${THEME.border}` }}>{err}</p>}
        </motion.section>
      </motion.div>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────
function StatCard({ icon: Icon, label, value, trend, color }: { icon: LucideIcon; label: string; value: string; trend?: string; color: string }) {
  const { isMobile } = useViewport();
  return (
    <motion.div whileHover={{ y: -4 }} style={{ ...glassStyle, padding: isMobile ? "20px" : "28px", flex: isMobile ? "1 1 100%" : "1 1 280px", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", border: `1px solid ${THEME.border}` }}>
        <Icon size={28} color={color} />
      </div>
      <div style={{ color: THEME.textDim, fontSize: "12px", fontWeight: 700, letterSpacing: "1px", marginBottom: "8px" }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: "32px", fontWeight: 900 }}>{value}</div>
      {trend && <div style={{ color: THEME.textDim, fontSize: "13px", marginTop: "8px", fontWeight: 600 }}>{trend} vs last month</div>}
    </motion.div>
  );
}

// ─── Dashboard View ──────────────────────────────────────────────
function DashboardView({ expenses, stats, user, trips, onLogout }: { expenses: Expense[]; stats: Stats; user: User; trips: Trip[]; onLogout: () => void }) {
  const { isMobile } = useViewport();
  const pieData = stats.categoryBreakdown.map(c => ({ name: c._id, value: c.total, color: CATEGORY_COLORS[c._id as Category] || "#6B7280" }));
  const barData = stats.dailySpending.map(d => ({ day: `${d._id}`, amount: d.total }));
  const remainingBudget = Math.max(user.monthlyBudget - stats.totalSpent, 0);
  const dailyAverage = stats.totalSpent > 0 ? Math.round(stats.totalSpent / Math.max(expenses.length, 1)) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "40px" }}>
        <StatCard icon={TrendingDown} label="Spent" value={formatCurrency(user.currency, stats.totalSpent)} color="#fff" trend={`${expenses.length} records`} />
        <StatCard icon={Target} label="Remaining" value={formatCurrency(user.currency, remainingBudget)} color="#d4d4d4" />
        <StatCard icon={ArrowUpRight} label="Average" value={formatCurrency(user.currency, dailyAverage)} color="#a3a3a3" />
        <StatCard icon={Wallet} label="Trips" value={`${trips.length}`} color="#8a8a8a" trend={trips.length ? `${trips[0].title}` : "No trip yet"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        <div style={{ ...glassStyle, padding: isMobile ? "24px 20px" : "32px", background: "rgba(255,255,255,0.03)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>Category Allocation</h3>
          <p style={{ color: THEME.textDim, marginTop: 0, marginBottom: "28px" }}>See where the month is actually going.</p>
          <div style={{ height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={pieData[i].color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ background: THEME.bgSoft, border: `1px solid ${THEME.border}`, borderRadius: "16px", color: THEME.textMain }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...glassStyle, padding: "32px", background: "rgba(255,255,255,0.03)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>Spending Velocity</h3>
          <p style={{ color: THEME.textDim, marginTop: 0, marginBottom: "28px" }}>Daily movement across recorded expenses.</p>
          <div style={{ height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: THEME.textDim, fontSize: 11 }} />
                <Bar dataKey="amount" fill={THEME.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ ...glassStyle, padding: isMobile ? "24px 20px" : "32px", background: "rgba(255,255,255,0.03)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "28px" }}>Recent Vault Activities</h3>
        {expenses.slice(0, 5).map(exp => (
          <div key={exp._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 0" : "18px 0", borderBottom: `1px solid ${THEME.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{CATEGORY_ICONS[exp.category]}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px" }}>{exp.title}</div>
                <div style={{ color: THEME.textDim, fontSize: "13px" }}>{new Date(exp.date).toLocaleDateString()}</div>
              </div>
            </div>
            <div style={{ fontWeight: 900, color: THEME.textMain, fontSize: "18px" }}>-{formatCurrency(user.currency, exp.amount)}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        <div style={{ ...glassStyle, padding: "28px", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ color: THEME.textMuted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Current Budget</div>
          <div style={{ fontSize: "32px", fontWeight: 900, marginBottom: "8px" }}>{formatCurrency(user.currency, user.monthlyBudget)}</div>
          <div style={{ color: THEME.textDim, fontSize: "14px" }}>{user.email}</div>
        </div>

        <motion.button 
          onClick={onLogout} 
          whileHover={{ y: -4 }} 
          whileTap={{ scale: 0.98 }} 
          style={{ 
            ...glassStyle,
            width: "100%", 
            padding: "28px", 
            background: "rgba(255,255,255,0.03)", 
            color: THEME.textMain, 
            fontWeight: 800, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "14px",
            fontSize: "20px"
          }}
        >
          <LogOut size={24} /> Sign Out Account
        </motion.button>
      </div>
    </motion.div>
  );
}

function AddExpenseView({
  form,
  setForm,
  onSubmit,
  saving,
  error,
  currency,
}: {
  form: ExpenseFormState;
  setForm: React.Dispatch<React.SetStateAction<ExpenseFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  error: string;
  currency: Currency;
}) {
  const { isMobile } = useViewport();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ ...glassStyle, padding: "32px", maxWidth: "820px", background: "rgba(255,255,255,0.03)" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "12px" }}>Add Expense</h3>
        <p style={{ color: THEME.textDim, marginBottom: "28px" }}>Add a clean record with amount, category, date, and note.</p>

        <form onSubmit={(e) => { void onSubmit(e); }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px", marginBottom: "18px" }}>
            <input
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
              placeholder="Expense title"
              style={inputStyle}
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
              placeholder={`Amount (${CURRENCY_SYMBOLS[currency]})`}
              style={inputStyle}
            />
            <select
              value={form.category}
              onChange={(e) => setForm((current) => ({ ...current, category: e.target.value as Category }))}
              style={inputStyle}
            >
              {Object.keys(CATEGORY_ICONS).map((category) => (
                <option key={category} value={category} style={{ background: THEME.bgSoft, color: THEME.textMain }}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <textarea
            value={form.note}
            onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))}
            placeholder="Optional note"
            rows={4}
            style={{ ...inputStyle, resize: "vertical", marginBottom: "20px" }}
          />

          {error && <p style={{ color: THEME.accent, marginBottom: "16px" }}>{error}</p>}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={saving}
            style={{ padding: "16px 26px", background: THEME.buttonBg, border: "none", borderRadius: "14px", color: THEME.buttonText, fontWeight: 800, cursor: "pointer" }}
          >
            {saving ? "Saving..." : "Save Expense"}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

function TripsView({
  trips,
  form,
  setForm,
  onSubmit,
  saving,
  error,
  onDelete,
}: {
  trips: Trip[];
  form: TripFormState;
  setForm: React.Dispatch<React.SetStateAction<TripFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  error: string;
  onDelete: (tripId: string) => Promise<void>;
}) {
  const { isMobile } = useViewport();
  const addParticipant = () => {
    setForm((current) => ({
      ...current,
      participants: [...current.participants, { name: "", contributedAmount: "" }],
    }));
  };

  const addExpenseLine = () => {
    setForm((current) => ({
      ...current,
      expenses: [
        ...current.expenses,
        { title: "", amount: "", paidBy: "", date: getTodayDate(), note: "" },
      ],
    }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "grid", gap: "28px" }}>
      <div style={{ ...glassStyle, padding: "32px", background: "rgba(255,255,255,0.03)" }}>
        <h3 style={{ fontSize: "22px", fontWeight: 900, marginTop: 0, marginBottom: "10px" }}>Trip Expense Manager</h3>
        <p style={{ color: THEME.textDim, marginTop: 0, marginBottom: "28px" }}>
          Add the trip name, who contributed money, who paid, and the app will calculate the shared split automatically.
        </p>

        <form onSubmit={(e) => { void onSubmit(e); }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "18px" }}>
            <input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="Trip title" style={inputStyle} />
            <input value={form.destination} onChange={(e) => setForm((current) => ({ ...current, destination: e.target.value }))} placeholder="Destination" style={inputStyle} />
            <input type="date" value={form.startDate} onChange={(e) => setForm((current) => ({ ...current, startDate: e.target.value }))} style={inputStyle} />
            <input type="date" value={form.endDate} onChange={(e) => setForm((current) => ({ ...current, endDate: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: THEME.textDim, fontSize: "13px", marginBottom: "8px" }}>Trip currency</label>
            <select value={form.currency} onChange={(e) => setForm((current) => ({ ...current, currency: e.target.value as Currency }))} style={{ ...inputStyle, maxWidth: "220px" }}>
              {CURRENCIES.map((item) => (
                <option key={item} value={item} style={{ background: THEME.bgSoft, color: THEME.textMain }}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...glassStyle, padding: "22px", marginBottom: "18px", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "18px" }}>Participants</h4>
                <p style={{ color: THEME.textDim, margin: "6px 0 0" }}>Add each person and the amount they gave to the trip admin.</p>
              </div>
              <button type="button" onClick={addParticipant} style={{ border: `1px solid ${THEME.border}`, background: "transparent", color: THEME.textMain, borderRadius: "14px", padding: "10px 14px", cursor: "pointer" }}>
                Add person
              </button>
            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              {form.participants.map((participant, index) => (
                <div key={`participant-${index}`} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 180px 52px", gap: "12px" }}>
                  <input
                    value={participant.name}
                    onChange={(e) => setForm((current) => ({
                      ...current,
                      participants: current.participants.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item),
                    }))}
                    placeholder="Participant name"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={participant.contributedAmount}
                    onChange={(e) => setForm((current) => ({
                      ...current,
                      participants: current.participants.map((item, itemIndex) => itemIndex === index ? { ...item, contributedAmount: e.target.value } : item),
                    }))}
                    placeholder="Amount"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      participants: current.participants.filter((_, itemIndex) => itemIndex !== index),
                    }))}
                    style={{ border: `1px solid ${THEME.border}`, background: "transparent", color: THEME.textMain, borderRadius: "16px", cursor: "pointer" }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...glassStyle, padding: "22px", marginBottom: "18px", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "18px" }}>Trip Expenses</h4>
                <p style={{ color: THEME.textDim, margin: "6px 0 0" }}>Track hotel, travel, food, or anything paid during the trip.</p>
              </div>
              <button type="button" onClick={addExpenseLine} style={{ border: `1px solid ${THEME.border}`, background: "transparent", color: THEME.textMain, borderRadius: "14px", padding: "10px 14px", cursor: "pointer" }}>
                Add expense
              </button>
            </div>
            <div style={{ display: "grid", gap: "14px" }}>
              {form.expenses.map((expense, index) => (
                <div key={`trip-expense-${index}`} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(160px, 1fr)) 52px", gap: "12px", alignItems: "center" }}>
                  <input value={expense.title} onChange={(e) => setForm((current) => ({ ...current, expenses: current.expenses.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item) }))} placeholder="Expense title" style={inputStyle} />
                  <input type="number" min="0" step="0.01" value={expense.amount} onChange={(e) => setForm((current) => ({ ...current, expenses: current.expenses.map((item, itemIndex) => itemIndex === index ? { ...item, amount: e.target.value } : item) }))} placeholder="Amount" style={inputStyle} />
                  <input value={expense.paidBy} onChange={(e) => setForm((current) => ({ ...current, expenses: current.expenses.map((item, itemIndex) => itemIndex === index ? { ...item, paidBy: e.target.value } : item) }))} placeholder="Paid by" style={inputStyle} />
                  <input type="date" value={expense.date} onChange={(e) => setForm((current) => ({ ...current, expenses: current.expenses.map((item, itemIndex) => itemIndex === index ? { ...item, date: e.target.value } : item) }))} style={inputStyle} />
                  <input value={expense.note} onChange={(e) => setForm((current) => ({ ...current, expenses: current.expenses.map((item, itemIndex) => itemIndex === index ? { ...item, note: e.target.value } : item) }))} placeholder="Note" style={inputStyle} />
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, expenses: current.expenses.filter((_, itemIndex) => itemIndex !== index) }))}
                    style={{ border: `1px solid ${THEME.border}`, background: "transparent", color: THEME.textMain, borderRadius: "16px", cursor: "pointer", minHeight: "52px" }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>

          <textarea value={form.note} onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))} placeholder="Trip note or planning details" rows={4} style={{ ...inputStyle, resize: "vertical", marginBottom: "20px" }} />

          {error && <p style={{ color: THEME.textMain, marginBottom: "16px" }}>{error}</p>}

          <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={saving} style={{ padding: "16px 28px", background: THEME.buttonBg, border: "none", borderRadius: "14px", color: THEME.buttonText, fontWeight: 900, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Trip"}
          </motion.button>
        </form>
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {!trips.length && (
          <div style={{ ...glassStyle, padding: "28px", background: "rgba(255,255,255,0.03)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "8px" }}>No trips yet</h3>
            <p style={{ color: THEME.textDim, margin: 0 }}>
              Create a trip to track who paid, who added money, and how much each person should settle.
            </p>
          </div>
        )}
        {trips.map((trip) => (
          <div key={trip._id} style={{ ...glassStyle, padding: "28px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
              <div>
                <div style={{ color: THEME.textMuted, fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "8px" }}>Trip Workspace</div>
                <h3 style={{ margin: 0, fontSize: "24px" }}>{trip.title}</h3>
                <p style={{ color: THEME.textDim, margin: "8px 0 0" }}>
                  {trip.destination ? `${trip.destination} • ` : ""}
                  {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "Open date"}
                  {trip.endDate ? ` - ${new Date(trip.endDate).toLocaleDateString()}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => { void onDelete(trip._id); }} style={{ border: `1px solid ${THEME.border}`, background: "transparent", color: THEME.textMain, borderRadius: "14px", padding: "10px 14px", cursor: "pointer", height: "fit-content" }}>
                Delete
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "22px" }}>
              <div style={{ ...glassStyle, padding: "18px", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ color: THEME.textMuted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Total Added</div>
                <div style={{ fontSize: "24px", fontWeight: 900 }}>{formatCurrency(trip.currency, trip.summary.totalContributed)}</div>
              </div>
              <div style={{ ...glassStyle, padding: "18px", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ color: THEME.textMuted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Spent By Admin</div>
                <div style={{ fontSize: "24px", fontWeight: 900 }}>{formatCurrency(trip.currency, trip.summary.totalSpent)}</div>
              </div>
              <div style={{ ...glassStyle, padding: "18px", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ color: THEME.textMuted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Per Person</div>
                <div style={{ fontSize: "24px", fontWeight: 900 }}>{formatCurrency(trip.currency, trip.summary.sharePerPerson)}</div>
              </div>
              <div style={{ ...glassStyle, padding: "18px", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ color: THEME.textMuted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Balance</div>
                <div style={{ fontSize: "24px", fontWeight: 900 }}>{formatCurrency(trip.currency, trip.summary.remainingBalance)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              <div style={{ ...glassStyle, padding: "20px", background: "rgba(255,255,255,0.02)" }}>
                <h4 style={{ marginTop: 0, marginBottom: "14px" }}>Participants</h4>
                {trip.summary.settlements.map((participant) => (
                  <div key={`${trip._id}-${participant.name}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 0", borderBottom: `1px solid ${THEME.border}` }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{participant.name}</div>
                      <div style={{ color: THEME.textDim, fontSize: "13px" }}>
                        Added {formatCurrency(trip.currency, participant.contributedAmount)} • Share {formatCurrency(trip.currency, participant.share)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 800 }}>
                      <div>{participant.status}</div>
                      <div style={{ color: THEME.textDim, fontSize: "13px" }}>{formatCurrency(trip.currency, Math.abs(participant.net))}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...glassStyle, padding: "20px", background: "rgba(255,255,255,0.02)" }}>
                <h4 style={{ marginTop: 0, marginBottom: "14px" }}>Expenses</h4>
                {trip.expenses.length ? trip.expenses.map((expense, index) => (
                  <div key={`${trip._id}-expense-${index}`} style={{ padding: "12px 0", borderBottom: `1px solid ${THEME.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{expense.title}</div>
                        <div style={{ color: THEME.textDim, fontSize: "13px" }}>
                          Paid by {expense.paidBy} • {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ fontWeight: 900 }}>{formatCurrency(trip.currency, expense.amount)}</div>
                    </div>
                    {expense.note && <div style={{ color: THEME.textDim, fontSize: "13px", marginTop: "6px" }}>{expense.note}</div>}
                  </div>
                )) : <p style={{ color: THEME.textDim, margin: 0 }}>No trip expenses added yet.</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsView({
  user,
  onSave,
  saving,
  feedback,
}: {
  user: User;
  onSave: (monthlyBudget: number, currency: Currency, themePreference: ThemePreference) => Promise<void>;
  saving: boolean;
  feedback: string;
}) {
  const [budget, setBudget] = useState(String(user.monthlyBudget));
  const [currency, setCurrency] = useState<Currency>(user.currency);
  const [themePreference, setThemePreference] = useState<ThemePreference>(user.themePreference);

  useEffect(() => {
    setBudget(String(user.monthlyBudget));
    setCurrency(user.currency);
    setThemePreference(user.themePreference);
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ ...glassStyle, padding: isMobile ? "24px 20px" : "32px", maxWidth: "720px", background: "rgba(255,255,255,0.03)" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "12px" }}>Budget Settings</h3>
        <p style={{ color: THEME.textDim, marginBottom: "28px" }}>
          Change your monthly budget, currency, and theme whenever you need. These settings are saved for your account.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSave(Number(budget), currency, themePreference);
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", color: THEME.textDim, fontSize: "13px", marginBottom: "8px" }}>Monthly budget</label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", color: THEME.textDim, fontSize: "13px", marginBottom: "8px" }}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} style={inputStyle}>
                {CURRENCIES.map((item) => (
                  <option key={item} value={item} style={{ background: THEME.bgSoft, color: THEME.textMain }}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", color: THEME.textDim, fontSize: "13px", marginBottom: "10px" }}>Theme</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setThemePreference(option.value)}
                  style={{
                    textAlign: "left",
                    padding: "16px",
                    borderRadius: "16px",
                    border: themePreference === option.value ? `1px solid ${THEME.borderStrong}` : `1px solid ${THEME.border}`,
                    background: themePreference === option.value ? THEME.surfaceStrong : THEME.surface,
                    color: THEME.textMain,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: "6px" }}>{option.label}</div>
                  <div style={{ color: THEME.textDim, fontSize: "13px" }}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={saving}
            style={{ padding: "16px 26px", background: THEME.buttonBg, border: "none", borderRadius: "14px", color: THEME.buttonText, fontWeight: 800, cursor: "pointer" }}
          >
            {saving ? "Saving..." : "Update Budget"}
          </motion.button>
        </form>

        {feedback && (
          <p style={{ color: THEME.textDim, marginTop: "18px", padding: "12px 14px", border: `1px solid ${THEME.border}`, borderRadius: "14px", background: "rgba(255,255,255,0.02)" }}>
            {feedback}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── App ─────────────────────────────────────────────────────────
export default function App() {
  const { isMobile, isTablet } = useViewport();
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [view, setView] = useState<View>("dashboard");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<Stats>({ categoryBreakdown: [], dailySpending: [], totalSpent: 0 });
  const [loading, setLoading] = useState(() => Boolean(getStoredUser()));
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [tripSaving, setTripSaving] = useState(false);
  const [tripError, setTripError] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    title: "",
    amount: "",
    category: "Food",
    date: getTodayDate(),
    note: "",
  });
  const [tripForm, setTripForm] = useState<TripFormState>({
    title: "",
    destination: "",
    currency: "INR",
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    note: "",
    participants: [
      { name: "", contributedAmount: "" },
      { name: "", contributedAmount: "" },
    ],
    expenses: [
      { title: "", amount: "", paidBy: "", date: getTodayDate(), note: "" },
    ],
  });
  const activeThemePreference = user?.themePreference ?? "monochrome";

  useEffect(() => {
    const palette = THEME_PALETTES[activeThemePreference];
    Object.entries(palette).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    document.body.style.background = THEME.bg;
    document.body.style.color = THEME.textMain;
  }, [activeThemePreference]);

  const fetchExpenseData = async () => {
    const [expRes, statsRes, tripRes] = await Promise.all([
      axios.get(`${API_URL}/expenses`, { headers: getAuthHeader() }),
      axios.get(`${API_URL}/expenses/stats`, { headers: getAuthHeader() }),
      axios.get(`${API_URL}/trips`, { headers: getAuthHeader() }),
    ]);

    return {
      expenses: expRes.data.expenses as Expense[],
      stats: statsRes.data.stats as Stats,
      trips: tripRes.data.trips as Trip[],
    };
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
          const data = await fetchExpenseData();

          if (!isMounted) {
            return;
          }

          setExpenses(data.expenses);
          setStats(data.stats);
          setTrips(data.trips);
      } catch (error) {
          console.error(getErrorMessage(error, "Unable to load expense data."));
      } finally {
          if (isMounted) {
            setLoading(false);
          }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogin = (u: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", token);
    setUser(u);
    setLoading(true);
    setSettingsFeedback("");
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError("");

    if (!expenseForm.title.trim()) {
      setExpenseError("Title is required.");
      return;
    }

    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      setExpenseError("Amount must be greater than 0.");
      return;
    }

    setSavingExpense(true);

    try {
      await axios.post(
        `${API_URL}/expenses`,
        {
          title: expenseForm.title.trim(),
          amount: Number(expenseForm.amount),
          category: expenseForm.category,
          date: expenseForm.date,
          note: expenseForm.note.trim(),
        },
        { headers: getAuthHeader() },
      );

      const data = await fetchExpenseData();
      setExpenses(data.expenses);
      setStats(data.stats);
      setTrips(data.trips);
      setExpenseForm({
        title: "",
        amount: "",
        category: "Food",
        date: getTodayDate(),
        note: "",
      });
      setView("expenses");
    } catch (error) {
      setExpenseError(getErrorMessage(error, "Unable to add expense."));
    } finally {
      setSavingExpense(false);
    }
  };

  const resetTripForm = () => {
    setTripForm({
      title: "",
      destination: "",
      currency: currentUser.currency,
      startDate: getTodayDate(),
      endDate: getTodayDate(),
      note: "",
      participants: [
        { name: "", contributedAmount: "" },
        { name: "", contributedAmount: "" },
      ],
      expenses: [
        { title: "", amount: "", paidBy: "", date: getTodayDate(), note: "" },
      ],
    });
  };

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTripError("");

    if (!tripForm.title.trim()) {
      setTripError("Trip title is required.");
      return;
    }

    const participants = tripForm.participants
      .map((participant) => ({
        name: participant.name.trim(),
        contributedAmount: Number(participant.contributedAmount) || 0,
      }))
      .filter((participant) => participant.name);

    if (!participants.length) {
      setTripError("Add at least one participant.");
      return;
    }

    const expensesPayload = tripForm.expenses
      .map((expense) => ({
        title: expense.title.trim(),
        amount: Number(expense.amount),
        paidBy: expense.paidBy.trim(),
        date: expense.date,
        note: expense.note.trim(),
      }))
      .filter((expense) => expense.title && expense.paidBy && expense.amount > 0);

    setTripSaving(true);

    try {
      const res = await axios.post(
        `${API_URL}/trips`,
        {
          title: tripForm.title.trim(),
          destination: tripForm.destination.trim(),
          currency: tripForm.currency,
          startDate: tripForm.startDate,
          endDate: tripForm.endDate,
          note: tripForm.note.trim(),
          participants,
          expenses: expensesPayload,
        },
        { headers: getAuthHeader() },
      );

      setTrips((current) => [res.data.trip as Trip, ...current]);
      resetTripForm();
      setView("trips");
    } catch (error) {
      setTripError(getErrorMessage(error, "Unable to save trip."));
    } finally {
      setTripSaving(false);
    }
  };

  const handleTripDelete = async (tripId: string) => {
    try {
      await axios.delete(`${API_URL}/trips/${tripId}`, { headers: getAuthHeader() });
      setTrips((current) => current.filter((trip) => trip._id !== tripId));
    } catch (error) {
      setTripError(getErrorMessage(error, "Unable to delete trip."));
    }
  };

  const exportExpensesPdf = () => {
    if (!user) {
      return;
    }

    const doc = new jsPDF();
    const currencySymbol = CURRENCY_SYMBOLS[user.currency];

    doc.setFontSize(18);
    doc.text("Expense Report", 14, 18);
    doc.setFontSize(11);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 26);

    autoTable(doc, {
      head: [["Title", "Category", "Date", "Amount"]],
      body: expenses.map((expense) => [
        expense.title,
        expense.category,
        new Date(expense.date).toLocaleDateString(),
        `${currencySymbol}${expense.amount.toFixed(2)}`,
      ]),
      startY: 34,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [99, 102, 241],
      },
    });

    doc.save("expense-report.pdf");
  };

  const handleBudgetUpdate = async (monthlyBudget: number, currency: Currency, themePreference: ThemePreference) => {
    if (!user) {
      return;
    }

    if (!Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
      setSettingsFeedback("Budget must be zero or greater.");
      return;
    }

    setSettingsSaving(true);
    setSettingsFeedback("");

    try {
      const res = await axios.put(
        `${API_URL}/auth/update-budget`,
        { monthlyBudget, currency, themePreference },
        { headers: getAuthHeader() },
      );

      const nextUser = res.data.user as User;
      setUser(nextUser);
      localStorage.setItem("user", JSON.stringify(nextUser));
      setSettingsFeedback("Budget updated.");
    } catch (error) {
      setSettingsFeedback(getErrorMessage(error, "Unable to update budget."));
    } finally {
      setSettingsSaving(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setExpenses([]);
    setStats({ categoryBreakdown: [], dailySpending: [], totalSpent: 0 });
    setUser(null);
    setLoading(false);
  };

  if (!user && !loading) return <LoginPage onLogin={handleLogin} />;
  if (loading) return <div style={{ height: "100vh", background: THEME.bg }} />;

  const currentUser = user as User;
  const filteredExpenses = expenses.filter((expense) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [expense.title, expense.category, expense.note ?? ""].some((value) =>
      value.toLowerCase().includes(query),
    );
  });
  const pageTitle = {
    dashboard: "Dashboard",
    expenses: "Expenses",
    add: "Add Expense",
    trips: "Trips",
    settings: "Settings",
  }[view];
  const pageDescription = {
    dashboard: "A quiet view of spending, budget, and category movement.",
    expenses: "Search, review, and export your expense history.",
    add: "Capture a new expense without extra clutter.",
    trips: "Manage shared trip money, contributions, and settlements.",
    settings: "Manage your personal budget and preferred currency.",
  }[view];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${THEME.bg}, ${THEME.bgSoft} 45%, ${THEME.bg})`, display: "flex", flexDirection: isMobile || isTablet ? "column" : "row" }}>
      <aside style={{ width: isMobile || isTablet ? "100%" : "280px", background: "rgba(255,255,255,0.02)", borderRight: isMobile || isTablet ? "none" : `1px solid ${THEME.border}`, borderBottom: isMobile || isTablet ? `1px solid ${THEME.border}` : "none", display: "flex", flexDirection: "column", padding: isMobile ? "24px 0" : "32px 0" }}>
        <div style={{ padding: "0 28px 44px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: THEME.surfaceStrong, border: `1px solid ${THEME.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet color={THEME.textMain} size={24} /></div>
          <div>
            <div style={{ fontSize: "12px", color: THEME.textMuted, letterSpacing: "0.2em", textTransform: "uppercase" }}>Expense Tracker</div>
            <span style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-1px" }}>SpendWise</span>
            <div style={{ color: THEME.textDim, fontSize: "13px", marginTop: "4px", fontWeight: 600 }}>{formatCurrency(currentUser.currency, currentUser.monthlyBudget)} Budget</div>
          </div>
        </div>

        <nav style={{ flex: 1, display: isMobile ? "grid" : "block", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : undefined, gap: isMobile ? "8px" : undefined, padding: isMobile ? "0 18px" : undefined }}>
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { id: "expenses", icon: Receipt, label: "History" },
            { id: "add", icon: PlusCircle, label: "Add Expense" },
            { id: "trips", icon: Wallet, label: "Trips" },
            { id: "settings", icon: SettingsIcon, label: "Budget Settings" },
          ].map(item => (
            <motion.div key={item.id} onClick={() => setView(item.id as View)} whileHover={{ x: 6 }} style={{ 
              margin: isMobile ? "0" : "0 18px 10px",
              padding: "16px 18px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer",
              color: view === item.id ? THEME.activeText : THEME.textDim,
              background: view === item.id ? THEME.activeBg : "transparent",
              borderRadius: "18px",
              border: view === item.id ? `1px solid ${THEME.borderStrong}` : "1px solid transparent",
              minHeight: isMobile ? "64px" : undefined,
            }}>
              <item.icon size={22} />
              <span style={{ fontWeight: 700, fontSize: isMobile ? "13px" : "15px" }}>{item.label}</span>
            </motion.div>
          ))}
        </nav>
        {!isMobile && (
          <div style={{ padding: "0 28px" }}>
            <p style={{ color: THEME.textMuted, fontSize: "11px", textAlign: "center" }}>v1.0.4 • {currentUser.email}</p>
          </div>
        )}
      </aside>

      <main style={{ flex: 1, minWidth: "0", padding: isMobile ? "24px 16px 40px" : isTablet ? "32px 24px 44px" : "44px clamp(20px, 4vw, 56px)", overflowY: "auto" }}>
        <header style={{ marginBottom: "42px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? "24px" : "0", gap: "20px" }}>
            <div>
              <div style={{ color: THEME.textMuted, fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "8px" }}>Workspace</div>
              <h2 style={{ fontSize: isMobile ? "28px" : "36px", fontWeight: 900, marginBottom: "8px", marginTop: 0 }}>{pageTitle}</h2>
              {!isMobile && <p style={{ color: THEME.textDim, margin: 0 }}>{pageDescription}</p>}
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {!isMobile && (
                <div style={{ background: THEME.surface, padding: "12px 16px", borderRadius: "18px", border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", gap: "10px", minWidth: "260px" }}>
                  <Search size={18} color={THEME.textDim} />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search expenses..." style={{ background: "transparent", border: "none", color: THEME.textMain, outline: "none", fontSize: "14px", width: "100%" }} />
                </div>
              )}
              
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                   <div style={{ width: isMobile ? "44px" : "50px", height: isMobile ? "44px" : "50px", borderRadius: "15px", background: THEME.surface, border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Bell size={isMobile ? 18 : 20} color={THEME.textMain} /></div>
                   <motion.div 
                      whileHover={{ scale: 1.06 }} 
                      style={{ 
                          width: isMobile ? "44px" : "50px", height: isMobile ? "44px" : "50px", borderRadius: "50%", 
                          background: THEME.buttonBg, 
                          border: `1px solid ${THEME.borderStrong}`, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 900, fontSize: isMobile ? "16px" : "18px", color: THEME.buttonText,
                          boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
                      }}
                   >
                      {currentUser.name[0]}
                   </motion.div>
              </div>
            </div>
          </div>

          {isMobile && (
            <div style={{ background: THEME.surface, padding: "14px 18px", borderRadius: "20px", border: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
              <Search size={18} color={THEME.textDim} />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search expenses..." style={{ background: "transparent", border: "none", color: THEME.textMain, outline: "none", fontSize: "15px", width: "100%" }} />
            </div>
          )}
          {isMobile && <p style={{ color: THEME.textDim, margin: "16px 0 0", fontSize: "14px" }}>{pageDescription}</p>}
        </header>

        {view === "dashboard" && <DashboardView expenses={expenses} stats={stats} user={currentUser} trips={trips} onLogout={logout} />}
        {view === "add" && (
          <AddExpenseView
            form={expenseForm}
            setForm={setExpenseForm}
            onSubmit={handleAddExpense}
            saving={savingExpense}
            error={expenseError}
            currency={currentUser.currency}
          />
        )}
        {view === "trips" && (
          <TripsView
            trips={trips}
            form={tripForm}
            setForm={setTripForm}
            onSubmit={handleTripSubmit}
            saving={tripSaving}
            error={tripError}
            onDelete={handleTripDelete}
          />
        )}
        {view === "expenses" && (
            <div style={{ ...glassStyle, padding: isMobile ? "24px 20px" : "32px", background: "rgba(255,255,255,0.03)" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>Complete History</h3>
                      <p style={{ color: THEME.textDim, margin: 0 }}>{filteredExpenses.length} matching expenses</p>
                    </div>
                    <motion.button onClick={exportExpensesPdf} whileHover={{ scale: 1.05 }} style={{ background: THEME.buttonBg, border: "none", padding: "10px 20px", borderRadius: "12px", color: THEME.buttonText, fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileDown size={18} /> Export PDF
                    </motion.button>
                 </div>
                 {filteredExpenses.map(exp => (
                    <div key={exp._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0", borderBottom: `1px solid ${THEME.border}` }}>
                        <div style={{ display: "flex", gap: "20px" }}>
                             <div style={{ fontSize: "24px", width: "44px", height: "44px", borderRadius: "14px", border: `1px solid ${THEME.border}`, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>{CATEGORY_ICONS[exp.category]}</div>
                             <div>
                                <div style={{ fontWeight: 800, fontSize: "16px" }}>{exp.title}</div>
                                <div style={{ color: THEME.textDim, fontSize: "13px" }}>{exp.category} • {new Date(exp.date).toLocaleDateString()} {exp.note ? `• ${exp.note}` : ""}</div>
                             </div>
                        </div>
                        <div style={{ fontWeight: 900, color: THEME.textMain, fontSize: "20px" }}>-{formatCurrency(currentUser.currency, exp.amount)}</div>
                    </div>
                 ))}
            </div>
        )}
        {view === "settings" && (
          <SettingsView
            user={currentUser}
            onSave={handleBudgetUpdate}
            saving={settingsSaving}
            feedback={settingsFeedback}
          />
        )}
      </main>
    </div>
  );
}
