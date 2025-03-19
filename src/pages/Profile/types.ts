import { IconType } from "react-icons/lib";

export interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
  id_number: string | null;
  contact_number: string | null;
  type_of_user: string;
  subscription_end_date?: string;
  subscription_status: "active" | "inactive" | "expired";
  payment_reference?: string;
  last_payment_date?: string;
  avatar_url?: string;
}

export interface ProfileState {
  isLoading: boolean;
  profile: UserProfile;
  isEditing: boolean;
  editedProfile: Partial<UserProfile>;
  showModal: boolean;
  isSaving: boolean;
  isChangingPassword: boolean;
  passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  };
  showPasswords: {
    current_password: boolean;
    new_password: boolean;
    confirm_password: boolean;
  };
  isProcessingPayment: boolean;
  showEmailConfirmModal: boolean;
  newEmailAddress: string;
  isMfaEnabled: boolean;
  showMfaModal: boolean;
  mfaSecret: string;
  mfaQrCode: string;
  verificationCode: string;
  mfaFactorId: string;
  mfaDisableCode: string;
  uploadingAvatar: boolean;
  avatarFile: File | null;
  verificationError?: string;
}

export interface ProfileInfoItemProps {
  icon: IconType;
  label: string;
  value: string | null;
  field: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface TOTPFactor {
  id: string;
  type: 'totp';
  factor_type?: string;
  status?: string;
  totp: { 
    qr_code: string; 
    secret: string; 
    uri: string; 
  };
}

export interface PasswordValidationResult {
  isValid: boolean;
  message: string;
}

export type DispatchAction = React.Dispatch<React.SetStateAction<ProfileState>>; 