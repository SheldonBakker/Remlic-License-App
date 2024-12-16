/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import the default styles
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "../lib/supabase";
import { AMREntry } from "@supabase/supabase-js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showMfaPrompt, setShowMfaPrompt] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [challengeId, setChallengeId] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data, error } = await (await supabase).auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Login successful!");
        navigate("/profile", { replace: true });
      } else if (data.user) {
        // MFA is required
        const { data: enrollments, error: enrollError } = await (await supabase).auth.mfa.getAuthenticatorAssuranceLevel();

        if (enrollError) throw enrollError;

        if (enrollments.currentLevel === 'aal1' && enrollments.nextLevel === 'aal2') {
          // Ensure there are available authentication methods
          if (enrollments.currentAuthenticationMethods.length === 0) {
            throw new Error('No MFA factors available');
          }

          // Retrieve the factorId from the first available authentication method
          interface AMREntryExtended extends AMREntry {
            factor_id: string;
          }

          const currentMethod = enrollments.currentAuthenticationMethods[0] as AMREntryExtended;
          const factorId = currentMethod.factor_id;

          if (!factorId) {
            throw new Error('Invalid MFA factor ID');
          }

          // Initiate MFA challenge
          const { data: challenge, error: challengeError } = await (await supabase).auth.mfa.challenge({ factorId: factorId });

          if (challengeError) throw challengeError;

          setChallengeId(challenge.id);
          setFactorId(factorId);
          setShowMfaPrompt(true);
        } else {
          throw new Error('MFA requirements not met');
        }
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      setError(error.message || 'An unexpected error occurred');
      toast.error(error.message || 'Login failed');
    }
  };

  const handleMfaVerification = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      toast.error("Please enter a valid 6-digit MFA code");
      return;
    }

    try {
      const { data: verifyData, error: verifyError } = await (await supabase).auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: mfaCode,
      });

      if (verifyError) throw verifyError;

      if (verifyData) {
        const { data: { session }, error: sessionError } = await (await supabase).auth.getSession();
        if (sessionError) throw sessionError;
        if (session) {
          toast.success("Login successful!");
          navigate("/profile", { replace: true });
        } else {
          throw new Error('Session not established after MFA');
        }
      }
    } catch (error: any) {
      console.error("MFA Error:", error);
      setError(error.message || "Failed to verify MFA code");
      toast.error(error.message || "Failed to verify MFA code");
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      const { error } = await (await supabase).auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset link sent to your email!");
      setShowForgotPasswordModal(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      toast.error(error.message || "Failed to send reset link");
    }
  };

  useEffect(() => {
    return () => {
      setError("");
      setShowMfaPrompt(false);
      setMfaCode("");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] flex items-center justify-center">
      {showMfaPrompt ? (
        <div className="w-full max-w-md p-4 sm:p-8">
          <div className="bg-[#1f2937]/30 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl space-y-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-center text-white">
              Two-Factor Authentication
            </h2>
            <div className="space-y-4">
              <p className="text-white/80 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 text-white 
                         text-center text-2xl tracking-wider rounded-xl"
                placeholder="000000"
              />
              <button
                onClick={handleMfaVerification}
                disabled={mfaCode.length !== 6}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl 
                         font-medium transition-all duration-200 hover:bg-indigo-700
                         disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md p-4 sm:p-8">
          <form
            onSubmit={handleSubmit}
            className="bg-[#1f2937]/30 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl space-y-8 border border-indigo-500/20 
            hover:border-indigo-500/40"
          >
            <h2 className="text-3xl font-bold text-center text-white">
              Welcome Back
            </h2>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white/90"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 text-white 
                         placeholder-white/60 rounded-xl focus:ring-2 focus:ring-purple-500 
                         focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white/90"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/20 text-white 
                           placeholder-white/60 rounded-xl focus:ring-2 focus:ring-purple-500 
                           focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/90"
                  >
                    {showPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-indigo-600 text-white rounded-xl 
                       font-medium transition-all duration-200 hover:bg-indigo-700"
            >
              Sign In
            </button>

            <p className="text-center text-white/70 text-sm">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Create one
              </a>
            </p>
          </form>
        </div>
      )}

      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#1f2937] p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-indigo-500/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Reset Password
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="resetEmail"
                  className="block text-sm font-medium text-white/90 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 text-white 
                         placeholder-white/60 rounded-xl focus:ring-2 focus:ring-purple-500 
                         focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleForgotPassword}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl 
                           font-medium transition-all duration-200 hover:bg-indigo-700"
                >
                  Send Reset Link
                </button>
                <button
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setResetEmail("");
                  }}
                  className="flex-1 py-2.5 bg-gray-600 text-white rounded-xl 
                           font-medium transition-all duration-200 hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Login;
