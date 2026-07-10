import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { calculateTotalVolume } from '../utils/calculations';

export default function PostItem({ post, currentUser, onUpdate }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

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

  const getSubtitle = () => {
    if (post.post_type === 'WORKOUT') return 'Strength Training';
    if (post.post_type === 'PROGRESS_LOG') return 'Progress Update';
    return 'Community Update';
  };

  const renderWorkoutContent = () => {
    if (post.post_type !== 'WORKOUT' || !post.workout_split) return null;
    
    let exercises = typeof post.workout_exercises === 'string' ? JSON.parse(post.workout_exercises) : post.workout_exercises;
    if (!exercises || exercises.length === 0) return null;

    const dayMatch = post.content && typeof post.content === 'string' ? post.content.match(/Just crushed my (.*?) workout!/) : null;
    if (dayMatch && dayMatch[1]) {
      const sharedDay = dayMatch[1];
      const filtered = exercises.filter(ex => ex.day === sharedDay);
      if (filtered.length > 0) exercises = filtered;
    }

    const totalVolume = calculateTotalVolume(exercises);

    return (
      <div className="mt-4 bg-surface-container rounded-xl p-4">
        <h3 className="font-bold text-on-surface mb-3">{post.workout_split}</h3>
        
        {/* Metrics Row */}
        <div className="flex gap-12 mb-4 pb-4 border-b border-outline-variant/10">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Duration</p>
            <p className="text-sm text-on-surface font-bold">1h 20m</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Volume</p>
            <p className="text-sm text-on-surface font-bold">{totalVolume.toLocaleString()} kg</p>
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-3">
          {exercises.slice(0, 3).map((ex, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                 <span className="material-symbols-outlined text-on-surface-variant">fitness_center</span>
              </div>
              <div className="text-sm">
                <span className="text-on-surface font-bold">{ex.sets} sets </span>
                <span className="text-on-surface-variant">{ex.name || 'Exercise'}</span>
              </div>
            </div>
          ))}
          
          {exercises.length > 3 && (
            <button onClick={() => alert('Viewing full routine...')} className="text-xs text-primary font-medium hover:underline transition-colors mt-2">
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
      <div className="mt-4 bg-surface-container rounded-xl p-4">
        <div className="flex gap-12 mb-4 pb-4 border-b border-outline-variant/10">
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Duration</p>
            <p className="text-sm text-on-surface font-bold">15m</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Weight Log</p>
            <p className="text-sm text-on-surface font-bold">{post.log_weight} kg</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-secondary/20 text-on-secondary flex items-center justify-center flex-shrink-0">
             <span className="material-symbols-outlined text-[18px]">monitor_weight</span>
           </div>
           <div className="text-sm">
             <span className="text-on-surface font-bold">1 set </span>
             <span className="text-on-surface-variant">Daily Weigh-In</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <article className="glass-card rounded-xl overflow-hidden group transition-all duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex justify-center items-center">
              {post.author_avatar ? (
                <img className="w-full h-full object-cover" src={post.author_avatar} alt="Author" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h4 className="font-bold text-on-surface">{post.author_name}</h4>
                {post.author_role === 'COACH' && (
                  <span className="material-symbols-outlined text-[14px] text-primary" title="Certified Coach">verified</span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant">{timeAgoStr} • <span className="text-primary-fixed">{getSubtitle()}</span></p>
            </div>
          </div>
          <button onClick={() => alert('Opening post options...')} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
        
        {post.content && (
          <p className="text-on-surface mb-4 leading-relaxed">
            {post.content}
          </p>
        )}

        {/* Specific Data Blocks */}
        {renderWorkoutContent()}
        {renderProgressContent()}

        {/* Images */}
        {post.image_uris && post.image_uris.length > 0 && (
          <div className="relative h-72 w-full rounded-lg overflow-hidden bg-surface-container my-4">
            <img className="w-full h-full object-cover" src={post.image_uris[0]} alt="Post attachment" />
          </div>
        )}

        {/* Interaction Row */}
        <div className="flex items-center gap-6 pt-4 border-t border-outline-variant/10">
          <button onClick={handleLike} className={`flex items-center gap-2 transition-colors group/btn ${post.user_liked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined group-hover/btn:scale-110 transition-transform" style={{ fontVariationSettings: post.user_liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            <span className="text-xs font-medium">{post.likes_count} Likes</span>
          </button>
          <button onClick={() => alert('Comments coming soon!')} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group/btn">
            <span className="material-symbols-outlined group-hover/btn:scale-110 transition-transform">comment</span>
            <span className="text-xs font-medium">{post.comments_count} Comments</span>
          </button>
          <button onClick={() => alert('Sharing coming soon!')} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors ml-auto">
            <span className="material-symbols-outlined">share</span>
          </button>
          
          {post.post_type === 'WORKOUT' && post.author_id !== currentUser.id && (
            <button 
              onClick={handleImportRoutine}
              disabled={importing || importSuccess}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${importSuccess ? 'bg-secondary/20 text-secondary border-secondary/30' : 'bg-surface-container-high text-on-surface hover:bg-surface-bright border-outline-variant/30'}`}
            >
              {importSuccess ? 'Saved' : importing ? 'Saving...' : 'Copy Routine'}
            </button>
          )}
        </div>

        {/* Existing Comments (Preview) */}
        {comments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-outline-variant/5 space-y-3">
            {comments.slice(-2).map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden flex justify-center items-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                </div>
                <div className="bg-surface-container-high/40 rounded-2xl p-3 flex-1">
                  <p className="text-xs font-bold text-primary-fixed mb-1">{c.author_name}</p>
                  <p className="text-xs text-on-surface-variant">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden flex-shrink-0">
             <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
          </div>
          <input 
            type="text" 
            placeholder="Write a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-surface-container border border-outline-variant/20 rounded-full px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
          />
          <button 
            type="submit" 
            disabled={!newComment.trim()}
            className="text-sm font-bold text-primary disabled:opacity-30 transition-opacity pr-2"
          >
            Post
          </button>
        </form>
      </div>
    </article>
  );
}
