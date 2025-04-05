import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "../components/Input";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { supabase } from '../lib/supabase';

// Validation schema
const registerSchema = z
  .object({
    email: z
      .string()
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(50, "Password is too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// API client setup

interface StatusModalProps {
  isOpen: boolean;
  status: "success" | "error";
  message: string;
  onClose: () => void;
  onAction: () => void;
}

// Enhanced StatusModal component
const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  status,
  message,
  onClose,
  onAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[#1f2937] border border-indigo-500/20 rounded-2xl p-6 w-[90%] max-w-md animate-slideIn">
        <div className="text-center">
          {status === "success" ? (
            <FaCheckCircle className="mx-auto text-green-500 text-5xl mb-4 animate-bounce" />
          ) : (
            <FaTimesCircle className="mx-auto text-red-500 text-5xl mb-4 animate-shake" />
          )}
          <h3 className="text-xl font-semibold text-white mb-2">
            {status === "success"
              ? "Registration Successful"
              : "Registration Failed"}
          </h3>
          <p className="text-white/70 mb-6">{message}</p>
          <div className="flex justify-center gap-4">
            {status === "success" ? (
              <button
                onClick={onAction}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                         transition-all duration-300 transform hover:scale-105"
              >
                Proceed to Login
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 
                         transition-all duration-300 transform hover:scale-105"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({
    isOpen: false,
    status: "success" as "success" | "error",
    message: "",
  });

  useEffect(() => {
    const checkSession = async () => {
      const supabaseClient = await supabase;
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        navigate("/profile", { replace: true });
      }
    };

    checkSession();
  }, [navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    
    try {
      const supabaseClient = await supabase;
      
      const { data: authData, error } = await supabaseClient.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            first_name: null,
            last_name: null,
            type_of_user: 'registered',
            subscription_status: 'inactive',
          }
        },
      });

      if (error) throw error;

      if (authData?.user) {
        setModalState({
          isOpen: true,
          status: "success",
          message: "Registration successful! Please check your email to confirm your account.",
        });
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      
      let errorMessage = "Registration failed. Please try again later.";

      if (error instanceof Error) {
        if (error.message?.toLowerCase().includes("already registered")) {
          errorMessage = "This email is already registered. Please try logging in.";
        } else if (error.message?.toLowerCase().includes("rate limit")) {
          errorMessage = "Too many attempts. Please try again later.";
        } else if (error.message?.toLowerCase().includes("confirmation email")) {
          errorMessage = "Account created but there was an issue sending the confirmation email. Please contact support.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setModalState({
        isOpen: true,
        status: "error",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="md" text="Creating your account..." />;
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] 
                    flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md p-4 sm:p-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-[#1f2937]/30 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl space-y-8 border border-indigo-500/20 
          hover:border-indigo-500/40"
        >
          <h2 className="text-3xl font-bold text-center text-white">
            Create Account
          </h2>

          <div className="space-y-6">
            <Input
              label="Email"
              type="email"
              {...register("email")}
              className="bg-white/5 border-white/20 text-white placeholder-white/60"
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">
                {errors.email.message}
              </p>
            )}

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
                  {...register("password")}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 text-white 
                         placeholder-white/60 rounded-xl focus:ring-2 focus:ring-purple-500 
                         focus:border-transparent"
                  placeholder="Enter your password"
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
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">
                {errors.password.message}
              </p>
            )}

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-white/90"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 text-white 
                         placeholder-white/60 rounded-xl focus:ring-2 focus:ring-purple-500 
                         focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-indigo-600 text-white rounded-xl 
            font-medium transition-all duration-200 hover:bg-indigo-700"
          >
            Create Account
          </button>

          <p className="text-center text-white/70 text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
      <StatusModal
        isOpen={modalState.isOpen}
        status={modalState.status}
        message={modalState.message}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onAction={() => navigate("/login")}
      />
    </div>
  );
};

// Helper function to get error messages

export default Register;
