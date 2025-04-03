import {
  FiRefreshCw,
  FiTrash2,
  FiPlus,
  FiMail,
  FiActivity,
  FiSettings,
  FiCheck,
  FiPlay,
  FiDollarSign,
  FiBell,
  FiFileText,
  FiStar,
  FiHelpCircle,
  FiArrowUp,
} from "react-icons/fi";
import StructuredData from "../components/StructuredData";
import * as React from "react";
import { Helmet } from 'react-helmet';
import { Link as ScrollLink } from 'react-scroll';
import { LICENSE_TYPES } from '../constants/licenses';
import { Link } from 'react-router-dom';

const Documentation = () => {
  const licenseTypes = Object.entries(LICENSE_TYPES).map(([id, type]) => ({
    id,
    title: type.name,
    description: id === 'psira' 
      ? "Verify and store PSIRA registration details" 
      : `Track and manage your ${type.name.toLowerCase()} renewals`,
    icon: React.createElement(type.icon, { className: 'h-6 w-6' }),
    color: type.color,
    tailwindClass: type.tailwindClass,
    fields: [
      ...(id === 'vehicles' ? ["Make", "Model", "Registration Number", "Expiry Date"] :
         id === 'drivers' ? ["First Name", "Last Name", "ID Number", "Expiry Date"] :
         id === 'psira' ? ["First Name", "Last Name", "PSIRA No", "Reg Status", "Expiry Date"] :
         ["Owner", "Description", "Number", "Expiry Date"])
    ],
  }));

  const notificationFeatures = [
    {
      id: "email",
      title: "Email Notifications",
      description: "Receive automated email alerts for expiring licenses",
      icon: <FiMail className="h-6 w-6" />,
      details: ["Customizable frequency", "Expiry reminders", "Status updates"],
    },
    {
      id: "dashboard",
      title: "Dashboard Alerts",
      description: "Visual indicators for license status",
      icon: <FiActivity className="h-6 w-6" />,
      details: ["Color-coded status", "Expiry countdown", "Priority sorting"],
    },
    {
      id: "settings",
      title: "Notification Settings",
      description: "Personalize your notification preferences",
      icon: <FiSettings className="h-6 w-6" />,
      details: ["Custom reminder schedule", "Notification frequency", "Alert thresholds"],
    },
  ];

  const subscriptionTiers = [
    {
      id: "basic",
      title: "Tier 1",
      price: "R550/year or R50/month",
      features: ["2 Licenses per category"],
    },
    {
      id: "standard",
      title: "Tier 2",
      price: "R900/year or R80/month",
      features: ["5 Licenses per category"],
    },
    {
      id: "professional",
      title: "Tier 3",
      price: "R1000/year or R100/month",
      features: ["8 Licenses per category"],
    },
    {
      id: "advanced",
      title: "Tier 4",
      price: "R2100/year or R200/month",
      features: ["10 Licenses per category", "Priority support"],
    },
    {
      id: "premium",
      title: "Tier 5",
      price: "R4000/year or R350/month",
      features: ["Unlimited licenses per category", "Priority support", "API access"],
    },
  ];

  const articleData = React.useMemo(() => ({
    "@type": "Article",
    headline: "How to Use RemLic - License Management Documentation",
    author: {
      "@type": "Organization",
      name: "RemLic",
      url: "https://remlic.co.za",
    },
    publisher: {
      "@type": "Organization",
      name: "RemLic",
      logo: {
        "@type": "ImageObject",
        url: "https://remlic.co.za/logo.png",
      },
    },
    datePublished: "2024-03-20",
    dateModified: "2024-03-20",
    image: "https://remlic.co.za/documentation-preview.jpg",
    description:
      "A comprehensive guide to managing your licenses and permits with RemLic. Learn how to track driver's licenses, vehicle registrations, and more.",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://remlic.co.za/documentation",
    },
  }), []);

  const breadcrumbData = React.useMemo(() => ({
    items: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://remlic.co.za",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Documentation",
        item: "https://remlic.co.za/documentation",
      },
    ],
  }), []);

  const navigationSections = [
    { 
      id: "getting-started", 
      label: "Getting Started",
      icon: <FiPlay className="h-4 w-4" />
    },
    { 
      id: "subscription-plans", 
      label: "Subscription Plans",
      icon: <FiDollarSign className="h-4 w-4" />
    },
    { 
      id: "notifications", 
      label: "Notifications",
      icon: <FiBell className="h-4 w-4" />
    },
    { 
      id: "license-types", 
      label: "License Types",
      icon: <FiFileText className="h-4 w-4" />
    },
    { 
      id: "features", 
      label: "Features",
      icon: <FiStar className="h-4 w-4" />
    },
    { 
      id: "faq", 
      label: "FAQ",
      icon: <FiHelpCircle className="h-4 w-4" />
    }
  ];

  const faqItems = [
    {
      question: "How do I change my subscription plan?",
      answer: "You can upgrade or downgrade your subscription plan from your account settings. Changes take effect at the start of your next billing cycle."
    },
    {
      question: "What happens if I exceed my license limit?",
      answer: "You'll need to upgrade to a higher tier or remove some licenses to add new ones. We'll notify you when you're approaching your limit."
    },
    {
      question: "How to remove 2FA?",
      answer: "To remove 2FA, please email support@remlic.co.za with the following information: your email address, ID number, a clear picture of your ID document, and your payment reference number. Our support team will verify your identity and assist with removing 2FA from your account."
    },
    {
      question: "What information can you see?",
      answer: "All information is encrypted except for your profile information which includes: First Name, Last Name, ID number, Contact Number, Email, and what package you have."
    }
  ];

  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const duration = 1000; // Increase this value for slower scrolling (in milliseconds)
    const start = window.pageYOffset;
    const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

    const easeInOutQuad = (t: number): number => {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };

    const scroll = () => {
      const now = 'now' in window.performance ? performance.now() : new Date().getTime();
      const time = Math.min(1, ((now - startTime) / duration));
      
      window.scroll(0, Math.ceil(start * (1 - easeInOutQuad(time))));
      
      if (time < 1) {
        requestAnimationFrame(scroll);
      }
    };

    requestAnimationFrame(scroll);
  };

  return (
    <>
      <Helmet>
        <title>
          RemLic Documentation: Complete Guide to License Management
        </title>
        <meta
          name="description"
          content="Learn how to manage and track your licenses with RemLic. Comprehensive guide for driver's licenses, vehicle registrations, work permits, and more."
        />
        <meta
          name="keywords"
          content="license management, document tracking, driver's license renewal, vehicle registration, PrDP, firearm license, work contract"
        />
      </Helmet>

      <StructuredData type="article" data={articleData} />
      <StructuredData type="breadcrumb" data={breadcrumbData} />
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]">
        <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-indigo-500/20 shadow-lg shadow-slate-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16 overflow-x-auto scrollbar-hide">
              <div className="flex items-center space-x-2 sm:space-x-4">
                {navigationSections.map((section) => (
                  <ScrollLink
                    key={section.id}
                    to={section.id}
                    smooth={true}
                    duration={500}
                    spy={true}
                    offset={-80}
                    activeClass="!bg-indigo-500 !text-white !border-indigo-400"
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg
                      text-slate-400 border border-transparent
                      hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/30
                      transition-all duration-200 ease-out
                      cursor-pointer whitespace-nowrap
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                      group
                    `}
                  >
                    <span className="text-lg sm:text-base transition-transform group-hover:scale-110">
                      {section.icon}
                    </span>
                    <span className="text-xs sm:text-sm font-medium hidden sm:block">
                      {section.label}
                    </span>
                  </ScrollLink>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="bg-indigo-500/10 text-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full border border-indigo-500/20">
                Documentation
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              How to Use Remlic
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              A comprehensive guide to managing your licenses and permits
            </p>
          </div>

          {/* Enhanced Getting Started Section */}
          <div id="getting-started" className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Getting Started</h2>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold">
                    {step}
                  </div>
                  <div className="flex-1">
                    <p className="text-white">
                      {step === 1 && "Create an account or log in to your existing account"}
                      {step === 2 && "Choose from our flexible subscription tiers:"}
                      {step === 3 && "Add your licenses through the License Management dashboard"}
                      {step === 4 && "Set up your notification preferences for expiry reminders"}
                    </p>
                    {step === 2 && (
                      <ul className="list-disc list-inside ml-4 space-y-2 text-white">
                        <li>Tier 1 (R550/year or R50/month): Basic plan with 2 licenses per category</li>
                        <li>Tier 2 (R900/year or R80/month): Standard plan with 5 licenses per category</li>
                        <li>Tier 3 (R1000/year or R100/month): Professional plan with 8 licenses per category</li>
                        <li>Tier 4 (R2100/year or R200/month): Advanced plan with 10 licenses per category</li>
                        <li>Tier 5 (R4000/year or R350/month): Premium plan with unlimited licenses per category</li>
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Subscription Tiers Section */}
          <section id="subscription-plans" className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-indigo-500/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">Subscription Plans</h2>
              <p className="text-white/70 max-w-2xl mx-auto">Choose the perfect plan for your license management needs, with flexible pricing options for businesses of all sizes</p>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-lg bg-slate-800/80 p-1 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <span className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm">
                    Annual
                  </span>
                  <span className="px-4 py-2 text-sm font-medium text-white/70">
                    Monthly
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {subscriptionTiers.map((tier) => (
                <div 
                  key={tier.id} 
                  className={`relative overflow-hidden rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    tier.id === 'premium' 
                      ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-2 border-amber-500/30' 
                      : 'bg-gradient-to-b from-white/10 to-transparent border border-indigo-500/20'
                  }`}
                >
                  {tier.id === 'premium' && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-black px-3 py-1 rounded-bl-lg font-bold text-xs">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Tier Header */}
                    <div className="text-center mb-5">
                      <h3 className={`text-xl font-bold mb-2 ${
                        tier.id === 'premium' ? 'text-amber-300' : 'text-white'
                      }`}>
                        {tier.title}
                      </h3>
                      
                      {/* Price Display */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-baseline">
                          <span className="text-3xl font-extrabold text-white">
                            {tier.price.split('/')[0]}
                          </span>
                          <span className="text-white/50 ml-1 text-sm">
                            /year
                          </span>
                        </div>
                        <div className={`text-xs mt-1 ${
                          tier.id === 'premium' ? 'text-amber-300/80' : 'text-indigo-400/80'
                        }`}>
                          or {tier.price.split('or ')[1]}
                        </div>
                      </div>
                    </div>
                    
                    {/* Divider */}
                    <div className={`h-px w-16 mx-auto mb-5 ${
                      tier.id === 'premium' ? 'bg-amber-500/30' : 'bg-indigo-500/30'
                    }`}></div>
                    
                    {/* Features List */}
                    <ul className="space-y-3 mb-5">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <FiCheck className={`h-5 w-5 mr-2 flex-shrink-0 ${
                            tier.id === 'premium' ? 'text-amber-400' : 'text-green-400'
                          }`} />
                          <span className="text-white/80 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA Button */}
                    <Link 
                      to="/price"
                      className={`w-full block text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        tier.id === 'premium'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600' 
                          : 'bg-indigo-500/80 text-white hover:bg-indigo-600'
                      }`}
                    >
                      Select Plan
                    </Link>
                  </div>
                  
                  {/* Background Decorative Elements */}
                  <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 ${
                    tier.id === 'premium' ? 'bg-amber-400' : 'bg-indigo-500'
                  }`}></div>
                </div>
              ))}
            </div>
            
            {/* Pricing Notes */}
            <div className="text-center mt-8">
              <p className="text-white/60 text-sm">
                All plans include email notifications and unlimited license renewals. 
                <Link to="/price" className="text-indigo-400 hover:text-indigo-300 ml-1 underline-offset-2 hover:underline">
                  View full pricing details
                </Link>
              </p>
            </div>
          </section>

          {/* Add Enhanced Notification System Section */}
          <section id="notifications" className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Advanced Notification System</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {notificationFeatures.map((feature) => (
                <div key={feature.id} className="bg-white/5 rounded-xl p-6 border border-indigo-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-white mb-4">{feature.description}</p>
                  <ul className="list-disc list-inside text-white space-y-1">
                    {feature.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* License Types Section */}
          <section id="license-types" className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              License Types
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {licenseTypes.map((license) => (
                <div
                  key={license.id}
                  className="bg-white/5 rounded-xl p-6 border border-indigo-500/20"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`h-10 w-10 ${license.tailwindClass.bg} rounded-lg flex items-center justify-center ${license.tailwindClass.text}`}>
                      {React.cloneElement(license.icon, {
                        "aria-label": `${license.title} icon`,
                        role: "img",
                      })}
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {license.title}
                    </h3>
                  </div>
                  <p className="text-white mb-4">{license.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">
                      Required Fields:
                    </p>
                    <ul className="list-disc list-inside text-white text-sm">
                      {license.fields?.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-indigo-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Search Functionality
                </h3>
                <p className="text-white">
                  Easily find licenses using the search bar. Search by
                  registration numbers, names, or ID numbers.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-indigo-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Status Tracking
                </h3>
                <p className="text-white">
                  Visual indicators show license status: valid (green), expiring
                  soon (yellow), or expired (red).
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-indigo-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Organized Categories
                </h3>
                <p className="text-white">
                  Licenses are grouped by type for easy management and
                  monitoring.
                </p>
              </div>
            </div>
          </section>

          {/* Reminder Settings Section */}
          <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Reminder Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-indigo-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Customizable Notifications
                </h3>
                <p className="text-white">
                  Set up personalized reminder schedules for each license type.
                  Choose when and how often you want to be notified.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-indigo-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Reminder Frequency
                </h3>
                <p className="text-white">
                  Select between daily or weekly reminders for upcoming license
                  renewals.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-indigo-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Advanced Notice
                </h3>
                <p className="text-white">
                  Choose how many days in advance you want to be reminded about
                  expiring licenses.
                </p>
              </div>
            </div>
          </div>

          {/* Managing Licenses Section */}
          <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Managing Your Licenses
            </h2>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FiPlus className="h-6 w-6 text-indigo-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Adding New Licenses
                  </h3>
                </div>
                <p className="text-white">
                  1. Click the "Add License" button in the dashboard
                  <br />
                  2. Select the license type from the available options
                  <br />
                  3. Fill in the required information in the form
                  <br />
                  4. Submit to add the license to your dashboard
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FiRefreshCw className="h-6 w-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Renewing Licenses
                  </h3>
                </div>
                <p className="text-white">
                  Click the "Renew" button on any license card to update its
                  expiry date. You'll be prompted to enter the new expiry date.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FiTrash2 className="h-6 w-6 text-red-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Deleting Licenses
                  </h3>
                </div>
                <p className="text-white">
                  To remove a license, click the "Delete" button on the license
                  card. You'll be asked to confirm the deletion.
                </p>
              </div>
            </div>
          </div>

          {/* Tips and Best Practices */}
          <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Tips and Best Practices
            </h2>
            <div className="space-y-4 text-white/70">
              <p>• Regularly check your dashboard for upcoming renewals</p>
              <p>
                • Keep your contact information up to date to receive
                notifications
              </p>
              <p>
                • Add licenses as soon as you receive them for better tracking
              </p>
              <p>
                • Configure reminder settings for each license type based on
                their importance
              </p>
              <p>
                • Use daily reminders for critical licenses and weekly for
                others
              </p>
              <p>
                • Set longer advance notice periods for licenses that take
                longer to renew
              </p>
            </div>
          </div>

          {/* Add FAQ Section */}
          <section id="faq" className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{item.question}</h3>
                  <p className="text-white">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Add Contact Support Section */}
          <section className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Need Help?</h2>
            <div className="text-center">
              <p className="text-white/70 mb-4">
                Our support team is available to help you with any questions or issues.
              </p>
              <a
                href="mailto:support@remlic.co.za"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiMail className="mr-2" />
                Contact Support
              </a>
            </div>
          </section>
        </div>
      </main>

      <button
        onClick={scrollToTop}
        className={`          fixed bottom-8 right-8 p-3 rounded-full
          bg-indigo-600 text-white shadow-lg
          hover:bg-indigo-700 transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-indigo-500/40
          ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}
          z-50
        `}
        aria-label="Scroll to top"
      >
        <FiArrowUp className="h-6 w-6" />
      </button>
    </>
  );
};

export default React.memo(Documentation);

