export const encodeCursor = (id) => {
  if (!id) return null;
  return Buffer.from(id.toString()).toString('base64');
};

export const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    return Buffer.from(cursor, 'base64').toString('utf8');
  } catch (err) {
    return null;
  }
};

export const buildCursorFilter = (cursor, sortField = '_id', direction = -1) => {
  const decoded = decodeCursor(cursor);
  if (!decoded) return {};

  const op = direction === -1 ? '$lt' : '$gt';
  return { [sortField]: { [op]: decoded } };
};
