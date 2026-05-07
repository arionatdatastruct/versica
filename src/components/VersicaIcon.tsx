import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { box: "w-6 h-6", icon: "w-3.5 h-3.5" },
  sm: { box: "w-8 h-8", icon: "w-4 h-4" },
  md: { box: "w-12 h-12", icon: "w-6 h-6" },
  lg: { box: "w-16 h-16", icon: "w-8 h-8" },
  xl: { box: "w-24 h-24", icon: "w-12 h-12" },
};

export const VersicaIcon = ({ size = "sm", className }: Props) => {
  const s = sizeMap[size];
  return (
    <div
      className={cn(
        "rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/10",
        s.box,
        className,
      )}
      aria-label="Versica"
    >
      <Sparkles className={cn("text-primary", s.icon)} strokeWidth={2} />
    </div>
  );
};
