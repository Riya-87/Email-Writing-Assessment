import { getDB } from '../config/database.js';

/**
 * Controller to fetch a single random scenario from MongoDB.
 * Endpoint: GET /api/scenarios/random
 */
export async function getRandomScenario(req, res, next) {
  try {
    const db = getDB();
    const scenarios = await db.collection('scenarios').aggregate([{ $sample: { size: 1 } }]).toArray();

    if (!scenarios || scenarios.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SCENARIOS_UNAVAILABLE',
          message: 'No writing scenarios found in database. Run npm run seed to initialize scenarios.'
        }
      });
    }

    const doc = scenarios[0];
    return res.status(200).json({
      success: true,
      data: {
        id: doc._id.toString(),
        scenario: doc.scenario,
        context: doc.context,
        category: doc.category
      }
    });
  } catch (error) {
    next(error);
  }
}
