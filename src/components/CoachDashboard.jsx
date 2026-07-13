import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { getExerciseImage } from '../utils/exerciseImages';
import { 
  Dumbbell, 
  Flame, 
  MapPin, 
  Briefcase, 
  Phone, 
  User, 
  Moon, 
  Zap, 
  Droplet, 
  Coffee, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  X, 
  Search, 
  Award, 
  Check, 
  AlertTriangle, 
  LogOut,
  Edit2,
  RefreshCw,
  BrainCircuit,
  Database,
  Users
} from 'lucide-react';
import { TextEffect } from '../../components/motion-primitives/text-effect';
import ThemeToggle from './ThemeToggle';
import CommunityPage from './CommunityPage';
import ProfilePage from './ProfilePage';

export default function CoachDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, registry, library, chat, intelligence
  const [clients, setClients] = useState([]);
  
  // Knowledge Base States
  const [knowledgeSources, setKnowledgeSources] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newAssetFile, setNewAssetFile] = useState(null);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbMessage, setKbMessage] = useState({ type: '', text: '' });
  const [previewChunks, setPreviewChunks] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Library Lists
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [foodLibrary, setFoodLibrary] = useState([]);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Workspace Active Tab
  const [clientProfileTab, setClientProfileTab] = useState('summary'); // summary, habits, medical, training

  // Plan Override Form States
  const [overrideType, setOverrideType] = useState('workout'); // workout, nutrition
  const [workoutSplit, setWorkoutSplit] = useState('');
  const [workoutFreq, setWorkoutFreq] = useState(3);
  const [workoutScheme, setWorkoutScheme] = useState('Double Progression');
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [workoutStep, setWorkoutStep] = useState(1);
  const [activeDayTab, setActiveDayTab] = useState('Monday');
  
  const [nutriCal, setNutriCal] = useState(2000);
  const [nutriProtein, setNutriProtein] = useState(140);
  const [nutriCarbs, setNutriCarbs] = useState(210);
  const [nutriFats, setNutriFats] = useState(55);
  const [mealTemplates, setMealTemplates] = useState([]);

  // Library Creators Inline States
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('General');

  const [showAddFood, setShowAddFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodServingUnit, setNewFoodServingUnit] = useState('100g');
  const [newFoodCalories, setNewFoodCalories] = useState(100);
  const [newFoodProtein, setNewFoodProtein] = useState(10);
  const [newFoodCarbs, setNewFoodCarbs] = useState(15);
  const [newFoodFats, setNewFoodFats] = useState(2);

  // Food Builder States
  const [activeBuilder, setActiveBuilder] = useState(null); // { mealIndex, optionIndex }
  const [builderFoods, setBuilderFoods] = useState([]); // [ { name, quantity } ]

  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState('');
  const [overrideError, setOverrideError] = useState('');

  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello Coach! I\'m your AI assistant. I can help you analyze client plateaus, brainstorm workout splits, adjust macros, or manage difficult coaching situations.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendCoachMessage = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.sendCoachMessage(user?.id, text);
      setChatMessages((prev) => [...prev, { sender: 'assistant', text: res.reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Sorry, I ran into an error. Please check your backend connection.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const allClients = await api.getRoster(user.id);
      setClients(allClients);

      // Restore selection if exists
      if (selectedClient) {
        const updatedSelected = allClients.find(c => c.id === selectedClient.id);
        if (updatedSelected) setSelectedClient(updatedSelected);
      }
    } catch (err) {
      console.error('Failed to load coach dashboard data:', err.message);
    }
  };

  const loadLibrary = async () => {
    try {
      if (exerciseLibrary.length === 0) {
        const exercises = await api.getExercises();
        setExerciseLibrary(exercises);
      }
      if (foodLibrary.length === 0) {
        const foods = await api.getFoods();
        setFoodLibrary(foods);
      }
    } catch (err) {
      console.error('Failed to load library data:', err.message);
    }
  };

  const loadKnowledge = async () => {
    try {
      const data = await api.getKnowledge(user.id);
      setKnowledgeSources(data);
    } catch (err) {
      console.error('Failed to load knowledge base:', err.message);
    }
  };

  const handleRemoveKnowledge = async (sourceName) => {
    if (!window.confirm(`Are you sure you want to remove all knowledge chunks associated with "${sourceName}"?`)) {
      return;
    }
    setKbLoading(true);
    try {
      const res = await api.removeKnowledge(user.id, sourceName);
      setKbMessage({ type: 'success', text: res.message });
      loadKnowledge();
    } catch (err) {
      setKbMessage({ type: 'error', text: err.message });
    } finally {
      setKbLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'library' || (activeTab === 'registry' && selectedClient)) {
      loadLibrary();
    }
    if (activeTab === 'intelligence') {
      loadKnowledge();
    }
  }, [activeTab, selectedClient]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setOverrideSuccess('');
    setOverrideError('');
    setWorkoutStep(1);
    setActiveDayTab('Monday');

    // Prepopulate workout overrides
    if (client.workoutPlan) {
      setWorkoutSplit(client.workoutPlan.split || '');
      setWorkoutFreq(client.workoutPlan.frequency || 3);
      setWorkoutScheme(client.workoutPlan.progression_scheme || '');
      try {
        setWorkoutExercises(
          typeof client.workoutPlan.exercises === 'string'
            ? JSON.parse(client.workoutPlan.exercises)
            : client.workoutPlan.exercises || []
        );
      } catch {
        setWorkoutExercises([]);
      }
    } else {
      setWorkoutSplit('Full Body Recomp');
      setWorkoutFreq(3);
      setWorkoutScheme('Linear Progression');
      setWorkoutExercises([]);
    }

    // Prepopulate nutrition overrides
    if (client.nutritionPlan) {
      setNutriCal(client.nutritionPlan.calories || 2000);
      setNutriProtein(client.nutritionPlan.protein || 140);
      setNutriCarbs(client.nutritionPlan.carbs || 200);
      setNutriFats(client.nutritionPlan.fats || 70);
      try {
        setMealTemplates(
          typeof client.nutritionPlan.meal_templates === 'string'
            ? JSON.parse(client.nutritionPlan.meal_templates)
            : client.nutritionPlan.meal_templates || []
        );
      } catch {
        setMealTemplates([]);
      }
    } else {
      setNutriCal(2000);
      setNutriProtein(140);
      setNutriCarbs(200);
      setNutriFats(70);
      setMealTemplates([]);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      await loadData();
    } catch (err) {
      alert('Failed to resolve alert: ' + err.message);
    }
  };

  const handleRemoveClient = async () => {
    if (!window.confirm(`Are you sure you want to remove ${selectedClient.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.removeClient(selectedClient.id);
      setSelectedClient(null);
      await loadData();
    } catch (err) {
      alert('Failed to remove client: ' + err.message);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (overrideType === 'workout' && workoutStep === 1) {
      setWorkoutStep(2);
      return;
    }
    setOverrideLoading(true);
    setOverrideSuccess('');
    setOverrideError('');

    try {
      if (overrideType === 'workout') {
        const uniqueDays = new Set(workoutExercises.map(ex => ex.day).filter(Boolean));
        const calculatedFreq = uniqueDays.size || parseInt(workoutFreq) || 3;
        const details = {
          split: workoutSplit,
          frequency: calculatedFreq,
          exercises: workoutExercises,
          progression_scheme: workoutScheme
        };
        await api.overridePlan(selectedClient.id, 'workout', details);
        setOverrideSuccess('Workout protocol overrides pushed to client.');
        setWorkoutStep(1);
      } else {
        const details = {
          calories: parseInt(nutriCal),
          protein: parseInt(nutriProtein),
          carbs: parseInt(nutriCarbs),
          fats: parseInt(nutriFats),
          meal_templates: mealTemplates
        };
        await api.overridePlan(selectedClient.id, 'nutrition', details);
        setOverrideSuccess('Nutrition protocol overrides pushed to client.');
      }
      await loadData();
    } catch (err) {
      setOverrideError(err.message || 'Failed to submit override.');
    } finally {
      setOverrideLoading(false);
    }
  };

  // Compile live escalations from all clients
  const escalations = clients.flatMap((c) => 
    (c.activeAlerts || []).map((a) => ({
      ...a,
      client: c
    }))
  );

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-lg px-md w-64 bg-surface-container-low border-r border-outline-variant/20 z-50">
        <div className="mb-xl px-md">
          <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Fitness Buddy</h1>
          <p className="text-on-surface-variant font-label-md text-[12px] opacity-70">COACH PORTAL</p>
        </div>
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'dashboard' ? 'bg-primary-container text-on-primary-container font-bold scale-[0.99]' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('registry')}
            className={`w-full flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'registry' ? 'bg-primary-container text-on-primary-container font-bold scale-[0.99]' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-md text-label-md">Registry</span>
          </button>
          <button 
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'feed' ? 'bg-primary-container text-on-primary-container font-bold scale-[0.99]' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <Users size={20} className="text-current" />
            <span className="font-label-md text-label-md">Community Feed</span>
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`w-full flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'library' ? 'bg-primary-container text-on-primary-container font-bold scale-[0.99]' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">library_books</span>
            <span className="font-label-md text-label-md">Library</span>
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'chat' ? 'bg-primary-container text-on-primary-container font-bold scale-[0.99]' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">smart_toy</span>
            <span className="font-label-md text-label-md">AI Assistant</span>
          </button>
          <button 
            onClick={() => setActiveTab('intelligence')}
            className={`w-full flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'intelligence' ? 'bg-primary-container text-on-primary-container font-bold scale-[0.99]' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-label-md text-label-md">Intelligence Base</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-md rounded-xl px-md py-sm transition-all text-left ${activeTab === 'profile' ? 'bg-primary-container text-on-primary-container font-bold scale-[0.99]' : 'text-on-surface-variant hover:bg-secondary-container/40'}`}
          >
            <User size={20} className="text-current" />
            <span className="font-label-md text-label-md">Profile</span>
          </button>
        </nav>
        <div className="mt-auto pt-lg border-t border-outline-variant/20 space-y-2">
          <div className="px-md py-sm mb-md flex items-center gap-md">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">AK</div>
            <div>
              <p className="font-label-md text-label-md font-semibold">{user.name}</p>
              <p className="text-[12px] text-on-surface-variant">Coach Lead</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-md text-on-surface-variant px-md py-sm hover:bg-secondary-container/40 rounded-xl transition-all text-left">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 min-h-screen p-container-margin md:p-xl">
        {/* Mobile Header Nav & Search */}
        <div className="md:hidden flex overflow-x-auto custom-scrollbar gap-xs mb-md pb-1">
          <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'dashboard' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}`}>Overview</button>
          <button onClick={() => setActiveTab('registry')} className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'registry' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}`}>Registry</button>
          <button onClick={() => setActiveTab('feed')} className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'feed' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}`}>Feed</button>
          <button onClick={() => setActiveTab('library')} className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'library' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}`}>Library</button>
          <button onClick={() => setActiveTab('chat')} className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'chat' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}`}>AI Assist</button>
          <button onClick={() => setActiveTab('profile')} className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'profile' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}`}>Profile</button>
        </div>
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-xl gap-md">
          <div>
            <div className="flex items-center gap-md">
              <h2 className="font-headline-lg text-headline-lg text-on-background tracking-tight">
                {activeTab === 'dashboard' ? 'Coach Overview' : activeTab === 'registry' ? 'Client Management' : activeTab === 'chat' ? 'AI Assistant' : activeTab === 'intelligence' ? 'Intelligence Base' : activeTab === 'feed' ? 'Community Feed' : activeTab === 'profile' ? 'Coach Profile' : 'Asset Library'}
              </h2>
              {user.coach_code && (
                <div className="bg-primary/10 border border-primary/20 px-sm py-1 rounded-md flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px] text-primary">key</span>
                  <span className="text-[12px] font-bold text-primary">Invite Code: {user.coach_code}</span>
                </div>
              )}
            </div>
            <p className="text-on-surface-variant">
              {activeTab === 'dashboard' ? `You have ${clients.length} active clients. ${escalations.length > 0 ? `${escalations.length} require immediate attention.` : 'All good today!'}` : 
               activeTab === 'chat' ? 'Brainstorm splits, manage plateaus, and plan diets.' : 
               activeTab === 'intelligence' ? 'Manage your unique coaching data embedded into the AI brain.' :
               activeTab === 'feed' ? 'See what your clients are up to and interact with their shared posts.' :
               'Manage clients, design target meal plans, and override workouts.'}
            </p>
          </div>
          <div className="flex items-center gap-md">
            <ThemeToggle />
            <div className="relative">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                className="pl-xl pr-md py-sm rounded-full bg-surface-container border-none focus:ring-2 focus:ring-primary w-full md:w-64 transition-all" 
                placeholder="Search clients..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="w-full">
            <ProfilePage user={user} checkinHistory={[]} />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-xl animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-md">
                  <div className="p-sm bg-primary/10 rounded-xl text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <span className="text-[12px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">+2 this week</span>
                </div>
                <div>
                  <h3 className="text-on-surface-variant font-label-md">Total Active Clients</h3>
                  <p className="font-stat-display text-[36px] font-extrabold text-on-surface">{clients.length}</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-md">
                  <div className="p-sm bg-error/10 rounded-xl text-error flex items-center justify-center">
                    <span className="material-symbols-outlined">report</span>
                  </div>
                  {escalations.length > 0 && <span className="text-[12px] font-bold text-error bg-error-container/50 px-2 py-1 rounded-full">Action Required</span>}
                </div>
                <div>
                  <h3 className="text-on-surface-variant font-label-md">Active Escalations</h3>
                  <p className="font-stat-display text-[36px] font-extrabold text-on-surface">{escalations.length}</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-md">
                  <div className="p-sm bg-tertiary/10 rounded-xl text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined">fact_check</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-on-surface-variant font-label-md">Avg Compliance</h3>
                  <p className="font-stat-display text-[36px] font-extrabold text-on-surface">92%</p>
                </div>
              </div>
            </div>

            {/* Client Flags Distribution */}
            <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30">
              <h3 className="font-headline-md text-[18px] text-on-surface mb-md">Client Escalations Distribution</h3>
              {escalations.length > 0 ? (
                <div className="space-y-md">
                  {Object.entries(
                    escalations.reduce((acc, esc) => {
                      acc[esc.type] = (acc[esc.type] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]) => {
                    const percentage = (count / escalations.length) * 100;
                    return (
                      <div key={type} className="flex flex-col gap-xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-on-surface uppercase">{type}</span>
                          <span className="text-on-surface-variant">{count} Alert(s) ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-surface-container-low rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">No active escalations currently. All clear!</p>
              )}
            </div>

            {/* Escalation Center */}
            {escalations.length > 0 && (
              <section>
                <div className="flex items-center gap-sm mb-md">
                  <span className="material-symbols-outlined text-error">report</span>
                  <h3 className="font-headline-md text-headline-md">Escalation Center</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                  {escalations.slice(0, 3).map((esc) => (
                    <div key={esc.id} className="glass-card border border-error/20 rounded-xl p-md shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-sm">
                        <span className="px-sm py-xs bg-error-container text-on-error-container text-[10px] font-bold rounded-full uppercase tracking-widest">{esc.type}</span>
                        <span className="text-[10px] text-secondary font-bold uppercase">{esc.severity}</span>
                      </div>
                      <h4 className="font-headline-md text-[18px] mb-xs font-bold text-on-surface">{esc.client.name}</h4>
                      <p className="text-body-md text-on-surface-variant text-[12px] mb-md leading-relaxed">{esc.details}</p>
                      <button 
                        onClick={() => {
                          setActiveTab('registry');
                          handleSelectClient(esc.client);
                        }}
                        className="w-full py-sm bg-surface-container-high rounded-lg font-label-md text-primary font-bold hover:bg-primary hover:text-on-primary transition-all text-xs"
                      >
                        Inspect Plan overrides
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'registry' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            
            {/* Client Registry List */}
            <section className="lg:col-span-4 glass-card rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col h-[400px] lg:h-[750px]">
              <div className="p-md border-b border-outline-variant/20 flex justify-between items-center">
                <h3 className="font-headline-md text-[20px] font-extrabold text-on-surface">Client Registry</h3>
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{filteredClients.length} Active</span>
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredClients.map((client) => {
                  const isSelected = selectedClient?.id === client.id;
                  const hasAlerts = client.activeAlerts && client.activeAlerts.length > 0;
                  return (
                    <div 
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className={`p-md hover:bg-surface-container-low cursor-pointer transition-colors border-l-4 ${isSelected ? 'border-primary bg-surface-container-low/40' : 'border-transparent'} border-b border-outline-variant/10`}
                    >
                      <div className="flex items-center gap-md mb-sm">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {client.name ? client.name[0].toUpperCase() : 'C'}
                        </div>
                        <div className="flex-grow">
                          <p className="font-bold text-sm text-on-surface">{client.name}</p>
                          <p className="text-[11px] text-secondary font-medium">{client.email}</p>
                        </div>
                        {hasAlerts && (
                          <span className="w-2.5 h-2.5 bg-error rounded-full animate-ping" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-xs">
                        <span className="px-xs py-[2px] bg-secondary-container text-[10px] rounded border border-outline-variant/30 text-on-secondary-container font-semibold uppercase">{client.profile?.goal || 'No Goal'}</span>
                        <span className="px-xs py-[2px] bg-secondary-container text-[10px] rounded border border-outline-variant/30 text-on-secondary-container">{client.profile?.experience || 'Beginner'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Management Workspace */}
            <section className="lg:col-span-8">
              {selectedClient ? (
                <div className="space-y-lg">
                  
                  {/* Selected Client Overview */}
                  <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30">
                    <div className="flex justify-between items-center mb-xl border-b border-outline-variant/20 pb-md">
                      <div>
                        <h3 className="font-headline-md text-[22px] font-extrabold text-on-surface">{selectedClient.name}</h3>
                        <p className="text-on-surface-variant text-xs">Adherence probability: <strong className="text-primary">{(selectedClient.profile?.adherence_probability * 100 || 80).toFixed(0)}%</strong></p>
                      </div>
                      <div className="flex items-center gap-sm">
                        <span className="text-xs bg-primary/15 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold uppercase">
                          Complexity: {selectedClient.profile?.coaching_complexity || 'MEDIUM'}
                        </span>
                        <button 
                          onClick={handleRemoveClient}
                          className="text-error hover:bg-error-container/50 p-1.5 rounded-full transition-colors flex items-center justify-center"
                          title="Remove Client"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {selectedClient.profile ? (
                      <div>
                        {/* Tab Menu */}
                        <div className="flex border-b border-outline-variant/20 gap-base mb-md overflow-x-auto">
                          {['summary', 'habits', 'medical', 'training'].map((tabName) => (
                            <button
                              key={tabName}
                              type="button"
                              onClick={() => setClientProfileTab(tabName)}
                              className={`pb-sm px-base text-xs font-bold capitalize transition-colors ${clientProfileTab === tabName ? 'border-b-2 border-primary text-primary' : 'text-secondary hover:text-primary'}`}
                            >
                              {tabName}
                            </button>
                          ))}
                        </div>

                        {/* Bio / Goals */}
                        {clientProfileTab === 'summary' && (
                          <div className="space-y-md text-xs">
                            <div className="grid grid-cols-2 gap-sm">
                              <div>Age: <strong>{selectedClient.profile.age} yrs</strong></div>
                              <div>Gender: <strong className="text-primary">{selectedClient.profile.gender}</strong></div>
                              <div>Weight: <strong>{selectedClient.profile.weight} kg</strong></div>
                              <div>Height: <strong>{selectedClient.profile.height} cm</strong></div>
                              <div>Location: <strong>{selectedClient.profile.location}</strong></div>
                              <div>WhatsApp: <strong>{selectedClient.profile.contact_number || 'N/A'}</strong></div>
                            </div>
                            <div className="border-t border-outline-variant/20 pt-sm">
                              <span className="text-[10px] text-secondary font-bold uppercase">End Goal Vision</span>
                              <p className="font-semibold text-on-surface mt-1">{selectedClient.profile.end_goal_description}</p>
                            </div>
                          </div>
                        )}

                        {/* Lifestyle / Habits */}
                        {clientProfileTab === 'habits' && (
                          <div className="grid grid-cols-2 gap-sm text-xs">
                            <div>Sleep Hours: <strong>{selectedClient.profile.sleep_hours} hrs ({selectedClient.profile.sleep_consistency})</strong></div>
                            <div>Stress Level: <strong>{selectedClient.profile.stress_level}</strong></div>
                            <div>Water Intake: <strong>{selectedClient.profile.water_glasses} glasses</strong></div>
                            <div>Chai cups daily: <strong>{selectedClient.profile.chai_cups} cups</strong></div>
                            <div>Kitchen control: <strong>{selectedClient.profile.cooking_control}</strong></div>
                            <div>Diet strictness: <strong>{selectedClient.profile.diet_strictness_tolerance}</strong></div>
                          </div>
                        )}

                        {/* Medical Context */}
                        {clientProfileTab === 'medical' && (
                          <div className="space-y-sm text-xs">
                            <div>Active Conditions:</div>
                            <div className="flex flex-wrap gap-xs">
                              {selectedClient.profile.conditions?.map((c) => (
                                <span key={c} className="bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200 font-bold uppercase text-[9px]">{c}</span>
                              )) || <span className="text-teal-600 font-bold">None</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-xs pt-sm border-t border-outline-variant/20">
                              <div>Medications: <strong>{selectedClient.profile.medications ? 'Yes' : 'No'}</strong></div>
                              <div>Menstrual Cycle: <strong>{selectedClient.profile.cycle_status}</strong></div>
                              <div>Anxiety / Depression: <strong>{selectedClient.profile.anxiety_depression}</strong></div>
                              <div>Bloodwork: <strong>{selectedClient.profile.bloodwork_status}</strong></div>
                            </div>
                          </div>
                        )}

                        {/* Training Venue */}
                        {clientProfileTab === 'training' && (
                          <div className="space-y-xs text-xs">
                            <div>Workout Venue: <strong>{selectedClient.profile.home_or_gym}</strong></div>
                            <div>Preferred Timing: <strong>{selectedClient.profile.workout_timing}</strong></div>
                            <div>Workout Duration: <strong>{selectedClient.profile.workout_duration} mins</strong></div>
                            <div>Supplement comfort: <strong>{selectedClient.profile.supplement_comfort ? 'Comfortable' : 'Natural food only'}</strong></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-secondary italic">This client hasn't filled the onboarding wizard yet.</p>
                    )}
                  </div>

                  {/* Active Alerts Resolutions */}
                  {selectedClient.activeAlerts?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-950 p-md rounded-xl space-y-sm">
                      <h4 className="font-bold text-xs uppercase flex items-center gap-xs">
                        <ShieldAlert size={14} className="text-red-700" />
                        <span>Active Resolution Required</span>
                      </h4>
                      {selectedClient.activeAlerts.map((alert) => (
                        <div key={alert.id} className="flex justify-between items-center text-xs glass-card p-sm rounded border border-red-100">
                          <div>
                            <strong className="uppercase text-red-800">{alert.type}</strong>: {alert.details}
                          </div>
                          <button 
                            onClick={() => handleResolveAlert(alert.id)}
                            className="bg-teal-600 text-white px-2 py-1 rounded font-bold hover:bg-teal-700"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PLAN OVERRIDES EDITORS */}
                  <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30">
                    <div className="flex border-b border-outline-variant/20 mb-md gap-md">
                      <button 
                        onClick={() => { setOverrideType('workout'); setOverrideSuccess(''); setOverrideError(''); }}
                        className={`pb-sm font-bold text-xs transition-all ${overrideType === 'workout' ? 'border-b-2 border-primary text-primary' : 'text-secondary'}`}
                      >
                        Override Training Split
                      </button>
                      <button 
                        onClick={() => { setOverrideType('nutrition'); setOverrideSuccess(''); setOverrideError(''); }}
                        className={`pb-sm font-bold text-xs transition-all ${overrideType === 'nutrition' ? 'border-b-2 border-primary text-primary' : 'text-secondary'}`}
                      >
                        Override Nutrition targets
                      </button>
                    </div>

                    {overrideSuccess && (
                      <div className="bg-teal-50 border border-teal-200 text-teal-800 p-md rounded-xl mb-md text-xs font-semibold flex items-center gap-sm">
                        <span className="material-symbols-outlined text-teal-600">check_circle</span>
                        <span>{overrideSuccess}</span>
                      </div>
                    )}
                    {overrideError && (
                      <div className="bg-error-container text-on-error-container p-md rounded-xl mb-md text-xs font-semibold flex items-center gap-sm">
                        <span className="material-symbols-outlined text-error">error</span>
                        <span>{overrideError}</span>
                      </div>
                    )}

                    <form onSubmit={handleOverrideSubmit} className="space-y-md">
                      {overrideType === 'workout' ? (
                        <div className="space-y-sm">
                          {workoutStep === 1 ? (
                            <div className="space-y-md">
                              <div className="bg-primary-container/10 border border-primary/20 p-md rounded-xl text-xs text-primary font-semibold">
                                Step 1 of 2: Define Workout Split Protocol
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                                <div className="space-y-xs">
                                  <label className="text-xs font-bold text-secondary">Split Name</label>
                                  <input 
                                    className="w-full bg-surface-container-low border-outline-variant/30 rounded-lg p-sm text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    value={workoutSplit}
                                    onChange={(e) => setWorkoutSplit(e.target.value)}
                                    placeholder="e.g. Upper / Lower, PCOS Gentle"
                                    required
                                  />
                                </div>
                                <div className="space-y-xs">
                                  <label className="text-xs font-bold text-secondary">Frequency (days/wk)</label>
                                  <input 
                                    className="w-full bg-surface-container-low border-outline-variant/30 rounded-lg p-sm text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    type="number"
                                    value={workoutFreq}
                                    onChange={(e) => setWorkoutFreq(e.target.value)}
                                    min="1"
                                    max="7"
                                    required
                                  />
                                </div>
                                <div className="space-y-xs">
                                  <label className="text-xs font-bold text-secondary">Progression Cues</label>
                                  <input 
                                    className="w-full bg-surface-container-low border-outline-variant/30 rounded-lg p-sm text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    value={workoutScheme}
                                    onChange={(e) => setWorkoutScheme(e.target.value)}
                                    placeholder="e.g. Double progression"
                                    required
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setWorkoutStep(2)}
                                className="w-full py-md bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all text-xs flex items-center justify-center gap-xs"
                              >
                                <span>Next: Design Workout Days</span>
                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-md">
                              <div className="bg-primary-container/10 border border-primary/20 p-md rounded-xl text-xs text-primary font-semibold flex justify-between items-center">
                                <span>Step 2 of 2: Schedule Exercises per Day</span>
                                <span className="text-[10px] bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold uppercase">{workoutSplit} ({workoutFreq} Days)</span>
                              </div>

                              {/* Days Tabs */}
                              <div className="flex gap-xs border-b border-outline-variant/10 pb-2 overflow-x-auto">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                  const isSelected = activeDayTab === day;
                                  const exercisesCount = workoutExercises.filter(ex => (ex.day || 'Monday') === day).length;
                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() => setActiveDayTab(day)}
                                      className={`px-md py-sm rounded-lg text-xs font-bold transition-all flex items-center gap-xs ${isSelected ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'}`}
                                    >
                                      <span>{day}</span>
                                      {exercisesCount > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.25 rounded-full ${isSelected ? 'glass-card text-primary' : 'bg-secondary-fixed text-on-secondary-fixed'} font-extrabold`}>
                                          {exercisesCount}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Active Day Exercises Checklist */}
                              <div className="space-y-sm">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Exercises for {activeDayTab}</h4>
                                  <button
                                    type="button"
                                    onClick={() => setWorkoutExercises([
                                      ...workoutExercises,
                                      {
                                        name: exerciseLibrary[0]?.name || '',
                                        sets: 3,
                                        reps: '10',
                                        notes: '',
                                        day: activeDayTab
                                      }
                                    ])}
                                    className="text-[11px] text-primary font-bold flex items-center gap-xs hover:underline bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20"
                                  >
                                    <Plus size={12} /> Add Exercise to {activeDayTab}
                                  </button>
                                </div>

                                <div className="space-y-xs max-h-72 overflow-y-auto pr-xs">
                                  {workoutExercises
                                    .map((ex, originalIdx) => ({ ...ex, originalIdx }))
                                    .filter(ex => (ex.day || 'Monday') === activeDayTab)
                                    .map((ex, dayIdx) => (
                                      <div key={ex.originalIdx} className="flex gap-xs items-center glass-card p-xs rounded-lg border border-outline-variant/10 shadow-sm">
                                        <div className="w-8 h-8 rounded bg-surface-container flex-shrink-0 flex items-center justify-center overflow-hidden">
                                          {ex.name && ex.name !== 'ADD_NEW' ? (
                                            <img 
                                              src={getExerciseImage(ex.name)} 
                                              alt={ex.name}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'block';
                                              }}
                                            />
                                          ) : null}
                                          <span className="material-symbols-outlined text-[16px] text-outline" style={{display: ex.name && ex.name !== 'ADD_NEW' ? 'none' : 'block'}}>fitness_center</span>
                                        </div>
                                        <select 
                                          className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-sm text-xs flex-grow focus:outline-none focus:ring-1 focus:ring-primary"
                                          value={ex.name}
                                          onChange={(e) => {
                                            if (e.target.value === 'ADD_NEW') {
                                              setShowAddExercise(true);
                                            } else {
                                              const updated = [...workoutExercises];
                                              updated[ex.originalIdx].name = e.target.value;
                                              setWorkoutExercises(updated);
                                            }
                                          }}
                                        >
                                          <option value="" disabled>Select Exercise</option>
                                          {exerciseLibrary.map((l) => (
                                            <option key={l.id} value={l.name}>{l.name} ({l.category})</option>
                                          ))}
                                          <option value="ADD_NEW">+ Create new exercise...</option>
                                        </select>
                                        <input 
                                          type="number"
                                          placeholder="Sets"
                                          className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-sm text-xs w-14 focus:outline-none focus:ring-1 focus:ring-primary"
                                          value={ex.sets}
                                          onChange={(e) => {
                                            const updated = [...workoutExercises];
                                            updated[ex.originalIdx].sets = parseInt(e.target.value) || 0;
                                            setWorkoutExercises(updated);
                                          }}
                                        />
                                        <input 
                                          placeholder="Reps"
                                          className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-sm text-xs w-16 focus:outline-none focus:ring-1 focus:ring-primary"
                                          value={ex.reps}
                                          onChange={(e) => {
                                            const updated = [...workoutExercises];
                                            updated[ex.originalIdx].reps = e.target.value;
                                            setWorkoutExercises(updated);
                                          }}
                                        />
                                        <input 
                                          placeholder="Cues"
                                          className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-sm text-xs flex-grow focus:outline-none focus:ring-1 focus:ring-primary"
                                          value={ex.notes}
                                          onChange={(e) => {
                                            const updated = [...workoutExercises];
                                            updated[ex.originalIdx].notes = e.target.value;
                                            setWorkoutExercises(updated);
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setWorkoutExercises(workoutExercises.filter((_, i) => i !== ex.originalIdx))}
                                          className="text-red-500 hover:text-red-700 p-sm hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    ))}

                                  {workoutExercises.filter(ex => (ex.day || 'Monday') === activeDayTab).length === 0 && (
                                    <div className="text-center py-md glass-card rounded-xl border border-dashed border-outline-variant/40 text-secondary text-xs">
                                      No exercises scheduled for {activeDayTab} yet. Click add above!
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Back and Publish Buttons */}
                              <div className="flex gap-sm pt-sm border-t border-outline-variant/10">
                                <button
                                  type="button"
                                  onClick={() => setWorkoutStep(1)}
                                  className="px-md py-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant rounded-xl text-xs font-bold transition-all flex items-center gap-xs"
                                >
                                  <span className="material-symbols-outlined text-xs">arrow_back</span>
                                  <span>Back to Basics</span>
                                </button>
                                <button
                                  type="submit"
                                  disabled={overrideLoading}
                                  className="flex-grow py-sm bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all text-xs"
                                >
                                  {overrideLoading ? 'Applying Overrides...' : 'Publish Protocol to Client'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-sm">
                          <div className="grid grid-cols-4 gap-xs">
                            <div className="space-y-xs">
                              <label className="text-xs font-bold text-secondary">Calories (kcal)</label>
                              <input 
                                type="number" 
                                min="0"
                                className="w-full bg-surface-container-low border-outline-variant/30 rounded-lg p-sm text-xs"
                                value={nutriCal}
                                onChange={(e) => setNutriCal(e.target.value)}
                              />
                            </div>
                            <div className="space-y-xs">
                              <label className="text-xs font-bold text-secondary">Protein (g)</label>
                              <input 
                                type="number" 
                                min="0"
                                className="w-full bg-surface-container-low border-outline-variant/30 rounded-lg p-sm text-xs"
                                value={nutriProtein}
                                onChange={(e) => setNutriProtein(e.target.value)}
                              />
                            </div>
                            <div className="space-y-xs">
                              <label className="text-xs font-bold text-secondary">Carbs (g)</label>
                              <input 
                                type="number" 
                                min="0"
                                className="w-full bg-surface-container-low border-outline-variant/30 rounded-lg p-sm text-xs"
                                value={nutriCarbs}
                                onChange={(e) => setNutriCarbs(e.target.value)}
                              />
                            </div>
                            <div className="space-y-xs">
                              <label className="text-xs font-bold text-secondary">Fats (g)</label>
                              <input 
                                type="number" 
                                min="0"
                                className="w-full bg-surface-container-low border-outline-variant/30 rounded-lg p-sm text-xs"
                                value={nutriFats}
                                onChange={(e) => setNutriFats(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-xs">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-secondary">Meal Timeline suggestions</label>
                              <button
                                type="button"
                                onClick={() => setMealTemplates([...mealTemplates, { meal: 'Snack', options: [''], target_macro_estimate: '' }])}
                                className="text-[11px] text-primary font-bold flex items-center gap-xs hover:underline"
                              >
                                <Plus size={12} /> Add Meal Block
                              </button>
                            </div>

                            <div className="space-y-sm">
                              {mealTemplates.map((template, mIdx) => (
                                <div key={mIdx} className="glass-card p-sm rounded-xl border border-outline-variant/20 space-y-sm">
                                  <div className="flex justify-between items-center">
                                    <input 
                                      className="font-bold text-xs bg-transparent border-none text-on-surface"
                                      value={template.meal}
                                      onChange={(e) => {
                                        const updated = [...mealTemplates];
                                        updated[mIdx].meal = e.target.value;
                                        setMealTemplates(updated);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setMealTemplates(mealTemplates.filter((_, i) => i !== mIdx))}
                                      className="text-[10px] text-red-500 hover:underline"
                                    >
                                      Remove Meal
                                    </button>
                                  </div>

                                  <div className="space-y-xs">
                                    {template.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex gap-xs items-center">
                                        <input 
                                          className="glass-card border-outline-variant/30 rounded-lg p-xs text-xs flex-grow"
                                          placeholder="Option text (e.g. 2 boiled eggs)"
                                          value={opt}
                                          onChange={(e) => {
                                            const updated = [...mealTemplates];
                                            updated[mIdx].options[oIdx] = e.target.value;
                                            setMealTemplates(updated);
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveBuilder({ mealIndex: mIdx, optionIndex: oIdx });
                                            setBuilderFoods([]);
                                          }}
                                          className="text-[10px] bg-surface-container-highest px-2 py-1 rounded"
                                        >
                                          🍲 Foods
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...mealTemplates];
                                        updated[mIdx].options.push('');
                                        setMealTemplates(updated);
                                      }}
                                      className="text-[10px] text-primary hover:underline"
                                    >
                                      + Add Option
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {overrideType === 'nutrition' && (
                        <button
                          type="submit"
                          disabled={overrideLoading}
                          className="w-full py-md bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all text-xs"
                        >
                          {overrideLoading ? 'Applying Overrides...' : 'Publish Protocol to Client'}
                        </button>
                      )}
                    </form>
                  </div>

                </div>
              ) : (
                <div className="glass-card border border-outline-variant/20 rounded-2xl p-xl text-center min-h-[300px] flex flex-col justify-center items-center text-secondary">
                  <span className="material-symbols-outlined text-[48px] mb-sm">group</span>
                  <p className="font-bold text-sm">Select a client from the registry to manage protocols.</p>
                </div>
              )}
            </section>

          </div>
        )}

        {activeTab === 'library' && (
          /* ASSET LIBRARY TAB */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg animate-in fade-in duration-500">
            {/* Exercises Library */}
            <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
              <div className="flex justify-between items-center border-b pb-sm">
                <h3 className="font-bold text-md text-on-surface">Exercise Asset Repository</h3>
                <button 
                  onClick={() => setShowAddExercise(!showAddExercise)}
                  className="text-xs bg-primary text-on-primary px-2 py-1 rounded font-bold"
                >
                  Create Exercise
                </button>
              </div>

              {showAddExercise && (
                <div className="glass-card p-md rounded-xl border space-y-sm text-xs">
                  <input 
                    placeholder="Name (e.g. Incline DB Bench)" 
                    className="w-full p-sm rounded border glass-card"
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                  />
                  <input 
                    placeholder="Category (e.g. Chest)" 
                    className="w-full p-sm rounded border glass-card"
                    value={newExerciseCategory}
                    onChange={(e) => setNewExerciseCategory(e.target.value)}
                  />
                  <button 
                    onClick={async () => {
                      if (!newExerciseName) return;
                      await api.addExercise({ name: newExerciseName, category: newExerciseCategory });
                      setNewExerciseName('');
                      setShowAddExercise(false);
                      loadData();
                    }}
                    className="w-full bg-primary text-on-primary p-xs rounded font-bold"
                  >
                    Save Exercise
                  </button>
                </div>
              )}

              <div className="max-h-[500px] overflow-y-auto space-y-xs text-xs">
                {exerciseLibrary.map((ex) => (
                  <div key={ex.id} className="p-sm glass-card border rounded flex justify-between">
                    <strong>{ex.name}</strong>
                    <span className="text-secondary font-semibold uppercase text-[10px]">{ex.category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Food items Library */}
            <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
              <div className="flex justify-between items-center border-b pb-sm">
                <h3 className="font-bold text-md text-on-surface">Desi Food database</h3>
                <button 
                  onClick={() => setShowAddFood(!showAddFood)}
                  className="text-xs bg-primary text-on-primary px-2 py-1 rounded font-bold"
                >
                  Create Food
                </button>
              </div>

              {showAddFood && (
                <div className="glass-card p-md rounded-xl border space-y-sm text-xs">
                  <input 
                    placeholder="Food Name" 
                    className="w-full p-sm rounded border glass-card"
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                  />
                  <div className="grid grid-cols-5 gap-xs">
                    <input placeholder="Unit" className="p-xs rounded border glass-card" value={newFoodServingUnit} onChange={(e) => setNewFoodServingUnit(e.target.value)} />
                    <input placeholder="Kcal" className="p-xs rounded border glass-card" type="number" min="0" value={newFoodCalories} onChange={(e) => setNewFoodCalories(e.target.value)} />
                    <input placeholder="Prot" className="p-xs rounded border glass-card" type="number" min="0" value={newFoodProtein} onChange={(e) => setNewFoodProtein(e.target.value)} />
                    <input placeholder="Carb" className="p-xs rounded border glass-card" type="number" min="0" value={newFoodCarbs} onChange={(e) => setNewFoodCarbs(e.target.value)} />
                    <input placeholder="Fats" className="p-xs rounded border glass-card" type="number" min="0" value={newFoodFats} onChange={(e) => setNewFoodFats(e.target.value)} />
                  </div>
                  <button 
                    onClick={async () => {
                      if (!newFoodName) return;
                      await api.addFood({
                        name: newFoodName,
                        calories: parseInt(newFoodCalories),
                        protein: parseFloat(newFoodProtein),
                        carbs: parseFloat(newFoodCarbs),
                        fats: parseFloat(newFoodFats),
                        serving_unit: newFoodServingUnit
                      });
                      setNewFoodName('');
                      setShowAddFood(false);
                      loadData();
                    }}
                    className="w-full bg-primary text-on-primary p-xs rounded font-bold"
                  >
                    Save Food Item
                  </button>
                </div>
              )}

              <div className="max-h-[500px] overflow-y-auto space-y-xs text-xs">
                {foodLibrary.map((food) => (
                  <div key={food.id} className="p-sm glass-card border rounded flex justify-between">
                    <div>
                      <strong>{food.name}</strong>
                      <span className="text-[9px] text-secondary block">Unit: {food.serving_unit}</span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="font-bold text-primary">{food.calories} kcal</span>
                      <div className="text-on-surface-variant">P:{food.protein}g C:{food.carbs}g F:{food.fats}g</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-500">
            <div className="glass-card rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col flex-1 overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center gap-sm px-lg py-md border-b border-outline-variant/20 bg-surface-container-lowest">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px]">smart_toy</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-on-surface font-bold text-base">Fitness Buddy Coach AI</h3>
                  <p className="text-primary text-xs font-semibold animate-pulse">Online — Assisting Coach {user?.name}</p>
                </div>
                <button
                  onClick={() => {
                    setChatMessages([{ sender: 'assistant', text: 'Hello Coach! I\'m your AI assistant. I can help you analyze client plateaus, brainstorm workout splits, adjust macros, or manage difficult coaching situations.' }]);
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
                {['Client hit a plateau', 'Suggest a 4-day Upper/Lower split', 'How to handle knee pain?', 'Diet break protocols'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSendCoachMessage(s)}
                    className="text-xs bg-surface-container-low hover:bg-surface-container-high text-primary border border-outline-variant/30 rounded-full px-3 py-1.5 font-semibold transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-sm px-lg py-md border-t border-outline-variant/20 glass-card">
                <input
                  type="text"
                  className="flex-grow bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-md py-sm text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary"
                  placeholder="Ask about workout programming, client plateaus, nutrition strategies..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCoachMessage()}
                />
                <button
                  onClick={() => handleSendCoachMessage()}
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

        {/* INTELLIGENCE BASE TAB */}
        {activeTab === 'intelligence' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg animate-in fade-in duration-500">
            {/* Knowledge Base Overview */}
            <div className="lg:col-span-7 glass-card rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col h-[750px]">
              <div className="p-md border-b border-outline-variant/20 flex justify-between items-center">
                <div className="flex items-center gap-sm">
                  <Database className="text-primary" size={24} />
                  <h3 className="font-headline-md text-[20px] font-extrabold text-on-surface">Knowledge Base Assets</h3>
                </div>
                <button onClick={loadKnowledge} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-md space-y-md">
                {knowledgeSources.length === 0 ? (
                  <p className="text-secondary text-sm text-center mt-xl">No knowledge base assets found. Add some text or YouTube videos to get started.</p>
                ) : (
                  knowledgeSources.map((source, idx) => (
                    <div key={idx} className="bg-surface-container-lowest border border-outline-variant/30 p-md rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-md">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${source.source_type === 'YOUTUBE_VIDEO' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {source.source_type === 'YOUTUBE_VIDEO' ? 'play_circle' : 'description'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface">{source.name}</p>
                          <p className="text-[11px] text-secondary font-medium uppercase tracking-wider">{source.source_type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-right">
                          <p className="text-primary font-bold text-lg leading-none">{source.chunks_count}</p>
                          <p className="text-[10px] text-secondary">Embedded Chunks</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveKnowledge(source.name)}
                          className="text-error hover:bg-error-container p-1 rounded transition-colors flex items-center justify-center mt-1"
                          title="Remove Knowledge Source"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ingestion Controls */}
            <div className="lg:col-span-5 space-y-lg">
              {kbMessage.text && (
                <div className={`p-md rounded-xl text-sm font-semibold flex items-center gap-sm ${kbMessage.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-teal-50 text-teal-800 border border-teal-200'}`}>
                  <span className="material-symbols-outlined">{kbMessage.type === 'error' ? 'error' : 'check_circle'}</span>
                  <span>{kbMessage.text}</span>
                </div>
              )}

              {/* Add Text Note */}
              <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30">
                <h4 className="font-bold text-on-surface mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  Add Text Note
                </h4>
                <p className="text-xs text-secondary mb-md">Paste specific philosophies, diet rules, or workout cues directly into the AI's brain.</p>
                <div className="space-y-sm">
                  <input
                    type="text"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-sm text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Note Title (e.g. PCOS Cardio Rules)"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-sm text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-32 resize-none"
                    placeholder="Enter the exact rules or philosophy here..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                  />
                  <button
                    onClick={async () => {
                      if (!newNoteTitle || !newNoteContent) return;
                      setKbLoading(true);
                      setKbMessage({ type: '', text: '' });
                      try {
                        const res = await api.addKnowledgeText(user.id, newNoteTitle, newNoteContent);
                        setKbMessage({ type: 'success', text: res.message });
                        setNewNoteTitle('');
                        setNewNoteContent('');
                        loadKnowledge();
                      } catch (err) {
                        setKbMessage({ type: 'error', text: err.message });
                      } finally {
                        setKbLoading(false);
                      }
                    }}
                    disabled={kbLoading || !newNoteTitle || !newNoteContent}
                    className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary py-sm rounded-lg font-bold text-sm transition-all"
                  >
                    Embed Text Note
                  </button>
                </div>
              </div>

              {/* Document Asset Uploader */}
              <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30">
                <h4 className="font-bold text-on-surface mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">upload_file</span>
                  Document Asset Uploader
                </h4>
                <p className="text-xs text-secondary mb-md">Upload a document (PDF, DOCX, XLS). We'll automatically parse and embed it into the AI's brain.</p>
                <div className="space-y-sm">
                  <input
                    type="file"
                    accept=".pdf,.docx,.xls,.xlsx"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-xs text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    onChange={(e) => setNewAssetFile(e.target.files[0])}
                  />
                  <button
                    onClick={async () => {
                      if (!newAssetFile) return;
                      setKbLoading(true);
                      setKbMessage({ type: '', text: '' });
                      try {
                        const formData = new FormData();
                        formData.append('trainerId', user.id);
                        formData.append('file', newAssetFile);
                        
                        const res = await api.uploadKnowledge(formData);
                        setKbMessage({ type: 'success', text: res.message });
                        if (res.chunks && res.chunks.length > 0) {
                          setPreviewChunks(res.chunks);
                        }
                        setNewAssetFile(null);
                        // Reset file input visually
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) fileInput.value = '';
                        loadKnowledge();
                      } catch (err) {
                        setKbMessage({ type: 'error', text: err.message });
                      } finally {
                        setKbLoading(false);
                      }
                    }}
                    disabled={kbLoading || !newAssetFile}
                    className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary py-sm rounded-lg font-bold text-sm transition-all"
                  >
                    Start Ingestion Job
                  </button>
                </div>
              </div>

              {/* Transcript Preview Section */}
              {previewChunks && (
                <div className="glass-card rounded-2xl p-lg shadow-sm border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-md">
                    <h4 className="font-bold text-on-surface flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary">subtitles</span>
                      Extracted Transcripts & Embeddings
                    </h4>
                    <button onClick={() => setPreviewChunks(null)} className="text-secondary hover:text-primary">
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-secondary mb-md">These chunks have been successfully embedded and saved to your knowledge base. The original file has been securely discarded from memory.</p>
                  <div className="space-y-sm max-h-[400px] overflow-y-auto pr-sm custom-scrollbar">
                    {previewChunks.map((chunk, idx) => (
                      <div key={idx} className="bg-surface-container-lowest border border-outline-variant/30 p-md rounded-xl">
                        <span className="text-[10px] font-bold text-primary uppercase mb-xs block">Chunk {idx + 1} • {chunk.source_name}</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed font-mono">{chunk.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
        
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="h-[calc(100vh-140px)] min-h-[600px] w-full mt-0 animate-in fade-in duration-500">
            <CommunityPage user={user} />
          </div>
        )}
      </main>

      {/* FOOD SELECTOR BUILDER MODAL */}
      {activeBuilder && (
        <div className="fixed inset-0 bg-black/85 flex justify-center items-center z-50 p-md">
          <div className="glass-card rounded-2xl p-lg max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-xs">
                <span>🍲 Food Item Selector</span>
              </h3>
              <button onClick={() => setActiveBuilder(null)} className="text-secondary hover:text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-xs">
              <label className="text-xs font-bold text-secondary">Add food to option composition</label>
              <select
                className="w-full bg-surface-container-low border-outline-variant/30 rounded-lg p-sm text-xs"
                onChange={(e) => {
                  if (e.target.value) {
                    setBuilderFoods([...builderFoods, { name: e.target.value, quantity: '1.0' }]);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>-- Select a food item --</option>
                {foodLibrary.map(f => (
                  <option key={f.id} value={f.name}>{f.name} ({f.calories} kcal / {f.serving_unit})</option>
                ))}
              </select>
            </div>

            {/* Selected items builder list */}
            {builderFoods.length > 0 && (
              <div className="space-y-xs max-h-48 overflow-y-auto">
                {builderFoods.map((bf, idx) => {
                  const food = foodLibrary.find(f => f.name === bf.name);
                  return (
                    <div key={idx} className="flex gap-xs items-center glass-card p-sm rounded border text-xs">
                      <div className="flex-grow">
                        <strong className="text-on-surface">{bf.name}</strong>
                        <span className="text-[10px] text-on-surface-variant block">Unit: {food?.serving_unit}</span>
                      </div>
                      <input 
                        type="number"
                        className="glass-card border w-14 p-xs text-center rounded"
                        value={bf.quantity}
                        onChange={(e) => {
                          const updated = [...builderFoods];
                          updated[idx].quantity = e.target.value;
                          setBuilderFoods(updated);
                        }}
                      />
                      <button 
                        onClick={() => setBuilderFoods(builderFoods.filter((_, i) => i !== idx))}
                        className="text-red-500 p-xs"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live Totals summary */}
            {(() => {
              let totalCal = 0;
              let totalProt = 0;
              let totalCarb = 0;
              let totalFat = 0;
              builderFoods.forEach(bf => {
                const food = foodLibrary.find(f => f.name === bf.name);
                const qty = parseFloat(bf.quantity) || 1;
                if (food) {
                  totalCal += food.calories * qty;
                  totalProt += food.protein * qty;
                  totalCarb += food.carbs * qty;
                  totalFat += food.fats * qty;
                }
              });

              return (
                <div className="bg-surface-container-low p-sm rounded text-xs flex justify-between font-bold">
                  <span>Totals: {Math.round(totalCal)} kcal</span>
                  <span>P: {totalProt.toFixed(1)}g | C: {totalCarb.toFixed(1)}g | F: {totalFat.toFixed(1)}g</span>
                </div>
              );
            })()}

            <div className="flex justify-end gap-xs border-t pt-sm">
              <button 
                type="button" 
                onClick={() => setActiveBuilder(null)}
                className="bg-surface-container-high text-on-surface-variant px-lg py-sm rounded-lg font-bold text-xs"
              >
                Cancel
              </button>
              <button 
                type="button"
                className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold text-xs"
                onClick={() => {
                  const desc = builderFoods.map(bf => {
                    const qty = parseFloat(bf.quantity) || 1;
                    const food = foodLibrary.find(f => f.name === bf.name);
                    const unit = food ? food.serving_unit : '';
                    const qtyStr = qty === 1 ? '' : ` (${bf.quantity} x ${unit})`;
                    return `${bf.name}${qtyStr}`;
                  }).join(' + ');

                  let totalCal = 0;
                  let totalProt = 0;
                  let totalCarb = 0;
                  let totalFat = 0;
                  builderFoods.forEach(bf => {
                    const food = foodLibrary.find(f => f.name === bf.name);
                    const qty = parseFloat(bf.quantity) || 1;
                    if (food) {
                      totalCal += food.calories * qty;
                      totalProt += food.protein * qty;
                      totalCarb += food.carbs * qty;
                      totalFat += food.fats * qty;
                    }
                  });

                  const macroStr = `Protein: ~${Math.round(totalProt)}g | Carbs: ~${Math.round(totalCarb)}g | Fats: ~${Math.round(totalFat)}g`;

                  const { mealIndex, optionIndex } = activeBuilder;
                  const updated = [...mealTemplates];
                  updated[mealIndex].options[optionIndex] = desc;
                  updated[mealIndex].target_macro_estimate = macroStr;
                  setMealTemplates(updated);

                  setActiveBuilder(null);
                }}
              >
                Apply Composition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
