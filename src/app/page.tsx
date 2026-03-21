// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import EventCard from '@/components/landing/EventCard';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Event, SocialPost, TeamMember, Sponsor } from '@/types';
import { Loader2, Instagram, Users, Award } from 'lucide-react';
import { motion, Variants } from 'framer-motion'; // 🔥 Imported Variants

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [socials, setSocials] = useState<SocialPost[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    const fetchPublicData = async () => {
      const cachedData = sessionStorage.getItem('techfight_home_data');
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setEvents(parsed.events || []);
          setSocials(parsed.socials || []);
          setTeam(parsed.team || []);
          setSponsors(parsed.sponsors || []);
          setLoading(false);
          return; 
        } catch (e) {
          console.error("Cache parsing error, falling back to database", e);
        }
      }

      try {
        const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
        const fetchedEvents: Event[] = [];
        eventsSnap.forEach(doc => {
          const data = doc.data() as Event;
          if (data.isActive) fetchedEvents.push({ ...data, id: doc.id });
        });
        
        const socialsSnap = await getDocs(query(collection(db, 'social_posts'), orderBy('createdAt', 'desc')));
        const fetchedSocials: SocialPost[] = [];
        socialsSnap.forEach(doc => fetchedSocials.push({ id: doc.id, ...doc.data() } as SocialPost));
        
        const teamSnap = await getDocs(query(collection(db, 'team_members'), orderBy('displayOrder', 'asc')));
        const fetchedTeam: TeamMember[] = [];
        teamSnap.forEach(doc => fetchedTeam.push({ id: doc.id, ...doc.data() } as TeamMember));
        
        const sponsorSnap = await getDocs(query(collection(db, 'sponsors'), orderBy('displayOrder', 'asc')));
        const fetchedSponsors: Sponsor[] = [];
        sponsorSnap.forEach(doc => fetchedSponsors.push({ id: doc.id, ...doc.data() } as Sponsor));
        
        sessionStorage.setItem('techfight_home_data', JSON.stringify({
          events: fetchedEvents,
          socials: fetchedSocials,
          team: fetchedTeam,
          sponsors: fetchedSponsors
        }));

        setEvents(fetchedEvents);
        setSocials(fetchedSocials);
        setTeam(fetchedTeam);
        setSponsors(fetchedSponsors);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (socials.length > 0) {
      const timeout = setTimeout(() => {
        if (!document.getElementById('instagram-embed-script')) {
          const script = document.createElement('script');
          script.id = 'instagram-embed-script';
          script.src = 'https://www.instagram.com/embed.js';
          script.async = true;
          script.onload = () => {
            if ((window as any).instgrm) (window as any).instgrm.Embeds.process();
          };
          document.body.appendChild(script);
        } else {
          if ((window as any).instgrm) (window as any).instgrm.Embeds.process();
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [socials]);


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-[#6F0A42] mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Loading TechFight 2026...</p>
      </div>
    );
  }

  const technicalSponsors = sponsors.filter(s => s.category === 'TECHNICAL');
  const nonTechnicalSponsors = sponsors.filter(s => s.category === 'NON_TECHNICAL');
  const bothCategoriesExist = technicalSponsors.length > 0 && nonTechnicalSponsors.length > 0;

  // 🔥 ANIMATION VARIANTS (Fixed Types)
  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      {/* ========================================================= */}
      {/* 1. EVENTS SECTION */}
      {/* ========================================================= */}
      <section id="events" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-[12px] font-black tracking-[0.2em] text-[#9E1B42] uppercase mb-3">
              Competitions
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight uppercase [text-shadow:0_2px_10px_rgba(0,0,0,0.05)]">
              Active Events
            </h3>
            <div className="h-1.5 w-24 bg-linear-to-r from-[#6F0A39] to-[#9E1B42] mx-auto mt-6 rounded-full"></div>
          </motion.div>

          {events.length === 0 ? (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xl text-gray-500 font-medium">Events will be announced soon. Stay tuned!</p>
            </motion.div>
          ) : (
            <motion.div 
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {events.map((event) => (
                <motion.div key={event.id} variants={fadeUpVariant} className="h-full">
                  <EventCard event={event} currentUser={currentUser} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SPONSORS SECTION */}
      {/* ========================================================= */}
      {sponsors.length > 0 && (
        <section id="sponsors" className="py-24 bg-[#0B1121] border-t border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-150 h-150 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-150 h-150 bg-[#9E1B42]/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <h2 className="text-[12px] font-black tracking-[0.2em] text-amber-500 uppercase mb-3 flex items-center justify-center gap-2">
                <Award size={16} /> Official Partners
              </h2>
              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
                Our Sponsors
              </h3>
              <div className="h-1.5 w-20 bg-linear-to-r from-amber-400 to-yellow-600 mx-auto mt-5 rounded-full"></div>
            </motion.div>

            <div className={`grid grid-cols-1 gap-16 ${bothCategoriesExist ? 'md:grid-cols-2' : ''}`}>
              
              {/* TECHNICAL SPONSORS */}
              {technicalSponsors.length > 0 && (
                <div className={`space-y-12 ${bothCategoriesExist ? '' : 'mx-auto max-w-5xl'}`}>
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="text-center">
                    <h4 className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest mb-2 shadow-inner">
                      Technical Sponsors
                    </h4>
                  </motion.div>
                  
                  <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-12">
                    {/* Title */}
                    {technicalSponsors.filter(s => s.type === 'TITLE').length > 0 && (
                      <div className="flex flex-wrap justify-center gap-8">
                        {technicalSponsors.filter(s => s.type === 'TITLE').map(s => (
                          <motion.div variants={fadeUpVariant} key={s.id} className="flex flex-col items-center">
                            <div className="w-40 h-24 md:w-48 md:h-28 p-4 bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-center mb-3 border border-white/10">
                              <img src={s.logoUrl} alt={s.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-sm font-black text-white text-center">{s.name}</span>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">{s.type.replace('_', ' ')}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Co-Sponsor */}
                    {technicalSponsors.filter(s => s.type === 'CO_SPONSOR').length > 0 && (
                      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                        {technicalSponsors.filter(s => s.type === 'CO_SPONSOR').map(s => (
                          <motion.div variants={fadeUpVariant} key={s.id} className="flex flex-col items-center">
                            <div className="w-32 h-20 md:w-40 md:h-24 p-3 bg-white rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
                              <img src={s.logoUrl} alt={s.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-xs font-black text-gray-200 text-center">{s.name}</span>
                            <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest mt-0.5">{s.type.replace('_', ' ')}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Associate / Others */}
                    {technicalSponsors.filter(s => s.type === 'ASSOCIATE' || s.type === 'OTHER').length > 0 && (
                      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                        {technicalSponsors.filter(s => s.type === 'ASSOCIATE' || s.type === 'OTHER').map(s => (
                          <motion.div variants={fadeUpVariant} key={s.id} className="flex flex-col items-center">
                            <div className="w-24 h-16 md:w-32 md:h-20 p-2.5 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2">
                              <img src={s.logoUrl} alt={s.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-[11px] font-bold text-gray-300 text-center">{s.name}</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{s.type.replace('_', ' ')}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}

              {/* NON-TECHNICAL SPONSORS */}
              {nonTechnicalSponsors.length > 0 && (
                <div className={`space-y-12 ${bothCategoriesExist ? '' : 'mx-auto max-w-5xl'}`}>
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="text-center">
                    <h4 className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest mb-2 shadow-inner">
                      Non-Technical Sponsors
                    </h4>
                  </motion.div>
                  
                  <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-12">
                    {/* Title */}
                    {nonTechnicalSponsors.filter(s => s.type === 'TITLE').length > 0 && (
                      <div className="flex flex-wrap justify-center gap-8">
                        {nonTechnicalSponsors.filter(s => s.type === 'TITLE').map(s => (
                          <motion.div variants={fadeUpVariant} key={s.id} className="flex flex-col items-center">
                            <div className="w-40 h-24 md:w-48 md:h-28 p-4 bg-white rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-center mb-3 border border-white/10">
                              <img src={s.logoUrl} alt={s.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-sm font-black text-white text-center">{s.name}</span>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">{s.type.replace('_', ' ')}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Co-Sponsor */}
                    {nonTechnicalSponsors.filter(s => s.type === 'CO_SPONSOR').length > 0 && (
                      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                        {nonTechnicalSponsors.filter(s => s.type === 'CO_SPONSOR').map(s => (
                          <motion.div variants={fadeUpVariant} key={s.id} className="flex flex-col items-center">
                            <div className="w-32 h-20 md:w-40 md:h-24 p-3 bg-white rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
                              <img src={s.logoUrl} alt={s.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-xs font-black text-gray-200 text-center">{s.name}</span>
                            <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest mt-0.5">{s.type.replace('_', ' ')}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Associate / Others */}
                    {nonTechnicalSponsors.filter(s => s.type === 'ASSOCIATE' || s.type === 'OTHER').length > 0 && (
                      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                        {nonTechnicalSponsors.filter(s => s.type === 'ASSOCIATE' || s.type === 'OTHER').map(s => (
                          <motion.div variants={fadeUpVariant} key={s.id} className="flex flex-col items-center">
                            <div className="w-24 h-16 md:w-32 md:h-20 p-2.5 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2">
                              <img src={s.logoUrl} alt={s.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-[11px] font-bold text-gray-300 text-center">{s.name}</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{s.type.replace('_', ' ')}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 3. CESA TEAM SECTION */}
      {/* ========================================================= */}
      {team.length > 0 && (
        <section id="team" className="py-24 bg-[#0F172A] relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-800 via-[#0F172A] to-black"></div>
          
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 z-10">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <h2 className="text-[12px] font-black tracking-[0.2em] text-amber-400 uppercase mb-3 flex items-center justify-center gap-2">
                <Users size={16} /> The Organizing Committee
              </h2>
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                Meet the CESA Team
              </h3>
              <div className="h-1.5 w-24 bg-linear-to-r from-amber-400 to-orange-500 mx-auto mt-6 rounded-full"></div>
            </motion.div>

            <motion.div 
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12"
            >
              {team.map((member) => (
                <motion.div key={member.id} variants={fadeUpVariant} className="group text-center">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 rounded-full p-1 bg-linear-to-b from-amber-400 to-transparent">
                    <img 
                      src={member.imageUrl} 
                      alt={member.name} 
                      className="w-full h-full object-cover rounded-full border-4 border-[#0F172A] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{member.name}</h4>
                  <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">{member.role}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. SOCIAL MEDIA GALLERY SECTION */}
      {/* ========================================================= */}
      {socials.length > 0 && (
        <section id="socials" className="py-24 bg-white border-y border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-200 h-200 bg-pink-50/50 rounded-full blur-3xl -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-pink-200">
                  <Instagram size={28} />
                </div>
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight uppercase">
                #TechFight2026
              </h3>
              <p className="text-gray-500 mt-4 font-medium">Catch all the behind-the-scenes action and event highlights!</p>
            </motion.div>

            <motion.div 
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {socials.map((post) => (
                <motion.div key={post.id} variants={fadeUpVariant} className="bg-gray-50 rounded-2xl p-2 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex justify-center w-full">
                  <div 
                    className="w-full flex justify-center bg-white rounded-xl overflow-hidden [&>iframe]:min-w-full!"
                    dangerouslySetInnerHTML={{ __html: post.embedHtml }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm font-medium">
            © 2026 CESA, Sandip Institute of Engineering and Management. All Rights Reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}