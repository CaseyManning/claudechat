import React from "react";

type ButtonProps = React.PropsWithChildren & {
  ref?: React.RefObject<HTMLButtonElement | null>;
  className?: string;
  color?: ButtonColor;
  value?: string;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
} & (
    | {
        type: "submit";
        onClick?: (e: React.FormEvent) => void;
      }
    | {
        type?: "button" | "reset";
        onClick: (e: React.MouseEvent<HTMLElement>) => void;
      }
  ) &
  Pick<
    React.HTMLAttributes<HTMLButtonElement>,
    "onMouseEnter" | "onMouseLeave"
  >;

export type ButtonColor =
  | "stone"
  | "green"
  | "green-outline"
  | "red"
  | "red-outline"
  | "light"
  | "light-hover"
  | "blue"
  | "blue-outline"
  | "yellow"
  | "transparent"
  | "grey"
  | "outline"
  | "white"
  | "black";

export const colorClasses: Record<ButtonColor, string> = {
  stone: "bg-gray-4 text-white hover:bg-[#444]",
  green: "bg-green text-white hover:bg-[#4d8c1d]",
  "green-outline": "border border-green text-green hover:bg-green/10",
  red: "bg-red-100 !text-red-500",
  "red-outline": "border border-red-500 text-red-500",
  light: "bg-zinc-200/60",
  "light-hover": "bg-zinc-200/60 hover:bg-zinc-200/80 !text-zinc-500",
  blue: "bg-[#318dde] text-white",
  "blue-outline":
    "border border-[#318dde] text-[#318dde] hover:bg-[#318dde]/10",
  yellow: "bg-yellow-600",
  transparent: "bg-transparent hover:bg-black/5 text-black px-2!",
  grey: "bg-zinc-200 !text-black",
  outline: "border border-gray-2 text-black",
  white: "border border-gray-2 text-black bg-white hover:bg-zinc-50",
  black: "bg-zinc-800 hover:bg-zinc-900 text-white",
};

const Button: React.FC<ButtonProps> = ({
  ref,
  onClick,
  children,
  value,
  className,
  color: colorProp,
  type = "button",
  disabled = false,
  onMouseEnter,
  onMouseLeave,
  size = "medium",
}) => {
  const color: ButtonColor = colorProp ?? "white";

  const sizeClass = {
    small: "px-3 py-1.5 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base",
  }[size];

  return (
    <button
      ref={ref}
      value={value}
      name="_action"
      type={type}
      className={`${sizeClass} cursor-pointer font-medium rounded w-fit h-fit flex items-center justify-center ${
        disabled ? "opacity-50 cursor-not-allowed!" : ``
      } ${colorClasses[color]} ${className} `}
      style={{
        fontWeight: 450,
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  );
};

export default Button;
