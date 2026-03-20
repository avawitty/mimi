import * as functions from 'firebase-functions/v1';
import express from 'express';
import cookieParser from 'cookie-parser';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp();

const app = express();
app.use(cookieParser());
app.use(express.json());

// Session login endpoint
app.post('/api/sessionLogin', async (req, res) => {
  const idToken = req.body.idToken;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
    res.cookie('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    res.status(200).send({ status: 'success' });
  } catch (error) {
    res.status(401).send({ error: 'Unauthorized' });
  }
});

// Session logout endpoint
app.post('/api/sessionLogout', (req, res) => {
  res.clearCookie('__session');
  res.status(200).send({ status: 'success' });
});

import { generateDailyPressIssue } from './pressGenerator'; // I'll need to create this

// ... existing code ...

// Trigger endpoint for press issue generation
app.post('/api/triggerPressGeneration', async (req, res) => {
  try {
    await generateDailyPressIssue();
    res.status(200).send({ status: 'success' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to generate press issues' });
  }
});

export const api = functions.https.onRequest(app);
export const dailyPressIssueJob = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  await generateDailyPressIssue();
});
