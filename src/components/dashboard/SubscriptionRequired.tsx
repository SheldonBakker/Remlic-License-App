import { memo } from "react";
import { useNavigate } from "react-router-dom";

export const SubscriptionRequired = memo(() => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12 bg-[#1f2937]/30 backdrop-blur-xl rounded-xl border border-yellow-500/20">
      <h3 className="text-xl font-bold text-white mb-2">Upgrade Required</h3>
      <p className="text-white/70 mb-6">
        Please upgrade to access license management features.
      </p>
      <button
        onClick={() => navigate("/price")}
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white 
          py-2 px-6 rounded-lg transition-all duration-200 
          hover:from-yellow-600 hover:to-yellow-700"
      >
        View Pricing
      </button>
    </div>
  );
});
