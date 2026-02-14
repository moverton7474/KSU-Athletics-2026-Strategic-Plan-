
import { ReactNode } from 'react';

export interface ActionItem {
  task: string;
  owner: string;
  source: string;
  priority: 'Critical' | 'High' | 'Medium';
  status: string;
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
}
