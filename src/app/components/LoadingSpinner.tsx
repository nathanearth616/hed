export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-foreground/20 border-t-foreground"></div>
    </div>
  );
} 