import { useState, useEffect } from 'react';
import { api } from './services/api';
import OnboardingWizard from './components/OnboardingWizard';
import ClientDashboard from './components/ClientDashboard';
import CoachDashboard from './components/CoachDashboard';
import LandingPage from './components/LandingPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('CLIENT'); // CLIENT or COACH
  const [onboardData, setOnboardData] = useState(null); // { profile, workoutPlan, nutritionPlan }
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Login Page States
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [registerRole, setRegisterRole] = useState('CLIENT');
  const [coachCode, setCoachCode] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Check if logged in user already has a profile
  const checkProfileStatus = async (user) => {
    try {
      const data = await api.getProfile(user.id);
      setOnboardData(data);
    } catch (err) {
      console.error('Failed to retrieve profile status:', err.message);
    }
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem('fitness_buddy_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          setCurrentRole(user.role);
          await checkProfileStatus(user);
        } catch (e) {
          localStorage.removeItem('fitness_buddy_user');
        }
      }
      setIsInitializing(false);
    };
    restoreSession();
  }, []);

  const handleLogin = async (emailToUse) => {
    setAuthLoading(true);
    setAuthError('');
    const targetEmail = emailToUse || email;

    if (!targetEmail.trim()) {
      setAuthError('Please enter a valid email.');
      setAuthLoading(false);
      return;
    }

    try {
      const user = await api.login(targetEmail.trim());
      localStorage.setItem('fitness_buddy_user', JSON.stringify(user));
      setCurrentUser(user);
      setCurrentRole(user.role);
      await checkProfileStatus(user);
    } catch (err) {
      if (err.message.includes('not found')) {
        setEmail(targetEmail);
        setShowRegister(true);
      } else {
        setAuthError('Authentication failed: ' + err.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    if (!name.trim() || !email.trim()) {
      setAuthError('Name and email are required.');
      setAuthLoading(false);
      return;
    }

    try {
      const user = await api.register(name.trim(), email.trim(), registerRole, coachCode.trim());
      localStorage.setItem('fitness_buddy_user', JSON.stringify(user));
      setCurrentUser(user);
      setCurrentRole(user.role);
      await checkProfileStatus(user);
    } catch (err) {
      setAuthError('Registration failed: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail) => {
    handleLogin(quickEmail);
  };

  const handleOnboardingComplete = (data) => {
    setOnboardData({
      profile: data.profile,
      workoutPlan: data.workoutPlan,
      nutritionPlan: data.nutritionPlan,
      activeAlerts: data.alert ? [data.alert] : []
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('fitness_buddy_user');
    setCurrentUser(null);
    setOnboardData(null);
    setEmail('');
    setName('');
    setShowRegister(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loader-ring"></div>
      </div>
    );
  }

  // If not logged in, render authentication / login interface
  if (!currentUser) {
    return (
      <LandingPage
        email={email}
        setEmail={setEmail}
        name={name}
        setName={setName}
        registerRole={registerRole}
        setRegisterRole={setRegisterRole}
        coachCode={coachCode}
        setCoachCode={setCoachCode}
        showRegister={showRegister}
        setShowRegister={setShowRegister}
        authError={authError}
        authLoading={authLoading}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleQuickLogin={handleQuickLogin}
      />
    );
  }

  // If logged in:
  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner role toggle if they are COACH role to switch perspective */}
      {currentUser.role === 'COACH' && (
        <div className="bg-primary-container text-on-primary-container px-lg py-xs flex flex-col sm:flex-row justify-between items-center gap-xs sm:gap-0 text-xs font-bold shadow-sm">
          <span className="text-center sm:text-left">Logged in as Coach ({currentUser.name})</span>
          <div className="flex gap-xs w-full sm:w-auto justify-center sm:justify-start">
            <button 
              onClick={() => setCurrentRole('COACH')}
              className={`px-sm py-1 rounded transition-all ${currentRole === 'COACH' ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-primary-container/20 text-on-primary-container'}`}
            >
              Coach View
            </button>
            <button 
              onClick={() => {
                setCurrentRole('CLIENT');
                // Ensure they have a fake or real client profile context
                if (!onboardData) {
                  checkProfileStatus(currentUser);
                }
              }}
              className={`px-sm py-1 rounded transition-all ${currentRole === 'CLIENT' ? 'bg-primary text-on-primary shadow-sm' : 'hover:bg-primary-container/20 text-on-primary-container'}`}
            >
              Client View
            </button>
          </div>
        </div>
      )}

      {currentRole === 'CLIENT' ? (
        (!onboardData || !onboardData.profile) && currentUser.role !== 'COACH' ? (
          <div className="max-w-4xl mx-auto py-xl">
            <div className="text-center mb-lg">
              <h1 className="text-headline-lg font-bold text-primary">Onboarding Wizard</h1>
              <p className="text-on-surface-variant">Customize your metabolic target plan.</p>
            </div>
            <OnboardingWizard user={currentUser} onComplete={handleOnboardingComplete} />
          </div>
        ) : (
          <ClientDashboard
            user={currentUser}
            initialData={
              onboardData?.profile ? onboardData : {
                user: currentUser,
                profile: {
                  goal: 'Demonstration',
                  weight: 75,
                  adherence_probability: 1.0,
                  age: 30,
                  gender: 'MALE',
                  height: 180,
                  location: 'Global',
                  stress_level: 'LOW'
                },
                workoutPlan: {
                  split: 'Demo Split',
                  frequency: 3,
                  exercises: [{ name: 'Pushups', sets: 3, reps: 10, day: 'Monday' }]
                },
                nutritionPlan: {
                  calories: 2500,
                  protein: 150,
                  carbs: 300,
                  fats: 80,
                  meal_templates: [{ meal: 'Breakfast', options: 'Oats' }]
                },
                activeAlerts: []
              }
            }
            onReOnboard={() => setOnboardData(null)}
            onUpdateUser={setCurrentUser}
            onLogout={handleLogout}
          />
        )
      ) : (
        <CoachDashboard 
          user={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
