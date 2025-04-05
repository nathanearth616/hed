export default function LoadingSpinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <div className={`${className} animate-spin rounded-full border-2 border-white/30 border-r-white`} />
  );
} 