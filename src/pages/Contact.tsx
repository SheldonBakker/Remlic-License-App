import { useState } from "react";
import { FiMail } from "react-icons/fi";

// Move interfaces and constants outside component
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const INITIAL_FORM_STATE: ContactFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const CONTACT_INFO = [
  {
    icon: <FiMail className="h-6 w-6" />,
    title: "Email",
    details: (
      <a
        href="mailto:support@remlic.co.za"
        className="hover:text-indigo-400 transition-colors"
      >
        support@remlic.co.za
      </a>
    ),
  },
] as const;

// Extract reusable styles
const inputStyles =
  "w-full px-4 py-2 bg-white/10 border border-indigo-500/20 rounded-xl text-white focus:border-indigo-500 focus:outline-none";

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    console.log("Input changing:", e.target.name);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: result.message || "Message sent successfully!",
        });
        setFormData(INITIAL_FORM_STATE);
      } else {
        throw new Error(result.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Have questions? We're here to help. Send us a message and we'll
            respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {CONTACT_INFO.map((info, index) => (
              <div
                key={index}
                className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20
                  hover:border-indigo-500/40 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    {info.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {info.title}
                    </h3>
                    <p className="text-white/70">{info.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-6">
                  <label className="block text-white mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={inputStyles}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-white mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputStyles}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={inputStyles}
                />
              </div>

              <div className="mb-6">
                <label className="block text-white mb-2">Message</label>
                <textarea
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className={inputStyles}
                />
              </div>

              {submitStatus.type && (
                <div
                  className={`mb-6 p-4 rounded-xl ${
                    submitStatus.type === "success"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 
                  transition-all duration-200 font-medium disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
