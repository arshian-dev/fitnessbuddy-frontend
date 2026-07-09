import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import WgerAnimation from './WgerAnimation';
import { Search, Plus, Filter, Dumbbell } from 'lucide-react';

const getHistoryApi = async (userId, exerciseName) => {
  if (!userId || !exerciseName) return null;
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/workouts/history/${userId}/${exerciseName}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch history');
  }
  return res.json();
};

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
    <div className="flex h-full w-full bg-[#0F172A] text-slate-300 rounded-xl overflow-hidden shadow-2xl border border-white/5 animate-in fade-in duration-300">
      
      {/* LEFT PANE: Details View */}
      <div className="flex-grow flex flex-col items-center justify-center p-xl relative overflow-y-auto min-w-[300px]">
        {!selectedExercise ? (
          <div className="flex flex-col items-center justify-center max-w-sm text-center bg-slate-900/50 p-xl rounded-3xl border border-white/5 shadow-lg">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-md shadow-inner text-slate-500">
              <Dumbbell size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Select Exercise</h2>
            <p className="text-sm text-slate-400">Click on an exercise in the library to see statistics, animations, and your personal history.</p>
          </div>
        ) : (
          <div className="w-full max-w-3xl flex flex-col gap-lg animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-md pb-md border-b border-white/10">
              <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Dumbbell size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white">{selectedExercise.name}</h2>
                <p className="text-sm text-teal-400 font-bold tracking-widest uppercase mt-1">{selectedExercise.category || 'General'}</p>
              </div>
            </div>

            {/* Animation Viewer */}
            <div className="w-full bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-lg p-lg">
              <WgerAnimation 
                exerciseName={selectedExercise.name} 
                mediaType="any"
                containerClassName="w-full h-80 bg-slate-950 rounded-xl flex items-center justify-center"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Personal Stats / Ghost Data */}
            <div className="bg-slate-900 rounded-2xl border border-white/10 p-lg shadow-lg">
              <h3 className="text-lg font-bold text-white mb-md flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400">history</span>
                Your History
              </h3>
              
              {ghostLoading ? (
                <div className="text-slate-500 text-sm animate-pulse">Loading stats...</div>
              ) : ghostData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-md rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Last Weight</p>
                    <p className="text-2xl font-extrabold text-white">{ghostData.weight} <span className="text-sm text-slate-400 font-medium">kg</span></p>
                  </div>
                  <div className="bg-slate-950 p-md rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Last Reps</p>
                    <p className="text-2xl font-extrabold text-white">{ghostData.reps}</p>
                  </div>
                  <div className="bg-slate-950 p-md rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Est. 1RM</p>
                    <p className="text-2xl font-extrabold text-teal-400">{Math.round(ghostData.weight * (1 + ghostData.reps / 30))} <span className="text-sm text-slate-400 font-medium text-white">kg</span></p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm italic bg-slate-950 p-md rounded-xl border border-white/5">
                  You haven't logged any sets for this exercise yet. Start tracking to see your personal statistics!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Library Sidebar */}
      <div className="w-80 sm:w-96 flex-shrink-0 bg-slate-950 border-l border-white/10 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="p-md border-b border-white/10 space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-white">Library</h3>
            <button 
              onClick={() => setShowCustomModal(true)}
              className="text-teal-400 hover:text-teal-300 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Custom Exercise
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-sm">
            <div className="relative">
              <select className="w-full bg-slate-900 border border-white/10 rounded-lg px-sm py-2 text-sm text-white appearance-none focus:outline-none focus:border-teal-500 cursor-pointer">
                <option>All Equipment</option>
                {/* Placeholder for equipment filter since DB doesn't have it yet */}
                <option value="barbell">Barbell</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="machine">Machine</option>
                <option value="bodyweight">Bodyweight</option>
              </select>
              <Filter className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" size={16} />
            </div>
            
            <div className="relative">
              <select 
                value={selectedMuscle}
                onChange={(e) => setSelectedMuscle(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-sm py-2 text-sm text-white appearance-none focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {muscles.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" size={16} />
            </div>

            <div className="relative pt-xs">
              <Search className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="Search Exercises"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-xl flex justify-center">
              <div className="animate-spin text-teal-500"><Dumbbell size={24} /></div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="p-xl text-center text-slate-500 text-sm">
              No exercises found matching your filters.
            </div>
          ) : (
            <div className="py-sm">
              <div className="px-md pb-xs pt-sm text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                All Exercises
              </div>
              {filteredExercises.map(ex => (
                <button
                  key={ex.name}
                  onClick={() => setSelectedExercise(ex)}
                  className={`w-full text-left px-md py-sm flex items-center gap-md transition-colors ${selectedExercise?.name === ex.name ? 'bg-teal-500/10 border-l-2 border-teal-500' : 'hover:bg-slate-900 border-l-2 border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {/* WgerAnimation takes too long to load for 100 items, using a static icon */}
                    <Dumbbell size={18} className={selectedExercise?.name === ex.name ? 'text-teal-400' : 'text-slate-500'} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className={`text-sm font-bold truncate ${selectedExercise?.name === ex.name ? 'text-teal-400' : 'text-white'}`}>{ex.name}</span>
                    <span className="text-xs text-slate-500 truncate">{ex.category || 'General'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Exercise Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleCreateCustom} className="bg-slate-900 border border-white/10 rounded-2xl p-lg w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-md">Create Custom Exercise</h3>
            <div className="space-y-md">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Exercise Name</label>
                <input
                  type="text"
                  required
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Zercher Squat"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Target Muscle / Category</label>
                <input
                  type="text"
                  value={newExCategory}
                  onChange={(e) => setNewExCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Legs"
                />
              </div>
            </div>
            <div className="mt-xl flex justify-end gap-sm">
              <button 
                type="button" 
                onClick={() => setShowCustomModal(false)}
                className="px-md py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-lg py-2 rounded-lg font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors"
              >
                Create Exercise
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
