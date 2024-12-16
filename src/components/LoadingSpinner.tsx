interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  overlayOpacity?: "light" | "medium" | "dark";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text = "Loading...",
  overlayOpacity = "medium",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 border-2",
    md: "w-12 h-12 border-4",
    lg: "w-16 h-16 border-6",
  };

  const overlayClasses = {
    light: "bg-opacity-40",
    medium: "bg-opacity-60",
    dark: "bg-opacity-80",
  };

  return (
    <div
      className={`fixed inset-0 flex flex-col justify-center items-center bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] backdrop-blur-lg ${overlayClasses[overlayOpacity]} transition-all duration-500`}
    >
      <div className="relative">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-full animate-pulse bg-indigo-500/30 blur-3xl scale-150" />

        {/* Inner subtle pulsing ring */}
        <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400/20 duration-1500" />

        {/* Main spinner */}
        <div
          className={`
            ${sizeClasses[size]} 
            relative 
            border-indigo-300 
            border-t-transparent 
            rounded-full 
            animate-spin 
            duration-1000 
            shadow-[0_0_20px_rgba(99,102,241,0.4)] 
            before:content-[''] 
            before:absolute 
            before:inset-[-2px] 
            before:rounded-full 
            before:border-2 
            before:border-indigo-500/30
          `}
          role="status"
          aria-label="Loading"
        />
      </div>

      {text && (
        <div className="mt-8 flex flex-col items-center">
          <p className="text-indigo-100 text-sm font-medium tracking-wider animate-pulse">
            {text}
          </p>
          {/* Decorative line */}
          <div className="mt-2 h-[1px] w-24 bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
