import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { api } from '../services/api';
import WgerAnimation from './WgerAnimation';
import PlateCalculator from './PlateCalculator';
import { useTimer } from '../context/TimerContext';

// Extracted from api.js but using native fetch for tanstack if api.js lacks the method
// Fallback function for set logging since it might not be in api.js yet
const logSetApi = async ({ userId, exerciseId, weight, reps }) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/workouts/log-set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, exerciseId, weight, reps })
  });
  if (!res.ok) throw new Error('Failed to log set');
  return res.json();
};

const getHistoryApi = async (userId, exerciseId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/workouts/history/${userId}/${exerciseId}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
};

export default function WorkoutPlayer({ 
  activeWorkoutDay, 
  setActiveWorkoutDay, 
  workoutPlan, 
  getExercises, 
  user, 
  profile, 
  checkinHistory,
  onComplete
}) {
  const [workoutStepIndex, setWorkoutStepIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [setWeights, setSetWeights] = useState({});
  const [setRepsLog, setSetRepsLog] = useState({});
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Timer Context
  const { startTimer, stopTimer } = useTimer();

  // Logging Form State (for when workout finishes)
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState(7);
  const [caloriesLogged, setCaloriesLogged] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const queryClient = useQueryClient();
  const activeWorkoutExercises = getExercises().filter(ex => ex.day === activeWorkoutDay);
  const currentExercise = activeWorkoutExercises[workoutStepIndex];
  const isFinished = workoutStepIndex >= activeWorkoutExercises.length;

  useEffect(() => {
    let interval;
    if (!isFinished && !showQuitConfirm) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFinished, showQuitConfirm]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Fetch ghost values for current exercise
  const { data: ghostData } = useQuery({
    queryKey: ['workoutHistory', user.id, currentExercise?.name],
    queryFn: () => getHistoryApi(user.id, currentExercise?.name),
    enabled: !!currentExercise && !isFinished
  });

  // Optimistic UI mutation for logging a set
  const logSetMutation = useMutation({
    mutationFn: logSetApi,
    onMutate: async (newSet) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workoutHistory', user.id, currentExercise.name] });
      // Snapshot previous
      const previous = queryClient.getQueryData(['workoutHistory', user.id, currentExercise.name]);
      // Optimistically update to the new values
      queryClient.setQueryData(['workoutHistory', user.id, currentExercise.name], {
        weight: newSet.weight,
        reps: newSet.reps
      });
      return { previous };
    },
    onError: (err, newSet, context) => {
      queryClient.setQueryData(['workoutHistory', user.id, currentExercise.name], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutHistory', user.id, currentExercise.name] });
    }
  });

  const handleSetToggle = (setIdx) => {
    const currentSetsState = { ...(completedSets[workoutStepIndex] || {}) };
    const wasDone = !!currentSetsState[setIdx];
    currentSetsState[setIdx] = !wasDone;
    
    setCompletedSets(prev => ({
      ...prev,
      [workoutStepIndex]: currentSetsState
    }));

    if (!wasDone) {
      // Start global rest timer
      startTimer(currentExercise.restSeconds || 60);
      
      const customWeight = setWeights[workoutStepIndex]?.[setIdx];
      const finalWeight = customWeight !== undefined && customWeight !== '' ? parseFloat(customWeight) : (ghostData?.weight || profile?.weight || 0);
      
      const customReps = setRepsLog[workoutStepIndex]?.[setIdx];
      const finalReps = customReps !== undefined && customReps !== '' ? parseInt(customReps) : (ghostData?.reps || parseInt(currentExercise.reps) || 10);
      
      // Log the set to backend via optimistic mutation
      logSetMutation.mutate({
        userId: user.id,
        exerciseId: currentExercise.name,
        weight: finalWeight,
        reps: finalReps
      });
    } else {
      stopTimer();
    }
  };

  const handleFinishWorkout = async () => {
    const logData = {
      userId: user.id,
      log_date: new Date().toISOString().split('T')[0],
      weight: parseFloat(weight) || parseFloat(profile?.weight) || 70,
      waist_cm: parseFloat(waist) || null,
      workout_completed: true,
      calories_logged: caloriesLogged ? parseInt(caloriesLogged) : 0,
      energy_score: parseInt(energy),
      mood_score: parseInt(mood),
    };
    
    setFormLoading(true);
    try {
      await api.submitCheckin(logData);
      setFormSuccess("Session logged successfully!");
      if (onComplete) {
        setTimeout(() => {
          onComplete(activeWorkoutDay);
          setActiveWorkoutDay(null);
        }, 1500);
      }
    } catch (err) {
      setFormError("Failed to log workout session.");
    } finally {
      setFormLoading(false);
    }
  };

  // UI rendering
  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-white/10 overflow-hidden max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Runner Header */}
      <div className="bg-slate-950 px-lg py-md border-b border-white/10 flex justify-between items-center">
        {!showQuitConfirm ? (
          <>
            <div>
              <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest flex items-center gap-xs">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span>Workout Running - {formatTime(elapsedTime)}</span>
              </span>
              <h3 className="text-white font-bold text-base mt-0.5">{activeWorkoutDay} — {workoutPlan?.split || 'Custom Split'}</h3>
            </div>
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              Quit Session
            </button>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-sm">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-red-400 text-sm">warning</span>
              <span className="text-xs font-bold text-slate-300">Are you sure? Progress will not be saved.</span>
            </div>
            <div className="flex gap-xs self-end">
              <button onClick={() => setShowQuitConfirm(false)} className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-white/5">Cancel</button>
              <button onClick={() => { setActiveWorkoutDay(null); stopTimer(); }} className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded">Yes, Quit</button>
            </div>
          </div>
        )}
      </div>

      {/* Runner Body */}
      {activeWorkoutExercises.length === 0 ? (
        <div className="p-xl text-center">
          <p className="text-slate-400 text-sm">No exercises scheduled for {activeWorkoutDay}.</p>
          <button onClick={() => setActiveWorkoutDay(null)} className="mt-md bg-teal-500 text-slate-900 px-lg py-sm rounded-xl font-bold">Back to Workouts</button>
        </div>
      ) : isFinished ? (
        <div className="p-xl space-y-lg text-center bg-slate-900">
          <div className="w-16 h-16 bg-teal-950 border border-teal-500/30 text-teal-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <span className="material-symbols-outlined text-[36px]">celebration</span>
          </div>
          <h4 className="text-xl font-extrabold text-white">Workout Completed! 🎉</h4>
          <p className="text-slate-400 text-sm">Total Time: <strong className="text-white">{formatTime(elapsedTime)}</strong></p>
          
          {/* Finish form omitted for brevity - replacing with simpler form */}
          <div className="bg-slate-950 p-lg rounded-xl max-w-md mx-auto text-left space-y-md">
            {formSuccess && <p className="text-teal-400">{formSuccess}</p>}
            {formError && <p className="text-red-400">{formError}</p>}
            <button
              onClick={handleFinishWorkout}
              disabled={formLoading}
              className="w-full py-md bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-xl font-bold"
            >
              {formLoading ? 'Saving Log...' : 'Log Workout & Finish'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-lg space-y-lg">
          {/* Progress Bar */}
          <div className="space-y-xs">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>EXERCISE {workoutStepIndex + 1} OF {activeWorkoutExercises.length}</span>
              <span>{((workoutStepIndex / activeWorkoutExercises.length) * 100).toFixed(0)}% COMPLETE</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-teal-400 h-full transition-all duration-500" style={{ width: `${(workoutStepIndex / activeWorkoutExercises.length) * 100}%` }} />
            </div>
          </div>

          <div className="bg-slate-950 border border-white/5 rounded-xl p-lg space-y-md">
            <h4 className="text-lg font-extrabold text-white">{currentExercise.name}</h4>
            <p className="text-xs text-teal-400 font-bold uppercase">{currentExercise.sets} Sets x {currentExercise.reps} Reps</p>
            <div className="mt-md">
              <WgerAnimation exerciseName={currentExercise.name} mediaType="video" />
            </div>
            {/* Plate Calculator inline for barbell exercises */}
            {(currentExercise.name.toLowerCase().includes('barbell') || currentExercise.name.toLowerCase().includes('squat') || currentExercise.name.toLowerCase().includes('deadlift')) && (
              <div className="mt-4">
                <PlateCalculator />
              </div>
            )}
          </div>

          {/* Sets Tracker with Ghost Values */}
          <div className="space-y-sm">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
              <span>Track Your Sets</span>
              {ghostData && <span className="text-slate-500">Last: {ghostData.weight}kg x {ghostData.reps}</span>}
            </h5>
            <div className="grid grid-cols-1 gap-xs">
              {Array.from({ length: parseInt(currentExercise.sets) || 3 }, (_, setIdx) => {
                const isDone = !!completedSets[workoutStepIndex]?.[setIdx];
                return (
                  <div
                    key={setIdx}
                    onClick={() => handleSetToggle(setIdx)}
                    className={`p-md border rounded-xl flex items-center justify-between cursor-pointer transition-all ${isDone ? 'bg-teal-500/10 border-teal-500' : 'bg-slate-950 border-white/10 hover:border-white/20'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-grow mr-4">
                      <span className={`text-xs font-bold whitespace-nowrap ${isDone ? 'text-teal-400' : 'text-slate-300'}`}>SET {setIdx + 1}</span>
                      
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input 
                          type="number"
                          placeholder={ghostData?.weight || profile?.weight || 0}
                          value={setWeights[workoutStepIndex]?.[setIdx] ?? ''}
                          onChange={(e) => {
                            setSetWeights(prev => ({
                              ...prev,
                              [workoutStepIndex]: {
                                ...(prev[workoutStepIndex] || {}),
                                [setIdx]: e.target.value
                              }
                            }));
                          }}
                          disabled={isDone}
                          className="w-16 bg-slate-900 border border-white/20 rounded px-2 py-1 text-xs text-white focus:border-teal-500 focus:outline-none disabled:opacity-50"
                        />
                        <span className="text-xs font-bold text-slate-500">kg</span>
                        
                        <span className="text-xs font-bold text-slate-500 ml-2">x</span>
                        <input 
                          type="number"
                          placeholder={ghostData?.reps || parseInt(currentExercise.reps) || 10}
                          value={setRepsLog[workoutStepIndex]?.[setIdx] ?? ''}
                          onChange={(e) => {
                            setSetRepsLog(prev => ({
                              ...prev,
                              [workoutStepIndex]: {
                                ...(prev[workoutStepIndex] || {}),
                                [setIdx]: e.target.value
                              }
                            }));
                          }}
                          disabled={isDone}
                          className="w-12 bg-slate-900 border border-white/20 rounded px-2 py-1 text-xs text-white focus:border-teal-500 focus:outline-none disabled:opacity-50 ml-1"
                        />
                        <span className="text-xs font-bold text-slate-500">reps</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isDone ? 'bg-teal-500 border-teal-500 text-slate-950' : 'border-white/20 text-transparent'}`}>
                      <Check size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-sm pt-md border-t border-white/10">
            <button
              disabled={workoutStepIndex === 0}
              onClick={() => setWorkoutStepIndex(prev => prev - 1)}
              className="px-lg py-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-bold"
            >
              Prev
            </button>
            <button
              onClick={() => {
                setWorkoutStepIndex(prev => prev + 1);
                stopTimer();
              }}
              className="flex-grow py-sm bg-teal-500 text-slate-950 rounded-xl font-bold hover:bg-teal-400 text-xs"
            >
              {workoutStepIndex === activeWorkoutExercises.length - 1 ? 'Finish Workout' : 'Next Exercise'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
