import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#ff7f50] text-white hover:bg-[#fe7e4f] shadow-sm hover:shadow-md hover:shadow-[#fe7e4f]/20",
        primary:
          "bg-[#00677d] text-white hover:bg-[#005162] shadow-sm hover:shadow-md hover:shadow-[#00677d]/20",
        secondary:
          "bg-[#00a3c4] text-white hover:bg-[#008ba8] shadow-sm",
        outline:
          "border border-[#00677d] text-[#00677d] bg-transparent hover:bg-[#00677d]/10",
        outlineSecondary:
          "border border-[#ff7f50] text-[#ff7f50] bg-transparent hover:bg-[#ff7f50]/10",
        ghost:
          "text-[#00677d] hover:bg-[#00677d]/10",
        destructive:
          "bg-[#ba1a1a] text-white hover:bg-[#93000a] shadow-sm",
        link:
          "text-[#00677d] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
