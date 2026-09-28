export const computeHealth = (asset) => {
  let score = 100;

  // 1. Age penalty (max 40)
  const installDate = asset.installDate ? new Date(asset.installDate) : new Date(asset.createdAt || Date.now());
  const ageYears = Math.max(0, (Date.now() - installDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const expectedLife = asset.expectedLifeYears || 10;
  const agePenalty = Math.min(40, (ageYears / expectedLife) * 40);

  // 2. Condition penalty based on last rating (max 32)
  const latestRating = asset.lastInspection?.rating || 5;
  const conditionPenalty = Math.max(0, (5 - latestRating) * 8);

  // 3. Open work orders / issues penalty (max 15)
  const openCount = asset.openWorkOrderCount || 0;
  const openIssuePenalty = Math.min(15, openCount * 5);

  // 4. Overdue penalty (10 if overdue)
  const isOverdue = asset.nextInspectionDue && new Date(asset.nextInspectionDue) < new Date();
  const overduePenalty = isOverdue ? 10 : 0;

  // 5. AI severity penalty
  let aiPenalty = 0;
  const aiSev = asset.lastInspection?.aiSeverity;
  if (aiSev === 'low') aiPenalty = 3;
  else if (aiSev === 'medium') aiPenalty = 8;
  else if (aiSev === 'high') aiPenalty = 15;
  else if (aiSev === 'critical') aiPenalty = 25;

  score = Math.max(0, Math.min(100, Math.round(score - agePenalty - conditionPenalty - openIssuePenalty - overduePenalty - aiPenalty)));

  let riskLevel = 'low';
  if (score < 40) riskLevel = 'critical';
  else if (score < 60) riskLevel = 'high';
  else if (score < 80) riskLevel = 'medium';

  const factors = {
    ageYears: Number(ageYears.toFixed(1)),
    agePenalty: Number(agePenalty.toFixed(1)),
    conditionPenalty,
    openIssuePenalty,
    overduePenalty,
    aiPenalty
  };

  return {
    score,
    riskLevel,
    computedAt: new Date(),
    factors
  };
};
