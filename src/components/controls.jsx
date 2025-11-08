"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Play, Bot, ArrowRight } from 'lucide-react';

const taskSchema = z.object({
  name: z.string().min(1, "Name is required"),
  arrivalTime: z.coerce.number().min(0, "Must be >= 0"),
  burstTime: z.coerce.number().min(1, "Must be > 0"),
  priority: z.coerce.number().min(0, "Must be >= 0").optional().default(0),
  deadline: z.coerce.number().min(0, "Must be >= 0").optional(),
  period: z.coerce.number().min(0, "Must be >= 0").optional(),
});

const defaultTasks = [
    { id: 1, name: 'P1', arrivalTime: 0, burstTime: 8, priority: 2, deadline: 20, period: 20 },
    { id: 2, name: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, deadline: 10, period: 10 },
    { id: 3, name: 'P3', arrivalTime: 2, burstTime: 9, priority: 3, deadline: 30, period: 30 },
    { id: 4, name: 'P4', arrivalTime: 3, burstTime: 5, priority: 2, deadline: 15, period: 15 },
];

const algorithms = [
  { value: 'FCFS', label: 'First Come First Serve' },
  { value: 'SJF-NP', label: 'Shortest Job First (Non-Preemptive)' },
  { value: 'SJF-P', label: 'Shortest Job First (Preemptive)', isPreemptive: true },
  { value: 'Priority-NP', label: 'Priority (Non-Preemptive)', needsPriority: true },
  { value: 'Priority-P', label: 'Priority (Preemptive)', needsPriority: true, isPreemptive: true },
  { value: 'RR', label: 'Round Robin', needsQuantum: true },
  { value: 'EDF', label: 'Earliest Deadline First', needsRealtime: true, isPreemptive: true },
  { value: 'RMS', label: 'Rate Monotonic Scheduling', needsRealtime: true, isPreemptive: true },
];

export default function Controls() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [quantum, setQuantum] = useState(4);
  const [nextId, setNextId] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    // Load from local storage or set defaults
    try {
        const savedTasks = localStorage.getItem('scheduler-tasks');
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            setTasks(parsedTasks);
            setNextId(Math.max(...parsedTasks.map((t) => t.id), 0) + 1);
        } else {
            setTasks(defaultTasks);
            setNextId(defaultTasks.length + 1);
        }
    } catch(e) {
        setTasks(defaultTasks);
        setNextId(defaultTasks.length + 1);
    }
  }, []);

  useEffect(() => {
    // Persist tasks to localstorage whenever they change
    localStorage.setItem('scheduler-tasks', JSON.stringify(tasks));
  }, [tasks]);


  const form = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: `P${nextId}`,
      arrivalTime: 0,
      burstTime: 1,
      priority: 0,
    },
  });

  useEffect(() => {
    form.reset({ name: `P${nextId}`, arrivalTime: 0, burstTime: 1, priority: 0 });
  }, [nextId, form]);

  const selectedAlgorithm = useMemo(() => algorithms.find(a => a.value === algorithm), [algorithm]);

  const addTask = (data) => {
    setTasks([...tasks, { id: nextId, ...data }]);
    setNextId(prevId => prevId + 1);
  };

  const clearTasks = () => {
    setTasks([]);
    setNextId(1);
    toast({ title: "Task queue cleared." });
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  }

  const run = () => {
    if (tasks.length === 0) {
      toast({
        title: "No tasks to simulate",
        description: "Please add at least one task before running the simulation.",
        variant: "destructive",
      });
      return;
    }
    // Save to local storage before navigating
    localStorage.setItem('scheduler-tasks', JSON.stringify(tasks));
    localStorage.setItem('scheduler-algorithm', algorithm);

    router.push(`/simulation?algorithm=${algorithm}${selectedAlgorithm?.needsQuantum ? `&quantum=${quantum}` : ''}`);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent/80 pb-2">SchedulerSim</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">An interactive OS scheduling algorithm simulator designed to visualize complex processes with clarity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>1. Configure Simulation</CardTitle>
              <CardDescription>Select an algorithm and set its parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="algorithm">Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value)}>
                  <SelectTrigger id="algorithm" className="text-base">
                    <SelectValue placeholder="Select Algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithms.map(alg => (
                      <SelectItem key={alg.value} value={alg.value}>{alg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedAlgorithm?.needsQuantum && (
                <div className="space-y-2">
                  <Label htmlFor="quantum">Time Quantum</Label>
                  <Input id="quantum" type="number" value={quantum} onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))} min="1"/>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>2. Manage Tasks</CardTitle>
              <CardDescription>Add new tasks to the queue below.</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(addTask)}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Task Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="arrivalTime" render={({ field }) => (
                            <FormItem><FormLabel>Arrival Time</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="burstTime" render={({ field }) => (
                            <FormItem><FormLabel>Burst Time</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        {selectedAlgorithm?.needsPriority && <FormField control={form.control} name="priority" render={({ field }) => (
                            <FormItem><FormLabel>Priority</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>}
                        {selectedAlgorithm?.needsRealtime && (
                            <>
                            <FormField control={form.control} name="deadline" render={({ field }) => (
                                <FormItem><FormLabel>Deadline</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="period" render={({ field }) => (
                                <FormItem><FormLabel>Period</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            </>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2 p-4">
                    <Button type="submit" className="flex-1"><Plus className="mr-2"/>Add Task</Button>
                    <Button type="button" variant="outline" onClick={clearTasks} className="flex-1"><Trash2 className="mr-2"/>Clear All</Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
           <Card className="flex-1 shadow-lg min-h-[480px]">
            <CardHeader>
              <CardTitle>3. Task Queue</CardTitle>
              <CardDescription>Review the tasks before running the simulation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  {tasks.length === 0 && <TableCaption className="py-8">
                    <div className="text-center text-muted-foreground p-8">
                      <Bot size={48} className="mx-auto mb-4" />
                      <h3 className="text-xl font-semibold">Ready for Simulation</h3>
                      <p>Add some tasks to get started.</p>
                    </div>
                  </TableCaption>}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Name</TableHead>
                      <TableHead>Arrival</TableHead>
                      <TableHead>Burst</TableHead>
                      {selectedAlgorithm?.needsPriority && <TableHead>Priority</TableHead>}
                      {selectedAlgorithm?.needsRealtime && <>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Period</TableHead>
                      </>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>{task.arrivalTime}</TableCell>
                        <TableCell>{task.burstTime}</TableCell>
                        {selectedAlgorithm?.needsPriority && <TableCell>{task.priority}</TableCell>}
                        {selectedAlgorithm?.needsRealtime && <>
                          <TableCell>{task.deadline}</TableCell>
                          <TableCell>{task.period}</TableCell>
                        </>}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)}><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive"/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
             <CardFooter className="p-4 mt-auto">
                <Button onClick={run} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 shadow-md transition-transform hover:scale-[1.02]" disabled={tasks.length === 0}>
                    <Play className="mr-2"/> Run Simulation <ArrowRight className="ml-auto" />
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
