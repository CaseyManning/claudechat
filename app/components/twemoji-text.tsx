import { useEffect, useRef } from "react";
import twemoji from "twemoji";

interface TwemojiTextProps {
  text: string;
  className?: string;
}

export default function TwemojiText({ text, className }: TwemojiTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      twemoji.parse(containerRef.current, {
        className: "twemoji",
        base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
      });
    }
  }, [text]);

  return (
    <p ref={containerRef} className={className}>
      {text}
    </p>
  );
}
