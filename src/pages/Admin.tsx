import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../lib/supabase";
import { FiUsers, FiSettings, FiRefreshCw, FiSearch, FiMail, FiEdit2 } from "react-icons/fi";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import type { SupabaseClient } from '@supabase/supabase-js'
import React from 'react'
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  created_at: string;
  type_of_user: string;
  subscription_status: string;
  subscription_end_date: string | null;
  first_name: string;
  last_name: string;
  contact_number: string;
  id_number: string;
  payment_reference: string;
}

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  currentDate: string | null;
  userEmail: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentDate,
  userEmail,
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1f2937] p-8 rounded-xl border border-indigo-500/20 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">
          Update Subscription End Date
        </h3>
        <p className="text-white/70 mb-4">
          Updating subscription end date for: {userEmail}
        </p>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2 bg-[#374151]/50 border border-indigo-500/20 
            rounded-lg text-white mb-6 focus:border-indigo-500/50 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedDate)}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      const formattedDate = user.subscription_end_date 
        ? user.subscription_end_date.replace(/\//g, '-').split('T')[0]
        : '';

      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_number: user.contact_number,
        id_number: user.id_number,
        payment_reference: user.payment_reference,
        subscription_end_date: formattedDate,
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1f2937] p-8 rounded-xl border border-indigo-500/20 max-w-2xl w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">Edit User Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white/70 text-sm">First Name</label>
            <input
              type="text"
              value={formData.first_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full px-4 py-2 bg-[#374151]/50 border border-indigo-500/20 
                rounded-lg text-white mt-1 focus:border-indigo-500/50 
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Last Name</label>
            <input
              type="text"
              value={formData.last_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full px-4 py-2 bg-[#374151]/50 border border-indigo-500/20 
                rounded-lg text-white mt-1 focus:border-indigo-500/50 
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 bg-[#374151]/50 border border-indigo-500/20 
                rounded-lg text-white mt-1 focus:border-indigo-500/50 
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Contact Number</label>
            <input
              type="text"
              value={formData.contact_number || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
              className="w-full px-4 py-2 bg-[#374151]/50 border border-indigo-500/20 
                rounded-lg text-white mt-1 focus:border-indigo-500/50 
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">ID Number</label>
            <input
              type="text"
              value={formData.id_number || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
              className="w-full px-4 py-2 bg-[#374151]/50 border border-indigo-500/20 
                rounded-lg text-white mt-1 focus:border-indigo-500/50 
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Payment Reference</label>
            <input
              type="text"
              value={formData.payment_reference || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
              className="w-full px-4 py-2 bg-[#374151]/50 border border-indigo-500/20 
                rounded-lg text-white mt-1 focus:border-indigo-500/50 
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Subscription End Date</label>
            <input
              type="date"
              value={formData.subscription_end_date || ''}
              min="2024-01-01"
              max="2099-12-31"
              pattern="\d{4}-\d{2}-\d{2}"
              onChange={(e) => {
                const newDate = e.target.value;
                if (/^\d{4}-\d{2}-\d{2}$/.test(newDate) && newDate.slice(0, 4).length === 4) {
                  setFormData(prev => ({
                    ...prev,
                    subscription_end_date: newDate,
                    subscription_status: new Date(newDate) > new Date() ? 'active' : 'expired'
                  }));
                }
              }}
              className="w-full px-4 py-2 bg-[#374151]/50 border border-indigo-500/20 
                rounded-lg text-white mt-1 focus:border-indigo-500/50 
                focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!formData || Object.keys(formData).length === 0) {
                toast.error('No changes to save');
                return;
              }
              
              onSave(formData).catch(error => {
                console.error('Save error:', error);
                toast.error('Failed to save changes');
              });
            }}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail: string;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1f2937] p-8 rounded-xl border border-indigo-500/20 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">
          Confirm Password Reset
        </h3>
        <p className="text-white/70 mb-4">
          Are you sure you want to send a password reset link to:
        </p>
        <p className="text-indigo-400 mb-6 font-medium">{userEmail}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
          >
            Send Reset Link
          </button>
        </div>
      </div>
    </div>
  );
};

interface UserType {
  value: string;
  label: string;
  color: string;
}

const USER_TYPES: UserType[] = [
  { value: 'registered', label: 'Registered', color: 'text-gray-400 bg-gray-500/10' },
  { value: 'basic', label: 'Basic', color: 'text-blue-400 bg-blue-500/10' },
  { value: 'standard', label: 'Standard', color: 'text-green-400 bg-green-500/10' },
  { value: 'professional', label: 'Professional', color: 'text-purple-400 bg-purple-500/10' },
  { value: 'premium', label: 'Premium', color: 'text-yellow-400 bg-yellow-500/10' },
  { value: 'advanced', label: 'Advanced', color: 'text-red-400 bg-red-500/10' },
];

const Admin = () => {
  const navigate = useNavigate();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);
  const [isUpdatingUserType, setIsUpdatingUserType] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetCooldowns, setPasswordResetCooldowns] = useState<Record<string, number>>({});
  const [passwordResetModal, setPasswordResetModal] = useState<{
    isOpen: boolean;
    userEmail: string;
  }>({ isOpen: false, userEmail: '' });

  useEffect(() => {
    // Initialize supabase client
    const initSupabase = async () => {
      const client = await supabase;
      setSupabaseClient(client);
    };
    initSupabase();
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!supabaseClient) return;
    setIsRefreshing(true);
    try {
      const { data: profiles, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [supabaseClient]);

  const toggleMaintenance = async () => {
    if (!supabaseClient) return;
    try {
      const { data: existingRecord } = await supabaseClient
        .from("system_settings")
        .select("*")
        .eq("key", "maintenance_mode")
        .single();

      if (existingRecord) {
        const { error } = await supabaseClient
          .from("system_settings")
          .update({ value: !isMaintenance })
          .eq("key", "maintenance_mode");
        if (error) throw error;
      } else {
        const { error } = await supabaseClient
          .from("system_settings")
          .insert({ key: "maintenance_mode", value: !isMaintenance });
        if (error) throw error;
      }

      // Log the maintenance mode change
      const { error: logError } = await supabaseClient
        .from('admin_logs')
        .insert({
          action: 'toggle_maintenance',
          details: {
            new_status: !isMaintenance
          }
        });

      if (logError) throw logError;

      setIsMaintenance(!isMaintenance);
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
    }
  };

  const handleMaintenanceClick = () => {
    setShowMaintenanceConfirm(true);
  };

  const confirmToggleMaintenance = async () => {
    if (!supabaseClient) return;
    
    setShowMaintenanceConfirm(false);
    await toggleMaintenance();
    
    try {
      const { data, error } = await supabaseClient
        .from("system_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (error) throw error;
      setIsMaintenance(data?.value || false);
    } catch (error) {
      console.error("Error fetching maintenance status:", error);
      toast.error("Failed to update maintenance status");
    }
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!supabaseClient) return;
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          navigate('/error404');
          return;
        }

        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('type_of_user')
          .eq('id', user.id)
          .single();

        if (error || profile?.type_of_user !== 'admin') {
          navigate('/error404');
          return;
        }

        const fetchMaintenanceStatus = async () => {
          try {
            const { data, error } = await supabaseClient
              .from("system_settings")
              .select("*")
              .eq("key", "maintenance_mode");

            if (error) throw error;
            setIsMaintenance(data?.[0]?.value || false);
          } catch (error) {
            console.error("Error fetching maintenance status:", error);
            setIsMaintenance(false);
          }
        };

        fetchMaintenanceStatus();
        fetchUsers();
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/error404');
      }
    };

    if (supabaseClient) {
      checkAdminAccess();
    }
  }, [navigate, supabaseClient, fetchUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.type_of_user?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserTypeChange = async (userId: string, newType: string) => {
    if (!supabaseClient || isUpdatingUserType) return;
    
    try {
      setIsUpdatingUserType(true);
      
      // First check if the target user is an admin
      const { data: targetUser } = await supabaseClient
        .from('profiles')
        .select('type_of_user, email')
        .eq('id', userId)
        .single();

      if (targetUser?.type_of_user === 'admin') {
        alert('Admin user types cannot be modified');
        return;
      }

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ type_of_user: newType })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the admin action
      const { error: logError } = await supabaseClient
        .from('admin_logs')
        .insert({
          action: 'update_user_type',
          details: {
            user_id: userId,
            user_email: targetUser?.email,
            old_type: targetUser?.type_of_user,
            new_type: newType
          }
        });

      if (logError) throw logError;
      
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user type:', error);
      alert('Failed to update user type');
    } finally {
      setIsUpdatingUserType(false);
    }
  };

  const sendPasswordReset = async (userEmail: string) => {
    if (!supabaseClient) return;

    // Check if email is in cooldown
    const currentTime = Date.now();
    const cooldownTime = passwordResetCooldowns[userEmail] || 0;
    const timeRemaining = Math.ceil((cooldownTime - currentTime) / 1000);

    if (currentTime < cooldownTime) {
      toast.error(`Please wait ${timeRemaining} seconds before requesting another reset`);
      return;
    }

    try {
      // Get current admin's ID first
      const { data: { user: currentAdmin } } = await supabaseClient.auth.getUser();
      if (!currentAdmin?.id) throw new Error('No admin ID found');

      const { error } = await supabaseClient.auth.resetPasswordForEmail(userEmail);
      if (error) throw error;

      // Set cooldown for this email (60 seconds)
      setPasswordResetCooldowns(prev => ({
        ...prev,
        [userEmail]: currentTime + 60000
      }));

      // Log the admin action with admin_id
      const { error: logError } = await supabaseClient
        .from('admin_logs')
        .insert({
          admin_id: currentAdmin.id,
          action: 'send_password_reset',
          details: { user_email: userEmail }
        });

      if (logError) throw logError;
      
      toast.success('Password reset email sent successfully');
    } catch (error: unknown) {
      console.error('Error sending password reset:', error);
      // Check for rate limit error specifically
      if (error instanceof Error && error.message?.includes('security purposes')) {
        const match = error.message.match(/after (\d+) seconds/);
        const waitTime = match ? match[1] : '60';
        toast.error(`Please wait ${waitTime} seconds before requesting another reset`);
        
        // Update cooldown state
        setPasswordResetCooldowns(prev => ({
          ...prev,
          [userEmail]: currentTime + (parseInt(waitTime) * 1000)
        }));
      } else {
        toast.error('Failed to send password reset email');
      }
    }
  };

  const updateSubscriptionDate = async (newDate: string) => {
    if (!supabaseClient || !selectedUser) return;
    
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ 
          subscription_end_date: newDate,
          subscription_status: new Date(newDate) > new Date() ? 'active' : 'expired'
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Log the admin action
      const { error: logError } = await supabaseClient
        .from('admin_logs')
        .insert({
          action: 'update_subscription_date',
          details: {
            user_id: selectedUser.id,
            user_email: selectedUser.email,
            old_date: selectedUser.subscription_end_date,
            new_date: newDate
          }
        });

      if (logError) throw logError;

      await fetchUsers();
    } catch (error) {
      console.error('Error updating subscription date:', error);
      alert('Failed to update subscription date');
    } finally {
      setShowDatePicker(false);
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!supabaseClient || !editingUser) return;

    try {
      console.log('Updating user with data:', userData);
      
      // First verify the current user is an admin
      const { data: { user: currentAdmin } } = await supabaseClient.auth.getUser();
      const { data: adminProfile } = await supabaseClient
        .from('profiles')
        .select('type_of_user')
        .eq('id', currentAdmin?.id)
        .single();

      if (adminProfile?.type_of_user !== 'admin') {
        throw new Error('Unauthorized: Only admins can update user profiles');
      }

      const formattedData = {
        ...userData,
        subscription_end_date: userData?.subscription_end_date 
          ? new Date(userData.subscription_end_date).toISOString()
          : null,
        subscription_status: userData?.subscription_end_date 
          ? (new Date(userData.subscription_end_date) > new Date() ? 'active' : 'expired')
          : 'expired',
        updated_at: new Date().toISOString()
      };

      // Use the service role client for admin operations
      const { data: updatedData, error: updateError } = await supabaseClient
        .from('profiles')
        .update(formattedData)
        .eq('id', editingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!updatedData) throw new Error('No data was updated');

      // Log admin action
      await supabaseClient
        .from('admin_logs')
        .insert({
          admin_id: currentAdmin?.id,
          action: 'update_user_info',
          details: {
            user_id: editingUser.id,
            user_email: editingUser.email,
            updated_fields: Object.keys(formattedData)
          }
        });

      await fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
      toast.success('User information updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user information');
      throw error;
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading admin panel..." />;
  }

  return (
    <>
      <Helmet>
        <title>RemLic - Admin Panel</title>
        <meta name="description" content="RemLic admin panel" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <FiUsers className="h-6 w-6 text-indigo-400" />
                  Admin Panel
                </h1>
                <p className="text-gray-400">Manage system settings and users</p>
              </div>

              {/* Maintenance Toggle */}
              <button
                onClick={handleMaintenanceClick}
                className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium
                  ${isMaintenance 
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  }`}
              >
                <FiSettings className="h-5 w-5" />
                {isMaintenance ? "Disable Maintenance" : "Enable Maintenance"}
              </button>
            </div>

            {/* Search and Refresh */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by email or type..."
                  className="w-full px-4 py-2 pl-10 bg-[#374151]/50 border border-indigo-500/20 
                    rounded-lg text-white placeholder-gray-400 focus:border-indigo-500/50 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <button
                onClick={fetchUsers}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 
                  hover:bg-indigo-500/20 transition-all duration-200 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin duration-[3000ms]" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-6">
              <FiUsers className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">
                Users ({filteredUsers.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-indigo-400 border-b border-indigo-500/20">
                    <th className="pb-4 px-6 font-medium">First Name</th>
                    <th className="pb-4 px-6 font-medium">Last Name</th>
                    <th className="pb-4 px-6 font-medium">Type</th>
                    <th className="pb-4 px-6 font-medium">Status</th>
                    <th className="pb-4 px-6 font-medium">Subscription End</th>
                    <th className="pb-4 px-6 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr
                        className="border-b border-indigo-500/20 text-white/90 hover:bg-indigo-500/20 cursor-pointer
                          transition-colors duration-200"
                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      >
                        <td className="py-4 px-6">{user.first_name || 'N/A'}</td>
                        <td className="py-4 px-6">{user.last_name || 'N/A'}</td>
                        <td className="py-4 px-6">
                          {user.type_of_user === 'admin' ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-400">
                              admin
                            </span>
                          ) : (
                            <select
                              value={user.type_of_user}
                              onChange={(e) => handleUserTypeChange(user.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={isUpdatingUserType}
                              className="w-32 px-2 py-1.5 rounded-lg text-sm border appearance-none
                                bg-[#1f2937] border-indigo-500/20 focus:outline-none focus:ring-2 
                                focus:ring-indigo-500/20 cursor-pointer disabled:opacity-50
                                disabled:cursor-not-allowed"
                              style={{ 
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.5em 1.5em',
                                paddingRight: '2.5rem'
                              }}
                            >
                              {USER_TYPES.map((type) => (
                                <option
                                  key={type.value}
                                  value={type.value}
                                  className={`${type.color} py-1`}
                                >
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.subscription_status === "active"
                                ? "bg-indigo-500/10 text-indigo-400"
                                : "bg-indigo-500/10 text-indigo-400"
                            }`}
                          >
                            {user.subscription_status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {user.subscription_end_date
                            ? new Date(
                                user.subscription_end_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-4 px-6">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                      {expandedUserId === user.id && (
                        <tr>
                          <td colSpan={6} className="bg-indigo-500/10">
                            <div className="p-6 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <p className="text-gray-400 text-sm">Email:</p>
                                  <p className="text-white">{user.email}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">Contact Number:</p>
                                  <p className="text-white">{user.contact_number || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">ID Number:</p>
                                  <p className="text-white">{user.id_number || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">Payment Reference:</p>
                                  <p className="text-white">{user.payment_reference || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex gap-4 mt-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPasswordResetModal({ isOpen: true, userEmail: user.email });
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                                >
                                  <FiMail className="w-4 h-4" />
                                  Send Password Reset
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingUser(user);
                                    setShowEditModal(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                  Edit User
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Modal */}
      {showMaintenanceConfirm && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1f2937] p-8 rounded-xl border border-indigo-500/20 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">
              Confirm {isMaintenance ? "Disable" : "Enable"} Maintenance Mode
            </h3>
            <p className="text-white/70 mb-6">
              Are you sure you want to {isMaintenance ? "disable" : "enable"} maintenance mode? 
              This will {isMaintenance ? "restore" : "restrict"} access to the system.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowMaintenanceConfirm(false)}
                className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleMaintenance}
                className={`px-4 py-2 rounded-lg text-white hover:bg-opacity-90 transition-all duration-200
                  ${isMaintenance 
                    ? "bg-emerald-500 hover:bg-emerald-600" 
                    : "bg-red-500 hover:bg-red-600"
                  }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDatePicker && (
        <DatePickerModal
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onConfirm={updateSubscriptionDate}
          currentDate={selectedUser?.subscription_end_date ?? null}
          userEmail={selectedUser?.email || ''}
        />
      )}

      {showEditModal && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          user={editingUser}
          onSave={handleUpdateUser}
        />
      )}

      <PasswordResetModal
        isOpen={passwordResetModal.isOpen}
        onClose={() => setPasswordResetModal({ isOpen: false, userEmail: '' })}
        onConfirm={() => {
          sendPasswordReset(passwordResetModal.userEmail);
          setPasswordResetModal({ isOpen: false, userEmail: '' });
        }}
        userEmail={passwordResetModal.userEmail}
      />
    </>
  );
};

export default Admin;
