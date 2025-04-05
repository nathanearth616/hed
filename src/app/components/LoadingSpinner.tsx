interface LoadingSpinnerProps {
  className?: string;
}

export default function LoadingSpinner({ className = "w-5 h-5" }: LoadingSpinnerProps) {
  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
  );
} 