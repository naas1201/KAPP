/**
 * Cloudflare Workers Integration Module
 * 
 * This module provides utilities for Cloudflare Workers deployment:
 * - D1 Database client for SQL operations
 * - R2 Storage utilities for file uploads
 * - KV Namespace for caching and rate limiting
 * - Workers AI integration for AI features
 * - Firebase Auth sync for user management
 * - Structured logging
 * 
 * @see https://developers.cloudflare.com/workers/
 */

// Type exports
export type {
  CloudflareEnv,
  CloudflareContext,
  D1Database,
  D1PreparedStatement,
  D1Result,
  R2Bucket,
  R2Object,
  R2ObjectBody,
  KVNamespace,
  KVGetOptions,
  KVPutOptions,
  KVListOptions,
  KVListResult,
  Ai,
  AiTextGenerationResponse,
  ExecutionContext,
} from './types';

// Type utilities
export {
  getCloudflareContext,
  getD1,
  getR2,
  getAI,
  getKV,
} from './types';

// Database exports
export {
  getDB,
  query,
  queryOne,
  execute,
  batch,
  // User operations
  getUserByFirebaseUid,
  getUserByEmail,
  getUserById,
  createUser,
  updateUserRole,
  // Appointment operations
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getPendingAppointments,
  createAppointment,
  updateAppointmentStatus,
  // Treatment operations
  getActiveTreatments,
  getTreatmentById,
  getTreatmentsByCategory,
  // Doctor operations
  getAvailableDoctors,
  getDoctorByUserId,
  // Patient operations
  getPatientByUserId,
  createPatient,
} from './db';

export type {
  DBUser,
  DBAppointment,
  DBTreatment,
  DBDoctor,
  DBPatient,
} from './db';

// Storage exports
export {
  getStorage,
  uploadFile,
  uploadAppointmentFile,
  uploadPatientDocument,
  uploadPatientPhoto,
  deleteFile,
  deleteFiles,
  getFile,
  fileExists,
  listFiles,
  listPatientFiles,
  listAppointmentFiles,
  getAppointmentFilePath,
  getPatientDocumentPath,
  getPatientPhotoPath,
  isAllowedFileType,
  isAllowedFileSize,
  validateFile,
  DEFAULT_ALLOWED_FILE_TYPES,
  DEFAULT_MAX_FILE_SIZE_MB,
} from './storage';

export type {
  UploadedFile,
  UploadOptions,
} from './storage';

// AI exports
export {
  getAI as getWorkersAI,
  generateText,
  generateChat,
  generateTreatmentFAQ,
  generateConsultationSummary,
  generateHealthTips,
  checkAIHealth,
  AI_MODELS,
  DEFAULT_MODEL,
} from './ai';

export type {
  TextGenerationOptions,
  FAQ,
} from './ai';

// KV exports
export {
  getKV as getKVNamespace,
  createSession,
  getSession,
  deleteSession,
  extendSession,
  checkRateLimit,
  resetRateLimit,
  getRateLimitHeaders,
  getFeatureFlag,
  isFeatureEnabled,
  setFeatureFlag,
  listFeatureFlags,
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheGetOrSet,
  trackEvent,
  getRecentEvents,
  kv,
} from './kv';

export type {
  Session,
  SessionOptions,
  RateLimitConfig,
  RateLimitResult,
  FeatureFlag,
  CachedResponse,
  AnalyticsEvent,
} from './kv';

// Logging exports
export {
  logger,
  debug,
  info,
  warn,
  error,
  configureLogger,
  initLoggerFromEnv,
  setRequestContext,
  clearRequestContext,
  generateRequestId,
  logRequestStart,
  logRequestEnd,
  createChildLogger,
  startTimer,
  logOperation,
  logAsync,
} from './logging';

export type {
  LogLevel,
  LogEntry,
  LoggerConfig,
} from './logging';

// Auth sync exports
export {
  syncUserToD1,
  checkStaffRole,
  upgradeUserRole,
  getUserRole,
  ensureUserInD1,
} from './auth/sync-user';

export type {
  FirebaseUserData,
  SyncResult,
} from './auth/sync-user';
