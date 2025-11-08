"use client";

export const GanttChart = ({ chartInfo, totalDuration }) => {
    if (!chartInfo) return <div className="text-center text-muted-foreground">No chart data.</div>;
    
    const finalDuration = totalDuration ?? Math.max(...chartInfo.map(c => c.end), 0);
    if (finalDuration === 0) return <div className="text-center text-muted-foreground">Simulation has not started.</div>;

    const minWidth = Math.max(finalDuration * 20, 400);
  
    return (
      <div className="w-full overflow-x-auto p-2 border rounded-lg bg-muted/20">
        <div className="relative h-20 w-full" style={{minWidth: `${minWidth}px`}}>
          {chartInfo.map((block, index) => {
            if (block.end <= block.start) return null; // Don't render zero-width blocks
            return (
                <div
                  key={index}
                  className="absolute h-10 top-5 flex items-center justify-center rounded text-white font-bold text-sm shadow-md transition-all duration-100 ease-linear"
                  style={{
                    left: `${(block.start / finalDuration) * 100}%`,
                    width: `${((block.end - block.start) / finalDuration) * 100}%`,
                    backgroundColor: block.color,
                  }}
                  title={`${block.processId} (${block.start}-${block.end})`}
                >
                  {block.processId}
                </div>
            )
          })}
           <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-muted-foreground" style={{minWidth: `${minWidth}px`}}>
                {Array.from({ length: Math.min(finalDuration, 50) + 1 }).map((_, i) => {
                    const time = Math.round(i * finalDuration / Math.min(finalDuration, 50));
                    if (time > finalDuration) return null;
                    return <span key={i} style={{ position: 'absolute', left: `${(time/finalDuration)*100}%`, transform: 'translateX(-50%)' }}>{time}</span>
                })}
            </div>
        </div>
      </div>
    );
  };
