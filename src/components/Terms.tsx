import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiShield,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";

const Terms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <FiFileText />,
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.",
    },
    {
      icon: <FiShield />,
      title: "2. Use License",
      content:
        "Permission is granted to temporarily download one copy of the materials (information or software) on License Manager's website for personal, non-commercial transitory viewing only.",
    },
    {
      icon: <FiAlertCircle />,
      title: "3. Disclaimer",
      content:
        "The materials on License Manager's website are provided on an 'as is' basis. License Manager makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
    },
    {
      icon: <FiAlertCircle />,
      title: "4. Limitations",
      content:
        "In no event shall License Manager or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on License Manager's website.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="bg-indigo-500/10 text-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full border border-indigo-500/20">
              Legal Information
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Terms and Conditions
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Please read these terms carefully before using our services
          </p>
        </div>

        {/* Terms Content */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Last Updated Section */}
            <div
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-indigo-500/20 
              hover:border-indigo-500/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <p className="text-white/70">Last Updated: October 2024</p>
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-sm rounded-full">
                  Version 1.0
                </span>
              </div>
            </div>

            {/* Terms Sections */}
            {sections.map((section, index) => (
              <div
                key={index}
                className="group bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-indigo-500/20 
                  hover:border-indigo-500/40 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div
                    className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center 
                    text-indigo-400 group-hover:bg-indigo-500/20 transition-all duration-300"
                  >
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      {section.title}
                    </h2>
                    <p className="text-white/70 mb-4 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-12 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/privacy')}
              className="flex items-center px-8 py-3 bg-indigo-600 text-white rounded-xl 
                hover:bg-indigo-700 transition-all duration-200 font-medium group"
            >
              <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
