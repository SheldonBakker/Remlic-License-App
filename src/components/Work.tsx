/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, memo, useCallback } from "react";
import { Typography, Modal, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface WorkDetails {
  contractName: string;
  contractType: string;
  companyName: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  emailAddress: string;
  expiryDate: string;
  id?: string;
}

interface WorkProps {
  onClose?: () => void;
  editingLicense?: any;
}

const Work: React.FC<WorkProps> = ({ onClose, editingLicense }) => {
  const navigate = useNavigate();
  const [workData, setWorkData] = useState<WorkDetails>({
    contractName: "",
    contractType: "",
    companyName: "",
    firstName: "",
    lastName: "",
    contactNumber: "",
    emailAddress: "",
    expiryDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchWorkData = async () => {
      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // If we're editing an existing contract, populate the form with its data
      if (editingLicense) {
        setWorkData({
          contractName: editingLicense.contract_name || "",
          contractType: editingLicense.contract_type || "",
          companyName: editingLicense.company_name || "",
          firstName: editingLicense.first_name || "",
          lastName: editingLicense.last_name || "",
          contactNumber: editingLicense.contact_number || "",
          emailAddress: editingLicense.email_address || "",
          expiryDate: editingLicense.expiry_date || "",
        });
        return;
      }

      // For new contracts, try to pre-fill with user metadata
      try {
        const {
          data: { user },
          error,
        } = await (await supabase).auth.getUser();
        if (error || !user) throw error;

        setWorkData((prev) => ({
          ...prev,
          firstName: user.user_metadata.first_name || "",
          lastName: user.user_metadata.last_name || "",
          emailAddress: user.email || "",
        }));
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchWorkData();
  }, [navigate, editingLicense]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    Object.keys(workData).forEach((key) => {
      const value = workData[key as keyof WorkDetails];
      if (!value || !value.trim()) {
        newErrors[key] = `${
          key.charAt(0).toUpperCase() + key.slice(1)
        } is required`;
      }
      // Additional email validation
      if (key === "emailAddress" && workData.emailAddress.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(workData.emailAddress)) {
          newErrors[key] = "Invalid email address";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

          setWorkData((prev) => ({
            ...prev,
            [name]: formattedDate,
          }));
          return;
        }
      }

      setWorkData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

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

      const workInfo = {
        user_id: session.user.id,
        contract_name: workData.contractName,
        contract_type: workData.contractType,
        company_name: workData.companyName,
        first_name: workData.firstName,
        last_name: workData.lastName,
        contact_number: workData.contactNumber,
        email_address: workData.emailAddress,
        expiry_date: workData.expiryDate,
      };

      console.log("Attempting to save work info:", workInfo); // Debug log

      let response;
      if (editingLicense) {
        response = await (await supabase)
          .from("works")
          .update(workInfo)
          .eq("id", editingLicense.id)
          .select(); // Add .select() to get response data
      } else {
        response = await (await supabase)
          .from("works")
          .insert([workInfo])
          .select(); // Add .select() to get response data
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
      console.error("Full error details:", error); // More detailed error logging
      alert(
        error instanceof Error
          ? error.message
          : "Error saving work contract information"
      );
    }
  };

  const SuccessModal = memo(() => (
    <Modal
      open={showSuccessModal}
      onClose={() => setShowSuccessModal(false)}
      aria-labelledby="success-modal"
      sx={{
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(3px)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(1)",
          transition: "transform 0.3s ease-out",
          "&:hover": {
            transform: "translate(-50%, -50%) scale(1.02)",
          },
          width: {
            xs: "85%",
            sm: "400px",
          },
          p: { xs: 4, sm: 5 },
          bgcolor: "#1f2937",
          borderRadius: "16px",
          boxShadow: "rgba(0, 0, 0, 0.25) 0px 25px 50px -12px",
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
          Work contract has been saved successfully.
        </Typography>
      </Box>
    </Modal>
  ));

  return (
    <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-indigo-500/20 max-w-5xl mx-auto shadow-2xl">
      <div className="mb-6 md:mb-8">
        <Typography
          variant="h4"
          component="h1"
          className="text-2xl md:text-4xl text-white font-bold mb-2 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent"
        >
          Work Contract Information
        </Typography>
        <Typography
          variant="body1"
          className="text-white/70 text-sm md:text-base"
        >
          Enter your work contract details below
        </Typography>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="group transition-all duration-300 hover:scale-[1.01]">
          <label className="block text-white/90 text-sm font-medium mb-2 transition-colors group-hover:text-indigo-400">
            Name of Contract
          </label>
          <input
            type="text"
            name="contractName"
            value={workData.contractName}
            onChange={handleInputChange}
            className={`w-full p-3 md:p-4 bg-[#1f2937]/50 border ${
              errors.contractName ? "border-red-500" : "border-indigo-500/20"
            } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
            transition-all duration-200 backdrop-blur-xl outline-none hover:bg-[#1f2937]/70`}
          />
          {errors.contractName && (
            <p className="mt-1 text-red-500 text-sm">{errors.contractName}</p>
          )}
        </div>

        <div>
          <label className="block text-white/90 mb-2">Type of Contract</label>
          <input
            type="text"
            name="contractType"
            value={workData.contractType}
            onChange={handleInputChange}
            className={`w-full p-3 bg-[#1f2937]/50 border ${
              errors.contractType ? "border-red-500" : "border-indigo-500/20"
            } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
            transition-all duration-200`}
          />
          {errors.contractType && (
            <p className="mt-1 text-red-500 text-sm">{errors.contractType}</p>
          )}
        </div>

        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">
            Name of Company
          </label>
          <input
            type="text"
            name="companyName"
            value={workData.companyName}
            onChange={handleInputChange}
            className={`w-full p-3 bg-[#1f2937]/50 border ${
              errors.companyName ? "border-red-500" : "border-indigo-500/20"
            } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
            transition-all duration-200 backdrop-blur-xl outline-none`}
          />
          {errors.companyName && (
            <p className="mt-1.5 text-red-400 text-sm">{errors.companyName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={workData.firstName}
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
              value={workData.lastName}
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
        </div>

        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">
            Contact Number
          </label>
          <input
            type="tel"
            name="contactNumber"
            value={workData.contactNumber}
            onChange={handleInputChange}
            className={`w-full p-3 bg-[#1f2937]/50 border ${
              errors.contactNumber ? "border-red-500" : "border-indigo-500/20"
            } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
            transition-all duration-200 backdrop-blur-xl outline-none`}
          />
          {errors.contactNumber && (
            <p className="mt-1.5 text-red-400 text-sm">
              {errors.contactNumber}
            </p>
          )}
        </div>

        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="emailAddress"
            value={workData.emailAddress}
            onChange={handleInputChange}
            className={`w-full p-3 bg-[#1f2937]/50 border ${
              errors.emailAddress ? "border-red-500" : "border-indigo-500/20"
            } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
            transition-all duration-200 backdrop-blur-xl outline-none`}
          />
          {errors.emailAddress && (
            <p className="mt-1.5 text-red-400 text-sm">{errors.emailAddress}</p>
          )}
        </div>

        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">
            Expiry Date
          </label>
          <input
            type="text"
            name="expiryDate"
            value={workData.expiryDate}
            onChange={handleInputChange}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            className={`w-full p-3 bg-[#1f2937]/50 border ${
              errors.expiryDate ? "border-red-500" : "border-indigo-500/20"
            } rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
            transition-all duration-200 backdrop-blur-xl outline-none`}
          />
          <p className="mt-1 text-white/50 text-sm">Format: YYYY-MM-DD</p>
          {errors.expiryDate && (
            <p className="mt-1.5 text-red-400 text-sm">{errors.expiryDate}</p>
          )}
        </div>

        <div className="flex gap-4 pt-6 md:pt-8">
          <button
            type="submit"
            className="w-full md:w-auto md:min-w-[200px] bg-gradient-to-r from-purple-600 to-indigo-600 
            hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-6 
            rounded-xl transition-all duration-300 border border-white/10
            font-semibold shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02]
            active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
            text-sm md:text-base"
          >
            {editingLicense ? "Update Contract" : "Save Contract"}
          </button>
        </div>
      </form>

      <SuccessModal />
    </div>
  );
};

export default Work;
