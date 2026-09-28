const cleanInPlace = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      cleanInPlace(obj[key]);
    }
  }
};

export const sanitize = (req, res, next) => {
  if (req.body) cleanInPlace(req.body);
  if (req.query) cleanInPlace(req.query);
  if (req.params) cleanInPlace(req.params);
  next();
};
