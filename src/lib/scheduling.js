const colors = [
  '#4CAF50', '#F44336', '#2196F3', '#FFC107', '#9C27B0', 
  '#00BCD4', '#FF9800', '#E91E63', '#8BC34A', '#673AB7'
];

const getColor = (id) => colors[(id - 1) % colors.length];

const calculateStats = (completedProcesses, ganttChart, totalTime, tasks) => {
  const processStats = [];
  let totalTurnaroundTime = 0;
  let totalWaitingTime = 0;
  let totalResponseTime = 0;
  let totalDeadlineMisses = 0;

  completedProcesses.forEach(proc => {
    const originalTask = tasks.find(t => t.id === proc.id);
    const lastGanttEntry = ganttChart.slice().reverse().find(g => g.processId === proc.name);
    const finalCompletionTime = lastGanttEntry ? lastGanttEntry.end : 0;
    
    const turnaroundTime = finalCompletionTime - proc.arrivalTime;
    const waitingTime = turnaroundTime - proc.burstTime;

    const firstGanttEntry = ganttChart.find(g => g.processId === proc.name);
    const responseTime = firstGanttEntry ? firstGanttEntry.start - proc.arrivalTime : 0;

    let deadlineMet = '-';
    if (originalTask.deadline !== undefined) {
      if (finalCompletionTime <= originalTask.deadline) {
        deadlineMet = 'Yes';
      } else {
        deadlineMet = 'No';
        totalDeadlineMisses++;
      }
    }

    processStats.push({
      id: proc.id,
      name: proc.name,
      completionTime: finalCompletionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
      deadlineMet,
    });

    totalTurnaroundTime += turnaroundTime;
    totalWaitingTime += waitingTime;
    totalResponseTime += responseTime;
  });

  const totalBurstTime = ganttChart.reduce((acc, curr) => acc + (curr.end - curr.start), 0);
  const cpuUtilization = totalTime > 0 ? (totalBurstTime / totalTime) * 100 : 0;

  const N = processStats.length;
  const overallStats = {
    avgTurnaroundTime: N > 0 ? totalTurnaroundTime / N : 0,
    avgWaitingTime: N > 0 ? totalWaitingTime / N : 0,
    avgResponseTime: N > 0 ? totalResponseTime / N : 0,
    cpuUtilization: cpuUtilization,
    totalDeadlineMisses: totalDeadlineMisses,
  };

  return { processStats, overallStats };
};


// Main Simulation Runner
export const runSimulation = (tasks, algorithm, options = {}) => {
  const processes = tasks.map(task => ({
    ...task,
    remainingTime: task.burstTime,
    isStarted: false,
    color: getColor(task.id),
  }));

  const ganttChart = [];
  const completedProcesses = [];
  let readyQueue = [];
  let currentTime = 0;
  let runningProcess = null;
  const processQueue = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

  const addToReadyQueue = (process) => {
    readyQueue.push(process);
    switch (algorithm) {
      case 'SJF-P':
      case 'SJF-NP':
        readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);
        break;
      case 'Priority-P':
      case 'Priority-NP':
        readyQueue.sort((a, b) => a.priority - b.priority);
        break;
      case 'EDF':
         readyQueue.sort((a,b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity));
        break;
      case 'RMS':
        readyQueue.sort((a, b) => (a.period ?? Infinity) - (b.period ?? Infinity));
        break;
    }
  };

  while (processQueue.length > 0 || readyQueue.length > 0 || runningProcess) {
    while (processQueue.length > 0 && processQueue[0].arrivalTime <= currentTime) {
      addToReadyQueue(processQueue.shift());
    }

    if (!runningProcess && readyQueue.length > 0) {
      runningProcess = readyQueue.shift();
      if (!runningProcess.isStarted) {
        runningProcess.isStarted = true;
      }
      ganttChart.push({ processId: runningProcess.name, start: currentTime, end: currentTime, color: runningProcess.color });
    }

    if (runningProcess) {
      const currentGantt = ganttChart[ganttChart.length - 1];
      if (currentGantt.processId !== runningProcess.name) {
          ganttChart.push({ processId: runningProcess.name, start: currentTime, end: currentTime, color: runningProcess.color });
      }

      const timeSlice = (algorithm === 'RR' && options.quantum) ? options.quantum : 1;
      
      let preempt = false;
      if (algorithm === 'SJF-P' || algorithm === 'Priority-P' || algorithm === 'EDF' || algorithm === 'RMS') {
        if (readyQueue.length > 0) {
          const nextProcess = readyQueue[0];
          let shouldPreempt = false;
          if (algorithm === 'SJF-P') shouldPreempt = nextProcess.remainingTime < runningProcess.remainingTime;
          if (algorithm === 'Priority-P') shouldPreempt = nextProcess.priority < runningProcess.priority;
          if (algorithm === 'EDF') shouldPreempt = (nextProcess.deadline ?? Infinity) < (runningProcess.deadline ?? Infinity);
          if (algorithm === 'RMS') shouldPreempt = (nextProcess.period ?? Infinity) < (runningProcess.period ?? Infinity);

          if (shouldPreempt) {
            preempt = true;
          }
        }
      }

      if (preempt) {
          addToReadyQueue(runningProcess);
          runningProcess = null;
          continue;
      }
      
      const timeToRun = Math.min(runningProcess.remainingTime, timeSlice);

      currentTime++;
      runningProcess.remainingTime--;
      ganttChart[ganttChart.length-1].end = currentTime;
      
      if (runningProcess.remainingTime === 0) {
        completedProcesses.push(runningProcess);
        runningProcess = null;
      } else if (algorithm === 'RR' && (currentTime - currentGantt.start) % options.quantum === 0) {
        addToReadyQueue(runningProcess);
        runningProcess = null;
      }
    } else {
      currentTime++;
    }
  }

  // Merge contiguous gantt chart blocks
  const mergedGantt = [];
  if (ganttChart.length > 0) {
    let currentBlock = { ...ganttChart[0] };
    for (let i = 1; i < ganttChart.length; i++) {
      if (ganttChart[i].processId === currentBlock.processId && ganttChart[i].start === currentBlock.end) {
        currentBlock.end = ganttChart[i].end;
      } else {
        mergedGantt.push(currentBlock);
        currentBlock = { ...ganttChart[i] };
      }
    }
    mergedGantt.push(currentBlock);
  }

  const { processStats, overallStats } = calculateStats(completedProcesses, mergedGantt, currentTime, tasks);

  return {
    ganttChart: mergedGantt,
    processStats,
    overallStats
  };
};
