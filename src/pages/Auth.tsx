import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";

const EmailConfirmed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20">
          <div className="text-center">
            <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="mt-4 text-2xl font-bold text-white">
              Email Confirmed Successfully!
            </h2>
            <p className="mt-2 text-white/70">
              Thank you for verifying your email address. You can now access all
              features of your account.
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <button
                onClick={() => navigate("/login")}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 
                  transition-all duration-200 font-medium"
              >
                Login to Your Account
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="w-full px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 
                  transition-all duration-200 font-medium"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmed;
