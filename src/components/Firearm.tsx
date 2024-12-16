/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Typography, Modal, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface FirearmDetails {
  firstName: string;
  lastName: string;
  makeModel: string;
  caliber: string;
  registrationNumber: string;
  expiryDate: string;
}

interface FirearmProps {
  onClose?: () => void;
  editingLicense?: any;
}

const Firearm: React.FC<FirearmProps> = ({ onClose, editingLicense }) => {
  const navigate = useNavigate();
  const [firearmData, setFirearmData] = useState<FirearmDetails>({
    firstName: "",
    lastName: "",
    makeModel: "",
    caliber: "",
    registrationNumber: "",
    expiryDate: "",
  });

  useEffect(() => {
    const fetchFirearmData = async () => {
      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      if (editingLicense) {
        setFirearmData({
          firstName: editingLicense.first_name || "",
          lastName: editingLicense.last_name || "",
          makeModel: editingLicense.make_model || "",
          caliber: editingLicense.caliber || "",
          registrationNumber: editingLicense.registration_number || "",
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

        setFirearmData((prev) => ({
          ...prev,
          firstName: user.user_metadata.first_name || "",
          lastName: user.user_metadata.last_name || "",
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchFirearmData();
  }, [navigate, editingLicense]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    Object.keys(firearmData).forEach((key) => {
      if (!firearmData[key as keyof FirearmDetails].trim()) {
        newErrors[key] = `${
          key.charAt(0).toUpperCase() + key.slice(1)
        } is required`;
      }
    });

    if (firearmData.expiryDate) {
      const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
      if (!dateRegex.test(firearmData.expiryDate)) {
        newErrors.expiryDate = "Date must be in YYYY-MM-DD format";
      } else {
        const inputDate = new Date(firearmData.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (inputDate < today) {
          newErrors.expiryDate = "Expiry date cannot be in the past";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [firearmData]);

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

          setFirearmData((prev) => ({
            ...prev,
            [name]: formattedDate,
          }));
          return;
        }
      }

      setFirearmData((prev) => ({
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
        const firearmInfo = {
          user_id: session.user.id,
          first_name: firearmData.firstName,
          last_name: firearmData.lastName,
          make_model: firearmData.makeModel,
          caliber: firearmData.caliber,
          registration_number: firearmData.registrationNumber,
          expiry_date: firearmData.expiryDate,
        };

        const operation = editingLicense
          ? (await supabase)
              .from("firearms")
              .update(firearmInfo)
              .eq("id", editingLicense.id)
          : (await supabase).from("firearms").insert([firearmInfo]);

        const { error } = await operation;

        if (error) {
          if (error.code === "23505") {
            alert("A firearm with this registration number already exists.");
          } else {
            console.error("Database error:", error);
            alert(`Error saving firearm: ${error.message}`);
          }
          return;
        }

        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          if (onClose) onClose();
        }, 2000);
      } catch (error) {
        console.error("Error saving firearm:", error);
        alert("Error saving firearm information. Please try again later.");
      }
    },
    [validateForm, firearmData, editingLicense, navigate, onClose]
  );

  const SuccessModal = useMemo(
    () => () =>
      (
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
              Firearm information has been saved successfully.
            </Typography>
          </Box>
        </Modal>
      ),
    [showSuccessModal]
  );

  return (
    <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20">
      <Typography
        variant="h4"
        component="h1"
        className="text-white font-bold mb-4"
      >
        Firearm License Information
      </Typography>
      <Typography variant="body1" className="text-white/70 mb-8">
        Enter your firearm license details
      </Typography>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white/90 mb-2">First Name</label>
            <input
              type="text"
              name="firstName"
              value={firearmData.firstName}
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
              value={firearmData.lastName}
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
            <label className="block text-white/90 mb-2">Make and Model</label>
            <input
              type="text"
              name="makeModel"
              value={firearmData.makeModel}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.makeModel ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.makeModel && (
              <p className="mt-1 text-red-500 text-sm">{errors.makeModel}</p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">Caliber</label>
            <input
              type="text"
              name="caliber"
              value={firearmData.caliber}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.caliber ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.caliber && (
              <p className="mt-1 text-red-500 text-sm">{errors.caliber}</p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={firearmData.registrationNumber}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.registrationNumber
                  ? "border-red-500"
                  : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.registrationNumber && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.registrationNumber}
              </p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              value={firearmData.expiryDate}
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
            Save Firearm License
          </button>
        </div>
      </form>

      <SuccessModal />
    </div>
  );
};

export default Firearm;
