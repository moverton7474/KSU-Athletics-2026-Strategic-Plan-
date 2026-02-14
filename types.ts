
import { ReactNode } from 'react';

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  source: string;
  priority: 'Critical' | 'High' | 'Medium';
  status: string;
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export interface StrategicPillar {
  id: number;
  title: string;
  icon: ReactNode;
  focus: string;
  enablingAction: string;
  description: string;
  color: string;
  actions: ActionItem[];
  metrics: Metric[];
}
