'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GanttChart } from '@/components/gantt-chart';
import { runSimulation } from '@/lib/scheduling';
import { Bot, LineChart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SimulationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [quantum, setQuantum] = useState(4);
  const [error, setError] = useState(null);

  const [simulationResults, setSimulationResults] = useState(null);
  const [animatedChart, setAnimatedChart] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('scheduler-tasks');
      const algo = searchParams.get('algorithm');
      const q = searchParams.get('quantum');

      if (!storedTasks || !algo) {
        setError("Simulation data is missing. Please return to the home page and start again.");
        return;
      }

      const parsedTasks = JSON.parse(storedTasks);
      setTasks(parsedTasks);
      setAlgorithm(algo);
      if (q) setQuantum(parseInt(q));

      const results = runSimulation(parsedTasks, algo, { quantum: q ? parseInt(q) : undefined });
      setSimulationResults(results);

    } catch (e) {
      console.error(e);
      setError("Failed to load simulation data. Please return to the home page.");
    }
  }, [searchParams]);

  const totalDuration = useMemo(() => simulationResults?.ganttChart.reduce((max, block) => Math.max(max, block.end), 0) || 0, [simulationResults]);

  useEffect(() => {
    if (!simulationResults || totalDuration === 0) return;

    if (currentTime > totalDuration) {
        localStorage.setItem('scheduler-results', JSON.stringify(simulationResults));
        localStorage.setItem('scheduler-algorithm', algorithm);
        setProgress(100);
        setTimeout(() => {
            router.push('/results');
        }, 1000);
        return;
    }

    const interval = setInterval(() => {
      setCurrentTime(t => t + 1);
    }, 50); // Speed of simulation

    return () => clearInterval(interval);

  }, [simulationResults, currentTime, totalDuration, router, algorithm]);

  useEffect(() => {
    if(!simulationResults || totalDuration === 0) return;
    
    const currentBlocks = simulationResults.ganttChart.filter(block => block.start < currentTime);
    const animated = currentBlocks.map(block => ({
        ...block,
        end: Math.min(block.end, currentTime)
    }));

    setAnimatedChart(animated);
    setProgress((currentTime / totalDuration) * 100);

  }, [currentTime, simulationResults, totalDuration])

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
            <CardHeader>
                <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => router.push('/')}>Go Home</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!simulationResults) {
    return (
        <div className="flex flex-1 items-center justify-center min-h-[400px] lg:min-h-full">
            <div className="text-center text-muted-foreground p-8">
            <Bot size={48} className="mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold">Preparing Simulation...</h3>
            <p>Loading tasks and getting the CPU ready.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Simulation in Progress</h1>
        <p className="text-lg text-muted-foreground mt-2">Watching the {algorithm} algorithm at work.</p>
      </header>

       <Card className="min-h-[240px]">
            <CardHeader>
                <CardTitle>Live Gantt Chart</CardTitle>
                <CardDescription>Visualizing task execution in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center gap-4">
                    <span className="font-mono text-lg font-semibold">Time: {currentTime}s</span>
                    <Progress value={progress} className="w-full" />
                </div>
                <GanttChart chartInfo={animatedChart} totalDuration={totalDuration} />
            </CardContent>
        </Card>

        {progress >= 100 && (
            <div className="text-center mt-8">
                <p className="text-lg font-semibold mb-2">Simulation Complete!</p>
                <Button onClick={() => router.push('/results')}>
                    <LineChart className="mr-2 h-4 w-4"/> View Performance Results
                </Button>
            </div>
        )}
    </div>
  );
}
