import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import type { RateTrend } from "@/api/exchange-rates";

// Lek getting weaker (rate up) is shown red, stronger (rate down) green.
const TREND_COLORS = {
  light: { up: "#b91c1c", down: "#15803d" },
  dark: { up: "#f87171", down: "#4ade80" },
};

export function TrendArrow({
  trend,
  size = 22,
  onDark = false,
}: {
  trend: RateTrend;
  size?: number;
  onDark?: boolean;
}) {
  const colors = onDark ? TREND_COLORS.dark : TREND_COLORS.light;
  if (trend === "up") {
    return <ArrowUpward sx={{ fontSize: size, color: colors.up }} />;
  }
  if (trend === "down") {
    return <ArrowDownward sx={{ fontSize: size, color: colors.down }} />;
  }
  return null;
}
