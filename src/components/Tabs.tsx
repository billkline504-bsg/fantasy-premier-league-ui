// Implements BRD UIR-022 (tabbed time/period navigation) and UIR-023 (disabled-with-reason
// tabs). Used by Schedule, EPL, History, and any future screen needing the same pattern
// (Architecture §9) — one component, not one ad hoc implementation per screen.

export interface TabItem<TValue extends string> {
  value: TValue;
  label: string;
  disabledReason?: string;
}

export interface TabsProps<TValue extends string> {
  items: TabItem<TValue>[];
  activeValue: TValue;
  onChange: (value: TValue) => void;
  'aria-label': string;
}

export function Tabs<TValue extends string>({
  items,
  activeValue,
  onChange,
  'aria-label': ariaLabel,
}: TabsProps<TValue>) {
  return (
    <div role="tablist" aria-label={ariaLabel} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item) => {
        const isDisabled = Boolean(item.disabledReason);
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === activeValue}
            disabled={isDisabled}
            title={item.disabledReason}
            onClick={() => !isDisabled && onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
