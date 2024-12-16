import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Remlic.png";

const Launch = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Set your launch date here
  const launchDate = useMemo(() => new Date("2025-01-16T00:00:00"), []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      if (distance < 0) {
        clearInterval(timer);
        navigate("/home");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, launchDate]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('message', 'New subscription request from launch page');

      const response = await fetch('/api/notify.php', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setIsSubscribed(true);
        setEmail("");
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to subscribe. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center p-4 bg-[#1f2937]/30 backdrop-blur-xl rounded-xl border border-indigo-500/20 min-w-[120px]">
      <span className="text-5xl font-bold text-white mb-2 font-mono">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-white/70 text-sm uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      
      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <img
            src={Logo}
            alt="License Manager Logo"
            className="h-32 mx-auto mb-6 animate-float"
            loading="eager"
            width={128}
            height={128}
          />
          <div className="inline-block mb-4">
            <span className="bg-indigo-500/10 text-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full border border-indigo-500/20 animate-pulse">
              Coming Soon
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 tracking-tight">
            The Future of License Management
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            Get ready for South Africa's most comprehensive license management
            platform. We're revolutionizing how businesses handle their compliance.
          </p>

          {/* Countdown Timer */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <TimeBlock value={timeLeft.days} label="Days" />
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <TimeBlock value={timeLeft.minutes} label="Minutes" />
            <TimeBlock value={timeLeft.seconds} label="Seconds" />
          </div>

          {/* Early Access Section */}
          <div className="max-w-md mx-auto">
            <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20 shadow-xl">
              <h3 className="text-2xl font-semibold text-white mb-4">
                {isSubscribed ? "Thank You!" : "Get Early Access"}
              </h3>
              {isSubscribed ? (
                <p className="text-white/70 mb-6">
                  You're on the list! We'll notify you when we launch.
                </p>
              ) : (
                <>
                  <p className="text-white/70 mb-6">
                    Be the first to know when we launch and receive exclusive
                    early-bird offers.
                  </p>
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-indigo-500/20 
                        text-white placeholder-white/50 focus:outline-none focus:border-indigo-500/40
                        transition-all duration-200"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 
                        transition-all duration-200 font-medium shadow-lg shadow-indigo-500/30
                        hover:shadow-indigo-500/40 active:transform active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Subscribing..." : "Notify Me"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {[
            {
              title: "Smart Notifications",
              description: "Never miss a renewal deadline with our intelligent notification system",
            },
            {
              title: "Secure Storage",
              description: "Your licenses and permits, safely stored and easily accessible",
            },
            {
              title: "Compliance Dashboard",
              description: "Complete overview of your compliance status at a glance",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20
                hover:border-indigo-500/40 transition-all duration-300 group"
            >
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Launch;
