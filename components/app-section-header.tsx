import type { ReactNode } from "react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";

/**
 * Standard section header: a title, optional description, and an optional
 * action slot (rendered as CardAction). Mirrors the repeated
 * `<CardHeader><div><CardTitle/><CardDescription/></div>...` markup exactly.
 */
export function AppSectionHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <CardHeader>
      <div>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      {action ? <CardAction>{action}</CardAction> : null}
    </CardHeader>
  );
}
