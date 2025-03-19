import { PasswordValidationResult } from "./types";

export const formatFieldValue = (
  field: string,
  value: string | null
): string | null => {
  if (!value) return value;

  if (field === "type_of_user") {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getAvatarUrl = (url?: string, email?: string) => {
  if (url) {
    return url;
  }
  // Fallback to DiceBear avatar
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'default'}`;
};

export const formatVerificationCode = (code: string): string => {
  return code.replace(/[^0-9]/g, '').slice(0, 6);
};

export const isValidVerificationCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

export const isSubscriptionExpired = (endDate?: string): boolean => {
  if (!endDate) return true;
  const today = new Date();
  const expiryDate = new Date(endDate);
  return today > expiryDate;
};

export const calculateDaysUntilExpiry = (dateString?: string): number => {
  if (!dateString) return 0;
  const today = new Date();
  const expiryDate = new Date(dateString);
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const validatePassword = (password: string): PasswordValidationResult => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  return { isValid: true, message: "" };
}; 