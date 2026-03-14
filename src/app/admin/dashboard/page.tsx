// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, Calendar, AlertCircle, IndianRupee, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalRegistrations: number;
  activeEvents: number;
  pendingReviews: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    activeEvents: 0,
    pendingReviews: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // 1. Fetch all events to count them and get their fees
        const eventsSnap = await getDocs(collection(db, 'events'));
        let activeEventsCount = 0;
        const eventFees: Record<string, number> = {};

        eventsSnap.forEach(doc => {
          const data = doc.data();
          if (data.isActive) activeEventsCount++;
          // Store fee for revenue calculation later
          eventFees[doc.id] = data.registrationFee || 0;
        });

        // 2. Fetch all registrations to count status and calculate revenue
        const regsSnap = await getDocs(collection(db, 'registrations'));
        let totalRegsCount = 0;
        let pendingCount = 0;
        let revenue = 0;

        regsSnap.forEach(doc => {
          totalRegsCount++;
          const data = doc.data();
          
          if (data.status === 'UNDER_REVIEW') {
            pendingCount++;
          } else if (data.status === 'ACCEPTED') {
            // Add the fee of the event this registration belongs to
            revenue += eventFees[data.eventId] || 0;
          }
        });

        // 3. Update the state with our real data
        setStats({
          totalRegistrations: totalRegsCount,
          activeEvents: activeEventsCount,
          pendingReviews: pendingCount,
          totalRevenue: revenue
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Admin</h1>
        <p className="text-gray-600">Here is the live overview of TechFight 2026.</p>
      </div>
      
      {/* 📊 STATISTICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Active Events */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Active Events</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
          </div>
          <p className="text-4xl font-extrabold text-gray-900">{stats.activeEvents}</p>
        </div>

        {/* Total Registrations */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Registrations</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={20} /></div>
          </div>
          <p className="text-4xl font-extrabold text-gray-900">{stats.totalRegistrations}</p>
        </div>

        {/* Pending UTR Reviews */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200 hover:shadow-md transition relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-orange-600 text-sm font-semibold uppercase tracking-wider">Pending UTRs</h3>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><AlertCircle size={20} /></div>
          </div>
          <p className="text-4xl font-extrabold text-orange-600">{stats.pendingReviews}</p>
          
          {/* Pulsing indicator if there are pending reviews */}
          {stats.pendingReviews > 0 && (
            <div className="absolute top-0 right-0 p-4">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            </div>
          )}
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-green-600 text-sm font-semibold uppercase tracking-wider">Revenue (Accepted)</h3>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><IndianRupee size={20} /></div>
          </div>
          <p className="text-4xl font-extrabold text-green-600">₹{stats.totalRevenue}</p>
        </div>
      </div>

      {/* 🚀 QUICK ACTIONS PANEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/events/create" className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition group">
            <span className="font-semibold text-gray-800 group-hover:text-blue-700">Create New Event</span>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-blue-600" />
          </Link>
          
          <Link href="/admin/finance" className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition group">
            <span className="font-semibold text-gray-800 group-hover:text-green-700">Verify Payments</span>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-green-600" />
          </Link>

          <Link href="/admin/users" className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition group">
            <span className="font-semibold text-gray-800 group-hover:text-purple-700">Assign Coordinators</span>
            <ArrowRight size={20} className="text-gray-400 group-hover:text-purple-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}