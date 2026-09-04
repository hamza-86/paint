/**
 * Frontend API Client Configuration
 *
 * The frontend communicates strictly with the standalone Express.js backend.
 * Base URL defaults to http://localhost:5000/api for local development.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
