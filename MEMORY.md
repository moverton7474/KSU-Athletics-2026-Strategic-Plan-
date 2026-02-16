# System Memory: NeuroSync Strategic Dashboard

## Current State (As of Feb 2025)
- **Environment**: Production-ready React 19 application.
- **Database**: Supabase integration active via `strategic_plan` table.
- **Intelligence**: Gemini 2.5 Live API integrated for voice; Gemini 3 Flash for text.
- **Knowledge Base**: `knowledgeBase.ts` acts as the primary strategic reference.

## Recent Updates
- **2025-02-14**: Implemented Manual Edit Modal for `ActionCard`.
- **2025-02-14**: Added `update_action_item` tool to AI Assistant.
- **2025-02-14**: Documentation layer added (`PRODUCT_DESCRIPTION.md`, `USER_GUIDE.md`, `MEMORY.md`).
- **2025-02-14**: Integrated "Second Brain" Knowledge Base into AI context.

## Active Roadmap
- [ ] Implement manual "Add Item" button on the UI (currently AI-only).
- [ ] Add User Authentication via Supabase Auth.
- [ ] Implement multi-user real-time presence (who else is viewing the dashboard).
- [ ] Expand metrics visualization with Chart.js or Recharts.

## Technical Constraints
- Model: `gemini-2.5-flash-native-audio-preview-12-2025` used for Voice.
- Table: `strategic_plan` stores all JSON data under a single `plan_key`.
