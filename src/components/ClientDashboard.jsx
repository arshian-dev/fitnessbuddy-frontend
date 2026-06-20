import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
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
  RefreshCw
} from 'lucide-react';

export default function ClientDashboard({ user, initialData, onReOnboard, onUpdateUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, workouts, nutrition, chat, progress
  const [profile, setProfile] = useState(initialData.profile);
  const [workoutPlan, setWorkoutPlan] = useState(initialData.workoutPlan);
  const [nutritionPlan, setNutritionPlan] = useState(initialData.nutritionPlan);
  const [activeAlerts, setActiveAlerts] = useState(initialData.activeAlerts || []);

  const [checkinHistory, setCheckinHistory] = useState([]);
  const [completedExercises, setCompletedExercises] = useState({});
  const [dietContext, setDietContext] = useState('TRADITIONAL'); // TRADITIONAL, STANDARD
  
  // Diet & Hydration States
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [selectedMealOptions, setSelectedMealOptions] = useState({});
  const [loggedMeals, setLoggedMeals] = useState({});

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
  const [workoutsCompleted, setWorkoutsCompleted] = useState('');
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
    setFormLoading(true);
    setFormSuccess('');
    setFormError('');

    try {
      const data = {
        userId: user.id,
        weight: parseFloat(weight),
        waist_cm: waist ? parseFloat(waist) : null,
        energy_score: parseInt(energy),
        mood_score: parseInt(mood),
        workouts_completed: workoutsCompleted ? parseInt(workoutsCompleted) : 0,
      };

      const res = await api.submitCheckin(data);
      
      setFormSuccess('Progress logged successfully!');
      
      // Reset input fields
      setWeight('');
      setWaist('');
      setEnergy(7);
      setMood(7);
      setWorkoutsCompleted('');
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
            onClick={onReOnboard}
            className="flex items-center gap-md text-on-surface-variant px-md py-sm hover:bg-secondary-container/40 rounded-xl transition-all text-left"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Retake Onboarding</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'chat' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">smart_toy</span>
            <span className="font-label-md text-label-md">AI Chat</span>
          </button>
        </div>

        <div className="mt-auto border-t border-outline-variant/20 pt-lg space-y-base">
          <div className="flex items-center gap-md px-md mb-lg">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-lg">
              {user.name ? user.name[0].toUpperCase() : 'A'}
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
        <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md flex justify-between items-center w-full px-container-margin py-md md:px-lg border-b border-outline-variant/30">
          <h2 className="font-headline-md text-headline-md text-primary tracking-tight capitalize">{activeTab}</h2>
          <div className="flex items-center gap-md">
            <div className="md:hidden flex bg-surface-container p-1 rounded-lg gap-xs">
              <button onClick={() => setActiveTab('overview')} className={`px-2 py-1 rounded text-xs ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-secondary'}`}>Home</button>
              <button onClick={() => setActiveTab('workouts')} className={`px-2 py-1 rounded text-xs ${activeTab === 'workouts' ? 'bg-primary text-white' : 'text-secondary'}`}>Split</button>
              <button onClick={() => setActiveTab('nutrition')} className={`px-2 py-1 rounded text-xs ${activeTab === 'nutrition' ? 'bg-primary text-white' : 'text-secondary'}`}>Diet</button>
              <button onClick={() => setActiveTab('chat')} className={`px-2 py-1 rounded text-xs ${activeTab === 'chat' ? 'bg-primary text-white' : 'text-secondary'}`}>AI</button>
              <button onClick={() => setActiveTab('progress')} className={`px-2 py-1 rounded text-xs ${activeTab === 'progress' ? 'bg-primary text-white' : 'text-secondary'}`}>Logs</button>
            </div>
            <div className="bg-secondary-container text-on-secondary-container px-sm py-1 rounded-full font-label-md text-xs flex items-center gap-xs">
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
                        <span className="text-[10px] bg-error text-white px-2 py-0.5 rounded-full font-extrabold uppercase">{alert.severity}</span>
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
                <div className="lg:col-span-4 bg-white rounded-xl p-lg shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                  <h3 className="font-headline-md text-lg text-on-surface mb-md self-start">Daily Energy</h3>
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
                        <h3 className="font-headline-md text-lg text-primary">Biometric Health Triggers</h3>
                      </div>
                      <div className="space-y-md">
                        <div className="flex gap-md bg-white p-md rounded-lg border-l-4 border-primary shadow-sm">
                          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0 text-primary">
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
                  <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between">
                    <div>
                      <h3 className="font-headline-md text-lg text-on-surface mb-md">Active Indicators</h3>
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
                      className="bg-white border border-primary/30 rounded-lg px-md py-sm focus:ring-2 focus:ring-primary uppercase flex-1 max-w-[200px]"
                      value={linkCoachCode}
                      onChange={(e) => setLinkCoachCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      disabled={linkCoachLoading}
                    />
                    <button 
                      type="submit" 
                      className="bg-primary text-white font-bold px-lg py-sm rounded-lg hover:bg-primary/90 transition-all shadow-sm"
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
              <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/20 mb-lg">
                <div className="flex items-center gap-sm mb-lg">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  <h3 className="font-headline-md text-lg text-on-surface font-extrabold">Weekly Progress & Adherence Analytics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                  {/* Card 1: Workout Adherence */}
                  <div className="bg-slate-50 p-lg rounded-xl border border-outline-variant/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Workout Adherence</span>
                      <span className="text-2xl font-extrabold text-primary block mt-sm">{analytics.adherenceRate}%</span>
                    </div>
                    <div className="mt-md">
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${analytics.adherenceRate}%` }} />
                      </div>
                      <p className="text-[10px] text-secondary mt-2">Target: {workoutPlan?.frequency || 3} workouts/week</p>
                    </div>
                  </div>

                  {/* Card 2: Weight Trend */}
                  <div className="bg-slate-50 p-lg rounded-xl border border-outline-variant/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Weight Change</span>
                      <span className="text-2xl font-extrabold text-slate-800 block mt-sm">
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
                  <div className="bg-slate-50 p-lg rounded-xl border border-outline-variant/10 flex flex-col justify-between">
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
                  <div className="bg-slate-50 p-lg rounded-xl border border-outline-variant/10 md:col-span-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-xs">
                        <Sparkles size={12} />
                        <span>AI Progress Synthesis</span>
                      </span>
                      <p className="text-[11px] text-slate-600 italic mt-sm leading-relaxed line-clamp-3 hover:line-clamp-none transition-all font-semibold">
                        "{analytics.aiInsight}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Bento Area: Logger Form & Live Assistant */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
                
                {/* Daily Progress Form */}
                <div className="lg:col-span-7 bg-white rounded-xl p-lg shadow-sm border border-outline-variant/20">
                  <h3 className="font-headline-md text-lg text-on-surface mb-lg">Log Daily Progress</h3>
                  
                  {formSuccess && (
                    <div className="bg-teal-50 border border-teal-200 text-teal-800 p-md rounded-xl mb-md text-sm font-semibold flex items-center gap-sm">
                      <span className="material-symbols-outlined text-teal-600">check_circle</span>
                      <span>{formSuccess}</span>
                    </div>
                  )}
                  {formError && (
                    <div className="bg-error-container text-on-error-container p-md rounded-xl mb-md text-sm font-semibold flex items-center gap-sm">
                      <span className="material-symbols-outlined text-error">error</span>
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCheckinSubmit} className="grid grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <label className="text-xs font-bold text-secondary">BODY WEIGHT (KG) *</label>
                      <input 
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                        placeholder="00.0" 
                        step="0.1" 
                        type="number"
                        min="0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="text-xs font-bold text-secondary">CALORIES LOGGED TODAY</label>
                      <input 
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                        placeholder="e.g. 2100" 
                        type="number"
                        min="0"
                        value={caloriesLogged}
                        onChange={(e) => setCaloriesLogged(e.target.value)}
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="text-xs font-bold text-secondary">WAIST CIRCUMFERENCE (CM)</label>
                      <input 
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                        placeholder="e.g. 88.0" 
                        type="number"
                        min="0"
                        step="0.1"
                        value={waist}
                        onChange={(e) => setWaist(e.target.value)}
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="text-xs font-bold text-secondary">WORKOUTS COMPLETED THIS WEEK *</label>
                      <input 
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-md focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                        placeholder={`Planned target: ${workoutPlan?.frequency || 3}`}
                        type="number"
                        min="0"
                        max="21"
                        value={workoutsCompleted}
                        onChange={(e) => setWorkoutsCompleted(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-xs col-span-2 grid grid-cols-2 gap-sm">
                      <div>
                        <label className="text-xs font-bold text-secondary flex justify-between">
                          <span>Energy</span>
                          <span>{energy}/10</span>
                        </label>
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          value={energy}
                          onChange={(e) => setEnergy(parseInt(e.target.value))}
                          className="w-full mt-2 accent-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-secondary flex justify-between">
                          <span>Mood</span>
                          <span>{mood}/10</span>
                        </label>
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          value={mood}
                          onChange={(e) => setMood(parseInt(e.target.value))}
                          className="w-full mt-2 accent-primary"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={formLoading}
                      className="col-span-2 mt-md bg-primary text-on-primary py-md rounded-xl font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-sm"
                    >
                      <Save size={16} />
                      <span>{formLoading ? 'Submitting...' : 'Save Log Entry'}</span>
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

          {/* TAB: AI CHAT (Full Page) */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[calc(100vh-120px)]">
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col flex-1 overflow-hidden">
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
                      <div className={`p-md rounded-2xl max-w-[75%] text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-white border border-outline-variant/20 text-on-surface rounded-bl-sm'
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
                      <div className="bg-white border border-outline-variant/20 text-secondary px-md py-sm rounded-2xl rounded-bl-sm text-sm italic shadow-sm">
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
                <div className="flex gap-sm px-lg py-md border-t border-outline-variant/20 bg-white">
                  <input
                    type="text"
                    className="flex-grow bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-md py-sm text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary"
                    placeholder="Ask about food swaps, workouts, nutrition..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-primary hover:opacity-90 disabled:opacity-50 text-white px-lg py-sm rounded-xl font-bold text-sm transition-all flex items-center gap-xs shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKOUT PLAN */}
          {activeTab === 'workouts' && (
            <div className="w-full">
              {activeWorkoutDay ? (
                /* ACTIVE WORKOUT MODE RUNNER */
                <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-white/10 overflow-hidden max-w-2xl mx-auto animate-in fade-in duration-300">
                  {/* Runner Header */}
                  <div className="bg-slate-950 px-lg py-md border-b border-white/10 flex justify-between items-center">
                    {!showQuitConfirm ? (
                      <>
                        <div>
                          <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest flex items-center gap-xs">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                            <span>Workout Running</span>
                          </span>
                          <h3 className="text-white font-bold text-base mt-0.5">{activeWorkoutDay} — {workoutPlan?.split || 'Custom Split'}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuitConfirm(true);
                          }}
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
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuitConfirm(false);
                            }}
                            className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWorkoutDay(null);
                              setWorkoutStepIndex(0);
                              setCompletedSets({});
                              setIsResting(false);
                              setRestSecondsLeft(null);
                              setShowQuitConfirm(false);
                            }}
                            className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded transition-colors"
                          >
                            Yes, Quit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Runner Body */}
                  {(() => {
                    const activeWorkoutExercises = getExercises().filter(ex => ex.day === activeWorkoutDay);
                    
                    if (activeWorkoutExercises.length === 0) {
                      return (
                        <div className="p-xl text-center">
                          <p className="text-slate-400 text-sm">No exercises scheduled for {activeWorkoutDay}.</p>
                          <button 
                            onClick={() => setActiveWorkoutDay(null)} 
                            className="mt-md bg-primary text-white px-lg py-sm rounded-xl font-bold hover:opacity-90 transition-all text-xs"
                          >
                            Back to Workouts
                          </button>
                        </div>
                      );
                    }

                    const isFinished = workoutStepIndex >= activeWorkoutExercises.length;

                    if (isFinished) {
                      /* WORKOUT COMPLETION SCREEN */
                      return (
                        <div className="p-xl space-y-lg text-center bg-slate-900">
                          <div className="w-16 h-16 bg-teal-950 border border-teal-500/30 text-teal-400 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                            <span className="material-symbols-outlined text-[36px]">celebration</span>
                          </div>
                          <div className="space-y-sm">
                            <h4 className="text-xl font-extrabold text-white">Workout Completed! 🎉</h4>
                            <p className="text-sm text-slate-300">Outstanding effort today! You finished all {activeWorkoutExercises.length} scheduled exercises.</p>
                          </div>

                          <div className="bg-slate-950 border border-white/10 p-lg rounded-xl max-w-sm mx-auto text-left space-y-md">
                            <h5 className="text-xs font-bold text-teal-400 uppercase tracking-wide">Quick Progress Check-in</h5>
                            
                            <div className="space-y-xs">
                              <label className="text-[10px] font-bold text-slate-400">CURRENT BODY WEIGHT (KG)</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder={profile?.weight ? `${profile.weight} kg` : '00.0'}
                                value={workoutLogWeight}
                                onChange={(e) => setWorkoutLogWeight(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-white text-sm placeholder:text-slate-600"
                              />
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              const currentCompleted = checkinHistory[0]?.workouts_completed || 0;
                              const weightVal = parseFloat(workoutLogWeight) || parseFloat(profile?.weight) || 70;
                              const logData = {
                                userId: user.id,
                                weight: weightVal,
                                workouts_completed: currentCompleted + 1,
                                energy_score: 8,
                                mood_score: 8
                              };
                              setFormLoading(true);
                              try {
                                await api.submitCheckin(logData);
                                await loadCheckinHistory();
                                setFormSuccess("Session logged successfully! Checked in on your dashboard.");
                                setTimeout(() => setFormSuccess(''), 5000);
                              } catch (err) {
                                setFormError("Failed to log workout session.");
                              } finally {
                                setFormLoading(false);
                                setActiveWorkoutDay(null);
                                setWorkoutStepIndex(0);
                                setCompletedSets({});
                                setWorkoutLogWeight('');
                              }
                            }}
                            className="w-full py-md bg-teal-500 hover:bg-teal-600 text-slate-950 rounded-xl font-bold transition-all text-sm shadow-md"
                          >
                            {formLoading ? 'Saving Log...' : 'Log Workout & Exit'}
                          </button>
                        </div>
                      );
                    }

                    const currentExercise = activeWorkoutExercises[workoutStepIndex];
                    const progressPct = (workoutStepIndex / activeWorkoutExercises.length) * 100;
                    const targetSetsNum = parseInt(currentExercise.sets) || 3;

                    return (
                      <div className="p-lg space-y-lg">
                        {/* Progress Bar */}
                        <div className="space-y-xs">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>EXERCISE {workoutStepIndex + 1} OF {activeWorkoutExercises.length}</span>
                            <span>{progressPct.toFixed(0)}% COMPLETE</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-teal-400 h-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>

                        {/* Exercise Details Card */}
                        <div className="bg-slate-950 border border-white/5 rounded-xl p-lg space-y-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-lg font-extrabold text-white leading-tight">{currentExercise.name}</h4>
                              <p className="text-xs text-teal-400 font-bold mt-1 uppercase tracking-widest">{currentExercise.sets} Sets x {currentExercise.reps} Reps</p>
                            </div>
                          </div>

                          {currentExercise.notes && (
                            <div className="bg-slate-905 bg-slate-900 border border-white/10 p-md rounded-lg border-l-4 border-teal-500 shadow-sm flex items-start gap-sm">
                              <span className="material-symbols-outlined text-teal-400 text-[18px] mt-0.5">tips_and_updates</span>
                              <p className="text-xs text-slate-300 italic">"{currentExercise.notes}"</p>
                            </div>
                          )}
                        </div>

                        {/* Sets Tracker Checklist */}
                        <div className="space-y-sm">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Track Your Sets</h5>
                          <div className="grid grid-cols-1 gap-xs">
                            {Array.from({ length: targetSetsNum }, (_, setIdx) => {
                              const isDone = !!completedSets[workoutStepIndex]?.[setIdx];
                              return (
                                <div
                                  key={setIdx}
                                  onClick={() => {
                                    const currentSetsState = { ...(completedSets[workoutStepIndex] || {}) };
                                    const wasDone = !!currentSetsState[setIdx];
                                    currentSetsState[setIdx] = !wasDone;
                                    setCompletedSets(prev => ({
                                      ...prev,
                                      [workoutStepIndex]: currentSetsState
                                    }));
                                    if (!wasDone) {
                                      setRestSecondsLeft(currentExercise.restSeconds || 60);
                                      setIsResting(true);
                                    }
                                  }}
                                  className={`p-md border rounded-xl flex items-center justify-between cursor-pointer transition-all ${isDone ? 'bg-teal-500/10 border-teal-500' : 'bg-slate-950 border-white/10 hover:border-white/20'}`}
                                >
                                  <span className={`text-xs font-bold ${isDone ? 'text-teal-400' : 'text-slate-300'}`}>SET {setIdx + 1}</span>
                                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isDone ? 'bg-teal-500 border-teal-500 text-slate-950' : 'border-white/20 text-transparent'}`}>
                                    <Check size={14} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rest Timer display */}
                        {isResting && restSecondsLeft !== null && (
                          <div className="bg-teal-950 border border-teal-500/30 p-md rounded-xl flex items-center justify-between animate-in fade-in duration-300">
                            <div className="flex items-center gap-sm">
                              <span className="material-symbols-outlined text-teal-400 text-[20px] animate-spin">alarm</span>
                              <span className="text-xs font-bold text-slate-300">Rest Timer: <strong className="text-teal-400 text-sm">{restSecondsLeft}s</strong> remaining</span>
                            </div>
                            <button
                              onClick={() => {
                                setIsResting(false);
                                setRestSecondsLeft(null);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-[10px] font-bold border border-white/10 transition-all shadow-sm"
                            >
                              Skip Rest
                            </button>
                          </div>
                        )}

                        {/* Navigation Controls */}
                        <div className="flex gap-sm pt-md border-t border-white/10">
                          <button
                            disabled={workoutStepIndex === 0}
                            onClick={() => setWorkoutStepIndex(prev => prev - 1)}
                            className="px-lg py-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-xs"
                          >
                            <span className="material-symbols-outlined text-xs">arrow_back</span>
                            <span>Prev</span>
                          </button>
                          <button
                            onClick={() => {
                              setWorkoutStepIndex(prev => prev + 1);
                              setIsResting(false);
                              setRestSecondsLeft(null);
                            }}
                            className="flex-grow py-sm bg-teal-500 text-slate-950 rounded-xl font-bold hover:bg-teal-400 transition-all text-xs flex items-center justify-center gap-xs"
                          >
                            <span>{workoutStepIndex === activeWorkoutExercises.length - 1 ? 'Finish Workout' : 'Next Exercise'}</span>
                            <span className="material-symbols-outlined text-xs font-bold">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
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
                        <h4 className="font-headline-md text-headline-md text-on-surface font-extrabold">{workoutPlan?.split || 'Custom Split'}</h4>
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
                          <div key={dayName} className="space-y-sm bg-white p-lg rounded-xl border border-outline-variant/15 shadow-sm">
                            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-xs mb-sm">
                              <h4 className="font-bold text-xs text-primary uppercase tracking-widest">{dayName}</h4>
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
                            </div>
                            <div className="space-y-sm">
                              {dayExercises.map((ex) => {
                                const originalIdx = getExercises().findIndex(
                                  e => e.name === ex.name && e.day === ex.day && e.notes === ex.notes
                                );
                                const isCompleted = !!completedExercises[originalIdx];
                                const hasKneeAlert = ex.name.toLowerCase().includes('deadlift') || ex.name.toLowerCase().includes('squat');
                                return (
                                  <div key={originalIdx} className="bg-slate-50 p-md rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all flex items-start gap-md">
                                    <button
                                      type="button"
                                      onClick={() => toggleExercise(originalIdx)}
                                      className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${isCompleted ? 'bg-primary border-primary text-white' : 'border-outline text-transparent'}`}
                                    >
                                      <Check size={14} />
                                    </button>
                                    
                                    <div className="flex-grow space-y-sm">
                                      <div className="flex justify-between items-start flex-wrap gap-xs">
                                        <div>
                                          <h5 className={`font-bold text-sm ${isCompleted ? 'line-through text-secondary' : 'text-on-surface'}`}>{ex.name}</h5>
                                          <p className="text-xs text-secondary mt-0.5">{ex.sets} Sets x {ex.reps} reps</p>
                                        </div>
                                        {hasKneeAlert && (
                                          <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-xs">
                                            <AlertTriangle size={10} />
                                            <span>KNEE LONGEVITY TIP</span>
                                          </span>
                                        )}
                                      </div>
                                      {ex.notes && (
                                        <p className="text-xs text-on-surface-variant bg-white p-sm rounded-lg border-l-2 border-primary/40 italic shadow-sm">
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
                    <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/20">
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
                    <div className="bg-primary p-xs rounded-full text-white flex items-center justify-center">
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
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/30 bento-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-sm">
                      <span className="font-label-md text-on-surface-variant font-bold text-xs uppercase tracking-wider">Protein</span>
                      <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">TARGET: {nutritionPlan?.protein || 140}g</span>
                    </div>
                    <p className="font-headline-md text-on-background mb-md">{loggedProtein}g</p>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (loggedProtein / (nutritionPlan?.protein || 140)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/30 bento-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-sm">
                      <span className="font-label-md text-on-surface-variant font-bold text-xs uppercase tracking-wider">Carbs</span>
                      <span className="bg-tertiary/10 text-tertiary text-[10px] px-2 py-0.5 rounded-full font-bold">TARGET: {nutritionPlan?.carbs || 200}g</span>
                    </div>
                    <p className="font-headline-md text-on-background mb-md">{loggedCarbs}g</p>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-tertiary h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (loggedCarbs / (nutritionPlan?.carbs || 200)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/30 bento-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-sm">
                      <span className="font-label-md text-on-surface-variant font-bold text-xs uppercase tracking-wider">Fats</span>
                      <span className="bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">TARGET: {nutritionPlan?.fats || 70}g</span>
                    </div>
                    <p className="font-headline-md text-on-background mb-md">{loggedFats}g</p>
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
                        className={`px-sm py-1.5 rounded-lg text-xs font-bold transition-all ${dietContext === 'TRADITIONAL' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Traditional
                      </button>
                      <button 
                        onClick={() => setDietContext('STANDARD')}
                        className={`px-sm py-1.5 rounded-lg text-xs font-bold transition-all ${dietContext === 'STANDARD' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
                      >
                        Standard Swaps
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
                          <div className="p-md md:p-lg grid grid-cols-1 md:grid-cols-2 gap-md md:gap-lg bg-white">
                            {m.options.map((opt, oIdx) => {
                              const isSelected = selectedMealOptions[idx] === oIdx || (selectedMealOptions[idx] === undefined && oIdx === 0);
                              return (
                                <div 
                                  key={oIdx} 
                                  onClick={() => setSelectedMealOptions(prev => ({ ...prev, [idx]: oIdx }))}
                                  className={`p-md rounded-xl cursor-pointer transition-colors ${isSelected ? 'border-2 border-primary bg-primary/5 hover:bg-primary/10' : 'border border-outline-variant/50 hover:border-primary/30 bg-surface-bright'}`}
                                >
                                  <div className="flex justify-between items-start mb-sm">
                                    <span className={`${isSelected ? 'bg-primary text-white' : 'bg-secondary/20 text-secondary'} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider`}>Option {String.fromCharCode(65 + oIdx)}</span>
                                    {isSelected && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                                  </div>
                                  <h4 className="font-bold text-on-surface mb-xs text-sm leading-tight">{translateOption(opt)}</h4>
                                  <p className="text-[11px] text-secondary leading-relaxed">Balanced macro choice matching your targets for this meal.</p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="bg-surface-container-low px-lg py-sm border-t border-outline-variant/20 flex justify-end">
                             <button
                               onClick={() => {
                                  if (!loggedMeals[idx]) {
                                    const proMatch = m.target_macro_estimate.match(/Protein:.*?(\d+)g/i);
                                    const carbMatch = m.target_macro_estimate.match(/Carbs:.*?(\d+)g/i);
                                    const fatMatch = m.target_macro_estimate.match(/Fats:.*?(\d+)g/i);
                                    
                                    const p = proMatch ? parseInt(proMatch[1]) : 0;
                                    const c = carbMatch ? parseInt(carbMatch[1]) : 0;
                                    const f = fatMatch ? parseInt(fatMatch[1]) : 0;
                                    const mealCals = (p * 4) + (c * 4) + (f * 9) || 400; // fallback

                                    setCaloriesLogged(prev => ((parseInt(prev) || 0) + mealCals).toString());
                                    setLoggedProtein(prev => prev + p);
                                    setLoggedCarbs(prev => prev + c);
                                    setLoggedFats(prev => prev + f);

                                    setLoggedMeals(prev => ({...prev, [idx]: true}));
                                  }
                               }}
                               disabled={loggedMeals[idx]}
                               className={`px-md py-xs rounded-lg font-bold text-xs flex items-center gap-xs transition-colors ${loggedMeals[idx] ? 'bg-teal-50 text-teal-700' : 'bg-primary text-white hover:bg-primary/90'}`}
                             >
                               <span className="material-symbols-outlined text-[14px]">
                                 {loggedMeals[idx] ? 'check' : 'add'}
                               </span>
                               {loggedMeals[idx] ? 'Logged' : 'Log Meal'}
                             </button>
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
                  <div className="bg-primary p-lg rounded-2xl text-white relative overflow-hidden shadow-md mt-xl">
                    <div className="relative z-10">
                      <div className="flex items-center gap-sm mb-md">
                        <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
                        <h3 className="font-headline-md text-lg tracking-tight">Cultural Swaps Widget</h3>
                      </div>
                      <p className="font-body-md mb-lg text-sm opacity-90 max-w-md">Maintain your heritage without compromising your health. Swap these common ingredients today.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div className="bg-white/10 backdrop-blur-md p-md rounded-xl flex items-center justify-between border border-white/20">
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
                        <div className="bg-white/10 backdrop-blur-md p-md rounded-xl flex items-center justify-between border border-white/20">
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
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
                  </div>
                </div>

                {/* Sidebar Widgets (1 Col) */}
                <div className="space-y-lg">
                  {/* AI Interaction */}
                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    <div className="bg-on-background p-md flex items-center gap-sm text-white">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                      </div>
                      <span className="font-bold text-sm tracking-wide">Ask Nutrition AI</span>
                    </div>
                    <div className="p-md space-y-md">
                      <div className="bg-surface-container p-md rounded-xl border border-primary/10">
                        <p className="text-xs italic text-on-surface-variant leading-relaxed">"Describe your meal, and I'll estimate the exact macros for you so you can easily log them to today's progress."</p>
                      </div>
                      <form onSubmit={handleEstimateMacros} className="relative">
                        <input
                          type="text"
                          value={foodQuery}
                          onChange={(e) => setFoodQuery(e.target.value)}
                          className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-md py-sm pr-10 focus:ring-1 focus:ring-primary focus:border-primary text-xs shadow-sm transition-all"
                          placeholder="e.g. 150g tandoori chicken..."
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
                            <div className="bg-white py-sm px-1 rounded-lg border border-outline-variant/10 shadow-sm">
                              <span className="text-[9px] text-secondary block font-bold tracking-wider mb-1">CAL</span>
                              <span className="font-extrabold text-primary text-sm">{calcResult.calories}</span>
                            </div>
                            <div className="bg-white py-sm px-1 rounded-lg border border-outline-variant/10 shadow-sm">
                              <span className="text-[9px] text-secondary block font-bold tracking-wider mb-1">PRO</span>
                              <span className="font-extrabold text-primary text-sm">{calcResult.protein}g</span>
                            </div>
                            <div className="bg-white py-sm px-1 rounded-lg border border-outline-variant/10 shadow-sm">
                              <span className="text-[9px] text-secondary block font-bold tracking-wider mb-1">CARB</span>
                              <span className="font-extrabold text-primary text-sm">{calcResult.carbs}g</span>
                            </div>
                            <div className="bg-white py-sm px-1 rounded-lg border border-outline-variant/10 shadow-sm">
                              <span className="text-[9px] text-secondary block font-bold tracking-wider mb-1">FAT</span>
                              <span className="font-extrabold text-primary text-sm">{calcResult.fats}g</span>
                            </div>
                          </div>
                          
                          {calcResult.breakdown && (
                            <div className="bg-white p-sm rounded-lg border border-outline-variant/10 text-[10px] leading-relaxed text-secondary italic shadow-sm">
                              <strong>AI Breakdown:</strong> {calcResult.breakdown}
                            </div>
                          )}

                          <button
                            onClick={handleLogCalcCalories}
                            className="w-full bg-primary text-white py-sm rounded-lg font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-xs shadow-md"
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
                        <div className="w-5 h-5 rounded-full bg-tertiary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="material-symbols-outlined text-[12px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
                        </div>
                        <p className="text-[11px] text-on-tertiary-fixed-variant leading-relaxed">Pre-load on protein 2 hours before leaving to avoid overeating.</p>
                      </li>
                      <li className="flex items-start gap-sm">
                        <div className="w-5 h-5 rounded-full bg-tertiary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="material-symbols-outlined text-[12px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
                        </div>
                        <p className="text-[11px] text-on-tertiary-fixed-variant leading-relaxed">Stick to kebabs & dry meats; avoid heavy cream gravies.</p>
                      </li>
                      <li className="flex items-start gap-sm">
                        <div className="w-5 h-5 rounded-full bg-tertiary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="material-symbols-outlined text-[12px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
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
              
              {/* Weight trend visualizer */}
              <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/20">
                <h3 className="font-headline-md text-lg text-on-surface mb-lg">Weight trend logged over time</h3>
                {checkinHistory.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-end h-36 gap-xs bg-slate-50 p-md rounded-xl border border-outline-variant/10">
                      {checkinHistory.slice().reverse().map((log, idx) => {
                        const baseWeight = Math.min(...checkinHistory.map((l) => l.weight)) - 5;
                        const maxWeight = Math.max(...checkinHistory.map((l) => l.weight)) + 5;
                        const heightPercent = ((log.weight - baseWeight) / (maxWeight - baseWeight)) * 100;
                        return (
                          <div 
                            key={log.id} 
                            style={{ height: `${Math.max(20, Math.min(100, heightPercent))}%` }}
                            className="flex-grow flex flex-col items-center justify-end gap-xs"
                          >
                            <span className="text-[10px] font-bold text-primary">{log.weight} kg</span>
                            <div className="w-full bg-primary hover:bg-primary-container transition-all rounded-t-sm h-full"></div>
                            <span className="text-[8px] text-secondary font-semibold">
                              {new Date(log.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-secondary text-sm text-center py-md">No progress entries logged yet. Write one on the overview tab!</p>
                )}
              </div>

              {/* Historical logs table */}
              <div className="bg-white rounded-xl p-lg shadow-sm border border-outline-variant/20">
                <h3 className="font-headline-md text-lg text-on-surface mb-md">Historical Check-in Logs</h3>
                {checkinHistory.length > 0 ? (
                  <div className="space-y-sm">
                    {checkinHistory.map((log) => (
                      <div key={log.id} className="p-md rounded-xl bg-slate-50 border border-outline-variant/20 text-xs">
                        <div className="flex justify-between border-b border-slate-200 pb-sm mb-sm flex-wrap gap-xs">
                          <span className="font-bold text-slate-800">
                            {new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span>
                            Weight: <strong className="text-primary">{log.weight} kg</strong>
                            {log.waist_cm && <span> | Waist: <strong className="text-primary">{log.waist_cm} cm</strong></span>}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-sm text-[10px] text-slate-500 font-bold mb-sm">
                          <span>Workouts completed: {log.workouts_completed}</span>
                          <span>Energy index: {log.energy_score}/10</span>
                          <span>Mood index: {log.mood_score}/10</span>
                        </div>
                        {log.ai_insight && (
                          <div className="bg-teal-50 border-l-2 border-primary p-sm rounded text-slate-700 italic">
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

        </div>
      </main>
    </div>
  );
}
