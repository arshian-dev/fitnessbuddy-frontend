import React, { useState, useEffect } from 'react';
import PostItem from './PostItem';
import { User, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../services/api';

export default function ProfilePage({ user, checkinHistory = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [feed, setFeed] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    try {
      const [feedData, friendsData] = await Promise.all([
        api.getCommunityFeed(user.id),
        api.getFriends(user.id)
      ]);
      setFeed(feedData);
      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);
  
  const acceptedFriends = friends.filter(f => f.status === 'ACCEPTED');
  const userPosts = feed.filter(p => p.user_id === user.id);

  // --- Calendar Logic ---
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Format checkin dates for easy lookup ('YYYY-MM-DD')
  const workedOutDates = new Set(checkinHistory.map(log => {
    // Some logs might be timestamps, ensure we grab the YYYY-MM-DD part
    return new Date(log.log_date || log.created_at).toISOString().split('T')[0];
  }));

  const renderCalendarDays = () => {
    const days = [];
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Header
    daysOfWeek.forEach((day, index) => {
      days.push(<div key={`header-${day}-${index}`} className="text-center text-[10px] font-bold text-slate-500 mb-2">{day}</div>);
    });

    // Blanks before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`blank-${i}`} className="text-center text-xs p-1"></div>);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isWorkedOut = workedOutDates.has(dateString);
      
      days.push(
        <div key={`day-${i}`} className="flex justify-center items-center p-1">
          <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all
            ${isWorkedOut ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'text-slate-400 hover:bg-white/5 cursor-pointer'}`}
          >
            {i}
          </div>
        </div>
      );
    }
    return days;
  };

  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));

  // --- Chart Data Logic ---
  // Create mock historical data for the chart from checkinHistory
  // We'll take the last 7 checkins and map them to Volume or Duration.
  const chartData = checkinHistory.slice(0, 7).reverse().map((log, i) => {
    // If we don't have real duration/volume in progress_logs yet, mock them dynamically
    const mockVolume = (log.energy_score || 7) * (log.weight || 70) * 15; // randomish multiplier
    const mockDuration = (log.energy_score || 7) * 10; // e.g. 70 mins
    
    return {
      name: new Date(log.log_date || log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      volume: mockVolume,
      duration: mockDuration
    };
  });

  // If chartData is empty, provide some default mock data for the visual
  const finalChartData = chartData.length > 0 ? chartData : [
    { name: 'Apr 26', duration: 45 }, { name: 'May 10', duration: 60 },
    { name: 'May 24', duration: 50 }, { name: 'Jun 7', duration: 75 },
    { name: 'Jun 21', duration: 65 }, { name: 'Jul 5', duration: 90 }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in fade-in space-y-6">
      
      {/* Top Profile Header Card */}
      <div className="bg-[#121212] rounded-2xl border border-white/5 p-8 text-white shadow-lg flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-[#1A1A1A] flex items-center justify-center flex-shrink-0 text-slate-400">
          <User size={40} />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight">{user.name || 'Athlete'}</h1>
            <button className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors self-center md:self-auto">
              Edit Profile
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-6">{user.name || 'Athlete'}</p>
          
          <div className="flex justify-center md:justify-start gap-12">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Workouts</p>
              <p className="font-extrabold text-lg">{checkinHistory.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Followers</p>
              <p className="font-extrabold text-lg">{acceptedFriends.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Following</p>
              <p className="font-extrabold text-lg">{acceptedFriends.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Chart & Feed) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Statistics Chart */}
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-6 shadow-lg">
            <h3 className="text-white font-extrabold text-base mb-4">Statistics</h3>
            <div className="flex gap-4 mb-6 text-sm font-bold border-b border-white/5 pb-2">
              <span className="text-blue-500 border-b-2 border-blue-500 pb-2 -mb-[9px]">Duration</span>
              <span className="text-slate-500 hover:text-white cursor-pointer transition-colors pb-2">Volume</span>
            </div>
            
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-2xl font-extrabold text-white leading-none">2h 41m <span className="text-xs text-slate-500 font-normal">this week</span></p>
              </div>
              <select className="bg-[#1A1A1A] border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg outline-none">
                <option>Last 12 weeks</option>
                <option>Last 6 months</option>
                <option>All time</option>
              </select>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finalChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(val) => `${val}m`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="duration" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User's Post Feed */}
          <div className="space-y-6">
            {userPosts.length === 0 ? (
              <div className="text-center p-8 bg-[#121212] rounded-2xl border border-white/5 text-slate-500 text-sm">
                You haven't posted any workouts yet.
              </div>
            ) : (
              userPosts.map(post => (
                <PostItem key={post.id} post={post} currentUser={user} onUpdate={() => loadData(true)} />
              ))
            )}
          </div>
        </div>

        {/* Right Column (Calendar) */}
        <div className="lg:col-span-4">
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-6 shadow-lg sticky top-24">
            <h3 className="text-white font-extrabold text-base mb-6">Calendar</h3>
            
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h4 className="text-sm font-bold text-white">
                {monthNames[currentMonth]} {currentYear}
              </h4>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-2">
              {renderCalendarDays()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
