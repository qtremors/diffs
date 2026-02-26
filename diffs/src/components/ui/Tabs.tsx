"use client";

// ---------------------------------------------------------------------------
// Tabs — reusable tabbed navigation
// ---------------------------------------------------------------------------

import React from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="tabs-container" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeId === tab.id}
          className={`tab-button ${activeId === tab.id ? "tab-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge && <span className="tab-badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}
