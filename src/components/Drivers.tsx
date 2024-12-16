/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, memo } from "react";
import { Typography, Modal, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface DriverLicense {
  firstName: string;
  lastName: string;
  idNumber: string;
  expiryDate: string;
}

interface DriversProps {
  onClose?: () => void;
  editingLicense?: any;
}

const Drivers: React.FC<DriversProps> = ({ onClose, editingLicense }) => {
  const navigate = useNavigate();
  const [driverData, setDriverData] = useState<DriverLicense>({
    firstName: "",
    lastName: "",
    idNumber: "",
    expiryDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchUserData = useCallback(async () => {
    const {
      data: { session },
    } = await (await supabase).auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    if (editingLicense) {
      setDriverData({
        firstName: editingLicense.first_name,
        lastName: editingLicense.last_name,
        idNumber: editingLicense.id_number,
        expiryDate: editingLicense.expiry_date,
      });
      return;
    }
  }, [navigate, editingLicense]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    Object.keys(driverData).forEach((key) => {
      if (!driverData[key as keyof DriverLicense].trim()) {
        newErrors[key] = `${
          key.charAt(0).toUpperCase() + key.slice(1)
        } is required`;
      }
    });

    if (driverData.expiryDate) {
      const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
      if (!dateRegex.test(driverData.expiryDate)) {
        newErrors.expiryDate = "Please enter a valid date in YYYY-MM-DD format";
      } else {
        const inputDate = new Date(driverData.expiryDate);
        const today = new Date();
        if (inputDate < today) {
          newErrors.expiryDate = "Expiry date cannot be in the past";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [driverData]);

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

          setDriverData((prev) => ({
            ...prev,
            [name]: formattedDate,
          }));
          return;
        }
      }

      setDriverData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
        const formattedExpiryDate = new Date(driverData.expiryDate)
          .toISOString()
          .split("T")[0];

        const licenseData = {
          user_id: session.user.id,
          first_name: driverData.firstName,
          last_name: driverData.lastName,
          id_number: driverData.idNumber,
          expiry_date: formattedExpiryDate,
        };

        const { error } = await (await supabase)
          .from("drivers")
          .insert(licenseData);

        if (error) throw error;

        setDriverData({
          firstName: "",
          lastName: "",
          idNumber: "",
          expiryDate: "",
        });

        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          if (onClose) onClose();
        }, 2000);
      } catch (error) {
        console.error("Error saving driver license:", error);
        alert("Error saving driver license information");
      }
    },
    [validateForm, navigate, driverData, onClose]
  );

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
          Driver license information has been saved successfully.
        </Typography>
      </Box>
    </Modal>
  ));

  return (
    <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-indigo-500/20 max-w-4xl mx-auto">
      <div className="mb-8">
        <Typography
          variant="h4"
          component="h1"
          className="text-2xl sm:text-3xl text-white font-bold mb-2"
        >
          Driver License Information
        </Typography>
        <Typography variant="body1" className="text-white/70">
          Please fill in your driver's license details below
        </Typography>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={driverData.firstName}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.firstName ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
              transition-all duration-200 backdrop-blur-xl outline-none`}
            />
            {errors.firstName && (
              <p className="mt-1.5 text-red-400 text-sm">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={driverData.lastName}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.lastName ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
              transition-all duration-200 backdrop-blur-xl outline-none`}
            />
            {errors.lastName && (
              <p className="mt-1.5 text-red-400 text-sm">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              ID Number
            </label>
            <input
              type="text"
              name="idNumber"
              value={driverData.idNumber}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.idNumber ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
              transition-all duration-200 backdrop-blur-xl outline-none`}
            />
            {errors.idNumber && (
              <p className="mt-1.5 text-red-400 text-sm">{errors.idNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              name="expiryDate"
              value={driverData.expiryDate}
              onChange={handleInputChange}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.expiryDate ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
              transition-all duration-200 backdrop-blur-xl outline-none`}
            />
            <p className="mt-1.5 text-white/50 text-xs">Format: YYYY-MM-DD</p>
            {errors.expiryDate && (
              <p className="mt-1.5 text-red-400 text-sm">{errors.expiryDate}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto sm:min-w-[200px] bg-gradient-to-r from-purple-600 to-indigo-600 
            hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-6 
            rounded-xl transition-all duration-200 border border-white/10
            font-semibold shadow-lg hover:shadow-indigo-500/25"
          >
            Save License Details
          </button>
        </div>
      </form>

      <SuccessModal />
    </div>
  );
};

export default memo(Drivers);
