'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GanttChart } from '@/components/gantt-chart';
import { ResultsTable, StatCard } from '@/components/results-display';
import { Bot, Download, RotateCcw } from 'lucide-react';
import { exportToCsv } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ResultsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [results, setResults] = useState(null);
    const [algorithm, setAlgorithm] = useState('FCFS');
    const [error, setError] = useState(null);

    useEffect(() => {
        // We need to ensure this runs only on the client
        if (typeof window !== 'undefined') {
            try {
                const storedResults = localStorage.getItem('scheduler-results');
                const algo = localStorage.getItem('scheduler-algorithm');

                if (!storedResults || !algo) {
                    setError("Simulation results are missing. Please return to the home page and run a new simulation.");
                    return;
                }

                setResults(JSON.parse(storedResults));
                setAlgorithm(algo);
            } catch (e) {
                console.error(e);
                setError("Failed to load simulation results. Please return to the home page.");
            }
        }
    }, []);

    const handleExport = () => {
        if (results && results.processStats.length > 0) {
          exportToCsv(`schedulersim-results-${algorithm}.csv`, results.processStats);
        } else {
          toast({
            title: "No results to export",
            description: "Cannot find any results to export to CSV.",
            variant: "destructive",
          });
        }
      };

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

    if (!results) {
        return (
            <div className="flex flex-1 items-center justify-center min-h-screen">
                <div className="text-center text-muted-foreground p-8">
                <Bot size={48} className="mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold">Loading Results...</h3>
                <p>Crunching the numbers from the simulation.</p>
                </div>
            </div>
        );
    }
    
    const totalDuration = (results.ganttChart || []).reduce((max, block) => Math.max(max, block.end), 0);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Simulation Results</h1>
                <p className="text-lg text-muted-foreground mt-2">Analysis of the {algorithm} algorithm.</p>
            </header>

            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Final Gantt Chart</CardTitle>
                        <CardDescription>The complete visual representation of the task schedule.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GanttChart chartInfo={results.ganttChart} totalDuration={totalDuration}/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Performance Metrics</CardTitle>
                            <CardDescription>Detailed statistics for each task and overall performance.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4"/>Export CSV</Button>
                    </CardHeader>
                    <CardContent>
                        {results.overallStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                                <StatCard title="Avg Turnaround" value={results.overallStats.avgTurnaroundTime.toFixed(2)} />
                                <StatCard title="Avg Waiting" value={results.overallStats.avgWaitingTime.toFixed(2)} />
                                <StatCard title="CPU Utilization" value={`${results.overallStats.cpuUtilization.toFixed(2)}%`} />
                                <StatCard title="Deadline Misses" value={results.overallStats.totalDeadlineMisses.toString()} />
                            </div>
                        )}
                        <ResultsTable stats={results.processStats} algorithm={algorithm}/>
                    </CardContent>
                </Card>
                
                <div className="text-center mt-4">
                    <Button onClick={() => router.push('/')}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Run New Simulation
                    </Button>
                </div>
            </div>
        </div>
    );
}
