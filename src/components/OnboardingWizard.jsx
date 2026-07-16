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

const DESI_STAPLES = [
  'Roti / Chapati', 'Naan', 'White Rice / Basmati', 'Brown Rice', 'Daal (Chana / Masoor / Moong)',
  'Chicken (karahi, roast, boiled)', 'Beef / Mutton', 'Fish', 'Eggs', 'Aloo', 'Mixed sabzi (bhindi, gobi, palak etc.)',
  'Dahi / Yogurt', 'Doodh / Full fat milk', 'Desi Ghee', 'Olive oil', 'Other cooking oil'
];

const WESTERN_STAPLES = [
  'Oats / Porridge', 'Whole wheat bread / Brown bread', 'Pasta / Macaroni', 'White bread / Sandwich bread',
  'Chicken breast (grilled / boiled)', 'Beef', 'Eggs', 'Fish', 'Tuna / Canned fish', 'White Rice / Basmati',
  'Brown Rice', 'Greek yogurt', 'Cottage cheese', 'Peanut butter', 'Salad greens / Vegetables', 'Sweet potato',
  'Olive oil', 'Other cooking oil', 'Avocados'
];

const MIXED_STAPLES = Array.from(new Set([...DESI_STAPLES, ...WESTERN_STAPLES]));

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
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightCm, setHeightCm] = useState(172);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(8);
  const [location, setLocation] = useState('Pakistan');
  const [occupation, setOccupation] = useState('Employed');
  const [contactNumber, setContactNumber] = useState('');

  // Step 2: Habits & Diet (Culture)
  const [homeOrGym, setHomeOrGym] = useState('GYM');
  const [workoutTiming, setWorkoutTiming] = useState('EVENING');
  const [workoutDuration, setWorkoutDuration] = useState('45-60');
  const [supplementComfort, setSupplementComfort] = useState(true);
  const [dietTrackingPref, setDietTrackingPref] = useState('PORTION_CONTROL');
  const [hasFoodScale, setHasFoodScale] = useState('NO');
  const [cookingControl, setCookingControl] = useState('FULL');
  const [waterGlasses, setWaterGlasses] = useState(8);
  const [chaiCups, setChaiCups] = useState(1);
  const [beverageMilk, setBeverageMilk] = useState('YES');
  const [beverageSugar, setBeverageSugar] = useState('YES');
  const [dailyDiet, setDailyDiet] = useState('DESI');
  const [selectedDietStaples, setSelectedDietStaples] = useState([]);
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
    if (selectedDietStaples.includes(staple)) {
      setSelectedDietStaples(selectedDietStaples.filter((s) => s !== staple));
    } else {
      setSelectedDietStaples([...selectedDietStaples, staple]);
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
      height: heightUnit === 'cm' ? parseFloat(heightCm) : (parseFloat(heightFt) * 30.48 + parseFloat(heightIn) * 2.54),
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
      dietTrackingPref,
      hasFoodScale: dietTrackingPref === 'CALORIE_COUNTED' ? hasFoodScale === 'YES' : false,
      cookingControl,
      goal,
      experience,
      endGoalDescription: `${endGoalDescription}. Staples: ${selectedDietStaples.join(', ')}. Dawats: ${dawatFrequency}. Beverages: Milk(${beverageMilk}) Sugar(${beverageSugar})`
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
    <div className="w-full max-w-4xl mx-auto px-container-margin py-xl">
      {/* Progress Tracker */}
      <div className="mb-xl px-md max-w-3xl mx-auto">
        <div className="flex justify-between relative mb-base">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-container-highest rounded-full -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary to-primary-container rounded-full -translate-y-1/2 z-0 transition-all duration-700 ease-in-out" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          {/* Step Bubbles */}
          <div className="step-indicator z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white transition-all duration-500 ${step >= 1 ? 'bg-primary text-on-primary scale-110' : 'bg-surface-container-highest text-secondary'}`}>1</div>
            <span className={`text-xs font-bold transition-colors ${step >= 1 ? 'text-primary' : 'text-secondary'}`}>Profile</span>
          </div>
          <div className="step-indicator z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white transition-all duration-500 ${step >= 2 ? 'bg-primary text-on-primary scale-110' : 'bg-surface-container-highest text-secondary'}`}>2</div>
            <span className={`text-xs font-bold transition-colors ${step >= 2 ? 'text-primary' : 'text-secondary'}`}>Culture</span>
          </div>
          <div className="step-indicator z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white transition-all duration-500 ${step >= 3 ? 'bg-primary text-on-primary scale-110' : 'bg-surface-container-highest text-secondary'}`}>3</div>
            <span className={`text-xs font-bold transition-colors ${step >= 3 ? 'text-primary' : 'text-secondary'}`}>Health</span>
          </div>
          <div className="step-indicator z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white transition-all duration-500 ${step >= 4 ? 'bg-primary text-on-primary scale-110' : 'bg-surface-container-highest text-secondary'}`}>4</div>
            <span className={`text-xs font-bold transition-colors ${step >= 4 ? 'text-primary' : 'text-secondary'}`}>AI Review</span>
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
      <div className="glass-card rounded-2xl p-6 md:p-10 shadow-xl shadow-primary/5 border border-white/10 relative overflow-hidden bg-surface-container/80 backdrop-blur-xl">
        {/* STEP 1: Basic Bio Metrics */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            <div className="space-y-2 border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <h2 className="text-2xl font-bold text-on-surface">Tell us about yourself</h2>
              </div>
              <p className="text-on-surface-variant text-sm ml-14">This helps us calculate your baseline metabolic rate accurately.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">Age (years)</label>
                <input 
                  className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm" 
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
                  className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
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
                  className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm" 
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
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-label-md text-on-surface">Height</label>
                  <select 
                    className="text-xs bg-transparent border-none text-primary cursor-pointer focus:outline-none"
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value)}
                  >
                    <option value="cm">cm</option>
                    <option value="ft">ft/in</option>
                  </select>
                </div>
                {heightUnit === 'cm' ? (
                  <input 
                    className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm" 
                    placeholder="e.g. 172" 
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    min="100"
                    max="250"
                    required
                  />
                ) : (
                  <div className="flex gap-sm">
                    <input 
                      className="w-1/2 bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm" 
                      placeholder="ft" 
                      type="number"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      min="3"
                      max="8"
                      required
                    />
                    <input 
                      className="w-1/2 bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm" 
                      placeholder="in" 
                      type="number"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      min="0"
                      max="11"
                      required
                    />
                  </div>
                )}
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface">Primary Location</label>
                <select 
                  className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
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
                  className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm" 
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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            <div className="space-y-2 border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-xl text-on-secondary shadow-sm">
                  <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
                </div>
                <h2 className="text-2xl font-bold text-on-surface">Dietary Habits & Staples</h2>
              </div>
              <p className="text-on-surface-variant text-sm ml-14">We customize macros and swaps based on traditional South Asian staples.</p>
            </div>
            
            <div className="space-y-8">
              {/* Top Section: Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                <div className="space-y-6">
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Diet Tracking Preference</label>
                    <select 
                      className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
                      value={dietTrackingPref}
                      onChange={(e) => setDietTrackingPref(e.target.value)}
                    >
                      <option value="PORTION_CONTROL">Meals with portion control guidance</option>
                      <option value="CALORIE_COUNTED">Exact calorie-counted meals (most effective)</option>
                    </select>
                  </div>
                  {dietTrackingPref === 'CALORIE_COUNTED' && (
                    <div className="space-y-xs pl-sm border-l-2 border-primary mt-sm animate-in fade-in slide-in-from-left-2">
                      <label className="font-label-md text-label-md text-on-surface">Do you have a food weighing scale at home?</label>
                      <div className="flex gap-md">
                        <label className="flex items-center gap-xs cursor-pointer">
                          <input 
                            type="radio" 
                            name="foodScale" 
                            value="YES" 
                            checked={hasFoodScale === 'YES'} 
                            onChange={(e) => setHasFoodScale(e.target.value)} 
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-xs cursor-pointer">
                          <input 
                            type="radio" 
                            name="foodScale" 
                            value="NO" 
                            checked={hasFoodScale === 'NO'} 
                            onChange={(e) => setHasFoodScale(e.target.value)} 
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Kitchen Cooking Dynamic</label>
                    <select 
                      className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
                      value={cookingControl}
                      onChange={(e) => setCookingControl(e.target.value)}
                    >
                      <option value="FULL">Cook my own meals</option>
                      <option value="SOMEONE_ELSE">Someone else cooks (family member / maid)</option>
                      <option value="EATING_OUT">Mostly eating out / ordering in</option>
                      <option value="HOSTEL">Hostel / Company site - Little control over meals</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Dawat Frequency (Social Eating)</label>
                    <select 
                      className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
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
                      <label className="font-label-md text-label-md text-on-surface">Chai / Coffee (cups/day)</label>
                      <input 
                        type="number"
                        className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
                        value={chaiCups}
                        min="0"
                        onChange={(e) => setChaiCups(e.target.value)}
                      />
                      {chaiCups > 0 && (
                        <div className="flex flex-col gap-xs mt-sm text-sm animate-in fade-in slide-in-from-top-2">
                          <div className="flex justify-between items-center bg-surface-container-low/40 p-2 rounded-lg">
                            <span>Milk?</span>
                            <div className="flex gap-xs">
                              <label className="flex items-center gap-xs cursor-pointer"><input type="radio" name="milk" value="YES" checked={beverageMilk === 'YES'} onChange={(e) => setBeverageMilk(e.target.value)} className="accent-primary" /> Yes</label>
                              <label className="flex items-center gap-xs cursor-pointer"><input type="radio" name="milk" value="NO" checked={beverageMilk === 'NO'} onChange={(e) => setBeverageMilk(e.target.value)} className="accent-primary" /> No</label>
                            </div>
                          </div>
                          <div className="flex justify-between items-center bg-surface-container-low/40 p-2 rounded-lg">
                            <span>Sugar?</span>
                            <div className="flex gap-xs">
                              <label className="flex items-center gap-xs cursor-pointer"><input type="radio" name="sugar" value="YES" checked={beverageSugar === 'YES'} onChange={(e) => setBeverageSugar(e.target.value)} className="accent-primary" /> Yes</label>
                              <label className="flex items-center gap-xs cursor-pointer"><input type="radio" name="sugar" value="NO" checked={beverageSugar === 'NO'} onChange={(e) => setBeverageSugar(e.target.value)} className="accent-primary" /> No</label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-xs">
                      <label className="font-label-md text-label-md text-on-surface">Water (glasses/day)</label>
                      <input 
                        type="number"
                        className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm h-[46px]"
                        value={waterGlasses}
                        min="0"
                        onChange={(e) => setWaterGlasses(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Dietary Staples (Full Width) */}
              <div className="space-y-6 pt-6 border-t border-outline-variant/20">
                <div className="space-y-xs max-w-md">
                  <label className="font-label-md text-label-md text-on-surface">Daily Diet</label>
                  <select 
                    className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
                    value={dailyDiet}
                    onChange={(e) => {
                      setDailyDiet(e.target.value);
                      setSelectedDietStaples([]); // Reset selections when switching diets
                    }}
                  >
                    <option value="DESI">Desi</option>
                    <option value="WESTERN">Western</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="font-label-md text-label-md text-on-surface">
                    {dailyDiet === 'DESI' ? "Which of these do you eat regularly or have available at home?" : "Which of these do you eat regularly or have available?"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {(dailyDiet === 'DESI' ? DESI_STAPLES : dailyDiet === 'WESTERN' ? WESTERN_STAPLES : MIXED_STAPLES).map((staple) => (
                      <label key={staple} className="flex items-center gap-3 p-3 bg-surface-container-low/40 rounded-xl border border-transparent cursor-pointer hover:bg-surface-container-low hover:border-outline-variant/50 hover:shadow-sm transition-all group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox"
                            checked={selectedDietStaples.includes(staple)}
                            onChange={() => toggleStaple(staple)}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-outline-variant checked:border-primary checked:bg-primary transition-all"
                          />
                          <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                          </span>
                        </div>
                        <span className="font-medium text-sm text-on-surface group-hover:text-primary transition-colors">{staple}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Health, Medical & Goals */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            <div className="space-y-2 border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-tertiary/10 rounded-xl text-tertiary shadow-sm">
                  <span className="material-symbols-outlined text-2xl">favorite</span>
                </div>
                <h2 className="text-2xl font-bold text-on-surface">Health & Objectives</h2>
              </div>
              <p className="text-on-surface-variant text-sm ml-14">We align training triggers to prevent joint pain and manage hormone stress.</p>
            </div>
            
            <div className="space-y-8">
              {/* Top Section: Full Width Medical Conditions */}
              <div className="space-y-4">
                <label className="font-label-md text-label-md text-on-surface">Medical Conditions (Select all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CONDITIONS_LIST.slice(0, 8).map((cond) => (
                    <label key={cond} className="flex items-center gap-3 p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low hover:border-primary/50 hover:shadow-sm transition-all group">
                      <div className="relative flex items-center shrink-0">
                        <input 
                          type="checkbox"
                          checked={selectedConditions.includes(cond)}
                          onChange={() => toggleCondition(cond)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-outline-variant checked:border-primary checked:bg-primary transition-all"
                        />
                        <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors leading-tight">{cond}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bottom Section: Left & Right Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl pt-6 border-t border-outline-variant/20">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Primary Fitness Goal</label>
                    <select 
                      className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    >
                      <option value="FAT_LOSS">Fat Loss / Body Recomp</option>
                      <option value="MUSCLE_GAIN">Hypertrophy / Lean Muscle Gain</option>
                      <option value="RECOMP">Maintenance &amp; Recovery</option>
                    </select>
                  </div>
                  
                  {gender === 'FEMALE' && (
                    <div className="space-y-xs animate-in fade-in slide-in-from-top-2">
                      <label className="font-label-md text-label-md text-on-surface">Menstrual Cycle Pacing</label>
                      <select
                        className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
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
                          className={`py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all shadow-sm ${experience === exp ? 'bg-primary-container/30 text-primary border-primary' : 'bg-surface-container-low/50 border-transparent text-secondary hover:bg-surface-container-low hover:border-outline-variant/50'}`}
                          onClick={() => setExperience(exp)}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Workout Venue</label>
                    <div className="grid grid-cols-2 gap-sm">
                      <button
                        type="button"
                        className={`py-3 px-4 rounded-xl font-bold border-2 transition-all shadow-sm ${homeOrGym === 'GYM' ? 'bg-primary-container/30 text-primary border-primary hover:bg-primary-container/50' : 'bg-surface-container-low/50 border-transparent text-secondary hover:bg-surface-container-low hover:border-outline-variant/50'}`}
                        onClick={() => setHomeOrGym('GYM')}
                      >
                        Gym
                      </button>
                      <button
                        type="button"
                        className={`py-3 px-4 rounded-xl font-bold border-2 transition-all shadow-sm ${homeOrGym === 'HOME' ? 'bg-primary-container/30 text-primary border-primary hover:bg-primary-container/50' : 'bg-surface-container-low/50 border-transparent text-secondary hover:bg-surface-container-low hover:border-outline-variant/50'}`}
                        onClick={() => setHomeOrGym('HOME')}
                      >
                        Home
                      </button>
                    </div>
                  </div>

                  <div className="space-y-xs">
                    <label className="font-label-md text-label-md text-on-surface">Average stress level</label>
                    <div className="grid grid-cols-4 gap-sm">
                      {['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].map((stress) => (
                        <button
                          type="button"
                          key={stress}
                          className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold border-2 transition-all shadow-sm ${stressLevel === stress ? 'bg-primary-container/30 text-primary border-primary' : 'bg-surface-container-low/50 border-transparent text-secondary hover:bg-surface-container-low hover:border-outline-variant/50'}`}
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
                      className="w-full bg-surface-container-low/50 hover:bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/80 focus:border-primary focus:outline-none transition-all shadow-sm text-sm"
                      placeholder="e.g. wedding prep, lower visceral fat..."
                      value={endGoalDescription}
                      onChange={(e) => setEndGoalDescription(e.target.value)}
                    />
                  </div>
                </div>
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
        <div className="mt-10 flex justify-between items-center border-t border-outline-variant/20 pt-6" id="form-nav">
          {step > 1 && step < 4 ? (
            <button 
              type="button"
              className="flex items-center gap-2 px-6 py-3 text-secondary font-bold hover:bg-surface-container-high hover:text-on-surface rounded-xl transition-all shadow-sm active:scale-95" 
              onClick={handlePrev}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button 
              type="button"
              className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container hover:shadow-lg transition-all active:scale-95" 
              onClick={handleNext}
            >
              Next
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          ) : step === 3 ? (
            <button 
              type="button"
              className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container hover:shadow-lg transition-all active:scale-95 animate-pulse" 
              onClick={handleNext}
            >
              Generate AI Plan
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </button>
          ) : (
            !aiAnalyzing && (
              <button 
                type="button"
                className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container hover:shadow-lg transition-all active:scale-95"
                onClick={handleFinish}
              >
                Enter Dashboard
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
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
