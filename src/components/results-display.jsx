"use client";

import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


export const ResultsTable = ({ stats, algorithm }) => {
    const showDeadline = ['EDF', 'RMS'].includes(algorithm);
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Turnaround</TableHead>
                    <TableHead>Waiting</TableHead>
                    <TableHead>Response</TableHead>
                    {showDeadline && <TableHead>Deadline Met</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
            {stats && stats.sort((a,b) => a.id - b.id).map(stat => (
                <TableRow key={stat.id}>
                    <TableCell className="font-medium">{stat.name}</TableCell>
                    <TableCell>{stat.completionTime}</TableCell>
                    <TableCell>{stat.turnaroundTime}</TableCell>
                    <TableCell>{stat.waitingTime}</TableCell>
                    <TableCell>{stat.responseTime}</TableCell>
                    {showDeadline && (
                        <TableCell className={cn(stat.deadlineMet === 'No' && 'text-destructive font-semibold')}>
                            {stat.deadlineMet}
                        </TableCell>
                    )}
                </TableRow>
            ))}
            </TableBody>
        </Table>
    );
}

export const StatCard = ({ title, value }) => (
    <div className="bg-muted/30 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
)
