# The Taste Graph (Investor-Ready Feature Roadmap)

**Status:** Pending (Awaiting Quota Reset)

## The Core Concept
Right now Mimi generates artifacts (zines). Investors don't care about artifacts; they care about data accumulation and network effects. The feature that turns Mimi into infrastructure is a persistent, evolving map of aesthetic intelligence: **The Taste Graph**.

## What It Is
Every interaction a user has with Mimi produces signals:
- Fragments they save
- References they input
- Visual styles they like
- Concepts they generate
- Artifacts they publish

All of this becomes structured data.

### Example
User saves:
- Margiela runway
- Brutalist typography
- Evangelion biomech

The system converts that into embeddings:
```json
UserTasteVector = {
  "avant_garde_fashion": 0.81,
  "brutalism": 0.63,
  "biomechanical": 0.72,
  "conceptual_art": 0.66
}
```

Over time, Mimi learns an `AestheticProfile` as an evolving vector.

## Why This Is Fundable
Because it becomes a new dataset. Datasets are what AI companies are valued on. Right now there is no dataset of taste. Pinterest approximates it through engagement, but Mimi would have **semantic taste training**. That is very different.

## The Flywheel
The Taste Graph creates a compounding loop:
1. User fragments
2. AI interpretation
3. Taste profile
4. Better synthesis
5. More use
6. More fragments
7. Stronger dataset

This is the AI flywheel investors want.

## What This Enables Later
Once the Taste Graph exists, Mimi can power:

### 1. Trend Detection
Find emerging aesthetics before they become trends.
*Example:* `biomechanical` + `catholic iconography` appearing in 3% of new users = Trend signal.

### 2. Cultural Intelligence Reports
Instead of WGSN trend reports, brands query Mimi.
*Example:* "What aesthetics are emerging in Gen Z fashion?"

### 3. Creative Matching
Connect people with similar taste vectors.
*Examples:* designer ↔ photographer, brand ↔ creative director

### 4. AI Personalization
Every Mimi output becomes deeply personalized. Not generic AI.

## The Moat
Once thousands of users train Mimi, the dataset becomes extremely hard to replicate.
