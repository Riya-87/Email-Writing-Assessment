import { getDB } from '../config/database.js';

/**
 * Controller to fetch submission history and cumulative performance for a session.
 * Endpoint: GET /api/history/:sessionId
 */
export async function getSessionHistory(req, res, next) {
  try {
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A valid sessionId parameter is required.'
        }
      });
    }

    if (sessionId.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sessionId parameter exceeds maximum length of 100 characters.'
        }
      });
    }

    const db = getDB();
    const cleanSessionId = sessionId.trim();

    // Query up to 50 newest attempts for this session
    const attemptsDocs = await db.collection('submissions')
      .find({ sessionId: cleanSessionId })
      .sort({ submittedAt: -1 })
      .limit(50)
      .toArray();

    // Compute total accumulated points across all attempts for this session
    const totalPointsAgg = await db.collection('submissions').aggregate([
      { $match: { sessionId: cleanSessionId } },
      { $group: { _id: null, totalPoints: { $sum: '$totalScore' }, totalAttempts: { $sum: 1 } } }
    ]).toArray();

    const totalPoints = totalPointsAgg.length > 0 ? totalPointsAgg[0].totalPoints : 0;
    const totalAttempts = totalPointsAgg.length > 0 ? totalPointsAgg[0].totalAttempts : 0;

    const attempts = attemptsDocs.map(doc => ({
      attemptId: doc._id.toString(),
      scenario: doc.scenarioSnapshot?.scenario || 'Unknown Scenario',
      subject: doc.subject,
      totalScore: doc.totalScore,
      submittedAt: doc.submittedAt instanceof Date ? doc.submittedAt.toISOString() : doc.submittedAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        sessionId: cleanSessionId,
        totalAttempts,
        totalPoints,
        attempts
      }
    });
  } catch (error) {
    next(error);
  }
}
