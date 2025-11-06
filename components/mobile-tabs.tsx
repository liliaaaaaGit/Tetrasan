"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTab {
  label: string;
  value: string;
  content: React.ReactNode;
}

interface MobileTabsProps {
  tabs: MobileTab[];
  defaultValue?: string;
}

/**
 * MobileTabs Component
 * On mobile devices, tabs become accordions (expandable sections)
 * On desktop, they display as traditional tabs
 */
export function MobileTabs({ tabs, defaultValue }: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    defaultValue || tabs[0]?.value
  );

  return (
    <>
      {/* Desktop tabs - hidden on mobile */}
      <div className="hidden md:block">
        <div className="border-b border-border mb-4">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.value
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          {tabs.map(
            (tab) =>
              activeTab === tab.value && (
                <div key={tab.value}>{tab.content}</div>
              )
          )}
        </div>
      </div>

      {/* Mobile accordion - hidden on desktop */}
      <div className="md:hidden space-y-2">
        {tabs.map((tab) => (
          <div key={tab.value} className="border border-border rounded-lg">
            <button
              onClick={() =>
                setExpandedAccordion(
                  expandedAccordion === tab.value ? null : tab.value
                )
              }
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-medium text-sm">{tab.label}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 transition-transform",
                  expandedAccordion === tab.value && "rotate-180"
                )}
              />
            </button>
            {expandedAccordion === tab.value && (
              <div className="px-4 pb-4 border-t border-border pt-4">
                {tab.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

