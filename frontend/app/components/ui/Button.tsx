import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5 h-8",
    md: "px-4 py-2 text-sm gap-2 h-10",
    lg: "px-5 py-2.5 text-base gap-2.5 h-12",
  };

  const variantStyles = {
    primary:
      "bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-[0_0_12px_rgba(14,165,233,0.25)] active:scale-[0.98]",
    secondary:
      "bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#F8FAFC] active:scale-[0.98]",
    success:
      "bg-[rgba(6,78,59,0.5)] hover:bg-[rgba(5,150,105,0.7)] border border-[#059669] text-[#34D399] hover:text-white active:scale-[0.98]",
    danger:
      "bg-[rgba(127,29,29,0.5)] hover:bg-[#DC2626] border border-[#DC2626] text-[#F87171] hover:text-white active:scale-[0.98]",
    ghost:
      "bg-transparent hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]",
  };

  return (
    <button
      type={props.type || "button"}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
