export const HEALTH_COLORS = {
  healthy: '#8FD3B0',
  watch: '#E6C36A',
  high: '#E38B5F',
  critical: '#EF6A62'
};

export const getHealthRiskLevel = (score) => {
  if (score < 40) return 'critical';
  if (score < 60) return 'high';
  if (score < 80) return 'watch';
  return 'healthy';
};

export const getHealthColor = (riskOrScore) => {
  const risk = typeof riskOrScore === 'number' ? getHealthRiskLevel(riskOrScore) : riskOrScore;
  return HEALTH_COLORS[risk] || HEALTH_COLORS.healthy;
};

export const getHealthBadgeClass = (riskOrScore) => {
  const risk = typeof riskOrScore === 'number' ? getHealthRiskLevel(riskOrScore) : riskOrScore;
  switch (risk) {
    case 'critical':
      return 'chip-critical';
    case 'high':
      return 'chip-high';
    case 'watch':
      return 'chip-watch';
    default:
      return 'chip-healthy';
  }
};
