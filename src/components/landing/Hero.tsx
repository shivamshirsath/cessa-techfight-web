// src/components/landing/Hero.tsx
'use client';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    /* Clean white background. Added a subtle fade-in animation to the banner */
    <div className="w-full pt-[84px] bg-[#F8FAFC]">
      <div className="w-full max-w-[1800px] mx-auto bg-white border-b border-gray-200 overflow-hidden shadow-sm">
        <motion.img 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          src="/main-banner.jpg" 
          alt="Sandip Institute TechFight Banner" 
          className="w-full h-auto block object-contain"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop";
          }}
        />
      </div>
    </div>
  );
}