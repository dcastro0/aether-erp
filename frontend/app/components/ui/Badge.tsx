import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Info } from "lucide-react";

export type BadgeStatus = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  status: BadgeStatus;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  children,
  icon = true,
  className = "",
}) => {
  const styles = {
    success: {
      bg: "bg-[rgba(6,78,59,0.4)]",
      border: "border-[#059669]",
      text: "text-[#34D399]",
      Icon: CheckCircle2,
    },
    warning: {
      bg: "bg-[rgba(120,53,15,0.4)]",
      border: "border-[#D97706]",
      text: "text-[#FBBF24]",
      Icon: Clock,
    },
    danger: {
      bg: "bg-[rgba(127,29,29,0.4)]",
      border: "border-[#DC2626]",
      text: "text-[#F87171]",
      Icon: AlertTriangle,
    },
    info: {
      bg: "bg-[rgba(14,165,233,0.15)]",
      border: "border-[#0EA5E9]",
      text: "text-[#38BDF8]",
      Icon: Info,
    },
    neutral: {
      bg: "bg-[#1E293B]",
      border: "border-[#334155]",
      text: "text-[#94A3B8]",
      Icon: Info,
    },
  };

  const current = styles[status];
  const IconComponent = current.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${current.bg} ${current.border} ${current.text} ${className}`}
    >
      {icon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};
