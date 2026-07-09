import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ThumbsUp, MessageCircle, Share, Send, MoreHorizontal, User } from 'lucide-react';
import { calculateTotalVolume } from '../utils/calculations';

export default function PostItem({ post, currentUser, onUpdate }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Load comments on mount for immediate interaction like screenshot
  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await api.getComments(post.id);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await api.toggleLike(post.id, currentUser.id);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const added = await api.addComment(post.id, currentUser.id, newComment);
      setComments([...comments, { ...added, author_name: currentUser.name }]);
      setNewComment('');
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportRoutine = async () => {
    if (!post.workout_exercises || importing) return;
    setImporting(true);
    try {
      const exercises = typeof post.workout_exercises === 'string' ? JSON.parse(post.workout_exercises) : post.workout_exercises;
      await api.importRoutine(currentUser.id, `${post.author_name}'s ${post.workout_split}`, exercises);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to import routine', err);
    } finally {
      setImporting(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  };

  const timeAgoStr = getTimeAgo(post.created_at);

  const renderWorkoutContent = () => {
    if (post.post_type !== 'WORKOUT' || !post.workout_split) return null;
    
    let exercises = typeof post.workout_exercises === 'string' ? JSON.parse(post.workout_exercises) : post.workout_exercises;
    if (!exercises || exercises.length === 0) return null;

    // Filter exercises by the specific day shared (e.g., "Monday") if it was an auto-shared workout
    const dayMatch = post.content && typeof post.content === 'string' ? post.content.match(/Just crushed my (.*?) workout!/) : null;
    if (dayMatch && dayMatch[1]) {
      const sharedDay = dayMatch[1];
      const filtered = exercises.filter(ex => ex.day === sharedDay);
      if (filtered.length > 0) exercises = filtered;
    }

    // Mock Volume using utility
    const totalVolume = calculateTotalVolume(exercises);

    return (
      <div className="mt-4">
        {/* Metrics Row */}
        <div className="flex gap-12 mb-4 pb-4 border-b border-white/5">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Duration</p>
            <p className="text-sm text-white font-bold">1h 20m</p> {/* Mock duration */}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Volume</p>
            <p className="text-sm text-white font-bold">{totalVolume.toLocaleString()} kg</p>
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-3">
          {exercises.slice(0, 3).map((ex, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                 <img src="https://wger.de/media/exercise-images/191/Bench-press-1.png" alt="exercise" className="w-8 h-8 opacity-50 grayscale" onError={(e) => e.target.style.display='none'} />
              </div>
              <div className="text-sm">
                <span className="text-white font-bold">{ex.sets} sets </span>
                <span className="text-slate-300">{ex.name || 'Exercise'}</span>
              </div>
            </div>
          ))}
          
          {exercises.length > 3 && (
            <button className="text-xs text-slate-500 font-medium hover:text-white transition-colors mt-2">
              See {exercises.length - 3} more exercises
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderProgressContent = () => {
    if (post.post_type !== 'PROGRESS_LOG' || !post.log_weight) return null;
    return (
      <div className="mt-4">
        <div className="flex gap-12 mb-4 pb-4 border-b border-white/5">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Duration</p>
            <p className="text-sm text-white font-bold">15m</p> {/* Mock duration for checkin */}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Weight Log</p>
            <p className="text-sm text-white font-bold">{post.log_weight} kg</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
             <span className="material-symbols-outlined text-[18px]">monitor_weight</span>
           </div>
           <div className="text-sm">
             <span className="text-white font-bold">1 set </span>
             <span className="text-slate-300">Daily Weigh-In</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden w-full max-w-2xl text-white">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-300 overflow-hidden">
              <User size={20} />
            </div>
            <div className="leading-tight">
              <h4 className="font-bold text-sm text-slate-100">{post.author_name}</h4>
              <span className="text-[11px] text-slate-500">{timeAgoStr}</span>
            </div>
          </div>
          <button className="text-slate-500 hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Workout Title & Content */}
        {post.post_type === 'WORKOUT' && post.workout_split && (
          <h3 className="font-extrabold text-base text-white mb-1">{post.workout_split}</h3>
        )}
        {post.post_type === 'PROGRESS_LOG' && (
          <h3 className="font-extrabold text-base text-white mb-1">Progress Update</h3>
        )}
        
        {post.content && (
          <p className="text-sm text-slate-300 mb-2">{post.content}</p>
        )}

        {/* Specific Data Blocks */}
        {renderWorkoutContent()}
        {renderProgressContent()}
        
        {/* Images */}
        {post.image_uris && post.image_uris.length > 0 && (
          <div className="mt-4 rounded-xl overflow-hidden">
            <img src={post.image_uris[0]} alt="Post attachment" className="w-full h-auto object-cover max-h-96" />
          </div>
        )}
        
        {/* Action Bar */}
        <div className="flex items-center gap-6 mt-6 pb-4 border-b border-white/5">
          <button onClick={handleLike} className={`flex items-center gap-2 text-sm transition-colors ${post.user_liked ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}>
            <ThumbsUp size={18} className={post.user_liked ? "fill-current" : ""} />
            {post.likes_count > 0 && <span>{post.likes_count}</span>}
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MessageCircle size={18} />
            {post.comments_count > 0 && <span>{post.comments_count}</span>}
          </div>
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <Share size={18} />
          </button>
          
          {post.post_type === 'WORKOUT' && post.author_id !== currentUser.id && (
            <button 
              onClick={handleImportRoutine}
              disabled={importing || importSuccess}
              className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${importSuccess ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              {importSuccess ? 'Saved' : importing ? 'Saving...' : 'Copy Routine'}
            </button>
          )}
        </div>

        {/* Existing Comments (Preview) */}
        {comments.length > 0 && (
          <div className="mt-4 space-y-3">
            {comments.slice(-2).map(c => (
              <div key={c.id} className="text-sm">
                <span className="font-bold text-slate-200 mr-2">{c.author_name}</span>
                <span className="text-slate-400">{c.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
             <User size={16} className="text-slate-500" />
          </div>
          <input 
            type="text" 
            placeholder="Write a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-[#1A1A1A] border border-white/5 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
          />
          <button 
            type="submit" 
            disabled={!newComment.trim()}
            className="text-sm font-bold text-blue-500 disabled:opacity-30 transition-opacity pr-2"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
