// src/components/landing/Hero.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const banners = [
  "/main-banner.jpg",
  "/FINAL.jpg"
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === banners.length - 1 ? 0 : prevIndex + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === banners.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="w-full pt-[84px] bg-white border-b border-gray-200 shadow-sm relative group">
      
      {/* Overflow hidden ensures we only see one image at a time */}
      <div className="overflow-hidden relative w-full">
        
        {/* The Flex container holds all images in a row and slides left/right */}
        <motion.div 
          className="flex w-full"
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }} // Premium smooth easing
        >
          {banners.map((src, index) => (
            <img 
              key={index}
              src={src} 
              alt={`TechFight Banner ${index + 1}`} 
              className="w-full h-auto object-cover shrink-0"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop";
              }}
            />
          ))}
        </motion.div>

        {/* ================= CONTROLS ================= */}
        
        {/* Left Arrow */}
        <button 
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
          aria-label="Previous Banner"
        >
          <ChevronLeft size={28} />
        </button>

        {/* Right Arrow */}
        <button 
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
          aria-label="Next Banner"
        >
          <ChevronRight size={28} />
        </button>

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
          {banners.map((_, index) => (
            <button 
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-500 ${
                currentIndex === index 
                  ? 'w-10 bg-[#9E1B42] shadow-[0_0_10px_rgba(158,27,66,0.8)]' 
                  : 'w-2 bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}