import Link, { type LinkProps } from "next/link";
import type { ComponentProps } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LinkButtonProps = LinkProps &
  Omit<ComponentProps<"a">, keyof LinkProps> & {
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
    size?: "default" | "sm" | "lg" | "xs" | "icon" | "icon-sm" | "icon-lg" | "icon-xs";
    className?: string;
    children?: React.ReactNode;
  };

export function LinkButton({
  variant = "default",
  size = "default",
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      {...rest}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </Link>
  );
}
