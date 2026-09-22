import { ObjectId } from 'mongodb';
import { getDB } from '../config/database.js';
import { evaluateEmail } from '../services/evaluator.js';
import { calculateScores, sanitizeFeedback } from '../services/scoring.js';
import { evaluationQueue } from '../services/concurrencyQueue.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controller to handle email submission, evaluation, and persistence.
 * Endpoint: POST /api/submissions
 */
export async function submitEmail(req, res, next) {
  const startTime = Date.now();

  try {
    const { sessionId, scenarioId, to, subject, body, clientSubmissionId: bodyClientSubId } = req.body || {};
    const clientSubmissionId = (bodyClientSubId || req.headers['idempotency-key'] || req.headers['x-client-submission-id'])?.trim();

    // 1. Validation
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sessionId is required and must be a non-empty string.'
        }
      });
    }

    if (sessionId.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sessionId exceeds maximum allowed length of 100 characters.'
        }
      });
    }

    if (!scenarioId || typeof scenarioId !== 'string' || !ObjectId.isValid(scenarioId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A valid scenarioId is required.'
        }
      });
    }

    if (!to || typeof to !== 'string' || !EMAIL_REGEX.test(to.trim()) || to.trim().length > 254) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A valid recipient email address (To) is required.'
        }
      });
    }

    const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
    if (!cleanSubject) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Subject is required.'
        }
      });
    }

    if (cleanSubject.length > 200) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Subject cannot exceed 200 characters.'
        }
      });
    }

    const cleanBody = typeof body === 'string' ? body.trim() : '';
    if (!cleanBody) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Body is required.'
        }
      });
    }

    if (cleanBody.length > 10000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Body cannot exceed 10000 characters.'
        }
      });
    }

    if (clientSubmissionId && typeof clientSubmissionId === 'string' && clientSubmissionId.length > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'clientSubmissionId exceeds maximum allowed length of 100 characters.'
        }
      });
    }

    const db = getDB();

    // 2. Idempotency check: if clientSubmissionId was previously completed, return cached result
    if (clientSubmissionId) {
      const existingSubmission = await db.collection('submissions').findOne({
        clientSubmissionId,
        sessionId: sessionId.trim()
      });

      if (existingSubmission && existingSubmission.status === 'COMPLETED') {
        // Aggregate total points
        const totalPointsAgg = await db.collection('submissions').aggregate([
          { $match: { sessionId: sessionId.trim(), status: 'COMPLETED' } },
          { $group: { _id: null, totalPoints: { $sum: '$totalScore' } } }
        ]).toArray();

        const totalPoints = totalPointsAgg.length > 0 ? totalPointsAgg[0].totalPoints : existingSubmission.totalScore;

        return res.status(200).json({
          success: true,
          data: {
            attemptId: existingSubmission._id.toString(),
            scores: existingSubmission.scores,
            totalScore: existingSubmission.totalScore,
            feedback: existingSubmission.feedback,
            pointsAdded: existingSubmission.totalScore,
            totalPoints,
            submittedAt: existingSubmission.submittedAt instanceof Date
              ? existingSubmission.submittedAt.toISOString()
              : existingSubmission.submittedAt,
            idempotentReplay: true
          }
        });
      }
    }

    // 3. Find scenario prompt
    const scenarioDoc = await db.collection('scenarios').findOne({ _id: new ObjectId(scenarioId) });
    if (!scenarioDoc) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SCENARIO_NOT_FOUND',
          message: `Scenario with id ${scenarioId} does not exist.`
        }
      });
    }

    // 4. Enqueue evaluation in concurrency queue to protect Gemini rate limits
    const rawEvaluation = await evaluationQueue.enqueue(async () => {
      return await evaluateEmail({
        scenario: scenarioDoc.scenario,
        context: scenarioDoc.context,
        category: scenarioDoc.category,
        to: to.trim(),
        subject: cleanSubject,
        body: cleanBody
      });
    });

    // 5. Calculate deterministic scores & sanitize feedback on backend
    const { scores, totalScore } = calculateScores(rawEvaluation.scores);
    const feedback = sanitizeFeedback(rawEvaluation);

    // 6. Persist submission document
    const submittedAt = new Date();
    const processingTimeMs = Date.now() - startTime;

    const submissionDoc = {
      sessionId: sessionId.trim(),
      scenarioId: scenarioDoc._id,
      scenarioSnapshot: {
        scenario: scenarioDoc.scenario,
        context: scenarioDoc.context,
        category: scenarioDoc.category
      },
      to: to.trim(),
      subject: cleanSubject,
      body: cleanBody,
      scores,
      totalScore,
      feedback,
      status: 'COMPLETED',
      processingTimeMs,
      submittedAt
    };

    if (clientSubmissionId) {
      submissionDoc.clientSubmissionId = clientSubmissionId;
    }

    let attemptId;
    try {
      const insertResult = await db.collection('submissions').insertOne(submissionDoc);
      attemptId = insertResult.insertedId.toString();
    } catch (insertError) {
      // Handle race-condition duplicate key error on clientSubmissionId (code 11000)
      if (insertError.code === 11000 && clientSubmissionId) {
        const existing = await db.collection('submissions').findOne({ clientSubmissionId });
        if (existing) {
          const totalPointsAgg = await db.collection('submissions').aggregate([
            { $match: { sessionId: sessionId.trim(), status: 'COMPLETED' } },
            { $group: { _id: null, totalPoints: { $sum: '$totalScore' } } }
          ]).toArray();

          return res.status(200).json({
            success: true,
            data: {
              attemptId: existing._id.toString(),
              scores: existing.scores,
              totalScore: existing.totalScore,
              feedback: existing.feedback,
              pointsAdded: existing.totalScore,
              totalPoints: totalPointsAgg.length > 0 ? totalPointsAgg[0].totalPoints : existing.totalScore,
              submittedAt: existing.submittedAt instanceof Date ? existing.submittedAt.toISOString() : existing.submittedAt,
              idempotentReplay: true
            }
          });
        }
      }
      throw insertError;
    }

    // 7. Calculate total points for session from submissions collection (single source of truth)
    const totalPointsAgg = await db.collection('submissions').aggregate([
      { $match: { sessionId: sessionId.trim(), status: 'COMPLETED' } },
      { $group: { _id: null, totalPoints: { $sum: '$totalScore' } } }
    ]).toArray();

    const totalPoints = totalPointsAgg.length > 0 ? totalPointsAgg[0].totalPoints : totalScore;

    // 8. Return structured result according to API contract
    return res.status(201).json({
      success: true,
      data: {
        attemptId,
        scores,
        totalScore,
        feedback,
        pointsAdded: totalScore,
        totalPoints,
        submittedAt: submittedAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}
