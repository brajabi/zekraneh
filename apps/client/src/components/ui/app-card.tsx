import { Card } from "heroui-native";
import type { ComponentProps, PropsWithChildren } from "react";

type AppCardProps = PropsWithChildren<ComponentProps<typeof Card>>;

export function AppCard({ children, className, ...props }: AppCardProps) {
  return <Card className={`rounded-2xl border border-border bg-surface p-4 ${className ?? ""}`.trim()} {...props}>{children}</Card>;
}
