
import React from 'react';
import { Target, Users, Shield, RefreshCw, Heart } from 'lucide-react';
import { StrategicPillar } from './types';

export const PILLARS_DATA: StrategicPillar[] = [
  {
    id: 0,
    title: 'The "Giant Killer" Mindset',
    icon: <Target className="w-6 h-6" />,
    focus: 'Aggressive Competition & Business Dev',
    enablingAction: '$10M Revenue Pipeline Growth',
    description: 'Adopting an aggressive, high-stakes approach to close the $5.5M earned revenue gap.',
    color: 'bg-yellow-500',
    metrics: [
      { label: 'Revenue Gap', value: '$5.5M', change: '-12%', trend: 'up' },
      { label: 'Pipeline Value', value: '$10.2M', change: '+24%', trend: 'up' },
      { label: 'Sponsorships', value: '$2.1M', change: '+5%', trend: 'stable' }
    ],
    actions: [
      {
        id: 'p0-a1',
        task: "Launch Revenue AI Engine (Dynamic Pricing)",
        owner: "Brad Ledford",
        source: "Deep Dive Playbook #1",
        priority: "High",
        status: "Immediate (Weeks 2-4)"
      },
      {
        id: 'p0-a2',
        task: "Execute National Broadcast Sponsorship Model",
        owner: "Brad Ledford / Rob Aycock",
        source: "Sponsorship Plan",
        priority: "High",
        status: "Planning"
      },
      {
        id: 'p0-a3',
        task: "Close $2.7M Contributions Gap (Owls Fund)",
        owner: "Stephanie Clemmons",
        source: "Huron Report",
        priority: "Critical",
        status: "Ongoing"
      }
    ]
  },
  {
    id: 1,
    title: '"Process Over Personalities"',
    icon: <RefreshCw className="w-6 h-6" />,
    focus: 'Institutional Systems Strength',
    enablingAction: '"Lean Into Change" Campaign',
    description: 'Ensuring brand strength is built on systems rather than the influence of any single individual.',
    color: 'bg-gray-900',
    metrics: [
      { label: 'Policy Compliance', value: '94%', change: '+8%', trend: 'up' },
      { label: 'Operational Efficiency', value: '78%', change: '+2%', trend: 'stable' },
      { label: 'System Adoption', value: '62%', change: '+15%', trend: 'up' }
    ],
    actions: [
      {
        id: 'p1-a1',
        task: "Implement Operations Resilience Agent (AI)",
        owner: "Jessica Reo",
        source: "Deep Dive Playbook #2",
        priority: "High",
        status: "Pilot Phase"
      },
      {
        id: 'p1-a2',
        task: "Deploy Policy RAG Chatbot (Compliance/Travel)",
        owner: "Matt Iwanski / Jessica Reo",
        source: "AI Integration Strategy",
        priority: "Medium",
        status: "Development"
      },
      {
        id: 'p1-a3',
        task: "Finalize 'Lanes of Authority' (80/20 Split)",
        owner: "Milton Overton",
        source: "Executive Retreat Agenda",
        priority: "Critical",
        status: "Tuesday Retreat"
      }
    ]
  },
  {
    id: 2,
    title: '"Team Over Ego"',
    icon: <Users className="w-6 h-6" />,
    focus: 'Collective Organizational Success',
    enablingAction: '"Practice of Extreme Humility"',
    description: 'Prioritizing collective success and implementing a "Student-Athlete First" decision matrix.',
    color: 'bg-yellow-500',
    metrics: [
      { label: 'SA Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up' },
      { label: 'Internal Net Promoter', value: '72', change: '+12', trend: 'up' },
      { label: 'Meeting Efficiency', value: '88%', change: '-5%', trend: 'down' }
    ],
    actions: [
      {
        id: 'p2-a1',
        task: "Implement Decision Rights Framework (D/R/A/I)",
        owner: "Executive Team",
        source: "Retreat Objectives",
        priority: "High",
        status: "Workshop Item"
      },
      {
        id: 'p2-a2',
        task: "Establish Weekly Executive Operating Reviews",
        owner: "Tierra Thompson",
        source: "Execution Cadence",
        priority: "High",
        status: "Immediate"
      }
    ]
  },
  {
    id: 3,
    title: 'The "Reload" Mentality',
    icon: <Shield className="w-6 h-6" />,
    focus: 'Continuous Development',
    enablingAction: 'Talent Acquisition & Retention Model',
    description: 'Robust succession planning and retention strategies for the transfer portal era.',
    color: 'bg-gray-900',
    metrics: [
      { label: 'Portal Retention', value: '91%', change: '+4%', trend: 'up' },
      { label: 'NIL Pool Reach', value: '$4.2M', change: '+$1.1M', trend: 'up' },
      { label: 'Staff Retention', value: '85%', change: '-2%', trend: 'stable' }
    ],
    actions: [
      {
        id: 'p3-a1',
        task: "Finalize Revenue Share Player Retention Model",
        owner: "Milton Overton / Legal",
        source: "C-USA Insurance Model",
        priority: "Critical",
        status: "Legal Review"
      },
      {
        id: 'p3-a2',
        task: "Implement 'Moneyball 2.0' Portal Analytics",
        owner: "Jerry Mack / Mike Kershaw",
        source: "AI Strategy",
        priority: "High",
        status: "Software Eval"
      }
    ]
  },
  {
    id: 4,
    title: '360 Holistic Model',
    icon: <Heart className="w-6 h-6" />,
    focus: 'Comprehensive Support System',
    enablingAction: 'Wellstar Champions Complex',
    description: 'Building a state-of-the-art support system for health, human performance, and academics.',
    color: 'bg-yellow-500',
    metrics: [
      { label: 'SA GPA', value: '3.42', change: '+0.05', trend: 'up' },
      { label: 'Wellstar Usage', value: '92%', change: '+14%', trend: 'up' },
      { label: 'Complex Completion', value: '68%', change: '+5%', trend: 'stable' }
    ],
    actions: [
      {
        id: 'p4-a1',
        task: "Execute $25M Wellstar Partnership Deliverables",
        owner: "Mike Young / Ops",
        source: "Strategic Goals",
        priority: "Critical",
        status: "Execution"
      },
      {
        id: 'p4-a2',
        task: "Close Student-Athlete Meals Gap ($638k)",
        owner: "Brad Ledford (Revenue)",
        source: "Huron Expense Gap",
        priority: "High",
        status: "Funding Needed"
      }
    ]
  }
];
