import React from "react";

interface PageHeaderProps {
  title: string;
  button?: React.ReactNode;
}

/**
 * PageHeader Component
 * Displays a page title with an optional action button
 * Used at the top of most pages in the app
 */
export function PageHeader({ title, button }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {button && <div>{button}</div>}
    </div>
  );
}

