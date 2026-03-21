// src/components/landing/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { logoutUser } from '@/lib/auth';
import { Menu, X, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    
    if (latest > 10) setScrolled(true);
    else setScrolled(false);

    if (latest > previous && latest > 150) {
      setHidden(true);
      setMobileMenuOpen(false);
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    window.location.reload();
  };

  const handleNavigation = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* DEEP PLUM NAVBAR */}
      <motion.nav
        variants={{ 
          visible: { y: 0 }, 
          hidden: { y: "-100%" } 
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-[999] w-full transition-all duration-300 bg-[#6F0A39]/95 backdrop-blur-md ${
          scrolled || mobileMenuOpen
            ? "border-b border-white/10 shadow-[0_4px_25px_rgba(111,10,66,0.5)]" 
            : "border-b border-transparent shadow-none"
        }`}
      >
        <div className="w-full max-w-[1500px] mx-auto px-6 md:px-12 flex justify-between items-center h-[84px]">
          
          {/* Logo - Premium White & Amber Glow */}
          <div 
            className="flex-shrink-0 flex items-center gap-1 cursor-pointer z-[1001] hover:scale-105 transition-transform duration-300" 
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          >
            <span className="text-2xl md:text-3xl font-black tracking-tight text-white [text-shadow:0_0_18px_rgba(255,255,255,0.4)]">Tech</span>
            <span className="text-2xl md:text-3xl font-black tracking-tight text-amber-300 [text-shadow:0_0_18px_rgba(245,158,11,0.6)]">Fight</span>
            <sup className="text-white/80 font-bold text-sm mt-2 ml-1">2026</sup>
          </div>
          
          {/* Desktop Links - White text, glowing Amber on hover */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#events" onClick={(e) => handleNavigation(e, 'events')} className="text-[14px] uppercase tracking-wider font-bold text-white/90 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all duration-300">
              Events
            </a>

            {/* NEW SPONSOR LINK */}
              <a href="#sponsors" onClick={(e) => handleNavigation(e, 'sponsors')} className="text-[14px] uppercase tracking-wider font-bold text-white/90 hover:text-amber-300 transition-all duration-300">
                Sponsors
              </a>
            
            <a href="#team" onClick={(e) => handleNavigation(e, 'team')} className="text-[14px] uppercase tracking-wider font-bold text-white/90 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all duration-300">
              CESA Team
            </a>

            <a href="#socials" onClick={(e) => handleNavigation(e, 'socials')} className="text-[14px] uppercase tracking-wider font-bold text-white/90 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all duration-300">
              Gallery
            </a>

            {currentUser ? (
              <>
                <Link href="/dashboard" className="text-[14px] uppercase tracking-wider font-bold text-white/90 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all duration-300">
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-[14px] uppercase tracking-wider font-bold text-white/90 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all duration-300 flex items-center gap-2"
                >
                  Logout <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="group relative inline-flex items-center gap-2 bg-black/20 border border-white/20 text-white px-7 py-2.5 rounded-full text-[13px] font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:border-amber-400 hover:text-amber-300 hover:bg-black/30 transition-all duration-300"
              >
                <User size={16} strokeWidth={2.5} className="group-hover:[drop-shadow:0_0_8px_rgba(251,191,36,0.8)]" /> Login
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center z-[1001]">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="text-white p-2 hover:text-amber-300 hover:bg-black/10 rounded-full transition-colors"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[990] pt-[100px] px-8 flex flex-col md:hidden bg-[#6F0A42]/98 backdrop-blur-2xl border-t border-white/10 shadow-[0_10px_40px_rgba(111,10,66,0.4)]"
          >
            <div className="flex flex-col space-y-6 w-full mt-4">
              <a href="#events" onClick={(e) => handleNavigation(e, 'events')} className="text-lg font-bold tracking-wider uppercase text-white/90 border-b border-white/10 pb-4 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all">Events</a>
              
              <a href="#team" onClick={(e) => handleNavigation(e, 'team')} className="text-lg font-bold tracking-wider uppercase text-white/90 border-b border-white/10 pb-4 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all">CESA Team</a>
              
              <a href="#socials" onClick={(e) => handleNavigation(e, 'socials')} className="text-lg font-bold tracking-wider uppercase text-white/90 border-b border-white/10 pb-4 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all">Gallery</a>
              
              {currentUser ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold tracking-wider uppercase text-white/90 border-b border-white/10 pb-4 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all">Dashboard</Link>
                  <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="text-lg font-bold tracking-wider uppercase text-white/90 flex items-center gap-2 pt-2 hover:text-amber-300 hover:[text-shadow:0_0_12px_rgba(251,191,36,0.8)] transition-all">
                    <LogOut size={20} /> Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="bg-black/20 border border-white/20 text-white px-6 py-4 rounded-xl text-center text-[15px] font-bold uppercase tracking-widest flex justify-center items-center gap-2 mt-6 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:bg-black/30 hover:text-amber-300 hover:border-amber-400 transition-all"
                >
                  <User size={20} /> Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}