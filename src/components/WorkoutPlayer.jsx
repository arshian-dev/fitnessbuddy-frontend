import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { api } from '../services/api';
import PlateCalculator from './PlateCalculator';
import { useTimer } from '../context/TimerContext';
import { getExerciseImage } from '../utils/exerciseImages';

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
  const [elapsedTime, setElapsedTime] = useState(0);
  const { startTimer, stopTimer, secondsLeft, isActive } = useTimer();

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
    if (!isFinished) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFinished]);

  // Removed local rest timer logic; using global TimerContext instead.

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const { data: ghostData } = useQuery({
    queryKey: ['workoutHistory', user.id, currentExercise?.name],
    queryFn: () => getHistoryApi(user.id, currentExercise?.name),
    enabled: !!currentExercise && !isFinished
  });

  const logSetMutation = useMutation({
    mutationFn: logSetApi,
    onMutate: async (newSet) => {
      await queryClient.cancelQueries({ queryKey: ['workoutHistory', user.id, currentExercise.name] });
      const previous = queryClient.getQueryData(['workoutHistory', user.id, currentExercise.name]);
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
      const restSecs = currentExercise.restSeconds || 90;
      startTimer(restSecs);
      
      const customWeight = setWeights[workoutStepIndex]?.[setIdx];
      const finalWeight = customWeight !== undefined && customWeight !== '' ? parseFloat(customWeight) : (ghostData?.weight || profile?.weight || 0);
      
      const customReps = setRepsLog[workoutStepIndex]?.[setIdx];
      const finalReps = customReps !== undefined && customReps !== '' ? parseInt(customReps) : (ghostData?.reps || parseInt(currentExercise.reps) || 10);
      
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

  const skipRest = () => {
    stopTimer();
  };

  if (activeWorkoutExercises.length === 0) {
    return (
      <div className="p-xl text-center flex flex-col items-center justify-center h-full">
        <p className="text-on-surface-variant text-sm">No exercises scheduled for {activeWorkoutDay}.</p>
        <button onClick={() => setActiveWorkoutDay(null)} className="mt-md bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-bold">Back to Workouts</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="p-xl space-y-lg text-center flex flex-col items-center justify-center h-full bg-background">
        <div className="w-16 h-16 bg-surface-container-highest border border-primary-container/30 text-primary-container rounded-full flex items-center justify-center mx-auto animate-bounce">
          <span className="material-symbols-outlined text-[36px]">celebration</span>
        </div>
        <h4 className="font-text-headline-lg text-on-surface">Workout Completed! 🎉</h4>
        <p className="text-on-surface-variant text-sm">Total Time: <strong className="text-on-surface">{formatTime(elapsedTime)}</strong></p>
        
        <div className="glass-card p-lg rounded-xl max-w-md w-full mx-auto text-left space-y-md">
          {formSuccess && <p className="text-primary-container">{formSuccess}</p>}
          {formError && <p className="text-error">{formError}</p>}
          <button
            onClick={handleFinishWorkout}
            disabled={formLoading}
            className="w-full py-md bg-primary-container hover:brightness-110 text-on-primary-container rounded-xl font-bold transition-all"
          >
            {formLoading ? 'Saving Log...' : 'Log Workout & Finish'}
          </button>
        </div>
      </div>
    );
  }

  const nextExercise = activeWorkoutExercises[workoutStepIndex + 1];

  return (
    <div className="fixed inset-0 z-50 bg-background text-on-surface flex flex-col md:flex-row overflow-hidden font-text-body-sm selection:bg-primary-container selection:text-on-primary-container">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0"></div>

      {/* Left Column: Focus */}
      <section className="w-full md:w-3/5 h-[40vh] md:h-full flex flex-col p-6 md:p-12 justify-between relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-fixed">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>fitness_center</span>
              <span className="font-text-title-md tracking-wider uppercase">{activeWorkoutDay} — {workoutPlan?.split || 'Custom'}</span>
            </div>
            <h1 className="font-text-headline-lg text-on-surface">{currentExercise.name}</h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-on-surface-variant font-text-title-md">{formatTime(elapsedTime)}</span>
            <div className="w-32 h-1 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary-container transition-all duration-500 shadow-[0_0_10px_#00f5d4]" style={{ width: `${((workoutStepIndex) / activeWorkoutExercises.length) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center py-4 md:py-8 h-full">
          <div className="relative w-full max-w-2xl h-full min-h-[200px] glass-card rounded-2xl overflow-hidden animate-float group">
            <div className="w-full h-full flex items-center justify-center p-4 bg-surface-container-lowest/50 relative">
              <img 
                src={getExerciseImage(currentExercise)} 
                alt={currentExercise.name}
                className="w-full h-full object-contain dark:mix-blend-screen dark:invert-0 invert mix-blend-multiply opacity-90"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              <span className="material-symbols-outlined text-[96px] text-outline" style={{display: 'none'}}>fitness_center</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
              <div className="space-y-1">
                {nextExercise && (
                  <>
                    <p className="text-on-surface-variant font-medium">Coming Up Next</p>
                    <p className="text-on-surface font-text-title-md">{nextExercise.name}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rest Timer Overlay */}
        <div className={`absolute inset-0 z-20 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <p className="text-primary-fixed uppercase tracking-[0.2em] mb-4">Recovery Time</p>
          <div className="text-[120px] md:text-[180px] font-text-headline-lg timer-glow text-primary-container leading-none">
            {formatTime(secondsLeft)}
          </div>
          <button 
            className="mt-8 px-8 py-3 border-2 border-primary-container text-primary-container rounded-full font-bold hover:bg-primary-container hover:text-on-primary-container transition-all"
            onClick={skipRest}
          >
            SKIP REST
          </button>
        </div>
      </section>

      {/* Right Column: Interactive Log */}
      <section className="w-full md:w-2/5 h-[60vh] md:h-full glass-card border-l border-white/5 p-6 md:p-8 flex flex-col gap-6 no-scrollbar overflow-y-auto relative z-10">
        <div className="flex items-center justify-between">
          <h2 className="font-text-title-md text-on-surface">Execution Log</h2>
          {ghostData && (
            <span className="bg-surface-container-highest px-3 py-1 rounded-full text-text-body-sm text-on-surface-variant">
              Last: {ghostData.weight}kg x {ghostData.reps}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-4 px-4 text-on-surface-variant uppercase text-[10px] tracking-widest font-bold">
            <span>Set</span>
            <span>Weight (kg)</span>
            <span>Reps</span>
            <span className="text-right">Status</span>
          </div>

          {Array.from({ length: parseInt(currentExercise.sets) || 3 }, (_, setIdx) => {
            const isDone = !!completedSets[workoutStepIndex]?.[setIdx];
            
            // Current active set is the first not-done set
            const currentSetsForExercise = completedSets[workoutStepIndex] || {};
            const isCurrentActiveSet = !isDone && (setIdx === 0 || currentSetsForExercise[setIdx - 1]);

            return (
              <div key={setIdx} className={`grid grid-cols-4 items-center p-4 rounded-xl transition-all ${
                isDone ? 'bg-surface-container-low/50 border border-white/5 opacity-60' : 
                isCurrentActiveSet ? 'bg-surface-container active-ring border border-primary-container/30 transform scale-[1.02]' : 
                'bg-transparent border border-dashed border-white/10 opacity-40'
              }`}>
                <span className={`font-bold ${isDone ? 'text-on-surface' : isCurrentActiveSet ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                  {setIdx + 1}
                </span>
                
                {isCurrentActiveSet ? (
                  <div className="relative group">
                    <input 
                      type="number" 
                      placeholder={ghostData?.weight || profile?.weight || 0}
                      value={setWeights[workoutStepIndex]?.[setIdx] ?? ''}
                      onChange={(e) => setSetWeights(prev => ({...prev, [workoutStepIndex]: {...(prev[workoutStepIndex] || {}), [setIdx]: e.target.value}}))}
                      className="bg-transparent border-none p-0 w-full font-bold text-lg text-on-surface focus:ring-0"
                    />
                    <div className="absolute bottom-0 left-0 w-8 h-[2px] bg-primary-container"></div>
                  </div>
                ) : (
                  <span className={isDone ? 'text-on-surface' : 'text-on-surface-variant'}>
                    {setWeights[workoutStepIndex]?.[setIdx] || (isDone ? (ghostData?.weight || profile?.weight || 0) : '---')}
                  </span>
                )}

                {isCurrentActiveSet ? (
                  <div className="relative group">
                    <input 
                      type="number" 
                      placeholder={ghostData?.reps || currentExercise.reps || 10}
                      value={setRepsLog[workoutStepIndex]?.[setIdx] ?? ''}
                      onChange={(e) => setSetRepsLog(prev => ({...prev, [workoutStepIndex]: {...(prev[workoutStepIndex] || {}), [setIdx]: e.target.value}}))}
                      className="bg-transparent border-none p-0 w-full font-bold text-lg text-on-surface focus:ring-0"
                    />
                    <div className="absolute bottom-0 left-0 w-8 h-[2px] bg-primary-container"></div>
                  </div>
                ) : (
                  <span className={isDone ? 'text-on-surface' : 'text-on-surface-variant'}>
                    {setRepsLog[workoutStepIndex]?.[setIdx] || (isDone ? (ghostData?.reps || currentExercise.reps || 10) : '---')}
                  </span>
                )}

                <div className="flex justify-end">
                  {isDone ? (
                    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : isCurrentActiveSet ? (
                    <button 
                      onClick={() => handleSetToggle(setIdx)}
                      className="bg-primary-container text-on-primary-container px-3 py-1 rounded-lg font-bold text-[11px] uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all"
                    >
                      Finish Set
                    </button>
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant">hourglass_empty</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          {(currentExercise.name.toLowerCase().includes('barbell') || currentExercise.name.toLowerCase().includes('squat') || currentExercise.name.toLowerCase().includes('deadlift')) && (
            <div className="p-4 rounded-xl bg-surface-container border border-white/5">
              <PlateCalculator />
            </div>
          )}

          <div className="flex gap-sm">
            <button
              disabled={workoutStepIndex === 0}
              onClick={() => {
                setWorkoutStepIndex(prev => prev - 1);
                skipRest();
              }}
              className="px-lg py-4 bg-surface-container-highest text-on-surface rounded-xl font-bold hover:bg-surface-bright transition-colors disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => {
                setWorkoutStepIndex(prev => prev + 1);
                skipRest();
              }}
              className="flex-1 bg-primary-container text-on-primary-container py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              {workoutStepIndex === activeWorkoutExercises.length - 1 ? 'Finish Workout' : 'Next Exercise'}
            </button>
          </div>
          
          <button 
            onClick={() => setActiveWorkoutDay(null)}
            className="w-full flex items-center justify-center gap-2 text-error py-2 text-xs hover:text-error-container transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span> End Session Early
          </button>
        </div>
      </section>
    </div>
  );
}
