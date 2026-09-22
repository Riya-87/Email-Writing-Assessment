import dotenv from 'dotenv';
dotenv.config();

import { connectDB, closeDB } from '../config/database.js';

export const initialScenarios = [
  {
    scenario: 'Ask your manager for a day off',
    context: 'You need to request personal time off for next Friday due to a family commitment. Ensure your current projects are handed over or up to date.',
    category: 'Workplace Request'
  },
  {
    replyTo: 'Reply to a customer who received a damaged product',
    scenario: 'Reply to a customer who received a damaged product',
    context: 'A customer received a cracked ceramic mug they ordered from your e-commerce store. They are disappointed and asking for an immediate solution.',
    category: 'Customer Support'
  },
  {
    scenario: 'Follow up after a job interview',
    context: 'You interviewed for a Junior Full-Stack Developer position three days ago. Thank the interviewer, reiterate your interest in the team, and inquire about next steps.',
    category: 'Job Application'
  },
  {
    scenario: 'Request to reschedule a meeting',
    context: 'You have a calendar conflict with an upcoming project kickoff meeting with a client. Apologize and propose two alternate times.',
    category: 'Professional Scheduling'
  },
  {
    scenario: 'Ask a manager for clarification about an assignment',
    context: 'You received project specifications for an urgent task, but two acceptance criteria appear contradictory. Ask for clarity professionally without stalling progress.',
    category: 'Internal Communication'
  },
  {
    scenario: 'Follow up on an unanswered professional email',
    context: 'You sent an important design approval request to a senior stakeholder one week ago but received no response. Send a polite, professional nudge.',
    category: 'Professional Follow-up'
  },
  {
    scenario: 'Inform a manager about a task delay',
    context: 'A technical blocker with a third-party API has delayed your deliverable by two business days. Inform your manager early, explain the root cause, and present an updated ETA.',
    category: 'Status Update'
  },
  {
    scenario: 'Ask a client for missing project information',
    context: 'The client did not provide the brand assets and color guidelines needed to begin the UI development. Politely request these materials to avoid project delays.',
    category: 'Client Communication'
  },
  {
    scenario: 'Request feedback after completing a project',
    context: 'You successfully deployed the new customer onboarding flow. Email the product manager asking for their feedback and any suggested areas of improvement.',
    category: 'Professional Development'
  },
  {
    scenario: 'Request work-from-home for one day',
    context: 'You need to work remotely on Wednesday because of a home maintenance technician visit. Confirm that you will be reachable on Slack and attend all scheduled calls.',
    category: 'Workplace Request'
  },
  {
    scenario: 'Acknowledge an escalated customer complaint',
    context: 'A customer’s subscription was billed twice due to a billing gateway error. Acknowledge the issue with empathy, explain that the refund has been initiated, and provide reference details.',
    category: 'Customer Support'
  },
  {
    scenario: 'Congratulate a colleague on a promotion',
    context: 'A colleague on another team was recently promoted to Team Lead. Send a warm, professional note congratulating them and acknowledging their dedication.',
    category: 'Internal Communication'
  }
];

export async function seedScenarios() {
  console.log('Starting scenario seed process...');
  const db = await connectDB();
  const scenariosCollection = db.collection('scenarios');

  // Ensure index on scenario name to facilitate fast lookups and avoid duplicates
  await scenariosCollection.createIndex({ scenario: 1 }, { unique: true });

  let insertedCount = 0;
  let existingCount = 0;

  for (const item of initialScenarios) {
    const result = await scenariosCollection.updateOne(
      { scenario: item.scenario },
      {
        $setOnInsert: {
          scenario: item.scenario,
          context: item.context,
          category: item.category,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      insertedCount++;
    } else {
      existingCount++;
    }
  }

  console.log(`Seeding complete: ${insertedCount} inserted, ${existingCount} already existed.`);
  return { insertedCount, existingCount };
}

// Allow direct execution via `node src/seed/scenarios.js`
if (process.argv[1] && process.argv[1].endsWith('scenarios.js')) {
  seedScenarios()
    .then(async () => {
      await closeDB();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('Seed script failed:', error.message);
      await closeDB();
      process.exit(1);
    });
}
