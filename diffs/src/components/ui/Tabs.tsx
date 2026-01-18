"use client";
import { useId } from "react";
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
  label?: string;
  id?: string;
  panelId?: string;
  disabled?: boolean;
}

export default function Tabs({
  tabs,
  activeId,
  onChange,
  label = "View",
  id: suppliedId,
  panelId,
  disabled = false,
}: TabsProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <div
      className="tabs-container"
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        if (disabled) return;
        const index = tabs.findIndex((tab) => tab.id === activeId);
        const next =
          event.key === "ArrowRight"
            ? (index + 1) % tabs.length
            : event.key === "ArrowLeft"
              ? (index - 1 + tabs.length) % tabs.length
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : -1;
        if (next < 0) return;
        event.preventDefault();
        onChange(tabs[next].id);
        event.currentTarget
          .querySelectorAll<HTMLButtonElement>('[role="tab"]')
          [next]?.focus();
      }}
    >
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          id={`${id}-${tab.id}`}
          role="tab"
          disabled={disabled}
          aria-controls={panelId}
          aria-selected={activeId === tab.id}
          tabIndex={activeId === tab.id ? 0 : -1}
          className={`tab-button ${activeId === tab.id ? "tab-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge && <span className="tab-badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}
