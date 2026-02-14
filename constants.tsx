
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
    actions: [
      {
        task: "Launch Revenue AI Engine (Dynamic Pricing)",
        owner: "Brad Ledford",
        source: "Deep Dive Playbook #1",
        priority: "High",
        status: "Immediate (Weeks 2-4)"
      },
      {
        task: "Execute National Broadcast Sponsorship Model",
        owner: "Brad Ledford / Rob Aycock",
        source: "Sponsorship Plan",
        priority: "High",
        status: "Planning"
      },
      {
        task: "Close $2.7M Contributions Gap (Owls Fund)",
        owner: "Stephanie Clemmons",
        source: "Huron Report",
        priority: "Critical",
        status: "Ongoing"
      },
      {
        task: "Monetize East District/Convocation Naming Rights",
        owner: "Brad Ledford",
        source: "Huron Opportunity",
        priority: "Medium",
        status: "Inventory Phase"
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
    actions: [
      {
        task: "Implement Operations Resilience Agent (AI)",
        owner: "Jessica Reo",
        source: "Deep Dive Playbook #2",
        priority: "High",
        status: "Pilot Phase"
      },
      {
        task: "Deploy Policy RAG Chatbot (Compliance/Travel)",
        owner: "Matt Iwanski / Jessica Reo",
        source: "AI Integration Strategy",
        priority: "Medium",
        status: "Development"
      },
      {
        task: "Finalize 'Lanes of Authority' (80/20 Split)",
        owner: "Milton Overton",
        source: "Executive Retreat Agenda",
        priority: "Critical",
        status: "Tuesday Retreat"
      },
      {
        task: "Initiate CFO Search & Interim Protocol",
        owner: "Jessica Reo (Interim)",
        source: "90-Day Sprint",
        priority: "Critical",
        status: "Week 1"
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
    actions: [
      {
        task: "Implement Decision Rights Framework (D/R/A/I)",
        owner: "Executive Team",
        source: "Retreat Objectives",
        priority: "High",
        status: "Workshop Item"
      },
      {
        task: "Establish Weekly Executive Operating Reviews",
        owner: "Tierra Thompson",
        source: "Execution Cadence",
        priority: "High",
        status: "Immediate"
      },
      {
        task: "Eliminate '35 Bubbles' (AD Time Allocation)",
        owner: "Tierra Thompson",
        source: "Time Allocation Analysis",
        priority: "Medium",
        status: "Restructuring"
      },
      {
        task: "Align 'President’s Parliament' Funding Requests",
        owner: "Milton Overton",
        source: "Retreat Wrap-Up",
        priority: "High",
        status: "Strategic"
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
    actions: [
      {
        task: "Finalize Revenue Share Player Retention Model",
        owner: "Milton Overton / Legal",
        source: "C-USA Insurance Model",
        priority: "Critical",
        status: "Legal Review"
      },
      {
        task: "Implement 'Moneyball 2.0' Portal Analytics",
        owner: "Jerry Mack / Mike Kershaw",
        source: "AI Strategy",
        priority: "High",
        status: "Software Eval"
      },
      {
        task: "Secure $8-10M NIL Pool Target",
        owner: "Owls Collective / Dev",
        source: "Power 4 Benchmark",
        priority: "High",
        status: "Ongoing"
      },
      {
        task: "Standardize Sport Supervision Program",
        owner: "Jessica Reo",
        source: "Huron Interview Themes",
        priority: "Medium",
        status: "Drafting"
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
    actions: [
      {
        task: "Execute $25M Wellstar Partnership Deliverables",
        owner: "Mike Young / Ops",
        source: "Strategic Goals",
        priority: "Critical",
        status: "Execution"
      },
      {
        task: "Close Student-Athlete Meals Gap ($638k)",
        owner: "Brad Ledford (Revenue)",
        source: "Huron Expense Gap",
        priority: "High",
        status: "Funding Needed"
      },
      {
        task: "Complete Mickey Dunn Stadium Renovation",
        owner: "Ops / Facilities",
        source: "Capital Projects",
        priority: "High",
        status: "Construction"
      },
      {
        task: "Initiate Athletics-Specific Master Plan",
        owner: "Facilities Director",
        source: "Huron Rec",
        priority: "Medium",
        status: "RFP Stage"
      }
    ]
  }
];
