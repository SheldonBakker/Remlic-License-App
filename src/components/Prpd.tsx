/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Typography, Modal, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface PrpdDetails {
  firstName: string;
  lastName: string;
  idNumber: string;
  expiryDate: string;
}

interface PrpdProps {
  onClose?: () => void;
  editingLicense?: any;
}

const Prpd: React.FC<PrpdProps> = ({ onClose, editingLicense }) => {
  const navigate = useNavigate();
  const [prpdData, setPrpdData] = useState<PrpdDetails>({
    firstName: "",
    lastName: "",
    idNumber: "",
    expiryDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPrpdData = async () => {
      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      if (editingLicense) {
        setPrpdData({
          firstName: editingLicense.first_name || "",
          lastName: editingLicense.last_name || "",
          idNumber: editingLicense.id_number || "",
          expiryDate: editingLicense.expiry_date || "",
        });
        return;
      }

      try {
        const {
          data: { user },
          error,
        } = await (await supabase).auth.getUser();
        if (error || !user) throw error;

        setPrpdData({
          firstName: user.user_metadata.first_name || "",
          lastName: user.user_metadata.last_name || "",
          idNumber: "",
          expiryDate: "",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchPrpdData();
  }, [navigate, editingLicense]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    Object.keys(prpdData).forEach((key) => {
      if (!prpdData[key as keyof PrpdDetails].trim()) {
        newErrors[key] = `${
          key.charAt(0).toUpperCase() + key.slice(1)
        } is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [prpdData]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      if (name === "expiryDate") {
        // Handle date input formatting
        const dateInput = value.replace(/\D/g, ""); // Remove non-digits
        if (dateInput.length >= 4) {
          // If we have at least 4 digits for the year, format it as YYYY-MM
          const year = dateInput.slice(0, 4);
          const month = dateInput.slice(4, 6);
          const day = dateInput.slice(6, 8);

          let formattedDate = year;
          if (month) formattedDate += `-${month}`;
          if (day) formattedDate += `-${day}`;

          setPrpdData((prev) => ({
            ...prev,
            [name]: formattedDate,
          }));
          return;
        }
      }

      setPrpdData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await (await supabase)
        .from("prpd")
        .delete()
        .eq("id", editingLicense.id);

      if (error) throw error;

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        if (onClose) onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Error deleting PRPD:", error);
      alert(error.message || "Error deleting PRPD information");
    } finally {
      setIsLoading(false);
    }
  }, [editingLicense?.id, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsLoading(true);
      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      try {
        const prpdInfo = {
          user_id: session.user.id,
          first_name: prpdData.firstName,
          last_name: prpdData.lastName,
          id_number: prpdData.idNumber,
          expiry_date: prpdData.expiryDate,
        };

        let error;
        if (editingLicense) {
          ({ error } = await (await supabase)
            .from("prpd")
            .update(prpdInfo)
            .eq("id", editingLicense.id));
        } else {
          ({ error } = await (await supabase).from("prpd").insert([prpdInfo]));
        }

        if (error) throw error;

        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          if (onClose) onClose();
        }, 2000);
      } catch (error: any) {
        console.error("Error saving PRPD:", error);
        alert(error.message || "Error saving PRPD information");
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm, prpdData, editingLicense, navigate, onClose]
  );

  const SuccessModal = useMemo(() => {
    const ModalComponent = memo(() => (
      <Modal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        aria-labelledby="success-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: {
              xs: "90%", // For mobile devices
              sm: "400px", // For tablets and up
            },
            maxWidth: "400px",
            bgcolor: "#1f2937",
            borderRadius: "16px",
            boxShadow: "rgba(0, 0, 0, 0.25) 0px 25px 50px -12px",
            p: { xs: 3, sm: 4 }, // Responsive padding
            textAlign: "center",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            outline: "none", // Removes the default focus outline
            backdropFilter: "blur(20px)",
            animation: "fadeIn 0.3s ease-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translate(-50%, -45%)" },
              to: { opacity: 1, transform: "translate(-50%, -50%)" },
            },
          }}
        >
          <CheckCircleIcon
            sx={{
              fontSize: { xs: 48, sm: 60 }, // Responsive icon size
              color: "#818cf8",
              mb: 2,
              animation: "scaleIn 0.4s ease-out",
              "@keyframes scaleIn": {
                from: { transform: "scale(0)" },
                to: { transform: "scale(1)" },
              },
            }}
          />
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: "white",
              fontSize: { xs: "1.25rem", sm: "1.5rem" }, // Responsive text size
              fontWeight: 600,
            }}
          >
            Success!
          </Typography>
          <Typography
            sx={{
              mt: 2,
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: { xs: "0.875rem", sm: "1rem" }, // Responsive text size
            }}
          >
            PRPD license information has been saved successfully.
          </Typography>
        </Box>
      </Modal>
    ));
    return ModalComponent;
  }, [showSuccessModal]);

  const DeleteConfirmationModal = useMemo(() => {
    const ModalComponent = () => (
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        aria-labelledby="delete-confirmation-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "#1f2937",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            textAlign: "center",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{ color: "white", mb: 2 }}
          >
            Confirm Deletion
          </Typography>
          <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 3 }}>
            Are you sure you want to delete this PRPD license?
          </Typography>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleDelete();
                setIsDeleteModalOpen(false);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </Box>
      </Modal>
    );
    return ModalComponent;
  }, [isDeleteModalOpen, handleDelete]);

  return (
    <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20">
      <Typography
        variant="h4"
        component="h1"
        className="text-white font-bold mb-4"
      >
        PRPD License Information
      </Typography>
      <Typography variant="body1" className="text-white/70 mb-8">
        Enter your professional driving permit details
      </Typography>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white/90 mb-2">First Name</label>
            <input
              type="text"
              name="firstName"
              value={prpdData.firstName}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.firstName ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.firstName && (
              <p className="mt-1 text-red-500 text-sm">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={prpdData.lastName}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.lastName ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.lastName && (
              <p className="mt-1 text-red-500 text-sm">{errors.lastName}</p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">ID Number</label>
            <input
              type="text"
              name="idNumber"
              value={prpdData.idNumber}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.idNumber ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.idNumber && (
              <p className="mt-1 text-red-500 text-sm">{errors.idNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              value={prpdData.expiryDate}
              onChange={handleInputChange}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.expiryDate ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            <p className="mt-1 text-white/50 text-sm">Format: YYYY-MM-DD</p>
            {errors.expiryDate && (
              <p className="mt-1 text-red-500 text-sm">{errors.expiryDate}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 
            ${
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-purple-700 hover:to-indigo-700"
            } 
            text-white py-3 px-4 rounded-xl transition-all duration-200 border 
            border-white/10 font-semibold`}
          >
            {isLoading
              ? "Processing..."
              : editingLicense
              ? "Update PRPD License"
              : "Save PRPD License"}
          </button>
          {editingLicense && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 
              py-3 px-4 rounded-xl transition-all duration-200 border 
              border-red-500/20 font-semibold"
            >
              Delete PRPD License
            </button>
          )}
        </div>
      </form>

      <SuccessModal />
      <DeleteConfirmationModal />
    </div>
  );
};

export default React.memo(Prpd);
