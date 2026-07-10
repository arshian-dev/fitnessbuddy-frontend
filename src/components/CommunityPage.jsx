import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PostItem from './PostItem';
import { User, Activity, Image as ImageIcon, Video, BarChart2 } from 'lucide-react';

export default function CommunityPage({ user, workoutPlan, checkinHistory }) {
  const [feed, setFeed] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Post creation state
  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState('TEXT');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?.id]);

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
      console.error('Failed to load community data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (friendId) => {
    try {
      await api.sendFriendRequest(user.id, friendId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && postType === 'TEXT') return;
    
    setIsPosting(true);
    let referenceId = null;
    if (postType === 'WORKOUT' && workoutPlan) {
      referenceId = workoutPlan.id;
    } else if (postType === 'PROGRESS_LOG' && checkinHistory && checkinHistory.length > 0) {
      referenceId = checkinHistory[0].id;
    }

    try {
      await api.createPost({
        userId: user.id,
        content: newPostContent,
        postType: postType,
        referenceId: referenceId,
        imageUris: []
      });
      setNewPostContent('');
      setPostType('TEXT');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const suggestedAthletes = friends
    .filter(f => f.status !== 'ACCEPTED')
    .slice(0, 5);

  return (
    <div className="flex relative z-10 w-full animate-in fade-in">
      {/* Main Content Canvas */}
      <div className="flex-1 min-h-screen px-4 md:px-margin-edge py-8">
        {/* Mobile Top Header (Hidden on Desktop) */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <h2 className="font-text-headline-lg-mobile text-primary-fixed">Community</h2>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container p-0.5 overflow-hidden">
             {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="User" className="w-full h-full object-cover rounded-full" />
             ) : (
                <div className="w-full h-full bg-surface-container-highest rounded-full flex items-center justify-center text-on-surface">
                   <User size={20} />
                </div>
             )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Share Milestone Input Card */}
          <div className="glass-card rounded-xl p-6 shadow-sm">
            <form onSubmit={handleCreatePost}>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-surface-container-highest flex items-center justify-center">
                  {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-on-surface-variant" size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <textarea 
                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 font-text-title-md resize-none h-12" 
                    placeholder="Share your workout update or milestone..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                  
                  {/* Post Type Toggles (Specific to Fitness Buddy) */}
                  <div className="flex gap-2 mb-3">
                    <button 
                      type="button" 
                      onClick={() => setPostType(postType === 'WORKOUT' ? 'TEXT' : 'WORKOUT')}
                      disabled={!workoutPlan}
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors border ${postType === 'WORKOUT' ? 'border-primary-container bg-primary-container/10 text-primary-container' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'} disabled:opacity-30`}
                    >
                      Attach Workout
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setPostType(postType === 'PROGRESS_LOG' ? 'TEXT' : 'PROGRESS_LOG')}
                      disabled={!checkinHistory || checkinHistory.length === 0}
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors border ${postType === 'PROGRESS_LOG' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'} disabled:opacity-30`}
                    >
                      Attach Log
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => alert('Image upload coming soon!')} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                        <ImageIcon size={20} />
                      </button>
                      <button type="button" onClick={() => alert('Video upload coming soon!')} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                        <Video size={20} />
                      </button>
                      <button type="button" onClick={() => alert('Polls coming soon!')} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                        <BarChart2 size={20} />
                      </button>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isPosting || (!newPostContent.trim() && postType === 'TEXT')}
                      className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-bold font-text-title-md hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary-container/20 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isPosting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Feed Stream */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-primary-container" size={32} />
              </div>
            ) : feed.length === 0 ? (
              <div className="text-center p-12 glass-card rounded-xl text-on-surface-variant">
                <p>Your feed is quiet. Post an update or follow athletes!</p>
              </div>
            ) : (
              feed.map((post) => (
                <PostItem key={post.id} post={post} currentUser={user} onUpdate={() => loadData(true)} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Suggestions & Trends */}
      <aside className="hidden xl:block w-80 h-screen sticky top-0 p-gutter-md border-l border-outline-variant/10 bg-surface-container-low/50 backdrop-blur-md">
        <div className="space-y-8">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              className="w-full bg-surface-container text-on-surface border border-outline-variant/20 rounded-full pl-10 py-2 text-sm focus:ring-1 focus:ring-primary-container focus:border-primary-container outline-none" 
              placeholder="Search community..." 
              type="text" 
            />
          </div>

          {/* Trending Topics */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-text-title-md text-primary mb-4">Trending Tags</h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary/10 text-primary-fixed-dim px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">#120kgClub</span>
              <span className="bg-primary/10 text-primary-fixed-dim px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">#VeganFitness</span>
              <span className="bg-primary/10 text-primary-fixed-dim px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">#MorningRun</span>
              <span className="bg-primary/10 text-primary-fixed-dim px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:bg-primary/20 transition-colors">#HealthIndia</span>
            </div>
          </div>

          {/* Recommended Buddies */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-text-title-md text-primary mb-4">Fitness Buddies</h3>
            {suggestedAthletes.length > 0 ? (
              <div className="space-y-4">
                {suggestedAthletes.map(athlete => (
                  <div key={athlete.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center">
                      {athlete.profilePictureUrl ? (
                         <img src={athlete.profilePictureUrl} alt={athlete.name} className="w-full h-full object-cover" />
                      ) : (
                         <User className="text-on-surface-variant" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface leading-tight">{athlete.name}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${athlete.role === 'COACH' ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {athlete.role === 'COACH' ? 'Coach' : 'Athlete'}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleSendRequest(athlete.id)}
                      className="text-primary font-bold text-xs uppercase tracking-tight hover:underline"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant">No suggestions right now.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

// Temporary loader for inline use
const Loader2 = ({ className, size }) => (
  <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
);
