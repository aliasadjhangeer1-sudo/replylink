import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Design system §5B: gradient primary, glow hover, press scale .97, 44px min touch target.
const buttonVariants = cva(
  "inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-brand-gradient text-white shadow-glow hover:brightness-110",
        secondary: "bg-white/10 text-white border border-white/15 backdrop-blur hover:bg-white/15",
        outline: "border border-white/20 bg-transparent text-white hover:bg-white/5",
        ghost: "text-white/80 hover:bg-white/10 hover:text-white",
        destructive: "bg-red-500/90 text-white hover:bg-red-500",
      },
      size: { default: "h-11 px-5", sm: "h-9 px-3 text-xs min-h-[36px]", lg: "h-13 px-7 text-base", icon: "h-11 w-11" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; loading?: boolean; }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, loading, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} aria-busy={loading} {...props}>
    {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
    {children}
  </Comp>;
});
Button.displayName = "Button";
export { Button, buttonVariants };
