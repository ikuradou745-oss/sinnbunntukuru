import React from 'react';

interface ValueInputProps {
  value: number | string | undefined;
  onChange: (val: number | string) => void;
  availableVariables: string[];
  defaultValue?: number;
  label?: string;
}

export const ValueInput: React.FC<ValueInputProps> = ({
  value,
  onChange,
  availableVariables,
  defaultValue = 1,
}) => {
  const isVariable = typeof value === 'string' && availableVariables.includes(value);

  return (
    <div className="inline-flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-300 text-xs">
      <select
        value={isVariable ? 'variable' : 'literal'}
        onChange={(e) => {
          if (e.target.value === 'variable') {
            onChange(availableVariables[0] || 'スコア1');
          } else {
            onChange(defaultValue);
          }
        }}
        className="bg-transparent font-bold text-[11px] text-neutral-600 focus:outline-none cursor-pointer px-1"
      >
        <option value="literal">数値</option>
        <option value="variable">変数</option>
      </select>

      {isVariable ? (
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="bg-amber-100 text-amber-900 border border-amber-300 rounded px-1.5 py-0.5 font-bold text-xs focus:outline-none"
        >
          {availableVariables.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          value={value !== undefined ? Number(value) : defaultValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 bg-white border border-neutral-300 rounded px-1 py-0.5 text-center font-bold text-xs"
        />
      )}
    </div>
  );
};
