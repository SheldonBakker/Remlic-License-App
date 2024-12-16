/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FormEvent, useEffect, useState } from "react";
import {
  Typography,
  Modal,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface VehicleDetails {
  make: string;
  model: string;
  registrationNumber: string;
  expiryDate: string;
  [key: string]: string;
}

interface VehicleProps {
  onClose?: () => void;
  editingLicense?: any;
}

// Replace the existing SuccessModal with this one
const SuccessModal = React.memo(
  ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <Modal open={open} onClose={onClose} aria-labelledby="success-modal">
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
          Vehicle information has been saved successfully.
        </Typography>
      </Box>
    </Modal>
  )
);

const DeleteConfirmationDialog = React.memo(
  ({
    open,
    onClose,
    onDelete,
  }: {
    open: boolean;
    onClose: () => void;
    onDelete: () => void;
  }) => (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          backgroundColor: "#1f2937",
          border: "1px solid rgba(99, 102, 241, 0.2)",
        },
      }}
    >
      <DialogTitle sx={{ color: "white" }}>Confirm Deletion</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          Are you sure you want to delete your vehicle information?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          Cancel
        </Button>
        <Button onClick={onDelete} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
);

const RenewDialog = React.memo(
  ({
    open,
    onClose,
    renewalDate,
    onRenewalDateChange,
    onRenew,
  }: {
    open: boolean;
    onClose: () => void;
    renewalDate: string;
    onRenewalDateChange: (date: string) => void;
    onRenew: () => void;
  }) => (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          backgroundColor: "#1f2937",
          border: "1px solid rgba(99, 102, 241, 0.2)",
        },
      }}
    >
      <DialogTitle sx={{ color: "white" }}>Renew Vehicle License</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}>
          Please enter the new expiry date for your vehicle license
        </Typography>
        <input
          type="date"
          value={renewalDate}
          onChange={(e) => onRenewalDateChange(e.target.value)}
          className="w-full p-3 bg-[#1f2937]/50 border border-indigo-500/20
        rounded-xl text-white focus:border-indigo-500 focus:ring-1 
        focus:ring-indigo-500 transition-all duration-200 backdrop-blur-xl"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
          Cancel
        </Button>
        <Button
          onClick={onRenew}
          disabled={!renewalDate}
          sx={{
            background: "linear-gradient(to right, #9333ea, #6366f1)",
            color: "white",
            "&:hover": {
              background: "linear-gradient(to right, #7e22ce, #4f46e5)",
            },
          }}
        >
          Renew
        </Button>
      </DialogActions>
    </Dialog>
  )
);

const Vehicle: React.FC<VehicleProps> = ({ onClose, editingLicense }) => {
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState<VehicleDetails>({
    make: "",
    model: "",
    registrationNumber: "",
    expiryDate: "",
  });

  const [errors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewalDate, setRenewalDate] = useState("");

  useEffect(() => {
    const fetchVehicleData = async () => {
      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      if (editingLicense) {
        setVehicleData({
          make: editingLicense.make,
          model: editingLicense.model,
          registrationNumber: editingLicense.registration_number,
          expiryDate: editingLicense.expiry_date,
        });
        return;
      }

      setVehicleData({
        make: "",
        model: "",
        registrationNumber: "",
        expiryDate: "",
      });
    };

    fetchVehicleData();
  }, [navigate, editingLicense]);

  // Memoize handlers
  const handleInputChange = React.useCallback(
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

          setVehicleData((prev) => ({
            ...prev,
            [name]: formattedDate,
          }));
          return;
        }
      }

      setVehicleData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleRenewalDateChange = React.useCallback((date: string) => {
    setRenewalDate(date);
  }, []);

  const handleDelete = React.useCallback(async () => {
    if (!editingLicense?.id) return;

    const {
      data: { session },
    } = await (await supabase).auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    try {
      const { error } = await (await supabase)
        .from("vehicles")
        .delete()
        .eq("id", editingLicense.id)
        .eq("user_id", session.user.id);

      if (error) throw error;

      setShowDeleteDialog(false);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      alert("Error deleting vehicle information");
    }
  }, [editingLicense?.id, navigate, onClose]);

  const handleRenew = React.useCallback(async () => {
    if (!editingLicense?.id) return;

    const {
      data: { session },
    } = await (await supabase).auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    try {
      const { error } = await (
        await supabase
      )
        .from("vehicles")
        .update({
          expiry_date: renewalDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingLicense.id)
        .eq("user_id", session.user.id);

      if (error) throw error;

      setShowRenewDialog(false);
      setVehicleData((prev) => ({
        ...prev,
        expiryDate: renewalDate,
      }));

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error("Error renewing vehicle license:", error);
      alert("Error updating expiry date");
    }
  }, [editingLicense?.id, navigate, renewalDate]);

  const handleSubmit = React.useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const {
        data: { session },
      } = await (await supabase).auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      try {
        if (editingLicense?.id) {
          // Update existing vehicle
          const { error } = await (
            await supabase
          )
            .from("vehicles")
            .update({
              make: vehicleData.make,
              model: vehicleData.model,
              registration_number: vehicleData.registrationNumber,
              expiry_date: vehicleData.expiryDate,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingLicense.id)
            .eq("user_id", session.user.id);

          if (error) throw error;
        } else {
          // Insert new vehicle
          const { error } = await (await supabase).from("vehicles").insert({
            make: vehicleData.make,
            model: vehicleData.model,
            registration_number: vehicleData.registrationNumber,
            expiry_date: vehicleData.expiryDate,
            user_id: session.user.id,
          });

          if (error) throw error;
        }

        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          if (onClose) onClose();
        }, 2000);
      } catch (error) {
        console.error("Error saving vehicle:", error);
        alert("Error saving vehicle information");
      }
    },
    [vehicleData, editingLicense?.id, navigate, onClose]
  );

  return (
    <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20">
      <Typography
        variant="h4"
        component="h1"
        className="text-white font-bold mb-4"
      >
        Vehicle Information
      </Typography>
      <Typography variant="body1" className="text-white/70 mb-8">
        Enter your vehicle details
      </Typography>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white/90 mb-2">Make</label>
            <input
              type="text"
              name="make"
              value={vehicleData.make || ""}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.make ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.make && (
              <p className="mt-1 text-red-500 text-sm">{errors.make}</p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">Model</label>
            <input
              type="text"
              name="model"
              value={vehicleData.model || ""}
              onChange={handleInputChange}
              className={`w-full p-3 bg-[#1f2937]/50 border ${
                errors.model ? "border-red-500" : "border-indigo-500/20"
              } rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
              transition-all duration-200 backdrop-blur-xl`}
            />
            {errors.model && (
              <p className="mt-1 text-red-500 text-sm">{errors.model}</p>
            )}
          </div>
          <div>
            <label className="block text-white/90 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={vehicleData.registrationNumber || ""}
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
              value={vehicleData.expiryDate}
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
            Save Vehicle
          </button>
        </div>
      </form>

      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDelete={handleDelete}
      />
      <RenewDialog
        open={showRenewDialog}
        onClose={() => setShowRenewDialog(false)}
        renewalDate={renewalDate}
        onRenewalDateChange={handleRenewalDateChange}
        onRenew={handleRenew}
      />
    </div>
  );
};

export default React.memo(Vehicle);
