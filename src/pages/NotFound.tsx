import { FiAlertCircle, FiHome } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0">
        <div className="absolute h-[40rem] w-[40rem] -top-48 -left-48 bg-purple-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute h-[30rem] w-[30rem] -bottom-32 -right-32 bg-indigo-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute h-[35rem] w-[35rem] top-1/2 left-1/2 bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute h-20 w-20 top-1/4 right-1/4 bg-cyan-500/20 rounded-full blur-xl animate-float animation-delay-1000" />
        <div className="absolute h-16 w-16 bottom-1/4 left-1/3 bg-pink-500/20 rounded-full blur-xl animate-float animation-delay-3000" />
      </div>

      <div className="max-w-4xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
        <div
          className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-indigo-500/20
          animate-fade-in-up hover:shadow-indigo-500/20 hover:border-indigo-500/30 transition-all duration-500
          group"
        >
          {/* Card content */}
          <div className="px-6 sm:px-8 py-12 sm:py-16 text-center relative">
            <div className="flex flex-col items-center space-y-6">
              {/* Error Icon - Updated animation */}
              <div
                aria-label="Error indicator"
                className="h-24 w-24 rounded-full bg-red-500/20 flex items-center justify-center backdrop-blur-sm border border-red-400/30
                animate-bounce-slow group-hover:bg-red-500/30 transition-colors duration-300 hover:rotate-12 transform"
              >
                <FiAlertCircle className="h-12 w-12 text-red-400 animate-pulse" />
              </div>

              {/* Enhanced Error Message */}
              <div className="space-y-3 animate-fade-in animation-delay-300">
                <h1 className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
                  404
                </h1>
                <h2 className="text-xl sm:text-2xl font-semibold text-white/90 tracking-wide">
                  Page Not Found
                </h2>
                <p className="text-white/70 max-w-md mx-auto leading-relaxed">
                  The page you're looking for doesn't exist or has been moved to
                  a new location.
                </p>
              </div>

              {/* Button - Added aria-label */}
              <button
                onClick={() => navigate("/")}
                aria-label="Return to homepage"
                className="group relative mt-8 px-6 py-3 rounded-xl transition-all duration-300
                  bg-gradient-to-r from-indigo-500 to-purple-600
                  hover:from-indigo-600 hover:to-purple-700
                  text-white font-semibold
                  shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40
                  border border-indigo-500/20 hover:border-indigo-500/30
                  transform hover:scale-[1.02] hover:-translate-y-0.5
                  flex items-center justify-center space-x-3
                  animate-fade-in animation-delay-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <FiHome className="h-5 w-5" />
                <span>Return Home</span>
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-purple-400/20 
                    animate-shimmer transform -translate-x-full group-hover:translate-x-full transition-transform duration-1500"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Updated Animation Styles */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-blob {
          animation: blob 10s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-pulse-slow {
          animation: pulse 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes float {
          0% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(10deg); }
          100% { transform: translateY(0) rotate(0); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes scale-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .animate-float {
          animation: float 6s infinite ease-in-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }

        .animate-rotate {
          animation: rotate 10s linear infinite;
        }

        .animate-scale-pulse {
          animation: scale-pulse 2s infinite ease-in-out;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
