export const calculateTotalVolume = (exercises) => {
  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) return 0;
  
  return exercises.reduce((acc, ex) => {
    // If we have actual weight tracked, use it. Otherwise default to a placeholder (e.g. 50kg)
    const weight = ex.weight ? parseFloat(ex.weight) : 50;
    const sets = parseInt(ex.sets) || 3;
    const reps = parseInt(ex.reps) || 10;
    
    return acc + (sets * reps * weight);
  }, 0);
};
