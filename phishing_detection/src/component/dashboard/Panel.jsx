export default function Panel({ className = "", children }) {
  return (
    <div
      className={`rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(27,18,42,0.94),rgba(9,7,19,0.92))] shadow-[0_28px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
