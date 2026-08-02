import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && <div className="absolute left-3 text-[#64748B] pointer-events-none">{leftIcon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={`w-full h-10 px-3 ${leftIcon ? "pl-9" : ""} ${rightIcon ? "pr-9" : ""} bg-[#0F172A] border ${
              error ? "border-[#DC2626] focus:border-[#DC2626]" : "border-[#334155] focus:border-[#0EA5E9]"
            } rounded-md text-sm text-[#F8FAFC] placeholder-[#64748B] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,233,0.25)] ${className}`}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 text-[#64748B]">{rightIcon}</div>}
        </div>
        {error ? (
          <span className="text-xs text-[#F87171]">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-[#64748B]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
