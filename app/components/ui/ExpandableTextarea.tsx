import { useEffect, useRef, useState } from "react";

const ExpandableTextarea = ({
  defaultValue,
  className,
  ...props
}: React.ComponentProps<"textarea">) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = useState(defaultValue);

  const maxHeight = 400;

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    if (inputRef.current && value !== null) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + 2 + "px";
      if (inputRef.current.scrollHeight > maxHeight) {
        inputRef.current.style.height = maxHeight + "px";
      }
    }
    if (inputRef.current && !value) {
      inputRef.current.style.height = "auto";
    }
  }, [value, inputRef]);

  return (
    <textarea
      ref={inputRef}
      value={value}
      onChange={onChange}
      {...props}
      className={`resize-none  ${className}`}
    />
  );
};

export default ExpandableTextarea;
