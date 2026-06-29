// Mock du stockage natif pour les tests (cf. doc officielle AsyncStorage).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
