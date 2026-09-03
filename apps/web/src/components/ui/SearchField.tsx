import { Icon } from "./Icon";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  disabled?: boolean;
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
}: SearchFieldProps) {
  return (
    <form
      className="flex w-full gap-1.5 sm:gap-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="flex h-11 flex-1 items-center gap-2.5 rounded-[7px] border border-[#253043] bg-[#0e1521]/75 px-3 transition-colors focus-within:border-[#6f55dc] focus-within:ring-2 focus-within:ring-[#8568ff]/30 sm:gap-[18px] sm:px-[18px]">
        <Icon
          name="search"
          className="h-[27px] w-[27px] shrink-0 text-[#9aa6ba]"
        />
        <input
          type="search"
          aria-label={placeholder}
          className="w-full border-0 bg-transparent text-[15px] text-[#f3f5fb] outline-none placeholder:text-[#a2acbc] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[18px]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      <button
        type="submit"
        className="h-11 w-[140px] shrink-0 rounded-[7px] bg-[#5638e8] px-3 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)] transition-colors hover:bg-[#6749f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff] disabled:cursor-not-allowed disabled:opacity-60 sm:px-[18px] sm:text-[17px]"
        disabled={disabled}
      >
        {disabled ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
