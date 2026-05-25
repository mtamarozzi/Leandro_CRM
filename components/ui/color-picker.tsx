import { useId, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { WORKSPACE_COLOR_PRESETS } from '@/src/lib/schemas/workspace-schema';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets?: Array<{ label: string; value: string }>;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (HEX_PATTERN.test(prefixed)) {
    return prefixed.toUpperCase();
  }
  return null;
}

export function ColorPicker({
  value,
  onChange,
  presets = WORKSPACE_COLOR_PRESETS,
  disabled = false,
  className,
  id,
}: ColorPickerProps) {
  const reactId = useId();
  const inputId = id ?? `color-${reactId}`;
  const [inputValue, setInputValue] = useState(value);

  const handlePickerChange = (hex: string) => {
    const normalized = normalizeHex(hex);
    if (normalized) {
      setInputValue(normalized);
      onChange(normalized);
    }
  };

  const handleInputChange = (raw: string) => {
    setInputValue(raw);
    const normalized = normalizeHex(raw);
    if (normalized) {
      onChange(normalized);
    }
  };

  const handlePresetClick = (hex: string) => {
    if (disabled) return;
    const normalized = normalizeHex(hex) ?? hex;
    setInputValue(normalized);
    onChange(normalized);
  };

  return (
    <div
      className={cn('color-picker', disabled && 'color-picker--disabled', className)}
      data-slot="color-picker"
    >
      <div className="color-picker__canvas">
        <HexColorPicker
          color={value}
          onChange={handlePickerChange}
          style={disabled ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
        />
      </div>

      <div className="color-picker__hex">
        <label htmlFor={inputId} className="color-picker__hex-label">
          Código hex
        </label>
        <div className="color-picker__hex-row">
          <span
            className="color-picker__swatch"
            style={{ backgroundColor: HEX_PATTERN.test(value) ? value : '#ffffff' }}
            aria-hidden="true"
          />
          <Input
            id={inputId}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={() => {
              const normalized = normalizeHex(inputValue);
              if (normalized) {
                setInputValue(normalized);
              } else {
                setInputValue(value);
              }
            }}
            placeholder="#D4A017"
            maxLength={7}
            spellCheck={false}
            disabled={disabled}
            className="color-picker__hex-input"
          />
        </div>
      </div>

      {presets.length > 0 && (
        <div className="color-picker__presets" role="listbox" aria-label="Cores sugeridas">
          {presets.map((preset) => {
            const isActive = value.toUpperCase() === preset.value.toUpperCase();
            return (
              <button
                key={preset.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handlePresetClick(preset.value)}
                disabled={disabled}
                className={cn(
                  'color-picker__preset',
                  isActive && 'color-picker__preset--active',
                )}
                title={`${preset.label} (${preset.value})`}
              >
                <span
                  className="color-picker__preset-swatch"
                  style={{ backgroundColor: preset.value }}
                />
                <span className="color-picker__preset-label">{preset.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
