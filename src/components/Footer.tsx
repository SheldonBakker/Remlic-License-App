import React, { memo } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import { default as LogoImg } from "../assets/Remlic.png";

const currentYear = new Date().getFullYear();

const Footer: React.FC = memo(() => {
  return (
    <footer className="bg-gradient-to-r from-[#0f172a]/95 via-[#1e1b4b]/95 to-[#0f172a]/95 backdrop-blur-xl border-t border-indigo-500/20">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-white/90 font-semibold flex items-center gap-2">
              <img src={LogoImg} className="h-8 w-8" alt="Remlic Logo" />
              Remlic
            </div>
            <div className="text-white/60 text-sm">
              © {currentYear} All rights reserved.
            </div>
            <div className="text-white/60 text-sm animate-fade-in-up">
              Built by{" "}
              <a
                href="https://shikkidesign.co.za/"
                className="hover:text-white transition-all duration-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sheldon Bakker
              </a>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex space-x-8">
              <Link
                to="/privacy"
                className="text-white/70 hover:text-white transition-all duration-300 text-sm"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-white/70 hover:text-white transition-all duration-300 text-sm"
              >
                Terms
              </Link>
              <Link
                to="/contact"
                className="text-white/70 hover:text-white transition-all duration-300 text-sm"
              >
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-6 text-white/70">
              <a
                href="mailto:support@remlic.com"
                className="hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Email"
              >
                <FiMail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
