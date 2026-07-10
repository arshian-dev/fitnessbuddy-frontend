import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Filter, ArrowLeft, Bookmark } from 'lucide-react';

const getHistoryApi = async (userId, exerciseName) => {
  if (!userId || !exerciseName) return null;
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/workouts/history/${userId}/${exerciseName}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch history');
  }
  return res.json();
}

export default function ExercisesPage({ user }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All Muscles');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState('General');

  // Load exercises from our backend
  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await api.getExercises();
      setExercises(data || []);
    } catch (err) {
      console.error('Failed to load exercises', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  // Fetch ghost data for selected exercise
  const { data: ghostData, isLoading: ghostLoading } = useQuery({
    queryKey: ['workoutHistory', user?.id, selectedExercise?.name],
    queryFn: () => getHistoryApi(user?.id, selectedExercise?.name),
    enabled: !!selectedExercise && !!user?.id,
  });

  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!newExName.trim()) return;
    try {
      await api.createExercise({ name: newExName, category: newExCategory });
      await loadExercises();
      setShowCustomModal(false);
      setNewExName('');
    } catch (err) {
      console.error(err);
      alert('Failed to create custom exercise.');
    }
  };

  // Extract unique categories for the filter
  const muscles = ['All Muscles', ...new Set(exercises.map(e => e.category || 'General'))].filter(Boolean);

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'All Muscles' || ex.category === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="flex-1 relative overflow-y-auto no-scrollbar h-full text-on-surface animate-in fade-in pb-32">
      {/* Header Section */}
      {!selectedExercise && (
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 px-margin-edge py-6">
          <div className="max-w-container-max mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="font-text-headline-lg text-on-surface mb-1">Exercise Encyclopedia</h2>
              <p className="text-on-surface-variant font-text-body-sm">Explore movements with clinical precision and technique guides.</p>
            </div>

            {/* Search and Filter Cluster */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary-container transition-colors">search</span>
                <input 
                  className="bg-surface-container-high border border-outline-variant/30 rounded-full py-2.5 pl-10 pr-6 w-full lg:w-72 focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container text-on-surface placeholder:text-outline/60 transition-all" 
                  placeholder="Search exercises..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <select 
                  className="appearance-none flex items-center gap-2 px-4 py-2.5 bg-surface-container-high border border-outline-variant/30 rounded-lg text-on-surface hover:bg-surface-bright/20 transition-all font-text-body-sm outline-none cursor-pointer pr-8"
                  value={selectedMuscle}
                  onChange={(e) => setSelectedMuscle(e.target.value)}
                >
                  {muscles.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <Filter className="absolute right-2 top-3 text-outline pointer-events-none" size={16} />
              </div>

              <button 
                onClick={() => setShowCustomModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-lg hover:brightness-110 active:scale-95 transition-all font-bold"
              >
                <Plus size={20} />
                <span className="font-text-body-sm">Suggest</span>
              </button>
            </div>
          </div>
          
          {/* Quick Category Chips */}
          <div className="max-w-container-max mx-auto mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
             {muscles.slice(0, 8).map(m => (
               <button 
                  key={m}
                  onClick={() => setSelectedMuscle(m)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full font-text-body-sm transition-colors border ${selectedMuscle === m ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border-outline-variant/20'}`}
               >
                 {m}
               </button>
             ))}
          </div>
        </header>
      )}

      {/* Main Content */}
      <section className="p-4 md:p-margin-edge max-w-container-max mx-auto">
        {selectedExercise ? (
          /* DETAILS VIEW */
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setSelectedExercise(null)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary-container transition-colors w-fit"
            >
              <ArrowLeft size={20} />
              <span className="font-text-body-sm font-bold">Back to Library</span>
            </button>
            
            {/* Header */}
            <div className="flex items-center gap-6 pb-6 border-b border-outline-variant/10">
              <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[32px]">fitness_center</span>
              </div>
              <div>
                <h2 className="font-text-headline-lg text-on-surface">{selectedExercise.name}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20 text-xs text-on-surface-variant font-medium uppercase tracking-wider">{selectedExercise.category || 'General'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Animation Viewer */}
              <div className="w-full glass-card rounded-2xl overflow-hidden p-6">
                <div className="w-full h-80 bg-surface-container-lowest rounded-xl flex items-center justify-center relative border border-outline-variant/20">
                  <img 
                    src={`/images/exercises/${selectedExercise.name}.png`} 
                    alt={selectedExercise.name}
                    className="w-full h-full object-contain dark:mix-blend-screen dark:invert-0 invert mix-blend-multiply opacity-90"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <span className="material-symbols-outlined text-[64px] text-outline transition-colors duration-500" style={{display: 'none'}}>fitness_center</span>
                </div>
              </div>

              {/* Personal Stats / Ghost Data */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-text-title-md text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">history</span>
                  Your History
                </h3>
                
                {ghostLoading ? (
                  <div className="text-on-surface-variant text-sm animate-pulse">Analyzing clinical data...</div>
                ) : ghostData ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container/50 p-4 rounded-xl border border-outline-variant/10">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Last Weight</p>
                      <p className="text-2xl font-extrabold text-on-surface">{ghostData.weight} <span className="text-sm text-on-surface-variant font-medium">kg</span></p>
                    </div>
                    <div className="bg-surface-container/50 p-4 rounded-xl border border-outline-variant/10">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Last Reps</p>
                      <p className="text-2xl font-extrabold text-on-surface">{ghostData.reps}</p>
                    </div>
                    <div className="bg-primary-container/5 p-4 rounded-xl border border-primary-container/20 col-span-2 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-primary-container font-bold uppercase tracking-wider mb-1">Estimated 1RM</p>
                        <p className="text-3xl font-extrabold text-primary-fixed">{Math.round(ghostData.weight * (1 + ghostData.reps / 30))} <span className="text-lg text-primary-fixed/70 font-medium">kg</span></p>
                      </div>
                      <span className="material-symbols-outlined text-primary-container text-[40px] opacity-20">analytics</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-on-surface-variant text-sm bg-surface-container/50 p-6 rounded-xl border border-outline-variant/10 text-center">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">data_alert</span>
                    <p>No historical data available. Start tracking this movement to build your clinical profile.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* BENTO GRID */
          <>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">refresh</span>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center p-12 glass-card rounded-xl text-on-surface-variant">
                <p>No movements found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredExercises.map(ex => (
                  <div key={ex.name} className="glass-card rounded-xl overflow-hidden group flex flex-col">
                    <div className="aspect-video relative overflow-hidden bg-surface-container-highest flex items-center justify-center p-4">
                      <img 
                        src={`/images/exercises/${ex.name}.png`} 
                        alt={ex.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 dark:mix-blend-screen dark:invert-0 invert mix-blend-multiply opacity-90"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                      <span className="material-symbols-outlined text-[64px] text-outline group-hover:text-primary-container transition-colors duration-500" style={{display: 'none'}}>fitness_center</span>

                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 rounded bg-secondary-container/40 backdrop-blur-md text-[10px] font-bold text-on-secondary uppercase tracking-wider">Movement</span>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-text-title-md text-on-surface group-hover:text-primary-container transition-colors line-clamp-1">{ex.name}</h3>
                        <button onClick={() => alert('Exercise bookmarked!')} className="text-outline hover:text-primary-container transition-colors">
                          <Bookmark size={20} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary dark:text-primary-container font-medium uppercase">{ex.category || 'General'}</span>
                      </div>
                      <div className="mt-auto pt-4">
                        <button 
                          onClick={() => setSelectedExercise(ex)}
                          className="w-full py-2 bg-surface-container-high border border-outline-variant/50 rounded-lg text-on-surface font-text-body-sm hover:bg-primary-container hover:text-on-primary-container hover:border-transparent transition-all shadow-sm hover:shadow-md"
                        >
                          View Mechanics
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!loading && filteredExercises.length > 0 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <p className="text-on-surface-variant font-text-body-sm">Showing {filteredExercises.length} movements</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Custom Exercise Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleCreateCustom} className="glass-card border border-outline-variant/20 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="font-text-headline-lg text-on-surface mb-6">Suggest Movement</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Exercise Name</label>
                <input
                  type="text"
                  required
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary-container transition-colors"
                  placeholder="e.g. Zercher Squat"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Target Muscle / Category</label>
                <input
                  type="text"
                  value={newExCategory}
                  onChange={(e) => setNewExCategory(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary-container transition-colors"
                  placeholder="e.g. Legs"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => setShowCustomModal(false)}
                className="px-6 py-2 rounded-lg font-bold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 rounded-lg font-bold bg-primary-container hover:brightness-110 text-on-primary-container transition-all"
              >
                Add Movement
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
