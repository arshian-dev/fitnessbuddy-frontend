import { useState } from 'react';
import { api } from '../services/api';

const CONDITIONS_LIST = [
  'PCOS',
  'Knee injury',
  'Knee pain',
  'Type 2 diabetes',
  'Pre-diabetes / insulin resistance',
  'Hypertension (high BP)',
  'Hypothyroidism / Hyperthyroidism',
  'Eating disorder',
  'Heart condition',
  'Severe injury',
  'High cholesterol',
  'Fatty liver',
  'None'
];

const STAPLES_LIST = [
  { value: 'Roti / Chapati (Daily)', label: 'Roti / Chapati' },
  { value: 'Rice (Daily)', label: 'Rice / Basmati' },
  { value: 'Paneer / Tofu', label: 'Paneer / Tofu' },
  { value: 'Daal / Lentils', label: 'Daal / Lentils' },
  { value: 'Traditional Desi ghee / Butter', label: 'Desi Ghee / Butter' }
];

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('Analyzing biological markers...');
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState(null); // holds API result

  // Step 1: Basic Bio Metrics
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState('MALE');
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(172);
  const [location, setLocation] = useState('Pakistan');
  const [occupation, setOccupation] = useState('Employed');
  const [contactNumber, setContactNumber] = useState('');

  // Step 2: Habits & Diet (Culture)
  const [homeOrGym, setHomeOrGym] = useState('GYM');
  const [workoutTiming, setWorkoutTiming] = useState('EVENING');
  const [workoutDuration, setWorkoutDuration] = useState('45-60');
  const [supplementComfort, setSupplementComfort] = useState(true);
  const [dietStrictness, setDietStrictness] = useState('MODERATE');
  const [cookingControl, setCookingControl] = useState('FULL');
  const [waterGlasses, setWaterGlasses] = useState(8);
  const [chaiCups, setChaiCups] = useState(1);
  const [selectedStaples, setSelectedStaples] = useState(['Roti / Chapati (Daily)', 'Daal / Lentils']);
  const [dawatFrequency, setDawatFrequency] = useState('Occasional (Weekends)');

  // Step 3: Health & Goals
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [medications, setMedications] = useState(false);
  const [cycleStatus, setCycleStatus] = useState('NOT_APPLICABLE');
  const [anxietyDepression, setAnxietyDepression] = useState('NO');
  const [bloodworkStatus, setBloodworkStatus] = useState('NEVER');
  const [sleepHours, setSleepHours] = useState(7.0);
  const [sleepConsistency, setSleepConsistency] = useState('CONSISTENT');
  const [stressLevel, setStressLevel] = useState('MEDIUM');
  const [smokingStatus, setSmokingStatus] = useState('NO');
  const [goal, setGoal] = useState('FAT_LOSS');
  const [experience, setExperience] = useState('BEGINNER');
  const [endGoalDescription, setEndGoalDescription] = useState('');

  const toggleCondition = (cond) => {
    if (cond === 'None') {
      setSelectedConditions([]);
      return;
    }
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions.filter((c) => c !== 'None'), cond]);
    }
  };

  const toggleStaple = (staple) => {
    if (selectedStaples.includes(staple)) {
      setSelectedStaples(selectedStaples.filter((s) => s !== staple));
    } else {
      setSelectedStaples([...selectedStaples, staple]);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      triggerAiAnalysis();
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const triggerAiAnalysis = async () => {
    setStep(4);
    setAiAnalyzing(true);
    setError('');

    // Simulated status updates for realistic feel
    const statuses = [
      'Analyzing biological markers and location metrics...',
      'Computing calorie ceilings and protein target splits...',
      'Reviewing medical history and joint-safe protocols...',
      'Mapping South Asian dietary staples and swap libraries...',
      'Finalizing your Fitness Buddy intelligence plan...'
    ];

    let currentStatusIdx = 0;
    const interval = setInterval(() => {
      if (currentStatusIdx < statuses.length - 1) {
        currentStatusIdx++;
        setAnalysisStatus(statuses[currentStatusIdx]);
      }
    }, 600);

    const profileData = {
      userId: user.id,
      age: parseInt(age),
      gender,
      weight: parseFloat(weight),
      height: parseFloat(height),
      location,
      occupation,
      contactNumber,
      conditions: selectedConditions,
      medications,
      cycleStatus: gender === 'FEMALE' ? cycleStatus : 'NOT_APPLICABLE',
      anxietyDepression,
      bloodworkStatus,
      sleepHours: parseFloat(sleepHours),
      sleepConsistency,
      stressLevel,
      smokingStatus,
      waterGlasses: parseInt(waterGlasses),
      chaiCups: parseInt(chaiCups),
      homeOrGym,
      workoutTiming,
      workoutDuration,
      equipmentAccess: homeOrGym === 'GYM' ? ['All gym machines', 'Free weights'] : ['Nothing'],
      supplementComfort,
      dietStrictnessTolerance: dietStrictness,
      cookingControl,
      goal,
      experience,
      endGoalDescription: `${endGoalDescription}. Staples: ${selectedStaples.join(', ')}. Dawats: ${dawatFrequency}`
    };

    try {
      const res = await api.saveProfile(profileData);
      clearInterval(interval);
      setResultData(res);
      setAiAnalyzing(false);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'Failed to submit onboarding form.');
      setAiAnalyzing(false);
    }
  };

  const handleFinish = () => {
    if (resultData) {
      onComplete(resultData);
    }
  };

  const getExercises = () => {
    if (!resultData || !resultData.workoutPlan || !resultData.workoutPlan.exercises) return [];
    return typeof resultData.workoutPlan.exercises === 'string'
      ? JSON.parse(resultData.workoutPlan.exercises)
      : resultData.workoutPlan.exercises;
  };

  const getMeals = () => {
    if (!resultData || !resultData.nutritionPlan || !resultData.nutritionPlan.meal_templates) return [];
    return typeof resultData.nutritionPlan.meal_templates === 'string'
      ? JSON.parse(resultData.nutritionPlan.meal_templates)
      : resultData.nutritionPlan.meal_templates;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-container-margin py-lg">
      {/* Progress Tracker */}
      <div className="mb-xl px-md">
        <div className="flex justify-between relative mb-base">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-highest -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          {/* Step Bubbles */}
          <div className="step-indicator z-10 flex flex-col items-center gap-xs">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md transition-colors duration-300 ${step >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-secondary'}`}>1</div>
            <span className={`text-xs font-bold ${step >= 1 ? 'text-primary' : 'text-secondary'}`}>Profile</span>
          </div>
          <div className="step-indicator z-10 flex flex-col items-center gap-xs">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md transition-colors duration-300 ${step >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-secondary'}`}>2</div>
            <span className={`text-xs font-bold ${step >= 2 ? 'text-primary' : 'text-secondary'}`}>Culture</span>
          </div>
          <div className="step-indicator z-10 flex flex-col items-center gap-xs">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md transition-colors duration-300 ${step >= 3 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-secondary'}`}>3</div>
            <span className={`text-xs font-bold ${step >= 3 ? 'text-primary' : 'text-secondary'}`}>Health</span>
          </div>
          <div className="step-indicator z-10 flex flex-col items-center gap-xs">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md transition-colors duration-300 ${step >= 4 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-secondary'}`}>4</div>
            <span className={`text-xs font-bold ${step >= 4 ? 'text-primary' : 'text-secondary'}`}>AI Review</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-md rounded-xl mb-md text-sm font-semibold flex items-center gap-sm">
          <span className="material-symbols-outlined text-error">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="glass-card rounded-xl p-md md:p-xl shadow-lg relative overflow-hidden bg-white">
        {/* STEP 1: Basic Bio Metrics */}
        {step === 1 && (
          <div className="space-y-lg">
            <div className="space-y-xs">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Tell us about yourself</h2>
              <p className="text-on-surface-variant">This helps us calculate your baseline metabolic rate accurately.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">Age (years)</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  placeholder="e.g. 28" 
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="16"
                  max="100"
                  required
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">Gender</label>
                <select 
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  value={gender}
                  onChange={(e) => { setGender(e.target.value); if (e.target.value === 'MALE') setCycleStatus('NOT_APPLICABLE'); else setCycleStatus('REGULAR'); }}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">Weight (kg)</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  placeholder="e.g. 75" 
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="30"
                  max="200"
                  required
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">Height (cm)</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  placeholder="e.g. 172" 
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min="100"
                  max="250"
                  required
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">Primary Location</label>
                <select 
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="Pakistan">Pakistan</option>
                  <option value="UAE/Gulf">UAE / Gulf Region</option>
                  <option value="U.K.">United Kingdom</option>
                  <option value="USA/Canada">USA / Canada</option>
                  <option value="Europe">Europe</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">WhatsApp Contact Number</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  placeholder="e.g. +923001234567" 
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Diet & Habits (Culture) */}
        {step === 2 && (
          <div className="space-y-lg">
            <div className="space-y-xs">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Dietary Habits & staples</h2>
              <p className="text-on-surface-variant">We customize macros and swaps based on traditional South Asian staples.</p>
            </div>
            
            <div className="space-y-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface">Diet Strictness Preference</label>
                  <select 
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none"
                    value={dietStrictness}
                    onChange={(e) => setDietStrictness(e.target.value)}
                  >
                    <option value="FLEXIBLE">Flexible (allows cheat ratios)</option>
                    <option value="MODERATE">Moderate compliance</option>
                    <option value="STRICT">Strict macro counting</option>
                  </select>
                </div>
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface">Kitchen Cooking Dynamic</label>
                  <select 
                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none"
                    value={cookingControl}
                    onChange={(e) => setCookingControl(e.target.value)}
                  >
                    <option value="FULL">Cook my own meals</option>
                    <option value="PARTIAL">Cook sometimes / family cooking</option>
                    <option value="NONE">Hostel / maid cooks / eat out</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                <div className="space-y-md">
                  <label className="font-label-md text-label-md text-on-surface">Traditional Staples Checklist</label>
                  <div className="grid grid-cols-1 gap-sm">
                    {STAPLES_LIST.map((staple) => (
                      <label key={staple.value} className="flex items-center gap-md p-sm bg-surface-container-low rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
                        <input 
                          type="checkbox"
                          checked={selectedStaples.includes(staple.value)}
                          onChange={() => toggleStaple(staple.value)}
                          className="rounded border-outline-variant text-primary focus:ring-primary"
                        />
                        <span className="font-medium text-sm">{staple.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Dawat Frequency (Social Eating)</label>
                    <select 
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none"
                      value={dawatFrequency}
                      onChange={(e) => setDawatFrequency(e.target.value)}
                    >
                      <option value="Rarely (Once a month)">Rarely (Once a month)</option>
                      <option value="Occasional (Weekends)">Occasional (Weekends)</option>
                      <option value="Frequent (3+ times a week)">Frequent (3+ times a week)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface">Chai (cups/day)</label>
                      <input 
                        type="number"
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md"
                        value={chaiCups}
                        min="0"
                        onChange={(e) => setChaiCups(e.target.value)}
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface">Water (glasses/day)</label>
                      <input 
                        type="number"
                        className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md"
                        value={waterGlasses}
                        min="0"
                        onChange={(e) => setWaterGlasses(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Workout Venue</label>
                    <div className="grid grid-cols-2 gap-sm">
                      <button
                        type="button"
                        className={`py-sm rounded-lg font-bold border ${homeOrGym === 'GYM' ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-low border-outline-variant text-secondary'}`}
                        onClick={() => setHomeOrGym('GYM')}
                      >
                        Gym
                      </button>
                      <button
                        type="button"
                        className={`py-sm rounded-lg font-bold border ${homeOrGym === 'HOME' ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-low border-outline-variant text-secondary'}`}
                        onClick={() => setHomeOrGym('HOME')}
                      >
                        Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Health, Medical & Goals */}
        {step === 3 && (
          <div className="space-y-lg">
            <div className="space-y-xs">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Health &amp; Objectives</h2>
              <p className="text-on-surface-variant">We align training triggers to prevent joint pain and manage hormone stress.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              <div className="space-y-md">
                <label className="font-label-md text-label-md text-on-surface">Medical Conditions (Select all that apply)</label>
                <div className="grid grid-cols-2 gap-sm">
                  {CONDITIONS_LIST.slice(0, 8).map((cond) => (
                    <label key={cond} className="flex items-center gap-base p-sm border border-outline-variant/30 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedConditions.includes(cond)}
                        onChange={() => toggleCondition(cond)}
                        className="rounded text-primary"
                      />
                      <span className="text-xs font-semibold">{cond}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-md">
                <label className="font-label-md text-label-md text-on-surface">Primary Fitness Goal</label>
                <select 
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="FAT_LOSS">Fat Loss / Body Recomp</option>
                  <option value="MUSCLE_GAIN">Hypertrophy / Lean Muscle Gain</option>
                  <option value="RECOMP">Maintenance &amp; Recovery</option>
                </select>
                
                {gender === 'FEMALE' && (
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Menstrual Cycle Pacing</label>
                    <select
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md focus:ring-2 focus:ring-primary focus:outline-none"
                      value={cycleStatus}
                      onChange={(e) => setCycleStatus(e.target.value)}
                    >
                      <option value="REGULAR">Regular Cycle</option>
                      <option value="IRREGULAR">Irregular / PCOS irregular</option>
                      <option value="PREGNANT">Pregnant (Low stress focus)</option>
                      <option value="POSTPARTUM">Postpartum (Rehab focus)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface">Experience Level</label>
                  <div className="grid grid-cols-3 gap-sm">
                    {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((exp) => (
                      <button
                        type="button"
                        key={exp}
                        className={`py-xs rounded text-xs font-bold border ${experience === exp ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-low border-outline-variant text-secondary'}`}
                        onClick={() => setExperience(exp)}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">Average stress level</label>
                <div className="grid grid-cols-4 gap-sm">
                  {['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].map((stress) => (
                    <button
                      type="button"
                      key={stress}
                      className={`py-xs rounded text-xs font-bold border ${stressLevel === stress ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container-low border-outline-variant text-secondary'}`}
                      onClick={() => setStressLevel(stress)}
                    >
                      {stress}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">End Goal Description</label>
                <input 
                  type="text"
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg p-md"
                  placeholder="e.g. wedding prep, lower visceral fat..."
                  value={endGoalDescription}
                  onChange={(e) => setEndGoalDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: AI Review Loading & Results */}
        {step === 4 && (
          <div className="h-full">
            {aiAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-xl space-y-md">
                <div className="loader-ring"></div>
                <div className="text-center">
                  <h3 className="font-bold text-lg text-primary">Generating your custom protocols...</h3>
                  <p className="text-on-surface-variant text-sm mt-xs">{analysisStatus}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-lg animate-in fade-in duration-700">
                <div className="flex items-center gap-md bg-primary/10 p-md rounded-xl border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-primary">Plan Ready!</h2>
                    <p className="text-sm text-on-surface-variant">Our AI has successfully configured custom routines for your fitness objectives.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  {/* Workout Pillar */}
                  <div className="p-md border border-outline-variant/30 rounded-xl space-y-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-xs text-sm">
                        <span className="material-symbols-outlined text-tertiary">fitness_center</span>
                        Workout Split Recommendation
                      </h3>
                      <span className="text-xs bg-tertiary/10 text-tertiary px-base py-xs rounded-full font-bold uppercase">{resultData?.workoutPlan?.split || 'Custom Split'}</span>
                    </div>
                    <ul className="space-y-sm text-xs">
                      {getExercises().slice(0, 4).map((ex, idx) => (
                        <li key={idx} className="flex items-start gap-base">
                          <span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
                          <span>{ex.name} - {ex.sets} sets x {ex.reps} reps</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-surface-container p-sm rounded-lg">
                      <p className="text-xs font-bold text-on-surface-variant uppercase">Progression Scheme:</p>
                      <p className="text-[11px]">{resultData?.workoutPlan?.progression_scheme || 'Dynamic Double Progression'}</p>
                    </div>
                  </div>

                  {/* Nutrition Pillar */}
                  <div className="p-md border border-outline-variant/30 rounded-xl space-y-md">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-xs text-sm">
                        <span className="material-symbols-outlined text-primary">restaurant</span>
                        Macro-Targeted Nutrition
                      </h3>
                      <span className="text-xs bg-primary/10 text-primary px-base py-xs rounded-full font-bold">{resultData?.nutritionPlan?.calories} kcal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-xs text-center">
                      <div className="bg-surface-container-low p-xs rounded">
                        <span className="block text-[10px] text-on-surface-variant">Protein</span>
                        <span className="font-bold text-xs">{resultData?.nutritionPlan?.protein}g</span>
                      </div>
                      <div className="bg-surface-container-low p-xs rounded">
                        <span className="block text-[10px] text-on-surface-variant">Carbs</span>
                        <span className="font-bold text-xs">{resultData?.nutritionPlan?.carbs}g</span>
                      </div>
                      <div className="bg-surface-container-low p-xs rounded">
                        <span className="block text-[10px] text-on-surface-variant">Fats</span>
                        <span className="font-bold text-xs">{resultData?.nutritionPlan?.fats}g</span>
                      </div>
                    </div>
                    <div className="space-y-xs">
                      <p className="text-xs font-bold text-primary flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[14px]">swap_horiz</span> Diet Swaps &amp; Options
                      </p>
                      <ul className="text-[11px] space-y-1">
                        {getMeals().slice(0, 3).map((m, idx) => (
                          <li key={idx}>• {m.meal}: {m.options}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-xl flex justify-between items-center border-t border-outline-variant/30 pt-lg" id="form-nav">
          {step > 1 && step < 4 ? (
            <button 
              type="button"
              className="flex items-center gap-xs px-lg py-md text-secondary font-bold hover:bg-surface-container rounded-xl transition-all" 
              onClick={handlePrev}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button 
              type="button"
              className="flex items-center gap-xs px-xl py-md bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary-container transition-all" 
              onClick={handleNext}
            >
              Next
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ) : step === 3 ? (
            <button 
              type="button"
              className="flex items-center gap-xs px-xl py-md bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary-container transition-all animate-pulse" 
              onClick={handleNext}
            >
              Generate AI Plan
              <span className="material-symbols-outlined">auto_awesome</span>
            </button>
          ) : (
            !aiAnalyzing && (
              <button 
                type="button"
                className="flex items-center gap-xs px-xl py-md bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary-container transition-all"
                onClick={handleFinish}
              >
                Enter Dashboard
                <span className="material-symbols-outlined">rocket_launch</span>
              </button>
            )
          )}
        </div>
      </div>

      <p className="mt-lg text-center text-on-surface-variant text-sm">
        Privacy matters. Your health data is encrypted and used only to personalize your experience.
      </p>
    </div>
  );
}
