
import { ReactNode } from 'react';

export type UserRole = 'Admin' | 'Contributor' | 'Viewer';

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
  alignmentScore?: number; // Phase 2: AI Alignment
  strategicRationale?: string; // Phase 2: AI Rationale
  externalKpiLink?: string; // Phase 2: Cascading KPIs
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
  icon?: string;
  iconElement?: ReactNode; 
  focus: string;
  enablingAction: string;
  description: string;
  color: string;
  actions: ActionItem[];
  metrics: Metric[];
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  logoUrl?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastActive?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
}
