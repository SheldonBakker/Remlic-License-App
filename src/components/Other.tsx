import React, { useState, useEffect, memo } from "react";
import { Typography, Modal, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface OtherDocument {
  description: string;
  expiryDate: string;
}

interface OtherProps {
  onClose: () => void;
  editingLicense: {
    id: string;
    description?: string;
    expiry_date: string;
    licenseType?: "vehicle" | "driver" | "firearm" | "prpd" | "work" | "other" | "passport";
  } | null;
}

const Other: React.FC<OtherProps> = ({ onClose, editingLicense }) => {
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<OtherDocument>({
    description: "",
    expiryDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      if (editingLicense) {
        setDocumentData({
          description: editingLicense.description ?? "",
          expiryDate: editingLicense.expiry_date,
        });
      }
    };

    checkSession();
  }, [navigate, editingLicense]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!documentData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!documentData.expiryDate.trim()) {
      newErrors.expiryDate = "Expiry date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setDocumentData((prev) => ({
          ...prev,
          [name]: formattedDate,
        }));
        return;
      }
    }

    setDocumentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const {
      data: { session },
    } = await (await supabase).auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    try {
      let error;
      const data = {
        user_id: session.user.id,
        description: documentData.description,
        expiry_date: documentData.expiryDate,
      };

      if (editingLicense) {
        ({ error } = await (await supabase)
          .from("other_documents")
          .update(data)
          .eq("id", editingLicense.id));
      } else {
        ({ error } = await (await supabase)
          .from("other_documents")
          .insert([data]));
      }

      if (error) throw error;

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Error saving document information");
    }
  };

  const SuccessModal = memo(() => (
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
            xs: "90%",
            sm: "400px",
          },
          maxWidth: "400px",
          bgcolor: "#1f2937",
          borderRadius: "16px",
          boxShadow: "rgba(0, 0, 0, 0.25) 0px 25px 50px -12px",
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          outline: "none",
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
            fontSize: { xs: 48, sm: 60 },
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
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            fontWeight: 600,
          }}
        >
          Success!
        </Typography>
        <Typography
          sx={{
            mt: 2,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          Document information has been saved successfully.
        </Typography>
      </Box>
    </Modal>
  ));

  return (
    <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20">
      <Typography
        variant="h4"
        component="h1"
        className="text-white font-bold mb-4"
      >
        Other Document Information
      </Typography>
      <Typography variant="body1" className="text-white/70 mb-8">
        Enter your document details
      </Typography>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white/90 mb-2">Description</label>
            <input
              type="text"
              name="description"
              value={documentData.description}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.description ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.description && (
              <p className="mt-1 text-red-500 text-sm">{errors.description}</p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              value={documentData.expiryDate}
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
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 
            hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-4 
            rounded-xl transition-all duration-200 border border-white/10
            font-semibold"
          >
            Save Document
          </button>
        </div>
      </form>

      <SuccessModal />
    </div>
  );
};

export default memo(Other);
