const defaultTestMongoUri = 'mongodb://localhost:27017/paintshop_test';

const getDatabaseName = (mongoUri) => {
  try {
    return new URL(mongoUri).pathname.replace(/^\//, '').split('?')[0];
  } catch {
    return '';
  }
};

export const getTestMongoUri = () => {
  const mongoUri = process.env.MONGODB_TEST_URI || defaultTestMongoUri;
  const databaseName = getDatabaseName(mongoUri);

  if (!databaseName || !/_test$/i.test(databaseName)) {
    throw new Error('MONGODB_TEST_URI must point to a database whose name ends with _test.');
  }

  return mongoUri;
};
