import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const WgerAnimation = ({ exerciseName, mediaType = 'any', className = '', containerClassName = '' }) => {
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMedia = async () => {
      if (!exerciseName) return;
      
      setLoading(true);
      try {
        // Strip out common qualifiers like 'Dumbbell', 'Barbell' to improve search match if needed
        // but for now let's just search the exact string as Wger API will do a substring match.
        const cleanName = exerciseName.split('(')[0].trim();
        const response = await api.searchWgerExercise(cleanName);
        
        if (isMounted && response.results && response.results.length > 0) {
          // Filter based on requested mediaType
          const match = response.results.find(res => {
            if (mediaType === 'video') return res.videos && res.videos.length > 0;
            if (mediaType === 'image') return res.images && res.images.length > 0;
            return (res.videos && res.videos.length > 0) || (res.images && res.images.length > 0);
          });
          
          if (match) {
            if ((mediaType === 'video' || mediaType === 'any') && match.videos && match.videos.length > 0) {
              setMedia({ type: 'video', url: match.videos[0].video });
            } else if ((mediaType === 'image' || mediaType === 'any') && match.images && match.images.length > 0) {
              // Try to find a gif if available, otherwise just use the first image
              const gif = match.images.find(img => img.image.endsWith('.gif'));
              setMedia({ type: 'image', url: gif ? gif.image : match.images[0].image });
            } else {
              setMedia(null);
            }
          } else {
            setMedia(null);
          }
        } else {
          setMedia(null);
        }
      } catch (error) {
        console.error('Failed to fetch wger animation:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedia();

    return () => {
      isMounted = false;
    };
  }, [exerciseName]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center animate-pulse ${containerClassName || 'w-full h-48 bg-slate-900 rounded-xl border border-white/5'}`}>
        <span className="material-symbols-outlined text-teal-500/50 text-[32px] animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!media) {
    return (
      <div className={`flex flex-col items-center justify-center text-slate-500 ${containerClassName || 'w-full h-24 bg-slate-900 rounded-xl border border-white/5'}`}>
        <span className="material-symbols-outlined text-[24px] mb-1">image_not_supported</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-center">
          {mediaType === 'video' ? 'No Video' : mediaType === 'image' ? 'No Photo' : 'No Media'}
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${containerClassName || 'w-full rounded-xl border border-white/10 bg-slate-900 shadow-sm'}`}>
      {media.type === 'video' ? (
        <video 
          src={media.url} 
          autoPlay 
          loop 
          muted 
          playsInline 
          className={className || 'w-full h-auto object-cover max-h-64'}
        />
      ) : (
        <img 
          src={media.url} 
          alt={`Animation for ${exerciseName}`} 
          className={className || 'w-full h-auto object-contain max-h-64 bg-white/5'} 
          loading="lazy"
        />
      )}
    </div>
  );
};

export default WgerAnimation;
