
import { ReactNode } from 'react';

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  ownerEmail?: string;
  source: string;
  priority: 'Critical' | 'High' | 'Medium';
  status: string;
  deadline?: string;
  progress?: number;
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
  icon?: string; // Stored as name for DB compatibility
  iconElement?: ReactNode; 
  focus: string;
  enablingAction: string;
  description: string;
  color: string;
  actions: ActionItem[];
  metrics: Metric[];
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Contributor' | 'Viewer';
  lastActive?: string;
}
