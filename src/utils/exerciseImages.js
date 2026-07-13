export const KNOWN_EXERCISE_IMAGES = [
  "Barbell Back Squat",
  "Barbell Deadlift",
  "Barbell Row",
  "Bodyweight Bulgarian Split Squats",
  "Cable Bicep Curls",
  "Dips (Chest-focused)",
  "Dumbbell Goblet Squats",
  "Dumbbell Incline Bench Press",
  "Dumbbell Shoulder Press",
  "Dumbbell Shrugs",
  "Face Pulls",
  "Hanging Knee Raises",
  "Hyperextensions (Back Extensions)",
  "Incline Barbell Bench Press",
  "Lat Pulldown (Gym)",
  "Leg Press",
  "Low Stress Walking - LISS Cardio",
  "Lying Leg Curls",
  "Machine Chest Press",
  "Overhead Press",
  "Plank",
  "Pull-ups",
  "Romanian Deadlift",
  "Rotator Cuff Warmups (External & Internal Rotations)",
  "Seated Cable Row",
  "Standard Pushups (on knees if needed)",
  "Tricep Extensions"
];

export function getExerciseImage(exerciseName) {
  if (!exerciseName) return null;
  
  // Exact match
  if (KNOWN_EXERCISE_IMAGES.includes(exerciseName)) {
    return `/images/exercises/${exerciseName}.png`;
  }

  // Fuzzy match logic
  const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const targetWords = normalize(exerciseName).split(/\s+/).filter(w => w.length > 2);
  const targetStr = normalize(exerciseName);
  
  let bestMatch = null;
  let bestScore = 0;

  for (const known of KNOWN_EXERCISE_IMAGES) {
    const knownWords = normalize(known).split(/\s+/);
    let score = 0;
    
    // Word overlap
    for (const w of targetWords) {
      if (knownWords.includes(w)) score += 1;
    }
    
    const knownStr = normalize(known);

    // Special exact substring bonuses
    if (targetStr.includes('rotator') && knownStr.includes('rotator cuff')) score += 5;
    if (targetStr.includes('pull up') && knownStr.includes('pull ups')) score += 5;
    if (targetStr.includes('overhead press') && knownStr.includes('overhead press')) score += 5;
    if (targetStr.includes('bench press') && knownStr.includes('bench press')) {
        // Boost if both have incline, or neither have incline
        if (targetStr.includes('incline') === knownStr.includes('incline')) score += 3;
    }
    if (targetStr.includes('squat') && knownStr.includes('squat')) score += 2;
    if (targetStr.includes('deadlift') && knownStr.includes('deadlift')) {
        if (targetStr.includes('romanian') === knownStr.includes('romanian')) score += 3;
    }
    if (targetStr.includes('flyes') && knownStr.includes('chest')) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = known;
    }
  }
  
  if (bestScore >= 1) { // Require at least 1 point to map
    return `/images/exercises/${bestMatch}.png`;
  }
  
  // Fallback to original just in case it's exactly correct but not in the known list
  return `/images/exercises/${exerciseName}.png`;
}
