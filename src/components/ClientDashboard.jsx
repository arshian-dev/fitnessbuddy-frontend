import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import WorkoutPlayer from './WorkoutPlayer';
import BloodworkPage from './BloodworkPage';
import CommunityPage from './CommunityPage';
import ExercisesPage from './ExercisesPage';
import ProfilePage from './ProfilePage';
import ThemeToggle from './ThemeToggle';
import { getExerciseImage } from '../utils/exerciseImages';
import { TextEffect } from '../../components/motion-primitives/text-effect';
import { 
  Dumbbell, 
  Flame, 
  HelpCircle, 
  LogOut, 
  Plus, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  Zap, 
  Save, 
  MessageSquare,
  RefreshCw,
  Share2,
  User
} from 'lucide-react';
import { calculateTotalVolume } from '../utils/calculations';

export default function ClientDashboard({ user, initialData, onReOnboard, onUpdateUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, workouts, nutrition, chat, progress
  const [profile, setProfile] = useState(initialData.profile);
  const [workoutPlan, setWorkoutPlan] = useState(initialData.workoutPlan);
  const [nutritionPlan, setNutritionPlan] = useState(initialData.nutritionPlan);
  const [isRegeneratingDiet, setIsRegeneratingDiet] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(initialData.activeAlerts || []);

  const [checkinHistory, setCheckinHistory] = useState([]);
  const [completedExercises, setCompletedExercises] = useState({});
  const [dietContext, setDietContext] = useState('TRADITIONAL'); // TRADITIONAL, STANDARD
  const [chartMetric, setChartMetric] = useState('body'); // 'body' or 'performance'
  
  // Diet & Hydration States
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [selectedMealOptions, setSelectedMealOptions] = useState({});
  const [loggedMeals, setLoggedMeals] = useState({});
  const [editingMealIdx, setEditingMealIdx] = useState(null);
  const [editMacros, setEditMacros] = useState({ p: 0, c: 0, f: 0, cals: 0 });
  const [baseMacros, setBaseMacros] = useState({ p: 0, c: 0, f: 0, cals: 0 });
  const [editPortion, setEditPortion] = useState(1.0);

  // Workout Split Selection Modal State
  const [showChangeSplitModal, setShowChangeSplitModal] = useState(false);
  const [selectedSplitKey, setSelectedSplitKey] = useState('FULL_BODY_3DAY');
  const [changeSplitLoading, setChangeSplitLoading] = useState(false);
  const [changeSplitError, setChangeSplitError] = useState('');

  const handleChangeSplit = async () => {
    if (!user?.id || !selectedSplitKey) return;
    setChangeSplitLoading(true);
    setChangeSplitError('');

    try {
      const response = await fetch('/api/workouts/change-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, splitKey: selectedSplitKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to change workout split.');
      }

      const data = await response.json();
      setWorkoutPlan(data);
      setShowChangeSplitModal(false);
    } catch (err) {
      console.error('Error changing split:', err);
      setChangeSplitError('Failed to change workout split. Please try again.');
    } finally {
      setChangeSplitLoading(false);
    }
  };

  // AI Food Calculator States
  const [foodQuery, setFoodQuery] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState('');
  const [calcLoggedMsg, setCalcLoggedMsg] = useState('');
  
  // Daily Progress Log Form State
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState(7);
  const [workoutCompletedToday, setWorkoutCompletedToday] = useState(false);
  const [logDate, setLogDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // Track specific workout split days completed today to prevent re-initiation
  const [completedWorkoutDays, setCompletedWorkoutDays] = useState(() => {
    if (!user?.id) return [];
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`fitness_buddy_completed_workouts_${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) return parsed.days || [];
      } catch (e) {}
    }
    return [];
  });
  
  const markWorkoutDayCompleted = (dayName) => {
    if (!dayName) return;
    
    // Check off all exercises for this day in the overview list
    const exercises = getExercises();
    setCompletedExercises(prev => {
      const newCompleted = { ...prev };
      exercises.forEach((ex, idx) => {
        if (ex.day === dayName) {
          newCompleted[idx] = true;
        }
      });
      return newCompleted;
    });

    setCompletedWorkoutDays(prev => {
      if (prev.includes(dayName)) return prev;
      const newDays = [...prev, dayName];
      const today = new Date().toDateString();
      localStorage.setItem(`fitness_buddy_completed_workouts_${user?.id}`, JSON.stringify({
        date: today,
        days: newDays
      }));
      return newDays;
    });
  };

  // Confirmation state for Retake Onboarding
  const [showReOnboardConfirm, setShowReOnboardConfirm] = useState(false);
  const [caloriesLogged, setCaloriesLogged] = useState('');
  const [loggedProtein, setLoggedProtein] = useState(0);
  const [loggedCarbs, setLoggedCarbs] = useState(0);
  const [loggedFats, setLoggedFats] = useState(0);

  // Active workout runner states
  const [activeWorkoutDay, setActiveWorkoutDay] = useState(null);
  const [workoutStepIndex, setWorkoutStepIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [restSecondsLeft, setRestSecondsLeft] = useState(null);
  const [isResting, setIsResting] = useState(false);
  const [workoutLogWeight, setWorkoutLogWeight] = useState('');
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [previewExercise, setPreviewExercise] = useState(null);
  const [chartTimeRange, setChartTimeRange] = useState('monthly');
  
  
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I\'m your Fitness Buddy assistant. Ask me about food swaps, workout tips, managing social events, or anything related to your fitness and nutrition plan!'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Link Coach State
  const [linkCoachCode, setLinkCoachCode] = useState('');
  const [linkCoachLoading, setLinkCoachLoading] = useState(false);
  const [linkCoachError, setLinkCoachError] = useState('');

  const handleLinkCoach = async (e) => {
    e.preventDefault();
    if (!linkCoachCode.trim()) return;
    setLinkCoachLoading(true);
    setLinkCoachError('');
    try {
      const updatedUser = await api.linkCoach(user.id, linkCoachCode.trim());
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
    } catch (err) {
      setLinkCoachError(err.message || 'Invalid Coach Code');
    } finally {
      setLinkCoachLoading(false);
    }
  };

  const handleRegenerateDiet = async () => {
    if (!window.confirm("Are you sure you want to regenerate your diet plan? This will overwrite your current meal schedule.")) return;
    setIsRegeneratingDiet(true);
    try {
      const res = await api.regenerateDiet(user.id);
      if (res.nutritionPlan) {
        setNutritionPlan(res.nutritionPlan);
        // Clear logged meals for the day since schedule changed
        setLoggedMeals({});
        setCaloriesLogged('0');
        setLoggedProtein(0);
        setLoggedCarbs(0);
        setLoggedFats(0);
        alert("Diet plan successfully regenerated!");
      }
    } catch (err) {
      alert("Failed to regenerate diet: " + err.message);
    } finally {
      setIsRegeneratingDiet(false);
    }
  };

  const toggleExercise = (id) => {
    setCompletedExercises(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const loadCheckinHistory = async () => {
    try {
      const history = await api.getCheckins(user.id);
      setCheckinHistory(history);
    } catch (err) {
      console.error('Failed to load check-ins:', err.message);
    }
  };

  useEffect(() => {
    loadCheckinHistory();
  }, [user.id]);

  const handleShareWorkout = async (dayName, e) => {
    e.stopPropagation();
    try {
      await api.createPost({
        userId: user.id,
        content: `Just crushed my ${dayName} workout! 💪`,
        postType: 'WORKOUT',
        referenceId: workoutPlan.id,
        imageUris: []
      });
      alert('Workout shared to community feed!');
    } catch (err) {
      alert('Failed to share workout: ' + err.message);
    }
  };

  // Persistence for daily logging
  useEffect(() => {
    if (user?.id) {
      const todayKey = `fitness_buddy_log_${user.id}_${new Date().toDateString()}`;
      const savedData = localStorage.getItem(todayKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.caloriesLogged) setCaloriesLogged(parsed.caloriesLogged);
          if (parsed.loggedProtein) setLoggedProtein(parsed.loggedProtein);
          if (parsed.loggedCarbs) setLoggedCarbs(parsed.loggedCarbs);
          if (parsed.loggedFats) setLoggedFats(parsed.loggedFats);
          if (parsed.waterGlasses) setWaterGlasses(parsed.waterGlasses);
          if (parsed.loggedMeals) setLoggedMeals(parsed.loggedMeals);
          if (parsed.selectedMealOptions) setSelectedMealOptions(parsed.selectedMealOptions);
        } catch (e) {
          console.error("Error parsing local log data", e);
        }
      }
    }
  }, [user.id]);

  // Save changes automatically
  useEffect(() => {
    if (user?.id) {
      const todayKey = `fitness_buddy_log_${user.id}_${new Date().toDateString()}`;
      localStorage.setItem(todayKey, JSON.stringify({
        caloriesLogged,
        loggedProtein,
        loggedCarbs,
        loggedFats,
        waterGlasses,
        loggedMeals,
        selectedMealOptions
      }));
    }
  }, [caloriesLogged, loggedProtein, loggedCarbs, loggedFats, waterGlasses, loggedMeals, selectedMealOptions, user.id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Active workout rest timer countdown effect
  useEffect(() => {
    let timer;
    if (isResting && restSecondsLeft !== null && restSecondsLeft > 0) {
      timer = setInterval(() => {
        setRestSecondsLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isResting, restSecondsLeft]);

  const handleCheckinSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setFormLoading(true);
      setFormSuccess('');
      setFormError('');

      const data = {
        userId: user.id,
        log_date: logDate,
        weight: parseFloat(weight),
        waist_cm: parseFloat(waist),
        energy_score: parseInt(energy),
        mood_score: parseInt(mood),
        workout_completed: workoutCompletedToday,
        calories_logged: caloriesLogged ? parseInt(caloriesLogged) : 0,
        protein_logged: parseInt(loggedProtein) || 0,
        carbs_logged: parseInt(loggedCarbs) || 0,
        fats_logged: parseInt(loggedFats) || 0,
      };

      const res = await api.submitCheckin(data);
      
      setFormSuccess('Progress logged successfully!');
      
      // Reset input fields but keep logDate
      setWeight('');
      setWaist('');
      setEnergy(7);
      setMood(7);
      setWorkoutCompletedToday(false);
      setCaloriesLogged('');

      await loadCheckinHistory();

      // Refresh alert states
      const refreshedProfile = await api.getProfile(user.id);
      setActiveAlerts(refreshedProfile.activeAlerts);
    } catch (err) {
      setFormError(err.message || 'Failed to submit log entry.');
    } finally {
      setFormLoading(false);
    }
  };

  const refreshPlans = async () => {
    try {
      const data = await api.getProfile(user.id);
      if (data.workoutPlan) setWorkoutPlan(data.workoutPlan);
      if (data.nutritionPlan) setNutritionPlan(data.nutritionPlan);
      if (data.activeAlerts) setActiveAlerts(data.activeAlerts);
    } catch (err) {
      console.error('Error refreshing client plans:', err.message);
    }
  };

  const handleRevertPlan = async () => {
    try {
      setFormLoading(true);
      await api.revertPlan(user.id);
      await refreshPlans();
      setFormSuccess('Reverted back to coach prescribed split successfully!');
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (err) {
      setFormError(err.message || 'Failed to revert plan.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.sendMessage(user?.id, text);
      setChatMessages((prev) => [...prev, { sender: 'assistant', text: res.reply }]);
      await refreshPlans();
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Sorry, I ran into an error. Please check your backend connection.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // AI Food Calculator handlers
  const handleEstimateMacros = async (e) => {
    e.preventDefault();
    if (!foodQuery.trim()) return;
    setCalcLoading(true);
    setCalcError('');
    setCalcResult(null);
    setCalcLoggedMsg('');

    try {
      const res = await api.estimateMacros(foodQuery);
      setCalcResult(res);
    } catch (err) {
      setCalcError(err.message || 'Failed to estimate macros. Try again.');
    } finally {
      setCalcLoading(false);
    }
  };

  const handleLogCalcCalories = () => {
    if (!calcResult) return;
    const added = calcResult.calories;
    setCaloriesLogged((prev) => {
      const current = parseInt(prev) || 0;
      const next = current + added;
      setCalcLoggedMsg(`Added ${added} kcal! Total is now ${next} kcal. Hit 'Save Log Entry' on the Overview tab to record.`);
      return next.toString();
    });
    setLoggedProtein(prev => prev + parseInt(calcResult.protein || 0));
    setLoggedCarbs(prev => prev + parseInt(calcResult.carbs || 0));
    setLoggedFats(prev => prev + parseInt(calcResult.fats || 0));
  };

  // Safe JSON parsers
  const getExercises = () => {
    if (!workoutPlan || !workoutPlan.exercises) return [];
    return typeof workoutPlan.exercises === 'string'
      ? JSON.parse(workoutPlan.exercises)
      : workoutPlan.exercises;
  };

  const getMealTemplates = () => {
    if (!nutritionPlan || !nutritionPlan.meal_templates) return [];
    return typeof nutritionPlan.meal_templates === 'string'
      ? JSON.parse(nutritionPlan.meal_templates)
      : nutritionPlan.meal_templates;
  };

  // Swaps when context is set to Standard
  const translateOption = (opt) => {
    if (dietContext === 'TRADITIONAL') return opt;
    // Replace typical South Asian terms with generic alternatives
    let swapped = opt;
    swapped = swapped.replace(/Roti/gi, 'Whole-wheat Wrap');
    swapped = swapped.replace(/Chapati/gi, 'Oatmeal Flatbread');
    swapped = swapped.replace(/Paneer Tikka/gi, 'Grilled Tofu Skewers');
    swapped = swapped.replace(/Paneer/gi, 'Cottage Cheese');
    swapped = swapped.replace(/Daal/gi, 'Boiled Lentils / Quinoa');
    swapped = swapped.replace(/Desi ghee/gi, 'Olive Oil');
    swapped = swapped.replace(/Tandoori Chicken/gi, 'Grilled Chicken Breast');
    swapped = swapped.replace(/Makhana/gi, 'Rice Cakes');
    return swapped;
  };

  // Calorie ring calculations
  const targetCalories = nutritionPlan?.calories || 2000;
  const loggedCalories = caloriesLogged ? parseInt(caloriesLogged) : (checkinHistory[0] ? targetCalories - 450 : 0);
  const caloriePct = Math.min(100, Math.max(0, (loggedCalories / targetCalories) * 100));
  const circleOffset = 201 - (caloriePct / 100) * 201;

  // Calculate analytics
  const getWeeklyAnalytics = () => {
    const workoutsCompletedThisWeek = checkinHistory[0]?.workouts_completed || 0;
    const targetFreq = workoutPlan?.frequency || 3;
    const adherenceRate = Math.min(100, Math.round((workoutsCompletedThisWeek / targetFreq) * 100));

    const currentWeight = checkinHistory[0]?.weight ? parseFloat(checkinHistory[0].weight) : (parseFloat(profile?.weight) || 0);
    const startingWeight = parseFloat(profile?.weight) || 0;
    const prevWeight = checkinHistory[1]?.weight ? parseFloat(checkinHistory[1].weight) : startingWeight;
    const weightDiff = currentWeight && prevWeight ? currentWeight - prevWeight : 0;

    let avgEnergy = 0;
    let avgMood = 0;
    const recentLogs = checkinHistory.slice(0, 5);
    if (recentLogs.length > 0) {
      const sumEnergy = recentLogs.reduce((sum, log) => sum + (log.energy_score || 7), 0);
      const sumMood = recentLogs.reduce((sum, log) => sum + (log.mood_score || 7), 0);
      avgEnergy = (sumEnergy / recentLogs.length).toFixed(1);
      avgMood = (sumMood / recentLogs.length).toFixed(1);
    } else {
      avgEnergy = '7.0';
      avgMood = '7.0';
    }

    const aiInsight = checkinHistory[0]?.ai_insight || 'Great work getting started! Log your weight and workouts today to generate personalized AI progress feedback.';

    return {
      adherenceRate,
      currentWeight,
      startingWeight,
      weightDiff,
      avgEnergy,
      avgMood,
      aiInsight
    };
  };

  const analytics = getWeeklyAnalytics();

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      {/* Sidebar Navigation */}
      <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-lg px-md bg-surface-container-low border-r border-outline-variant/20 w-64 z-50">
        <div className="mb-xl px-md">
          <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Fitness Buddy</h1>
        </div>
        <div className="flex flex-col gap-base flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'overview' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'workouts' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">fitness_center</span>
            <span className="font-label-md text-label-md">Workouts</span>
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'exercises' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">library_books</span>
            <span className="font-label-md text-label-md">Exercises</span>
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'nutrition' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">restaurant</span>
            <span className="font-label-md text-label-md">Nutrition</span>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'progress' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">insights</span>
            <span className="font-label-md text-label-md">Progress Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('bloodwork')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'bloodwork' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">science</span>
            <span className="font-label-md text-label-md">Bloodwork</span>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'community' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-md text-label-md">Feed</span>
          </button>
          <button
            onClick={() => setShowReOnboardConfirm(true)}
            className="flex items-center gap-md text-on-surface-variant px-md py-sm hover:bg-secondary-container/40 rounded-xl transition-all text-left"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Retake Onboarding</span>
          </button>
          
          {showReOnboardConfirm && (
            <div className="absolute left-0 top-0 w-full h-full bg-surface-container/90 z-10 flex flex-col items-center justify-center p-md animate-in fade-in rounded-2xl border border-outline/10">
              <span className="material-symbols-outlined text-red-500 mb-sm text-3xl">warning</span>
              <p className="text-sm font-bold text-center mb-sm">Are you sure you want to retake onboarding?</p>
              <div className="flex gap-sm">
                <button onClick={() => setShowReOnboardConfirm(false)} className="px-sm py-1 rounded bg-secondary-container text-on-secondary-container text-xs font-bold hover:bg-secondary-container/80 transition-colors">Cancel</button>
                <button onClick={onReOnboard} className="px-sm py-1 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">Yes, Retake</button>
              </div>
            </div>
          )}
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'chat' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">smart_toy</span>
            <span className="font-label-md text-label-md">AI Chat</span>
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'profile' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <User size={20} />
            <span className="font-label-md text-label-md">Profile</span>
          </button>
        </div>

        <div className="mt-auto border-t border-outline-variant/20 pt-lg space-y-base">
          <div className="flex items-center gap-md px-md mb-lg">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-lg overflow-hidden border border-outline-variant/30 relative">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.name ? user.name[0].toUpperCase() : 'A'
              )}
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface font-semibold">{user.name}</p>
              <p className="text-xs text-secondary">Stay Disciplined</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-md text-on-surface-variant px-md py-sm hover:bg-secondary-container/40 rounded-xl transition-all text-left w-full">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Canvas */}
      <main className="md:ml-64 min-h-screen pb-xl">
        {/* Mobile Header Nav */}
        <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md flex flex-col md:flex-row justify-between items-center w-full px-container-margin py-sm md:py-md md:px-lg border-b border-outline-variant/30 gap-sm md:gap-0">
          <div className="flex justify-between items-center w-full md:w-auto">
            <TextEffect as="h2" per="word" preset="slide" className="font-headline-md text-headline-md text-primary tracking-tight capitalize">
              {activeTab}
            </TextEffect>
            <div className="md:hidden bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full font-label-md text-xs flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              {checkinHistory.length}
            </div>
            <div className="md:hidden ml-2">
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center gap-md w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            <div className="hidden md:block mr-2">
              <ThemeToggle />
            </div>
            <div className="md:hidden flex bg-surface-container p-1 rounded-lg gap-xs min-w-max">
              <button onClick={() => setActiveTab('overview')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>Home</button>
              <button onClick={() => setActiveTab('workouts')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'workouts' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>Split</button>
              <button onClick={() => setActiveTab('exercises')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'exercises' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>Library</button>
              <button onClick={() => setActiveTab('nutrition')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'nutrition' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>Diet</button>
              <button onClick={() => setActiveTab('chat')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>AI</button>
              <button onClick={() => setActiveTab('progress')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'progress' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>Logs</button>
              <button onClick={() => setActiveTab('bloodwork')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'bloodwork' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>Labs</button>
              <button onClick={() => setActiveTab('community')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'community' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>Feed</button>
              <button onClick={() => setActiveTab('profile')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:bg-surface-container-high'}`}>Profile</button>
            </div>
            <div className="hidden md:flex bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full font-label-md text-xs items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              {checkinHistory.length} Check-ins
            </div>
          </div>
        </header>

        <div className="p-container-margin md:p-lg space-y-lg max-w-7xl mx-auto">
          
          {/* Active Priority Health Alarms */}
          {activeAlerts.length > 0 && (
            <div className="space-y-sm">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="flex gap-md bg-error-container/30 border border-error/20 p-md rounded-xl shadow-sm border-l-4 border-error items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <ShieldAlert className="text-error" size={24} />
                    <div>
                      <h4 className="font-bold text-sm text-on-error-container flex items-center gap-xs">
                        <span>{alert.type} Alert</span>
                        <span className="text-[10px] bg-error text-on-error px-2 py-0.5 rounded-full font-extrabold uppercase">{alert.severity}</span>
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{alert.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 1: OVERVIEW SCREEN (Bento Grid) */}
          {activeTab === 'overview' && (
            <div className="space-y-lg">
              
              {/* Bento Grid - Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
                
                {/* Daily Energy Circular Progress */}
                <div className="lg:col-span-4 glass-card rounded-xl p-lg shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                  <TextEffect as="h3" per="word" preset="slide" className="font-headline-md text-lg text-on-surface mb-md self-start">
                    Daily Energy
                  </TextEffect>
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle className="text-surface-container-high" cx="96" cy="96" fill="transparent" r="84" stroke="currentColor" strokeWidth="12"></circle>
                      <circle 
                        className="text-primary ring-progress transition-all duration-700" 
                        cx="96" 
                        cy="96" 
                        fill="transparent" 
                        r="84" 
                        stroke="currentColor" 
                        strokeWidth="12"
                        strokeDasharray="527"
                        strokeDashoffset={circleOffset}
                        strokeLinecap="round"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-stat-display text-stat-display text-primary text-[32px] font-extrabold">{loggedCalories}</span>
                      <span className="font-label-md text-secondary text-xs">of {targetCalories} kcal</span>
                    </div>
                  </div>
                  <div className="mt-lg flex gap-md w-full">
                    <div className="flex-1 text-center border-r border-outline-variant/20">
                      <p className="text-xs text-secondary font-label-md">Protein Goal</p>
                      <p className="font-bold text-on-surface">{nutritionPlan?.protein || 140}g</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-xs text-secondary font-label-md">Water Target</p>
                      <p className="font-bold text-on-surface">{profile?.waterGlasses || 8} Glasses</p>
                    </div>
                  </div>
                </div>

                {/* Coach Feedback & Streak */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-lg">
                  {/* Coach Comments */}
                  <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-sm mb-md">
                        <Activity className="text-primary" size={20} />
                        <TextEffect as="h3" per="word" preset="slide" className="font-headline-md text-lg text-primary">
                          Biometric Health Triggers
                        </TextEffect>
                      </div>
                      <div className="space-y-md">
                        <div className="flex gap-md glass-card p-md rounded-lg border-l-4 border-primary shadow-sm">
                          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0 text-on-secondary-fixed">
                            <span className="material-symbols-outlined">support_agent</span>
                          </div>
                          <div>
                            <p className="font-label-md text-xs text-on-surface font-bold">Clinical Guidance</p>
                            <p className="text-xs text-on-surface-variant mt-1">
                            Your recovery index is at <strong className="text-primary">{((profile?.recovery_score || 0.5) * 100).toFixed(0)}%</strong>. {(profile?.recovery_score || 0.5) > 0.6 ? 'Perfect state for muscular overload. Keep pushing!' : 'Focus on active joint recovery.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-md text-xs text-secondary italic">
                      Adherence Probability: <strong className="text-primary">{((profile?.adherence_probability || 0.5) * 100).toFixed(0)}%</strong>
                    </div>
                  </div>

                  {/* Workout Streak Visualizer */}
                  <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between">
                    <div>
                      <TextEffect as="h3" per="word" preset="slide" className="font-headline-md text-lg text-on-surface mb-md">
                        Active Indicators
                      </TextEffect>
                      <div className="grid grid-cols-3 gap-sm">
                        <div className="bg-surface-container-low p-md rounded-xl text-center">
                          <span className="text-xs text-secondary block">Recovery</span>
                          <span className="font-bold text-primary block mt-1">{((profile?.recovery_score || 0.5) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="bg-surface-container-low p-md rounded-xl text-center">
                          <span className="text-xs text-secondary block">Complexity</span>
                          <span className="font-bold text-primary block mt-1 uppercase text-xs">{profile?.coaching_complexity}</span>
                        </div>
                        <div className="bg-surface-container-low p-md rounded-xl text-center">
                          <span className="text-xs text-secondary block">Stress</span>
                          <span className="font-bold text-primary block mt-1 uppercase text-xs">{profile?.stress_level}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab('workouts')}
                      className="mt-md text-xs text-primary font-bold hover:underline flex items-center gap-xs"
                    >
                      <span>View details of your {workoutPlan?.split || 'Custom'} split</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Link Coach Card (Only visible if no coach assigned) */}
              {!user.assigned_coach_id && (
                <div className="bg-primary-container/20 rounded-xl p-lg shadow-sm border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-md mb-lg">
                  <div>
                    <h3 className="font-headline-md text-lg text-primary font-extrabold flex items-center gap-sm">
                      <span className="material-symbols-outlined">person_add</span>
                      Link to a Professional Coach
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-1">Have a Coach Invite Code? Link your account to sync your profile directly with their dashboard.</p>
                  </div>
                  <form onSubmit={handleLinkCoach} className="flex gap-sm w-full md:w-auto">
                    <input 
                      type="text" 
                      placeholder="Enter 6-digit Code" 
                      className="glass-card border border-primary/30 rounded-lg px-md py-sm focus:ring-2 focus:ring-primary uppercase flex-1 max-w-[200px]"
                      value={linkCoachCode}
                      onChange={(e) => setLinkCoachCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      disabled={linkCoachLoading}
                    />
                    <button 
                      type="submit" 
                      className="bg-primary text-on-primary font-bold px-lg py-sm rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                      disabled={linkCoachLoading}
                    >
                      {linkCoachLoading ? 'Linking...' : 'Link'}
                    </button>
                  </form>
                  {linkCoachError && (
                    <div className="text-error text-xs font-bold w-full md:w-auto mt-2 md:mt-0">{linkCoachError}</div>
                  )}
                </div>
              )}

              {/* Weekly Analytics & Adherence Card */}
              <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/20 mb-lg">
                <div className="flex items-center gap-sm mb-lg">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  <h3 className="font-headline-md text-lg text-on-surface font-extrabold">Weekly Progress & Adherence Analytics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                  {/* Card 1: Workout Adherence */}
                  <div className="glass-card p-lg rounded-xl border border-outline-variant/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Workout Adherence</span>
                      <span className="text-2xl font-extrabold text-primary block mt-sm">{analytics.adherenceRate}%</span>
                    </div>
                    <div className="mt-md">
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${analytics.adherenceRate}%` }} />
                      </div>
                      <p className="text-[10px] text-secondary mt-2">Target: {workoutPlan?.frequency || 3} workouts/week</p>
                    </div>
                  </div>

                  {/* Card 2: Weight Trend */}
                  <div className="glass-card p-lg rounded-xl border border-outline-variant/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Weight Change</span>
                      <span className="text-2xl font-extrabold text-on-surface block mt-sm">
                        {analytics.currentWeight ? `${analytics.currentWeight.toFixed(1)} kg` : '--'}
                      </span>
                    </div>
                    <div className="mt-md flex items-center gap-xs">
                      {analytics.weightDiff !== 0 ? (
                        <>
                          <TrendingUp size={16} className={analytics.weightDiff > 0 ? 'text-rose-500 rotate-0' : 'text-teal-600 rotate-180'} />
                          <span className={`text-xs font-bold ${analytics.weightDiff > 0 ? 'text-rose-500' : 'text-teal-600'}`}>
                            {analytics.weightDiff > 0 ? `+${analytics.weightDiff.toFixed(1)} kg` : `${analytics.weightDiff.toFixed(1)} kg`}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-secondary font-bold">No change</span>
                      )}
                      <span className="text-[10px] text-secondary">vs. last log</span>
                    </div>
                  </div>

                  {/* Card 3: Wellness Indicator */}
                  <div className="glass-card p-lg rounded-xl border border-outline-variant/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Wellness Index (Avg)</span>
                      <div className="flex gap-md mt-sm">
                        <div>
                          <span className="text-[10px] text-secondary block">Energy</span>
                          <span className="text-lg font-bold text-primary">{analytics.avgEnergy}/10</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-secondary block">Mood</span>
                          <span className="text-lg font-bold text-primary">{analytics.avgMood}/10</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-secondary mt-md">Averaged over recent logs</p>
                  </div>

                  {/* Card 4: AI Progress Insight */}
                  <div className="glass-card p-lg rounded-xl border border-outline-variant/10 md:col-span-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-xs">
                        <Sparkles size={12} />
                        <span>AI Progress Synthesis</span>
                      </span>
                      <p className="text-[11px] text-on-surface-variant italic mt-sm leading-relaxed line-clamp-3 hover:line-clamp-none transition-all font-semibold">
                        "{analytics.aiInsight}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Bento Area: Logger Form & Live Assistant */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                
                {/* Daily Progress / Log Workout CTA */}
                <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center hover:border-primary/40 transition-colors duration-300">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-md">
                    <Dumbbell size={32} />
                  </div>
                  <TextEffect as="h3" per="word" preset="slide" className="font-headline-md text-xl text-on-surface font-extrabold mb-xs">
                    Ready to train?
                  </TextEffect>
                  <p className="text-secondary text-sm mb-lg">Complete your session and log your physical progress all in one place.</p>
                  <button 
                    onClick={() => setActiveTab('workouts')}
                    className="bg-primary text-on-primary font-bold px-xl py-md rounded-xl hover:bg-primary/90 transition-all shadow-md text-sm w-full sm:w-auto"
                  >
                    Start & Log Workout
                  </button>
                </div>

                {/* Log Meal CTA */}
                <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center hover:border-primary/40 transition-colors duration-300">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-md">
                    <span className="material-symbols-outlined text-[32px]">restaurant</span>
                  </div>
                  <TextEffect as="h3" per="word" preset="slide" className="font-headline-md text-xl text-on-surface font-extrabold mb-xs">
                    Fuel your progress
                  </TextEffect>
                  <p className="text-secondary text-sm mb-lg">Track your meals, macros, and water intake to stay on target.</p>
                  <button 
                    onClick={() => setActiveTab('nutrition')}
                    className="bg-primary text-on-primary font-bold px-xl py-md rounded-xl hover:bg-primary/90 transition-all shadow-md text-sm w-full sm:w-auto"
                  >
                    Log Meal & Macros
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB: AI CHAT (Full Page) */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[calc(100vh-120px)]">
              <div className="glass-card rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col flex-1 overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center gap-sm px-lg py-md border-b border-outline-variant/20 bg-surface-container-lowest">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">smart_toy</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-on-surface font-bold text-base">Fitness Buddy AI</h3>
                    <p className="text-primary text-xs font-semibold animate-pulse">Online — Ask me about food, fitness & health</p>
                  </div>
                  <button
                    onClick={() => {
                      setChatMessages([{ sender: 'assistant', text: 'Hello! I\'m your Fitness Buddy assistant. Ask me about food swaps, workout tips, managing social events, or anything related to your fitness and nutrition plan!' }]);
                    }}
                    className="text-secondary hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10"
                    title="Clear chat"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-lg space-y-md bg-surface-container-lowest/50">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-sm ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
                        </div>
                      )}
                      <div className={`p-md rounded-2xl max-w-[75%] text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-primary text-on-primary rounded-br-sm'
                          : 'glass-card border border-outline-variant/20 text-on-surface rounded-bl-sm'
                      }`}>
                        {msg.sender === 'assistant' ? (
                          <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-primary [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-sm items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-[18px] animate-spin">progress_activity</span>
                      </div>
                      <div className="glass-card border border-outline-variant/20 text-secondary px-md py-sm rounded-2xl rounded-bl-sm text-sm italic shadow-sm">
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-xs px-lg py-sm border-t border-outline-variant/20 bg-surface-container-lowest">
                  {['Swap 100g chicken breast', 'What to eat at a dawat?', 'PCOS exercise tips', 'Post-workout meal ideas', 'How to hit my protein goal?'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSendMessage(s)}
                      className="text-xs bg-surface-container-low hover:bg-surface-container-high text-primary border border-outline-variant/30 rounded-full px-3 py-1.5 font-semibold transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-sm px-lg py-md border-t border-outline-variant/20 glass-card">
                  <textarea
                    rows={1}
                    className="flex-grow bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-md py-sm text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary resize-none custom-scrollbar"
                    placeholder="Ask about food swaps, workouts, nutrition..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary px-lg py-sm rounded-xl font-bold text-sm transition-all flex items-center gap-xs shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2.5: EXERCISES LIBRARY */}
          {activeTab === 'exercises' && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] w-full mt-0">
              <ExercisesPage user={user} />
            </div>
          )}

          {/* TAB 4: COMMUNITY PAGE */}
          {activeTab === 'community' && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] w-full mt-0">
              <CommunityPage 
                user={user} 
                workoutPlan={workoutPlan}
                checkinHistory={checkinHistory}
              />
            </div>
          )}

          {/* TAB 5: PROFILE PAGE */}
          {activeTab === 'profile' && (
            <div className="w-full">
              <ProfilePage 
                user={user} 
                checkinHistory={checkinHistory} 
                onUserUpdate={onUpdateUser}
              />
            </div>
          )}

          {/* TAB 2: WORKOUT PLAN */}
          {activeTab === 'workouts' && (
            <div className="w-full">
              {activeWorkoutDay ? (
                <WorkoutPlayer 
                  activeWorkoutDay={activeWorkoutDay}
                  setActiveWorkoutDay={setActiveWorkoutDay}
                  workoutPlan={workoutPlan}
                  getExercises={getExercises}
                  user={user}
                  profile={profile}
                  checkinHistory={checkinHistory}
                  onComplete={(dayName) => {
                    loadCheckinHistory();
                    if (dayName) markWorkoutDayCompleted(dayName);
                  }}
                />
              ) : (
                /* REGULAR WORKOUTS PAGE VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg animate-in fade-in duration-500">
                  {/* Left Column: Exercises checklist */}
                  <div className="lg:col-span-8 space-y-md">
                    {workoutPlan?.generated_by === 'AI' && (
                      <div className="bg-primary-container/10 border border-primary/20 p-md rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mb-md">
                        <div className="flex items-center gap-sm">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-primary uppercase tracking-wider">AI Custom Protocol Active</h5>
                            <p className="text-xs text-on-surface-variant mt-0.5">Your workout split has been customized by AI. You can revert to your coach's default plan anytime.</p>
                          </div>
                        </div>
                        <button
                          onClick={handleRevertPlan}
                          className="px-md py-sm bg-primary text-on-primary hover:opacity-90 rounded-lg text-xs font-bold transition-all flex items-center gap-xs self-start sm:self-auto shadow-sm"
                        >
                          <RefreshCw size={12} />
                          <span>Revert to Coach Plan</span>
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-surface-container-low p-md rounded-xl border border-outline-variant/10">
                      <div>
                        <span className="font-label-md text-primary uppercase text-[10px] tracking-widest font-bold">Active Protocol</span>
                        <div className="flex flex-wrap items-center gap-md mt-0.5">
                          <h4 className="font-headline-md text-headline-md text-on-surface font-extrabold">{workoutPlan?.split || 'Custom Split'}</h4>
                          <button
                            onClick={() => {
                              setSelectedSplitKey('FULL_BODY_3DAY');
                              setShowChangeSplitModal(true);
                            }}
                            className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-xs border border-primary/20 hover:scale-105"
                          >
                            <RefreshCw size={12} />
                            <span>Change Split</span>
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-secondary">Weekly Target</p>
                        <p className="font-bold text-primary">{workoutPlan?.frequency || 3} Sessions</p>
                      </div>
                    </div>

                    {workoutPlan ? (
                      <div className="space-y-lg">
                        {Object.entries(
                          getExercises().reduce((acc, ex) => {
                            const day = ex.day || 'Monday';
                            if (!acc[day]) acc[day] = [];
                            acc[day].push(ex);
                            return acc;
                          }, {})
                        ).sort(([dayA], [dayB]) => {
                          const weekOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                          const idxA = weekOrder.indexOf(dayA);
                          const idxB = weekOrder.indexOf(dayB);
                          return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
                        }).map(([dayName, dayExercises]) => (
                          <div key={dayName} className="space-y-sm glass-card p-lg rounded-xl border border-outline-variant/15 shadow-sm">
                            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-xs mb-sm">
                              <div>
                                <h4 className="font-bold text-xs text-primary uppercase tracking-widest">{dayName}</h4>
                                <p className="text-[10px] font-bold text-secondary uppercase mt-0.5 tracking-wider">
                                  Vol: {calculateTotalVolume(dayExercises).toLocaleString()} kg
                                </p>
                              </div>
                              {completedWorkoutDays.includes(dayName) ? (
                                <div className="flex items-center gap-sm">
                                  <span className="text-teal-500 text-[11px] font-bold flex items-center gap-xs">
                                    <Check size={14} /> Completed Today
                                  </span>
                                  <button
                                    onClick={(e) => handleShareWorkout(dayName, e)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-xs shadow-sm ml-2"
                                  >
                                    <Share2 size={10} /> Share to Feed
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveWorkoutDay(dayName);
                                    setWorkoutStepIndex(0);
                                    setCompletedSets({});
                                    setIsResting(false);
                                    setRestSecondsLeft(null);
                                    setShowQuitConfirm(false);
                                  }}
                                  className="bg-primary hover:bg-primary/95 text-on-primary px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-xs shadow-sm hover:scale-[1.02]"
                                >
                                  <Dumbbell size={12} />
                                  <span>Initiate Workout</span>
                                </button>
                              )}
                            </div>
                            <div className="space-y-sm">
                              {dayExercises.map((ex) => {
                                const originalIdx = getExercises().findIndex(
                                  e => e.name === ex.name && e.day === ex.day && e.notes === ex.notes
                                );
                                const isCompleted = !!completedExercises[originalIdx];
                                const hasKneeAlert = ex.name.toLowerCase().includes('deadlift') || ex.name.toLowerCase().includes('squat');
                                return (
                                  <div key={originalIdx} className="glass-card p-md rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex items-start gap-md">
                                    <button
                                      type="button"
                                      onClick={() => toggleExercise(originalIdx)}
                                      className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${isCompleted ? 'bg-primary border-primary text-on-primary' : 'border-outline text-transparent'}`}
                                    >
                                      <Check size={14} />
                                    </button>
                                    
                                    <div className="flex-grow space-y-sm">
                                      <div className="flex justify-between items-start gap-sm">
                                        <div 
                                          className="cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => setPreviewExercise(ex.name)}
                                        >
                                          <h5 className={`font-bold text-sm ${isCompleted ? 'line-through text-secondary' : 'text-on-surface'}`}>{ex.name}</h5>
                                          <p className="text-xs text-secondary mt-0.5">{ex.sets} Sets x {ex.reps} reps</p>
                                          {hasKneeAlert && (
                                            <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-xs mt-1 w-max">
                                              <AlertTriangle size={10} />
                                              <span>KNEE LONGEVITY TIP</span>
                                            </span>
                                          )}
                                        </div>
                                        <div 
                                          className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                          onClick={() => setPreviewExercise(ex.name)}
                                        >
                                          <div className="w-16 h-16 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-center overflow-hidden pointer-events-none">
                                            <img 
                                              src={getExerciseImage(ex)} 
                                              alt={ex.name}
                                              className="w-full h-full object-cover opacity-90"
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'block';
                                              }}
                                            />
                                            <span className="material-symbols-outlined text-outline" style={{display: 'none'}}>fitness_center</span>
                                          </div>
                                        </div>
                                      </div>
                                      {ex.notes && (
                                        <p className="text-xs text-on-surface-variant glass-card p-sm rounded-lg border-l-2 border-primary/40 italic shadow-sm">
                                          "{ex.notes}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-secondary text-sm">No exercises generated.</p>
                    )}
                  </div>

                  {/* Right Column: Overload strategy */}
                  <div className="lg:col-span-4 space-y-lg">
                    <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/20">
                      <h3 className="font-headline-md text-sm text-on-surface mb-md font-bold uppercase tracking-wider">Overload Strategy</h3>
                      <div className="bg-surface-container p-md rounded-lg space-y-sm">
                        <span className="text-[10px] text-secondary font-bold block uppercase">Progression Scheme</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {workoutPlan?.progression_scheme || 'Double progression rules apply. Keep notes of your logs.'}
                        </p>
                      </div>
                      <div className="mt-md bg-amber-50 border border-amber-200 text-amber-900 p-md rounded-lg text-xs leading-relaxed">
                        <strong>Injury prevention checklist:</strong> Check joint angles, keep reps controlled, and consult your coach on deep plateau phases.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIET PLAN */}
          {activeTab === 'nutrition' && (
            <div className="animate-in fade-in duration-500">
              {/* Header & Daily Summary */}
              <header className="mb-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                  <div>
                    <h2 className="font-headline-xl text-headline-xl text-on-background tracking-tight">Your Daily Nutrition</h2>
                    <p className="font-body-md text-body-md text-secondary">
                      Fueling your progress for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}.
                    </p>
                  </div>
                  <div 
                    onClick={() => setActiveTab('assistant')}
                    className="flex items-center gap-sm bg-surface-container-high p-xs pr-md rounded-full shadow-sm cursor-pointer hover:bg-surface-container transition-colors"
                  >
                    <div className="bg-primary p-xs rounded-full text-on-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">psychology</span>
                    </div>
                    <span className="font-label-md text-xs font-bold text-primary">Need macro advice? Ask AI in chat →</span>
                  </div>
                </div>

                {/* Macro Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/30 flex items-center justify-between md:justify-start gap-lg bento-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-20 h-20">
                        <circle className="text-surface-container stroke-current" cx="40" cy="40" fill="transparent" r="32" strokeWidth="8"></circle>
                        <circle className="text-primary stroke-current progress-ring-circle transform -rotate-90 origin-center transition-all duration-500" cx="40" cy="40" fill="transparent" r="32" strokeLinecap="round" strokeWidth="8" style={{ strokeDasharray: 201, strokeDashoffset: circleOffset }}></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-bold text-lg text-primary">{Math.round(caloriePct)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface-variant font-bold text-xs uppercase tracking-wider">Calories</p>
                      <p className="font-headline-md text-primary mt-1">
                        {loggedCalories} <span className="text-[12px] font-normal text-secondary">/ {targetCalories}</span>
                      </p>
                      <p className="text-[10px] text-secondary mt-1 font-bold">
                        {Math.max(0, targetCalories - loggedCalories)} REMAINING
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/30 bento-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-sm">
                      <span className="font-label-md text-on-surface-variant font-bold text-xs uppercase tracking-wider">Protein</span>
                      <span className="bg-primary/10 text-primary text-[10px] px-2.5 py-0.5 rounded-full font-bold">TARGET: {nutritionPlan?.protein || 140}g</span>
                    </div>
                    <p className="font-headline-md text-on-background mb-md">
                      {loggedProtein}g <span className="text-[10px] text-secondary font-normal ml-1">({Math.max(0, (nutritionPlan?.protein || 140) - loggedProtein)}g left)</span>
                    </p>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (loggedProtein / (nutritionPlan?.protein || 140)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/30 bento-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-sm">
                      <span className="font-label-md text-on-surface-variant font-bold text-xs uppercase tracking-wider">Carbs</span>
                      <span className="bg-primary/10 text-primary text-[10px] px-2.5 py-0.5 rounded-full font-bold">TARGET: {nutritionPlan?.carbs || 200}g</span>
                    </div>
                    <p className="font-headline-md text-on-background mb-md">
                      {loggedCarbs}g <span className="text-[10px] text-secondary font-normal ml-1">({Math.max(0, (nutritionPlan?.carbs || 200) - loggedCarbs)}g left)</span>
                    </p>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-tertiary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (loggedCarbs / (nutritionPlan?.carbs || 200)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/30 bento-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-sm">
                      <span className="font-label-md text-on-surface-variant font-bold text-xs uppercase tracking-wider">Fats</span>
                      <span className="bg-primary/10 text-primary text-[10px] px-2.5 py-0.5 rounded-full font-bold">TARGET: {nutritionPlan?.fats || 70}g</span>
                    </div>
                    <p className="font-headline-md text-on-background mb-md">
                      {loggedFats}g <span className="text-[10px] text-secondary font-normal ml-1">({Math.max(0, (nutritionPlan?.fats || 70) - loggedFats)}g left)</span>
                    </p>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (loggedFats / (nutritionPlan?.fats || 70)) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
                {/* Meal Schedule (2 Cols) */}
                <div className="lg:col-span-2 space-y-lg">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
                    <h3 className="font-headline-md text-xl tracking-tight text-on-background">Meal Schedule</h3>
                    <div className="flex gap-xs bg-surface-container p-1 rounded-xl items-center">
                      <button 
                        onClick={() => setDietContext('TRADITIONAL')}
                        className={`px-sm py-1.5 rounded-lg text-xs font-bold transition-all ${dietContext === 'TRADITIONAL' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Traditional
                      </button>
                      <button 
                        onClick={() => setDietContext('STANDARD')}
                        className={`px-sm py-1.5 rounded-lg text-xs font-bold transition-all ${dietContext === 'STANDARD' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Standard Swaps
                      </button>
                      <div className="w-px h-4 bg-outline-variant/30 mx-1"></div>
                      <button 
                        onClick={handleRegenerateDiet}
                        disabled={isRegeneratingDiet}
                        className="px-sm py-1.5 rounded-lg text-xs font-bold transition-all text-tertiary hover:bg-tertiary/10 flex items-center gap-1 disabled:opacity-50"
                        title="Generate a new AI diet plan based on your current profile"
                      >
                        <RefreshCw size={12} className={isRegeneratingDiet ? 'animate-spin' : ''} />
                        {isRegeneratingDiet ? 'Regenerating...' : 'Regenerate Diet'}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Meals */}
                  {nutritionPlan ? (
                    <div className="space-y-md">
                      {getMealTemplates().map((m, idx) => (
                        <div key={idx} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                          <div className="bg-surface-container-low px-lg py-md flex justify-between items-center border-b border-outline-variant/20">
                            <div className="flex items-center gap-sm">
                              <span className="material-symbols-outlined text-primary text-[20px]">
                                {idx === 0 ? 'wb_sunny' : idx === 1 ? 'light_mode' : idx === 2 ? 'dark_mode' : 'restaurant'}
                              </span>
                              <span className="font-bold text-on-surface uppercase text-sm tracking-widest">{m.meal}</span>
                            </div>
                            <span className="text-primary font-bold text-xs bg-primary/10 px-3 py-1 rounded-full">{m.target_macro_estimate}</span>
                          </div>
                          <div className="p-md md:p-lg grid grid-cols-1 md:grid-cols-2 gap-md md:gap-lg glass-card">
                            {m.options.map((opt, oIdx) => {
                              const isSelected = selectedMealOptions[idx] === oIdx || (selectedMealOptions[idx] === undefined && oIdx === 0);
                              return (
                                <div 
                                  key={oIdx} 
                                  onClick={() => setSelectedMealOptions(prev => ({ ...prev, [idx]: oIdx }))}
                                  className={`p-md rounded-xl cursor-pointer transition-colors ${isSelected ? 'border-2 border-primary bg-primary/5 hover:bg-primary/10' : 'border border-outline-variant/50 hover:border-primary/30 bg-surface-bright'}`}
                                >
                                  <div className="flex justify-between items-start mb-sm">
                                    <span className={`${isSelected ? 'bg-primary text-on-primary' : 'bg-secondary/20 text-secondary'} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider`}>Option {String.fromCharCode(65 + oIdx)}</span>
                                    {isSelected && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                                  </div>
                                  <h4 className="font-bold text-on-surface mb-xs text-sm leading-tight">{translateOption(opt)}</h4>
                                  <p className="text-[11px] text-secondary leading-relaxed">Balanced macro choice matching your targets for this meal.</p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="bg-surface-container-low px-lg py-sm border-t border-outline-variant/20 flex justify-end">
                             {loggedMeals[idx] ? (
                               <div className="flex items-center gap-md">
                                 <span className="text-primary font-bold text-xs flex items-center gap-xs">
                                   <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                   Logged
                                 </span>
                                 <button
                                   onClick={() => {
                                      const proMatch = m.target_macro_estimate.match(/Protein:.*?(\d+)g/i);
                                      const carbMatch = m.target_macro_estimate.match(/Carbs:.*?(\d+)g/i);
                                      const fatMatch = m.target_macro_estimate.match(/Fats:.*?(\d+)g/i);
                                      const p = proMatch ? parseInt(proMatch[1]) : 0;
                                      const c = carbMatch ? parseInt(carbMatch[1]) : 0;
                                      const f = fatMatch ? parseInt(fatMatch[1]) : 0;
                                      const mealCals = (p * 4) + (c * 4) + (f * 9) || 400;

                                      const loggedP = loggedMeals[idx]?.p ?? p;
                                      const loggedC = loggedMeals[idx]?.c ?? c;
                                      const loggedF = loggedMeals[idx]?.f ?? f;
                                      const loggedCals = loggedMeals[idx]?.cals ?? mealCals;

                                      setCaloriesLogged(prev => Math.max(0, (parseInt(prev) || 0) - loggedCals).toString());
                                      setLoggedProtein(prev => Math.max(0, prev - loggedP));
                                      setLoggedCarbs(prev => Math.max(0, prev - loggedC));
                                      setLoggedFats(prev => Math.max(0, prev - loggedF));
                                      setLoggedMeals(prev => ({...prev, [idx]: false}));
                                   }}
                                   className="text-xs text-secondary hover:text-error transition-colors flex items-center gap-1 font-semibold"
                                 >
                                   <span className="material-symbols-outlined text-[14px]">undo</span> Undo
                                 </button>
                               </div>
                             ) : (
                               <button
                                 onClick={() => {
                                    const proMatch = m.target_macro_estimate.match(/Protein:.*?(\d+)g/i);
                                    const carbMatch = m.target_macro_estimate.match(/Carbs:.*?(\d+)g/i);
                                    const fatMatch = m.target_macro_estimate.match(/Fats:.*?(\d+)g/i);
                                    const p = proMatch ? parseInt(proMatch[1]) : 0;
                                    const c = carbMatch ? parseInt(carbMatch[1]) : 0;
                                    const f = fatMatch ? parseInt(fatMatch[1]) : 0;
                                    const mealCals = (p * 4) + (c * 4) + (f * 9) || 400;

                                      setEditMacros({ p, c, f, cals: mealCals });
                                      setBaseMacros({ p, c, f, cals: mealCals });
                                      setEditPortion(1.0);
                                      setEditingMealIdx(idx);
                                 }}
                                 className="px-md py-xs rounded-lg font-bold text-xs flex items-center gap-xs transition-colors bg-primary text-on-primary hover:bg-primary/90"
                               >
                                 <span className="material-symbols-outlined text-[14px]">add</span>
                                 Log Meal
                               </button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl text-center">
                      <p className="text-secondary text-sm">No diet plan active. Check back when your coach assigns one.</p>
                    </div>
                  )}

                  {/* Cultural Swaps Widget */}
                  <div className="bg-primary p-lg rounded-2xl text-on-primary relative overflow-hidden shadow-md mt-xl">
                    <div className="relative z-10">
                      <div className="flex items-center gap-sm mb-md">
                        <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
                        <h3 className="font-headline-md text-lg tracking-tight">Cultural Swaps Widget</h3>
                      </div>
                      <p className="font-body-md mb-lg text-sm opacity-90 max-w-md">Maintain your heritage without compromising your health. Swap these common ingredients today.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div className="glass-card/10 backdrop-blur-md p-md rounded-xl flex items-center justify-between border border-white/20">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-primary-fixed opacity-90 tracking-wider">Instead of</span>
                            <span className="font-bold text-sm mt-0.5">White Basmati Rice</span>
                          </div>
                          <span className="material-symbols-outlined opacity-70">arrow_forward</span>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] uppercase font-bold text-primary-fixed opacity-90 tracking-wider">Try</span>
                            <span className="font-bold text-sm mt-0.5">Cauliflower Rice</span>
                          </div>
                        </div>
                        <div className="glass-card/10 backdrop-blur-md p-md rounded-xl flex items-center justify-between border border-white/20">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-primary-fixed opacity-90 tracking-wider">Instead of</span>
                            <span className="font-bold text-sm mt-0.5">Full Fat Buffalo Milk</span>
                          </div>
                          <span className="material-symbols-outlined opacity-70">arrow_forward</span>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] uppercase font-bold text-primary-fixed opacity-90 tracking-wider">Try</span>
                            <span className="font-bold text-sm mt-0.5">Skimmed or Soy Milk</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 glass-card/20 rounded-full blur-3xl"></div>
                  </div>
                </div>

                {/* Sidebar Widgets (1 Col) */}
                <div className="space-y-lg">
                  {/* AI Interaction */}
                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="bg-surface-container-high p-md flex items-center gap-sm text-on-surface">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">
                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                      </div>
                      <span className="font-bold text-sm tracking-wide">Ask Nutrition AI</span>
                    </div>
                    <div className="p-md space-y-md">
                      <div className="bg-surface-container p-md rounded-xl border border-primary/10">
                        <p className="text-xs italic text-on-surface-variant leading-relaxed">"Describe your meal with as much detail as possible (including cooking methods like 'fried' or 'grilled', and portion sizes like 'cups' or 'grams'). I'll estimate the exact macros so you can log them instantly."</p>
                      </div>
                      <form onSubmit={handleEstimateMacros} className="relative">
                        <input
                          type="text"
                          value={foodQuery}
                          onChange={(e) => setFoodQuery(e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-md py-sm pr-10 focus:ring-1 focus:ring-primary focus:border-primary text-xs shadow-sm transition-all"
                          placeholder="e.g. 150g chicken breast pan-fried in 1 tbsp olive oil with 1 cup cooked rice..."
                          required
                        />
                        <button type="submit" disabled={calcLoading} className="absolute right-2 top-1.5 p-1 text-primary disabled:opacity-50 hover:bg-primary/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[18px]">{calcLoading ? 'hourglass_empty' : 'send'}</span>
                        </button>
                      </form>

                      {calcError && <div className="bg-error-container text-on-error-container p-sm rounded-lg text-[11px] font-semibold flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">error</span>{calcError}</div>}
                      {calcLoggedMsg && <div className="bg-teal-50 border border-teal-200 text-teal-800 p-sm rounded-lg text-[11px] font-semibold flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">check_circle</span>{calcLoggedMsg}</div>}

                      {calcResult && (
                        <div className="bg-surface-bright border border-outline-variant/20 rounded-xl p-md space-y-md text-xs mt-md shadow-sm">
                          <div className="grid grid-cols-4 gap-xs text-center">
                            <div className="glass-card py-sm px-1 rounded-lg border border-outline-variant/10 shadow-sm">
                              <span className="text-[9px] text-secondary block font-bold tracking-wider mb-1">CAL</span>
                              <span className="font-extrabold text-primary text-sm">{calcResult.calories}</span>
                            </div>
                            <div className="glass-card py-sm px-1 rounded-lg border border-outline-variant/10 shadow-sm">
                              <span className="text-[9px] text-secondary block font-bold tracking-wider mb-1">PRO</span>
                              <span className="font-extrabold text-primary text-sm">{calcResult.protein}g</span>
                            </div>
                            <div className="glass-card py-sm px-1 rounded-lg border border-outline-variant/10 shadow-sm">
                              <span className="text-[9px] text-secondary block font-bold tracking-wider mb-1">CARB</span>
                              <span className="font-extrabold text-primary text-sm">{calcResult.carbs}g</span>
                            </div>
                            <div className="glass-card py-sm px-1 rounded-lg border border-outline-variant/10 shadow-sm">
                              <span className="text-[9px] text-secondary block font-bold tracking-wider mb-1">FAT</span>
                              <span className="font-extrabold text-primary text-sm">{calcResult.fats}g</span>
                            </div>
                          </div>
                          
                          {calcResult.breakdown && (
                            <div className="glass-card p-sm rounded-lg border border-outline-variant/10 text-[10px] leading-relaxed text-secondary italic shadow-sm">
                              <strong>AI Breakdown:</strong> {calcResult.breakdown}
                            </div>
                          )}

                          <button
                            onClick={handleLogCalcCalories}
                            className="w-full bg-primary text-on-primary py-sm rounded-lg font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-xs shadow-md"
                          >
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                            Log {calcResult.calories} kcal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dawat Survival Guide */}
                  <div className="bg-tertiary-fixed p-lg rounded-2xl border border-tertiary-container/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-sm mb-md text-on-tertiary-fixed">
                      <span className="material-symbols-outlined text-[20px]">celebration</span>
                      <h4 className="font-bold text-sm tracking-wide">Dawat Survival Guide</h4>
                    </div>
                    <p className="text-xs text-on-tertiary-fixed-variant mb-md font-medium">Attending a wedding tonight? Here's how to manage:</p>
                    <ul className="space-y-sm">
                      <li className="flex items-start gap-sm">
                        <div className="w-5 h-5 rounded-full bg-on-tertiary-fixed/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="material-symbols-outlined text-[12px] text-on-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
                        </div>
                        <p className="text-[11px] text-on-tertiary-fixed-variant leading-relaxed">Pre-load on protein 2 hours before leaving to avoid overeating.</p>
                      </li>
                      <li className="flex items-start gap-sm">
                        <div className="w-5 h-5 rounded-full bg-on-tertiary-fixed/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="material-symbols-outlined text-[12px] text-on-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
                        </div>
                        <p className="text-[11px] text-on-tertiary-fixed-variant leading-relaxed">Stick to kebabs & dry meats; avoid heavy cream gravies.</p>
                      </li>
                      <li className="flex items-start gap-sm">
                        <div className="w-5 h-5 rounded-full bg-on-tertiary-fixed/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="material-symbols-outlined text-[12px] text-on-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
                        </div>
                        <p className="text-[11px] text-on-tertiary-fixed-variant leading-relaxed">Limit desserts to exactly 2 small bites.</p>
                      </li>
                    </ul>
                  </div>

                  {/* Hydration Tracker */}
                  <div className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="flex justify-between items-center mb-md">
                      <h4 className="font-bold text-on-surface text-sm">Hydration</h4>
                      <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded-full">{(waterGlasses * 0.25).toFixed(1)}L / 3.5L</span>
                    </div>
                    <div className="flex gap-[2px] mb-lg flex-wrap">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className={`flex-grow h-2.5 rounded-full transition-all ${i < waterGlasses ? 'bg-primary' : 'bg-surface-container'}`}></div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setWaterGlasses(prev => Math.min(14, prev + 1))}
                      className="w-full py-sm border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-sm text-on-surface-variant hover:bg-surface-container hover:text-primary hover:border-primary/50 transition-all text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-[16px]">water_drop</span>
                      <span>Log 250ml Glass</span>
                    </button>
                  </div>

                  {/* Traditional Ingredient Insight */}
                  <div className="rounded-2xl overflow-hidden relative h-48 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-lg text-white">
                      <span className="bg-primary-fixed text-on-primary-fixed text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mb-sm">Insight</span>
                      <h5 className="font-bold text-sm mb-xs">Spices for Metabolism</h5>
                      <p className="text-[11px] opacity-90 leading-relaxed font-medium">Did you know Turmeric (Haldi) combined with black pepper increases absorption by 2000%?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROGRESS ANALYTICS HISTORY */}
          {activeTab === 'progress' && (
            <div className="space-y-lg">
              
              {/* Performance Curve Chart */}
              <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-lg gap-md">
                  <h3 className="font-headline-md text-lg text-on-surface">Performance Curve</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-sm">
                    {/* Metric Toggle */}
                    <div className="flex gap-xs bg-surface-container p-1 rounded-xl">
                      <button 
                        onClick={() => setChartMetric('body')} 
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartMetric === 'body' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Body Metrics
                      </button>
                      <button 
                        onClick={() => setChartMetric('performance')} 
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartMetric === 'performance' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Performance
                      </button>
                    </div>

                    {/* Time Range Toggle */}
                    <div className="flex gap-xs bg-surface-container p-1 rounded-xl">
                      <button 
                        onClick={() => setChartTimeRange('weekly')} 
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartTimeRange === 'weekly' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Weekly
                      </button>
                      <button 
                        onClick={() => setChartTimeRange('monthly')} 
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartTimeRange === 'monthly' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Monthly
                      </button>
                      <button 
                        onClick={() => setChartTimeRange('annual')} 
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${chartTimeRange === 'annual' ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Annual
                      </button>
                    </div>
                  </div>
                </div>

                {checkinHistory.length > 0 ? (
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(() => {
                          const now = new Date();
                          const cutoff = new Date();
                          if (chartTimeRange === 'weekly') cutoff.setDate(now.getDate() - 7);
                          else if (chartTimeRange === 'monthly') cutoff.setMonth(now.getMonth() - 1);
                          else if (chartTimeRange === 'annual') cutoff.setFullYear(now.getFullYear() - 1);
                          
                          return checkinHistory
                            .filter(log => new Date(log.log_date) >= cutoff)
                            .sort((a, b) => new Date(a.log_date) - new Date(b.log_date))
                            .map(log => {
                              const base = {
                                date: new Date(log.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                              };
                              if (chartMetric === 'body') {
                                return {
                                  ...base,
                                  Weight: log.weight,
                                  Calories: log.calories_logged || null
                                };
                              } else {
                                // Mock volume calculation consistent with ProfilePage until DB schema is updated
                                const mockVolume = (log.energy_score || 7) * (log.weight || 70) * 15; 
                                return {
                                  ...base,
                                  Volume: mockVolume,
                                  'Workouts Done': log.workouts_completed || (log.workout_completed ? 1 : 0)
                                };
                              }
                            });
                        })()}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dx={-10} domain={['auto', 'auto']} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dx={10} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {chartMetric === 'body' ? (
                          <>
                            <Line yAxisId="left" type="monotone" dataKey="Weight" stroke="#00B88C" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Line yAxisId="right" type="monotone" dataKey="Calories" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                          </>
                        ) : (
                          <>
                            <Line yAxisId="left" type="monotone" dataKey="Volume" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Line yAxisId="right" type="monotone" dataKey="Workouts Done" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-secondary text-sm text-center py-md glass-card rounded-xl border border-outline-variant/10">No progress entries logged yet. Track your weight or calories on the overview tab to see your curve!</p>
                )}
              </div>

              {/* Historical logs table */}
              <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/20">
                <h3 className="font-headline-md text-lg text-on-surface mb-md">Historical Check-in Logs</h3>
                {checkinHistory.length > 0 ? (
                  <div className="space-y-sm">
                    {checkinHistory.map((log) => (
                      <div key={log.id} className="p-md rounded-xl glass-card border border-outline-variant/20 text-xs">
                        <div className="flex justify-between border-b border-outline-variant/20 pb-sm mb-sm flex-wrap gap-xs">
                          <span className="font-bold text-on-surface">
                            {new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span>
                            Weight: <strong className="text-primary">{log.weight} kg</strong>
                            {log.waist_cm && <span> | Waist: <strong className="text-primary">{log.waist_cm} cm</strong></span>}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-sm text-[10px] text-on-surface-variant font-bold mb-sm">
                          <span className="flex items-center gap-1">
                            {log.workout_completed ? <Check size={12} className="text-primary" /> : <span className="w-3" />}
                            Workout: {log.workout_completed ? 'Yes' : 'No'}
                          </span>
                          <span>Calories: {log.calories_logged || '-'}</span>
                          <span>Energy: {log.energy_score}/10</span>
                          <span>Mood: {log.mood_score}/10</span>
                        </div>
                        {log.ai_insight && (
                          <div className="bg-primary/10 border-l-2 border-primary p-sm rounded text-primary italic">
                            <strong>AI Biometric Feedback:</strong> "{log.ai_insight}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-sm text-center">No logs found.</p>
                )}
              </div>

            </div>
          )}

          {/* TAB: BLOODWORK */}
          {activeTab === 'bloodwork' && (
            <BloodworkPage user={user} />
          )}


        </div>
      </main>

      {/* Exercise Video Preview Modal */}
      {previewExercise && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-md animate-in fade-in duration-200" onClick={() => setPreviewExercise(null)}>
          <div className="glass-card rounded-2xl p-lg max-w-md w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewExercise(null)} className="absolute top-md right-md text-on-surface-variant hover:text-on-surface transition-colors bg-surface-container-high rounded-full w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h3 className="text-lg font-bold text-on-surface mb-md pr-8">{previewExercise} Preview</h3>
            <div className="w-full h-64 bg-surface-container-lowest rounded-xl flex items-center justify-center relative border border-outline-variant/20 overflow-hidden">
              <img 
                src={getExerciseImage(previewExercise)} 
                alt={previewExercise}
                className="w-full h-full object-contain dark:mix-blend-screen dark:invert-0 invert mix-blend-multiply opacity-90"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'block';
                }}
              />
              <span className="material-symbols-outlined text-[64px] text-outline" style={{display: 'none'}}>fitness_center</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Macro Edit Modal */}
      {editingMealIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-md animate-in fade-in duration-200" onClick={() => setEditingMealIdx(null)}>
          <div className="glass-card rounded-2xl p-xl max-w-sm w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingMealIdx(null)} className="absolute top-md right-md text-on-surface-variant hover:text-on-surface transition-colors bg-surface-container-high rounded-full w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h3 className="text-lg font-bold text-on-surface mb-xs pr-8">Log Exact Macros</h3>
            <p className="text-xs text-secondary mb-md">Edit the quantities you consumed for this meal.</p>
            
            <div className="mb-sm glass-card p-sm rounded-lg border border-primary/20 bg-primary/5">
              <label className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                <span>Portion Size Multiplier</span>
                <span className="text-lg">{editPortion}x</span>
              </label>
              <div className="flex items-center gap-sm mt-2">
                <input 
                  type="range" 
                  min="0.25" 
                  max="3.0" 
                  step="0.25" 
                  value={editPortion} 
                  onChange={(e) => {
                    const portion = parseFloat(e.target.value) || 1;
                    setEditPortion(portion);
                    setEditMacros({
                      p: Math.round(baseMacros.p * portion),
                      c: Math.round(baseMacros.c * portion),
                      f: Math.round(baseMacros.f * portion),
                      cals: Math.round(baseMacros.cals * portion),
                    });
                  }}
                  className="w-full accent-primary"
                />
              </div>
              <p className="text-[10px] text-secondary mt-1">Adjust if you ate more or less than the recommended quantity.</p>
            </div>
            
            <div className="space-y-sm mb-lg">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">Protein (g)</label>
                <input 
                  type="number" 
                  value={editMacros.p} 
                  onChange={(e) => setEditMacros({...editMacros, p: parseInt(e.target.value) || 0})}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-sm text-on-surface text-sm w-full focus:border-primary transition-colors focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">Carbs (g)</label>
                <input 
                  type="number" 
                  value={editMacros.c} 
                  onChange={(e) => setEditMacros({...editMacros, c: parseInt(e.target.value) || 0})}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-sm text-on-surface text-sm w-full focus:border-primary transition-colors focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">Fats (g)</label>
                <input 
                  type="number" 
                  value={editMacros.f} 
                  onChange={(e) => setEditMacros({...editMacros, f: parseInt(e.target.value) || 0})}
                  className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-sm text-on-surface text-sm w-full focus:border-primary transition-colors focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">Calories</label>
                <div className="flex items-center gap-sm">
                  <input 
                    type="number" 
                    value={editMacros.cals} 
                    onChange={(e) => setEditMacros({...editMacros, cals: parseInt(e.target.value) || 0})}
                    className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-sm text-on-surface text-sm w-full focus:border-primary transition-colors focus:outline-none"
                  />
                  <button 
                    onClick={() => setEditMacros({...editMacros, cals: (editMacros.p * 4) + (editMacros.c * 4) + (editMacros.f * 9)})}
                    className="flex-shrink-0 bg-surface-container hover:bg-surface-container-high text-[10px] text-secondary font-bold px-2 py-1 rounded-md transition-colors border border-outline-variant/20"
                    title="Auto-calculate from macros"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setCaloriesLogged(prev => ((parseInt(prev) || 0) + editMacros.cals).toString());
                setLoggedProtein(prev => prev + editMacros.p);
                setLoggedCarbs(prev => prev + editMacros.c);
                setLoggedFats(prev => prev + editMacros.f);
                setLoggedMeals(prev => ({...prev, [editingMealIdx]: { p: editMacros.p, c: editMacros.c, f: editMacros.f, cals: editMacros.cals }}));
                setEditingMealIdx(null);
              }}
              className="w-full bg-primary text-on-primary font-bold py-md rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-xs shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">check</span> Save & Log
            </button>
          </div>
        </div>
      )}
      {/* Change Workout Split Modal */}
      {showChangeSplitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl max-w-2xl w-full p-lg md:p-xl shadow-2xl space-y-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-outline-variant/20 pb-md">
              <div>
                <h3 className="font-headline-md text-xl text-on-surface font-extrabold flex items-center gap-xs">
                  <Dumbbell className="text-primary" size={20} />
                  <span>Select Workout Split</span>
                </h3>
                <p className="text-xs text-secondary mt-1">
                  Choose a split that fits your schedule. Your workout routine will be updated while maintaining joint safety guidelines.
                </p>
              </div>
              <button
                onClick={() => setShowChangeSplitModal(false)}
                className="text-secondary hover:text-on-surface font-bold text-lg p-1 rounded-lg hover:bg-surface-container transition-colors"
              >
                ✕
              </button>
            </div>

            {changeSplitError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-md rounded-xl flex items-center gap-xs">
                <AlertTriangle size={14} />
                <span>{changeSplitError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-xs">
              {[
                {
                  key: 'FULL_BODY_3DAY',
                  title: 'Full Body Split',
                  tag: '3 Days/Week • Gym',
                  desc: 'High efficiency 3-day split hitting all major muscle groups each session with balanced recovery.'
                },
                {
                  key: 'UPPER_LOWER_4DAY',
                  title: 'Upper / Lower Split',
                  tag: '4 Days/Week • Gym',
                  desc: 'Alternating upper and lower body workout days for optimal strength and muscle volume.'
                },
                {
                  key: 'PPL_6DAY',
                  title: 'Push / Pull / Legs (PPL)',
                  tag: '6 Days/Week • Gym',
                  desc: 'Dedicated push, pull, and leg training days for serious hyper-focused hypertrophy.'
                },
                {
                  key: 'PCOS_3DAY',
                  title: 'PCOS Low-Cortisol Split',
                  tag: '3 Days/Week • Gentle',
                  desc: 'Low-stress workouts with controlled tempos to manage glucose and optimize hormone balance.'
                },
                {
                  key: 'KNEE_FRIENDLY_3DAY',
                  title: 'Knee-Friendly Split',
                  tag: '3 Days/Week • Joint Safe',
                  desc: 'Replaces heavy quad shear with glute, hamstring, and upper body focus for joint longevity.'
                },
                {
                  key: 'DESI_HOME_3DAY',
                  title: 'Desi Home-Fitness',
                  tag: '3 Days/Week • Home',
                  desc: 'Effective home workouts utilizing bodyweight movements, resistance bands, and dumbbells.'
                }
              ].map((item) => {
                const isSelected = selectedSplitKey === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => setSelectedSplitKey(item.key)}
                    className={`cursor-pointer p-md rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                        : 'border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/50 hover:bg-surface-container-low'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-xs">
                        <h4 className="font-bold text-sm text-on-surface">{item.title}</h4>
                        {isSelected && (
                          <span className="bg-primary text-on-primary rounded-full p-0.5">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-xs">
                        {item.tag}
                      </span>
                      <p className="text-xs text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowChangeSplitModal(false)}
                className="px-lg py-md rounded-xl text-xs font-bold text-secondary hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={changeSplitLoading}
                onClick={handleChangeSplit}
                className="bg-primary hover:bg-primary/95 text-on-primary font-bold px-xl py-md rounded-xl text-xs transition-all shadow-md flex items-center gap-xs disabled:opacity-50"
              >
                {changeSplitLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Updating Split...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Apply New Split</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
