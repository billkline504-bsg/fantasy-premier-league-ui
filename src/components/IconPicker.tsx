import type { ProfileIcon } from '../api/types';

// Implements BRD UIR-160 (fixed catalog, never an arbitrary upload) and UIR-170 (the same
// catalog/component renders identically wherever an icon is picked — global default or a
// per-league override). Per API Consumption Specification v1.1 §2.3b, `assetIdentifier` is an
// image asset reference (not the mock-up's inline color+emoji badge) with no stated
// hosting/base-URL convention — rendered here as-is as an <img src>, the least presumptuous
// choice pending confirmation against the running API.

export interface IconPickerProps {
  icons: ProfileIcon[];
  selectedIconId: string | null | undefined;
  onSelect: (profileIconId: string) => void;
  isDisabled?: boolean;
  'aria-label': string;
}

export function IconPicker({ icons, selectedIconId, onSelect, isDisabled, 'aria-label': ariaLabel }: IconPickerProps) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {icons
        .filter((icon) => icon.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((icon) => (
          <button
            key={icon.profileIconId}
            type="button"
            aria-pressed={icon.profileIconId === selectedIconId}
            disabled={isDisabled}
            onClick={() => onSelect(icon.profileIconId)}
            title={icon.name}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              padding: 0,
              overflow: 'hidden',
              border: icon.profileIconId === selectedIconId ? '3px solid var(--turf)' : '3px solid transparent',
            }}
          >
            <img
              src={icon.assetIdentifier}
              alt={icon.name}
              width={44}
              height={44}
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        ))}
    </div>
  );
}
