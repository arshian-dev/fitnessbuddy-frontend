import React, { useState } from 'react';

// Plates in KG
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
// Plates in LBS
const PLATES_LBS = [45, 35, 25, 10, 5, 2.5];

export function calculatePlates(targetWeight, barWeight = 20, unit = 'KG') {
  if (targetWeight <= barWeight) return [];

  const weightPerSide = (targetWeight - barWeight) / 2;
  let remainingWeight = weightPerSide;
  const availablePlates = unit === 'LBS' ? PLATES_LBS : PLATES_KG;
  const platesToUse = [];

  for (let plate of availablePlates) {
    while (remainingWeight >= plate) {
      platesToUse.push(plate);
      remainingWeight = Math.round((remainingWeight - plate) * 100) / 100; // handle JS float issues
    }
  }
  
  return platesToUse;
}

export default function PlateCalculator() {
  const [targetWeight, setTargetWeight] = useState(100);
  const [barWeight, setBarWeight] = useState(20);
  const [unit, setUnit] = useState('KG');

  const plates = calculatePlates(targetWeight, barWeight, unit);
  const actualWeight = barWeight + (plates.reduce((a, b) => a + b, 0) * 2);

  const getPlateColor = (weight) => {
    if (unit === 'KG') {
      if (weight >= 25) return 'bg-red-500 text-white';
      if (weight >= 20) return 'bg-blue-500 text-white';
      if (weight >= 15) return 'bg-yellow-400 text-on-surface';
      if (weight >= 10) return 'bg-green-500 text-white';
      if (weight >= 5) return 'bg-surface-container-high text-on-surface border border-outline-variant';
      if (weight >= 2.5) return 'bg-surface-container-highest text-white';
      return 'bg-surface-container text-white';
    } else {
      if (weight >= 45) return 'bg-blue-600 text-white';
      if (weight >= 35) return 'bg-yellow-400 text-on-surface';
      if (weight >= 25) return 'bg-green-500 text-white';
      if (weight >= 10) return 'bg-surface-container-high text-on-surface border border-outline-variant';
      return 'bg-surface-container-highest text-white';
    }
  };

  const getPlateHeight = (weight) => {
    if (unit === 'KG') {
      if (weight >= 15) return 'h-24';
      if (weight >= 10) return 'h-20';
      if (weight >= 5) return 'h-16';
      return 'h-12';
    } else {
      if (weight >= 45) return 'h-24';
      if (weight >= 25) return 'h-20';
      if (weight >= 10) return 'h-16';
      return 'h-12';
    }
  };

  return (
    <div className="card shadow-sm p-md rounded-xl bg-surface border border-outline/10">
      <h3 className="font-bold text-title-md mb-sm flex items-center gap-xs">
        <span className="material-symbols-outlined text-primary text-[20px]">fitness_center</span>
        Plate Calculator
      </h3>
      
      <div className="flex flex-wrap gap-sm mb-md">
        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Target Weight</label>
          <div className="flex items-center">
            <input 
              type="number" 
              className="glass-input rounded-lg text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none w-full text-center font-bold text-lg p-1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Bar</label>
          <input 
            type="number" 
            className="glass-input rounded-lg text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none w-full text-center p-1"
            value={barWeight}
            onChange={(e) => setBarWeight(Number(e.target.value))}
          />
        </div>
        <div className="w-20">
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Unit</label>
          <select 
            className="glass-input rounded-lg text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none w-full p-1"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="KG">KG</option>
            <option value="LBS">LBS</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-variant rounded-lg p-md flex flex-col items-center justify-center min-h-[120px] overflow-x-hidden relative">
        {targetWeight <= barWeight ? (
          <div className="text-on-surface-variant text-sm text-center">
            Just the bar! ({barWeight}{unit})
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center relative w-full">
              {/* Barbell */}
              <div className="absolute w-[120%] h-3 bg-surface-container-highest rounded-sm shadow-inner z-0"></div>
              {/* Center Stopper */}
              <div className="absolute w-4 h-10 bg-outline border border-outline-variant rounded z-10 left-4"></div>
              
              {/* Plates (one side) */}
              <div className="flex items-center gap-[2px] z-20 ml-10 overflow-x-visible">
                {plates.map((weight, i) => (
                  <div 
                    key={i} 
                    className={`w-6 ${getPlateHeight(weight)} ${getPlateColor(weight)} flex items-center justify-center rounded-sm font-bold text-[10px] shadow-sm flex-shrink-0 transition-all`}
                  >
                    <span className="-rotate-90 whitespace-nowrap">{weight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 text-xs text-on-surface-variant text-center">
              Per side: {plates.join(', ')} {unit} <br/>
              <span className="font-bold text-primary">Total loaded: {actualWeight} {unit}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
