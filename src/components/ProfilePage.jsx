import React, { useState, useEffect } from 'react';
import PostItem from './PostItem';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../services/api';

export default function ProfilePage({ user, checkinHistory = [], onUserUpdate, isReadOnly = false, onBack }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [feed, setFeed] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile States
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editAvatarBase64, setEditAvatarBase64] = useState(user?.avatar_url || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
  
  const workedOutDates = new Set(checkinHistory.map(log => {
    return new Date(log.log_date || log.created_at).toISOString().split('T')[0];
  }));

  const renderCalendarDays = () => {
    const days = [];
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    daysOfWeek.forEach((day, index) => {
      days.push(<div key={`header-${day}-${index}`} className="text-center text-[10px] font-bold text-on-surface-variant mb-2">{day}</div>);
    });

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`blank-${i}`} className="text-center text-xs p-1"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isWorkedOut = workedOutDates.has(dateString);
      
      days.push(
        <div key={`day-${i}`} className="flex justify-center items-center p-1">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all
            ${isWorkedOut ? 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(0,245,212,0.4)]' : 'text-outline hover:bg-surface-bright/20 cursor-pointer'}`}
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
  const chartData = checkinHistory.slice(0, 7).reverse().map((log) => {
    const mockVolume = (log.energy_score || 7) * (log.weight || 70) * 15;
    const mockDuration = (log.energy_score || 7) * 10;
    
    return {
      name: new Date(log.log_date || log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      volume: mockVolume,
      duration: mockDuration
    };
  });

  const finalChartData = chartData.length > 0 ? chartData : [
    { name: 'Apr 26', duration: 45 }, { name: 'May 10', duration: 60 },
    { name: 'May 24', duration: 50 }, { name: 'Jun 7', duration: 75 },
    { name: 'Jun 21', duration: 65 }, { name: 'Jul 5', duration: 90 }
  ];

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await api.updateUserProfile(user.id, {
        name: editName,
        email: editEmail,
        avatar_url: editAvatarBase64
      });
      if (res.success && onUserUpdate) {
        onUserUpdate(res.user);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary-container" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-4 md:px-margin-edge py-8 animate-in fade-in space-y-8 min-h-screen text-on-surface">
      
      <header className="flex justify-between items-end mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-bright transition-colors text-on-surface shadow-sm">
              <ChevronLeft size={24} />
            </button>
          )}
          <div>
            <h2 className="font-text-headline-lg text-on-surface">{isReadOnly ? `${user?.name || 'Athlete'}'s Profile` : 'Account Profile'}</h2>
            <p className="text-on-surface-variant font-text-body-sm mt-1">{isReadOnly ? 'Viewing community profile.' : 'Manage your identity and personalized fitness ecosystem.'}</p>
          </div>
        </div>
        {!isReadOnly && (
          <div className="hidden md:block">
            <button 
              onClick={handleSaveProfile}
              disabled={isSavingProfile || !editName.trim()}
              className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all flex items-center shadow-lg shadow-primary-container/20 disabled:opacity-50"
            >
              {isSavingProfile ? (
                <Loader2 size={20} className="animate-spin mr-2" />
              ) : (
                <span className="material-symbols-outlined mr-2 text-[20px]">save</span>
              )}
              Save Changes
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Avatar, Summary, Calendar */}
        <section className="lg:col-span-4 space-y-8">
          
          <div className="glass-card rounded-[2rem] p-10 flex flex-col items-center text-center animate-float">
            <div className={`relative group ${isReadOnly ? '' : 'cursor-pointer'}`}>
              <div className={`w-48 h-48 rounded-full overflow-hidden border-4 ${user?.role === 'COACH' ? 'border-primary' : 'border-primary-container'} p-1 bg-surface-container-low shadow-2xl`}>
                {editAvatarBase64 ? (
                  <img className="w-full h-full object-cover rounded-full" src={editAvatarBase64} alt="Profile Avatar" />
                ) : (
                  <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[64px] text-outline">person</span>
                  </div>
                )}
              </div>
              {!isReadOnly && (
                <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                  <div className="bg-primary-container text-on-primary-container p-3 rounded-full shadow-lg">
                    <span className="material-symbols-outlined text-[32px]">photo_camera</span>
                  </div>
                  <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            
            <div className="mt-8">
              <h3 className="font-text-headline-lg text-on-surface">{user.name || 'Athlete'}</h3>
              <p className={`font-medium tracking-wide text-xs mt-1 ${user?.role === 'COACH' ? 'text-primary' : 'text-primary-container'}`}>
                {user?.role === 'COACH' ? 'CERTIFIED COACH' : 'ELITE MEMBER'}
              </p>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4 mt-8">
              <div className="bg-surface-container/30 rounded-2xl p-4 border border-outline-variant/10">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">
                  {user?.role === 'COACH' ? 'Active Clients' : 'Workouts'}
                </p>
                <p className="text-on-surface font-extrabold text-xl">
                  {user?.role === 'COACH' ? (user?.client_count || '12') : checkinHistory.length}
                </p>
              </div>
              <div className="bg-surface-container/30 rounded-2xl p-4 border border-outline-variant/10">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Followers</p>
                <p className="text-on-surface font-extrabold text-xl">{acceptedFriends.length}</p>
              </div>
            </div>
          </div>

          {user?.role === 'COACH' ? (
            <div className="glass-card rounded-[2rem] p-8 border-l-4 border-l-primary">
              <h4 className="font-text-title-md text-primary mb-6 flex items-center">
                <span className="material-symbols-outlined mr-2">verified</span>
                Coaching Philosophy
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Dedicated to helping clients achieve their full potential through evidence-based programming and holistic habit building. I specialize in strength training, mobility, and sustainable fat loss.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-container rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Strength & Conditioning</span>
                <span className="px-3 py-1 bg-surface-container rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Mobility</span>
                <span className="px-3 py-1 bg-surface-container rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nutrition Planning</span>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-[2rem] p-8">
              <h4 className="font-text-title-md text-on-surface mb-6 flex items-center">
                <span className="material-symbols-outlined mr-2 text-primary-container">calendar_month</span>
                Clinical Schedule
              </h4>
              
              <div className="flex justify-between items-center mb-6">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-bright transition-colors text-on-surface-variant">
                  <ChevronLeft size={16} />
                </button>
                <h4 className="text-sm font-bold text-on-surface">
                  {monthNames[currentMonth]} {currentYear}
                </h4>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-bright transition-colors text-on-surface-variant">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-y-2">
                {renderCalendarDays()}
              </div>
            </div>
          )}
          
          <div className="glass-card rounded-[2rem] p-8">
            <h4 className="font-text-title-md text-on-surface mb-6 flex items-center">
              <span className="material-symbols-outlined mr-2 text-primary-container">workspace_premium</span>
              Recent Achievements
            </h4>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-primary/10 text-primary-fixed border border-primary/20 rounded-full text-xs font-semibold">Morning Warrior</span>
              <span class="px-4 py-2 bg-secondary/10 text-secondary-fixed border border-secondary/20 rounded-full text-xs font-semibold">Consistency</span>
            </div>
          </div>

        </section>

        {/* Right Column: Settings, Stats, Feed */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Identity Settings */}
          {!isReadOnly && (
          <div className="glass-card rounded-[2rem] p-8 md:p-10">
            <div className="flex items-center mb-8 pb-4 border-b border-outline-variant/10">
              <span className="material-symbols-outlined text-primary-container mr-3 text-[28px]">badge</span>
              <h4 className="font-text-headline-lg-mobile text-on-surface">Identity Settings</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 group">
                <label className="text-on-surface-variant font-medium ml-1 text-xs uppercase tracking-wider group-focus-within:text-primary-container transition-colors">Display Name</label>
                <input 
                  className="w-full bg-surface-container/40 border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-medium focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 transition-all" 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2 group">
                <label className="text-on-surface-variant font-medium ml-1 text-xs uppercase tracking-wider group-focus-within:text-primary-container transition-colors">Email Address</label>
                <input 
                  className="w-full bg-surface-container/40 border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-medium focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/50 transition-all" 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          )}

          {/* Stats Chart */}
          <div className="glass-card rounded-[2rem] p-8 md:p-10">
            <div className="flex items-center mb-8 pb-4 border-b border-outline-variant/10">
              <span className="material-symbols-outlined text-primary-container mr-3 text-[28px]">analytics</span>
              <h4 className="font-text-headline-lg-mobile text-on-surface">Performance Biometrics</h4>
            </div>
            
            <div className="flex gap-4 mb-6 text-sm font-bold border-b border-outline-variant/10 pb-2">
              <span className="text-primary-container border-b-2 border-primary-container pb-2 -mb-[9px]">Duration</span>
              <span className="text-outline hover:text-on-surface cursor-pointer transition-colors pb-2">Volume</span>
            </div>
            
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-3xl font-extrabold text-on-surface leading-none">2h 41m <span className="text-sm text-outline font-normal">this week</span></p>
              </div>
              <select className="bg-surface-container border border-outline-variant/20 text-on-surface text-xs font-bold px-3 py-2 rounded-lg outline-none cursor-pointer">
                <option>Last 12 weeks</option>
                <option>Last 6 months</option>
                <option>All time</option>
              </select>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finalChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(131, 148, 143, 0.1)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#83948f', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#83948f', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(val) => `${val}m`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(131,148,143,0.2)', borderRadius: '12px', color: '#dae2fd' }}
                    itemStyle={{ color: '#00f5d4', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="duration" fill="#00f5d4" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User's Post Feed */}
          <div className="glass-card rounded-[2rem] p-8 md:p-10">
            <div className="flex items-center mb-8 pb-4 border-b border-outline-variant/10">
              <span className="material-symbols-outlined text-primary-container mr-3 text-[28px]">history</span>
              <h4 className="font-text-headline-lg-mobile text-on-surface">Recent Activity</h4>
            </div>
            
            <div className="space-y-6">
              {userPosts.length === 0 ? (
                <div className="text-center py-12 bg-surface-container/30 rounded-2xl border border-outline-variant/10 text-on-surface-variant text-sm">
                  You haven't posted any workouts to the community yet.
                </div>
              ) : (
                userPosts.map(post => (
                  <PostItem key={post.id} post={post} currentUser={user} onUpdate={() => loadData(true)} />
                ))
              )}
            </div>
          </div>

        </section>

      </div>

      {/* Footer-style Action (Mobile) */}
      {!isReadOnly && (
      <div className="md:hidden mt-8 sticky bottom-24 z-40">
        <button 
          onClick={handleSaveProfile}
          disabled={isSavingProfile || !editName.trim()}
          className="w-full bg-primary-container text-on-primary-container px-6 py-4 rounded-2xl font-bold active:scale-95 transition-transform flex justify-center items-center shadow-lg shadow-primary-container/20 disabled:opacity-50"
        >
          {isSavingProfile ? (
            <Loader2 size={24} className="animate-spin mr-2" />
          ) : (
            <span className="material-symbols-outlined mr-2">save</span>
          )}
          Save All Changes
        </button>
      </div>
      )}

    </div>
  );
}
