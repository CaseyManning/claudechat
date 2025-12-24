import { useState } from "react";
import { useEffect, useRef } from "react";

export const useOutsideClick = (onClickOutside: () => void) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [ref, onClickOutside]);

  return ref;
};

interface DropdownSelectProps {
  options: string[];
  secondaryLabels?: string[];
  value: string;
  onChange: (value: string) => void;
}

const Dropdown = ({
  options,
  secondaryLabels,
  value,
  onChange,
}: DropdownSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const ref = useOutsideClick(() => setIsOpen(false));
  return (
    <div className="relative">
      <button
        className="font-ibm text-sm border border-gray-2 text-black bg-white hover:bg-zinc-50 px-3 rounded-sm py-2 flex flex-row gap-x-2 items-center"
        style={{
          fontWeight: 450,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value}</span> {"▾"}
      </button>
      <div
        className={`absolute z-10 top-[calc(100% - 30px)] mt-0.5 left-0 w-[220px] bg-white border border-gray-2 overflow-hidden rounded ${
          isOpen ? "flex flex-col" : "hidden"
        }`}
        ref={ref}
      >
        {options.map((option, index) => (
          <button
            key={option}
            onClick={() => {
              onChange(option);
              setIsOpen(false);
            }}
            className="px-3 pr-3 py-2 hover:bg-zinc-50 text-left font-ibm text-sm"
            style={{
              fontWeight: 450,
            }}
          >
            <div className="flex flex-row justify-between items-center">
              <span>{option}</span>
              {secondaryLabels?.[index] && (
                <span className="text-zinc-500 font-mono!">
                  {secondaryLabels[index]}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dropdown;
