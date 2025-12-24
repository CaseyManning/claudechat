export default function Loading() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-3 h-3 rounded-full bg-zinc-500 animate-pulse"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </div>
  );
}
