import { FiLock, FiDatabase, FiUserCheck, FiShield, FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();
  
  const privacyPoints = [
    {
      icon: <FiLock className="h-6 w-6" />,
      title: "Data Security",
      description:
        "We use industry-standard encryption and security measures to protect your personal information and license data.",
    },
    {
      icon: <FiDatabase className="h-6 w-6" />,
      title: "Data Collection",
      description:
        "We collect only essential information needed to manage your licenses and provide reminders, including contact details and license information.",
    },
    {
      icon: <FiUserCheck className="h-6 w-6" />,
      title: "Data Usage",
      description:
        "Your information is used solely for license management, notifications, and improving our services. We never sell your data to third parties.",
    },
    {
      icon: <FiShield className="h-6 w-6" />,
      title: "Your Rights",
      description:
        "You have the right to access, modify, or delete your personal data at any time through your account settings.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            We are committed to protecting your privacy and ensuring the
            security of your personal information.
          </p>
        </div>

        {/* Privacy Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {privacyPoints.map((point, index) => (
            <div
              key={index}
              className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20"
            >
              <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-4">
                {point.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {point.title}
              </h3>
              <p className="text-white/70">{point.description}</p>
            </div>
          ))}
        </div>

        {/* Detailed Privacy Information */}
        <div className="space-y-8 text-white/70">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Personal identification information (Name, email address, phone
                number)
              </li>
              <li>License details and documentation</li>
              <li>Usage data and analytics</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our license management service</li>
              <li>To notify you about license expiration and renewals</li>
              <li>To improve our platform and user experience</li>
              <li>To communicate important updates and changes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              Data Protection
            </h2>
            <p className="mb-4">
              We implement robust security measures to protect your data,
              including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>End-to-end encryption for sensitive data</li>
              <li>Regular security audits and updates</li>
              <li>Secure data centers and backup systems</li>
              <li>Strict access controls and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p>
              If you have any questions about our privacy policy or how we
              handle your data, please contact our privacy team at
              support@remlic.com
            </p>
          </section>

          <section className="pt-8 text-sm">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </section>
        </div>

        {/* Navigation Button */}
        <div className="mt-12 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/terms')}
            className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-xl 
              hover:bg-indigo-700 transition-all duration-200 font-medium group"
          >
            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Terms of Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
