'use client';

interface SwitchProps {
  value: boolean;
  label?: string;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function SwitchButton({
  value,
  label,
  onChange,
  disabled = false
}: SwitchProps) {
  return (
    <div
      className={`flex items-center gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {/* Label */}
      {label && (
        <span
          className='cursor-pointer text-sm font-medium text-gray-700 select-none'
          onClick={() => !disabled && onChange(!value)}
        >
          {label}
        </span>
      )}

      {/* Switch Button */}
      <button
        type='button'
        role='switch'
        // aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:outline-none ${value ? 'bg-green-500' : 'bg-gray-200'} `}
      >
        <span className='sr-only'>Use setting</span>
        <span
          aria-hidden='true'
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'} `}
        />
      </button>
    </div>
  );
}
