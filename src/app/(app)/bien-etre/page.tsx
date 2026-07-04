import { Heart } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export default function BienEtrePage() {
  return (
    <ComingSoon
      icon={Heart}
      title="Bien-être"
      description="Sommeil, humeur et énergie — le suivi de ta forme au quotidien."
      gradient={["#ff8fb0", "#ff2d55"]}
    />
  );
}
