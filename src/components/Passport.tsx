/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, memo } from "react";
import { Typography, Modal, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface PassportData {
  firstName: string;
  lastName: string;
  passportNumber: string;
  expiryDate: string;
}

interface PassportProps {
  onClose?: () => void;
  editingPassport?: any;
}

const Passport: React.FC<PassportProps> = ({ onClose, editingPassport }) => {
  const navigate = useNavigate();
  const [passportData, setPassportData] = useState<PassportData>({
    firstName: "",
    lastName: "",
    passportNumber: "",
    expiryDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchPassportData = async () => {
      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // If we're editing an existing passport, populate the form with its data
      if (editingPassport) {
        setPassportData({
          firstName: editingPassport.first_name || "",
          lastName: editingPassport.last_name || "",
          passportNumber: editingPassport.passport_number || "",
          expiryDate: editingPassport.expiry_date || "",
        });
        return;
      }

      // For new passports, try to pre-fill with user metadata
      try {
        const {
          data: { user },
          error,
        } = await (await supabase).auth.getUser();
        if (error || !user) throw error;

        setPassportData((prev) => ({
          ...prev,
          firstName: user.user_metadata.first_name || "",
          lastName: user.user_metadata.last_name || "",
        }));
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchPassportData();
  }, [navigate, editingPassport]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    Object.keys(passportData).forEach((key) => {
      if (!passportData[key as keyof PassportData].trim()) {
        newErrors[key] = `${
          key.charAt(0).toUpperCase() + key.slice(1)
        } is required`;
      }
    });

    if (passportData.expiryDate) {
      const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
      if (!dateRegex.test(passportData.expiryDate)) {
        newErrors.expiryDate = "Please enter a valid date in YYYY-MM-DD format";
      } else {
        const inputDate = new Date(passportData.expiryDate);
        const today = new Date();
        if (inputDate < today) {
          newErrors.expiryDate = "Expiry date cannot be in the past";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [passportData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const passportInfo = {
        user_id: session.user.id,
        first_name: passportData.firstName,
        last_name: passportData.lastName,
        passport_number: passportData.passportNumber,
        expiry_date: passportData.expiryDate,
      };

      console.log("Attempting to save passport info:", passportInfo); // Debug log

      let response;
      if (editingPassport) {
        response = await (await supabase)
          .from("passports")
          .update(passportInfo)
          .eq("id", editingPassport.id)
          .select();
      } else {
        response = await (await supabase)
          .from("passports")
          .insert([passportInfo])
          .select();
      }

      console.log("Supabase response:", response); // Debug log

      if (response.error) {
        throw new Error(
          `Database error: ${response.error.message} (${response.error.code})`
        );
      }

      if (!response.data) {
        throw new Error("No data returned from database");
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error("Full error details:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error saving passport information"
      );
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      if (name === "expiryDate") {
        const dateInput = value.replace(/\D/g, "");
        if (dateInput.length >= 4) {
          const year = dateInput.slice(0, 4);
          const month = dateInput.slice(4, 6);
          const day = dateInput.slice(6, 8);

          let formattedDate = year;
          if (month) formattedDate += `-${month}`;
          if (day) formattedDate += `-${day}`;

          setPassportData((prev) => ({
            ...prev,
            [name]: formattedDate,
          }));
          return;
        }
      }

      setPassportData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
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
          width: { xs: "90%", sm: "400px" },
          maxWidth: "400px",
          bgcolor: "#1f2937",
          borderRadius: "16px",
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          border: "1px solid rgba(99, 102, 241, 0.2)",
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 60, color: "#818cf8", mb: 2 }} />
        <Typography variant="h6" component="h2" sx={{ color: "white", mb: 1 }}>
          {editingPassport ? "Passport Updated!" : "Passport Added!"}
        </Typography>
        <Typography sx={{ color: "white/70" }}>
          Your passport information has been successfully{" "}
          {editingPassport ? "updated" : "saved"}.
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
          Passport Information
        </Typography>
        <Typography variant="body1" className="text-white/70">
          Please fill in your passport details below
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
              value={passportData.firstName}
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
              value={passportData.lastName}
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
              Passport Number
            </label>
            <input
              type="text"
              name="passportNumber"
              value={passportData.passportNumber}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.passportNumber ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
              transition-all duration-200 backdrop-blur-xl outline-none`}
            />
            {errors.passportNumber && (
              <p className="mt-1.5 text-red-400 text-sm">{errors.passportNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              name="expiryDate"
              value={passportData.expiryDate}
              onChange={handleInputChange}
              placeholder="YYYY-MM-DD"
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.expiryDate ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
              transition-all duration-200 backdrop-blur-xl outline-none`}
            />
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
            Save Passport Details
          </button>
        </div>
      </form>

      <SuccessModal />
    </div>
  );
};

export default memo(Passport);
