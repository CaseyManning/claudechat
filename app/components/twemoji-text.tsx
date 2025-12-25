import { useEffect, useRef } from "react";
import twemoji from "twemoji";
import ReactMarkdown from "react-markdown";

interface TwemojiTextProps {
  text: string;
  className?: string;
}

export default function TwemojiText({ text, className }: TwemojiTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      twemoji.parse(containerRef.current, {
        className: "twemoji",
      });
    }
  }, [text]);

  return (
    <div ref={containerRef} className={`${className} markdown-content`}>
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
