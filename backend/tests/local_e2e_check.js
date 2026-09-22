import dotenv from 'dotenv';
dotenv.config();

import { connectDB, closeDB, getDB } from '../src/config/database.js';
import { getRandomScenario } from '../src/controllers/scenarioController.js';
import { evaluateEmail } from '../src/services/evaluator.js';
import { calculateScores, sanitizeFeedback } from '../src/services/scoring.js';

async function runCheck() {
  console.log('--- Step 1: Testing MongoDB Atlas Connection ---');
  try {
    const db = await connectDB();
    const scenarioCount = await db.collection('scenarios').countDocuments();
    console.log(`[PASS] MongoDB Atlas connected successfully. Total scenarios in DB: ${scenarioCount}`);
  } catch (err) {
    console.error(`[FAIL] MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n--- Step 2: Testing Scenario Fetch ---');
  try {
    const db = getDB();
    const sample = await db.collection('scenarios').aggregate([{ $sample: { size: 1 } }]).toArray();
    if (sample.length > 0) {
      console.log(`[PASS] Scenario fetched: "${sample[0].scenario}" (Category: ${sample[0].category})`);
    } else {
      console.warn('[WARN] No scenarios found in database. You may need to run npm run seed.');
    }
  } catch (err) {
    console.error(`[FAIL] Scenario fetch failed: ${err.message}`);
  }

  console.log('\n--- Step 3: Testing Google Gemini Structured Evaluation ---');
  try {
    const evalResult = await evaluateEmail({
      scenario: 'Ask your manager for a day off',
      context: 'Request personal time off for next Friday due to family commitment.',
      category: 'Workplace Request',
      to: 'manager@example.com',
      subject: 'Time Off Request - Next Friday',
      body: 'Dear Manager,\n\nI am writing to request a day off next Friday for a family event. I have arranged for John to cover my shift and completed all pending tasks.\n\nThank you,\nCandidate'
    });

    console.log('[PASS] Gemini evaluation received successfully:');
    console.log('  Scores:', JSON.stringify(evalResult.scores));
    console.log('  Strengths:', evalResult.strengths);
    console.log('  Improvements:', evalResult.improvements);

    const calculated = calculateScores(evalResult.scores);
    console.log(`[PASS] Calculated Total Score: ${calculated.totalScore}/100`);
  } catch (err) {
    console.error(`[FAIL] Gemini evaluation failed: ${err.message}`);
  }

  console.log('\n--- Step 4: Closing DB connection ---');
  await closeDB();
  console.log('[PASS] All verification steps completed.');
}

runCheck().catch((err) => {
  console.error('Fatal error during check:', err.message);
  process.exit(1);
});
