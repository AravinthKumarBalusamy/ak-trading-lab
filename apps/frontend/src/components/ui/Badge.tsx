import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "success";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseStyle =
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none";

    const variantStyles = {
      default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
      secondary:
        "border-transparent bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700",
      destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
      success: "border-transparent bg-green-600 text-white hover:bg-green-700",
    };

    return (
      <div
        ref={ref}
        className={`${baseStyle} ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";
