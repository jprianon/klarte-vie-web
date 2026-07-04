import { TrendingUp } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function TradingPage() {
  return (
    <ComingSoon
      icon={TrendingUp}
      title="Trading"
      description="Ton journal de trades et la performance de ton portefeuille : capital, win rate, courbe de résultats."
      gradient={["#30d158", "#0a84ff"]}
    />
  );
}
