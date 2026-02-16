import { useEffect, useRef, useMemo } from "react";
import twemoji from "twemoji";
import ReactMarkdown from "react-markdown";
import { renderToStaticMarkup } from "react-dom/server";

interface TwemojiTextProps {
  text: string;
  className?: string;
}

export default function TwemojiText({ text, className }: TwemojiTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(
    () => renderToStaticMarkup(<ReactMarkdown>{text}</ReactMarkdown>),
    [text]
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = html;
      twemoji.parse(containerRef.current, { className: "twemoji" });
    }
  }, [html]);

  return <div ref={containerRef} className={`${className} markdown-content`} />;
}
