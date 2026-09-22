import { ObjectId } from 'mongodb';
import { getDB } from '../config/database.js';

/**
 * Controller to fetch details of a specific assessment attempt.
 * Endpoint: GET /api/results/:attemptId?sessionId=<uuid>
 */
export async function getAttemptResult(req, res, next) {
  try {
    const { attemptId } = req.params;
    const sessionId = req.query.sessionId || req.headers['x-session-id'];

    if (!attemptId || !ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A valid attemptId is required.'
        }
      });
    }

    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sessionId query parameter is required to verify attempt ownership.'
        }
      });
    }

    const db = getDB();
    const submission = await db.collection('submissions').findOne({ _id: new ObjectId(attemptId) });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Attempt with id ${attemptId} was not found.`
        }
      });
    }

    // Security check: ensure attempt belongs to this session
    if (submission.sessionId !== sessionId.trim()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: This attempt does not belong to the provided sessionId.'
        }
      });
    }

    // Calculate total points accumulated in this session
    const totalPointsAgg = await db.collection('submissions').aggregate([
      { $match: { sessionId: sessionId.trim() } },
      { $group: { _id: null, totalPoints: { $sum: '$totalScore' } } }
    ]).toArray();

    const totalPoints = totalPointsAgg.length > 0 ? totalPointsAgg[0].totalPoints : submission.totalScore;

    return res.status(200).json({
      success: true,
      data: {
        attemptId: submission._id.toString(),
        scores: submission.scores,
        totalScore: submission.totalScore,
        feedback: submission.feedback,
        pointsAdded: submission.totalScore,
        totalPoints,
        submittedAt: submission.submittedAt instanceof Date
          ? submission.submittedAt.toISOString()
          : submission.submittedAt
      }
    });
  } catch (error) {
    next(error);
  }
}
