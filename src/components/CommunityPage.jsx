import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PostItem from './PostItem';
import { User, Dumbbell, Activity, Plus } from 'lucide-react';

export default function CommunityPage({ user, workoutPlan, checkinHistory }) {
  const [feed, setFeed] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Post creation state
  const [showPostCreator, setShowPostCreator] = useState(false);
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
        imageUris: [] // Add image support back if needed via UI expansion
      });
      setNewPostContent('');
      setShowPostCreator(false);
      setPostType('TEXT');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  // derived data for sidebar
  const acceptedFriends = friends.filter(f => f.status === 'ACCEPTED');
  
  // Create a mock suggested athletes list from friends who are pending or not added
  // In a real app, this would be an actual suggestion endpoint
  const suggestedAthletes = friends
    .filter(f => f.status !== 'ACCEPTED')
    .slice(0, 5); // Just show top 5

  // Get user's latest activity from feed (if they have one)
  const latestActivity = feed.find(p => p.author_id === user?.id);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto py-6 animate-in fade-in">
      
      {/* Main Feed Column */}
      <div className="flex-1 w-full max-w-2xl mx-auto lg:mx-0 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Home</h1>
          <button 
            onClick={() => setShowPostCreator(!showPostCreator)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            <Plus size={14} /> New Post
          </button>
        </div>

        {/* Minimal Post Creator */}
        {showPostCreator && (
          <form onSubmit={handleCreatePost} className="bg-[#121212] rounded-2xl border border-white/5 p-4 shadow-xl">
            <textarea
              className="w-full bg-transparent text-white resize-none outline-none placeholder:text-slate-500 mb-2"
              placeholder="What's on your mind?"
              rows={3}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setPostType('WORKOUT')}
                  disabled={!workoutPlan}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider transition-colors ${postType === 'WORKOUT' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} disabled:opacity-30`}
                >
                  Attach Workout
                </button>
                <button 
                  type="button" 
                  onClick={() => setPostType('PROGRESS_LOG')}
                  disabled={!checkinHistory || checkinHistory.length === 0}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider transition-colors ${postType === 'PROGRESS_LOG' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} disabled:opacity-30`}
                >
                  Attach Log
                </button>
              </div>
              <button 
                type="submit" 
                disabled={isPosting || (!newPostContent.trim() && postType === 'TEXT')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full disabled:opacity-50 transition-colors"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        )}

        {/* Feed Stream */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin text-slate-500"><Activity size={24} /></div>
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center p-12 bg-[#121212] rounded-2xl border border-white/5 text-slate-500">
            <p>Your feed is quiet. Post an update or follow athletes!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {feed.map((post) => (
              <PostItem key={post.id} post={post} currentUser={user} onUpdate={() => loadData(true)} />
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        
        {/* Profile Summary Card */}
        <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden text-center p-6 text-white shadow-lg">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border-2 border-[#121212] flex items-center justify-center mb-3 text-slate-400 ring-2 ring-white/10">
            <User size={32} />
          </div>
          <h2 className="font-extrabold text-lg">{user?.name || 'Athlete'}</h2>
          <p className="text-xs text-slate-500 mb-6">{user?.name || 'Athlete'}</p>
          
          <div className="flex justify-around items-center border-t border-b border-white/5 py-4 mb-6">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Workouts</p>
              <p className="font-extrabold text-sm">{checkinHistory?.length || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Followers</p>
              <p className="font-extrabold text-sm">{acceptedFriends.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Following</p>
              <p className="font-extrabold text-sm">{acceptedFriends.length}</p>
            </div>
          </div>
          
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors">
            See your profile
          </button>
        </div>

        {/* Latest Activity */}
        <div className="bg-[#121212] rounded-2xl border border-white/5 p-5 text-white shadow-lg">
          <h3 className="font-extrabold text-sm mb-4">Latest Activity</h3>
          {latestActivity ? (
            <div>
              <p className="font-bold text-sm text-slate-200">
                {latestActivity.workout_split || (latestActivity.post_type === 'PROGRESS_LOG' ? 'Progress Update' : 'Text Post')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {new Date(latestActivity.created_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No recent activity.</p>
          )}
        </div>

        {/* Suggested Athletes */}
        <div className="bg-[#121212] rounded-2xl border border-white/5 p-5 text-white shadow-lg">
          <h3 className="font-extrabold text-sm mb-4">Suggested Athletes</h3>
          {suggestedAthletes.length > 0 ? (
            <div className="space-y-4">
              {suggestedAthletes.map(athlete => (
                <div key={athlete.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200 leading-tight">{athlete.name}</p>
                      <p className="text-[10px] text-slate-500">{athlete.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSendRequest(athlete.id)}
                    className="text-blue-500 hover:text-blue-400 text-xs font-bold px-2 py-1 transition-colors"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No suggestions right now.</p>
          )}
        </div>

      </div>
    </div>
  );
}
