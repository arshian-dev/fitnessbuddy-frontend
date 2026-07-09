const fs = require('fs');
const path = 'd:/work/Fitness Buddy/frontend/src/components/ClientDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                                      <div className="flex-grow space-y-sm">
                                        <div className="flex justify-between items-start flex-wrap gap-xs">
                                          <div>
                                            <h5 className={\`font-bold text-sm \${isCompleted ? 'line-through text-secondary' : 'text-on-surface'}\`}>{ex.name}</h5>
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
                                        <div className="mt-sm max-w-sm">
                                          <WgerAnimation exerciseName={ex.name} mediaType="image" />
                                        </div>
                                      </div>`;

const replacement = `                                      <div className="flex-grow space-y-sm">
                                        <div className="flex justify-between items-start gap-sm">
                                          <div>
                                            <h5 className={\`font-bold text-sm \${isCompleted ? 'line-through text-secondary' : 'text-on-surface'}\`}>{ex.name}</h5>
                                            <p className="text-xs text-secondary mt-0.5">{ex.sets} Sets x {ex.reps} reps</p>
                                            {hasKneeAlert && (
                                              <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-xs mt-1 w-max">
                                                <AlertTriangle size={10} />
                                                <span>KNEE LONGEVITY TIP</span>
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex-shrink-0">
                                            <WgerAnimation 
                                              exerciseName={ex.name} 
                                              mediaType="image" 
                                              containerClassName="w-16 h-16 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-center overflow-hidden"
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        </div>
                                        {ex.notes && (
                                          <p className="text-xs text-on-surface-variant bg-white p-sm rounded-lg border-l-2 border-primary/40 italic shadow-sm">
                                            "{ex.notes}"
                                          </p>
                                        )}
                                      </div>`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');
const normReplacement = replacement.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
    const newContent = normContent.replace(normTarget, normReplacement);
    fs.writeFileSync(path, newContent);
    console.log('Successfully replaced content.');
} else {
    console.log('Target string not found!');
    const idx = normContent.indexOf('WgerAnimation exerciseName={ex.name}');
    if(idx !== -1) {
        console.log('Found WgerAnimation at:', idx);
        console.log(normContent.substring(idx - 200, idx + 200));
    } else {
        console.log('WgerAnimation not found at all.');
    }
}
