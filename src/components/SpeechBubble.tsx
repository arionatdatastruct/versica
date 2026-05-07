import { VersicaIcon } from "./VersicaIcon";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  variant?: "lia" | "user";
  showAvatar?: boolean;
  className?: string;
}

export const SpeechBubble = ({ children, variant = "lia", showAvatar = true, className }: Props) => {
  if (variant === "user") {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="bg-accent-light text-foreground rounded-3xl rounded-br-md px-5 py-3.5 max-w-[85%] shadow-sm">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {showAvatar && <VersicaIcon size="sm" />}
      <div className="bg-primary-light text-foreground rounded-3xl rounded-tl-md px-5 py-3.5 max-w-[85%] shadow-sm">
        {children}
      </div>
    </div>
  );
};
