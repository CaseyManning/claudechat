export function InputField({ children }: React.PropsWithChildren) {
  return <div className="flex w-full flex-col gap-1">{children}</div>;
}

export type inputStyle = "default" | "outline";

export function Input({
  inputStyle = "outline",
  className,
  type,
  label,
  error,
  ...props
}: React.ComponentProps<"input"> & {
  error?: boolean;
  inputStyle?: inputStyle;
  label?: string;
}) {
  const styleClassNames =
    inputStyle === "default"
      ? `flex rounded-md bg-zinc-100 px-3 py-3
        text-base  outline-none transition-[color,box-shadow]
         file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground 
         disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`
      : "border border-zinc-500 p-3 focus:ring-0 focus:outline-none";

  return (
    <input
      type={type}
      data-slot="input"
      className={`${styleClassNames}
        ${error && "border-destructive aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"}
        ${className}`}
      {...props}
    >
      {label && <label className="text-sm text-zinc-500">{label}</label>}
    </input>
  );
}

export function InputError({ children }: React.PropsWithChildren) {
  return (
    <p className="mt-0 w-full text-left text-red-500 text-sm" role="alert">
      {children}
    </p>
  );
}
