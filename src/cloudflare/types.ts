/**
 * Cloudflare Workers Type Definitions
 * 
 * These types define the environment bindings available in Cloudflare Workers.
 * They are used for D1 database, R2 storage, and Workers AI integration.
 */

/**
 * Environment bindings available in Cloudflare Workers
 * These correspond to the bindings defined in wrangler.toml
 */
export interface CloudflareEnv {
  /** D1 SQL Database binding for application data */
  DB: D1Database;
  
  /** R2 Object Storage binding for file uploads */
  STORAGE: R2Bucket;
  
  /** Workers AI binding for AI-powered features */
  AI: Ai;
  
  /** Environment name (production, development, etc.) */
  ENVIRONMENT?: string;
}

/**
 * D1 Database interface
 * @see https://developers.cloudflare.com/d1/
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * R2 Object Storage interface
 * @see https://developers.cloudflare.com/r2/
 */
export interface R2Bucket {
  head(key: string): Promise<R2Object | null>;
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob, options?: R2PutOptions): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  createMultipartUpload(key: string, options?: R2MultipartOptions): Promise<R2MultipartUpload>;
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload;
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  checksums: R2Checksums;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  range?: R2Range;
  writeHttpMetadata(headers: Headers): void;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  blob(): Promise<Blob>;
}

export interface R2GetOptions {
  onlyIf?: R2Conditional;
  range?: R2Range;
}

export interface R2PutOptions {
  onlyIf?: R2Conditional;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  md5?: ArrayBuffer | string;
  sha1?: ArrayBuffer | string;
  sha256?: ArrayBuffer | string;
  sha384?: ArrayBuffer | string;
  sha512?: ArrayBuffer | string;
}

export interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  include?: ('httpMetadata' | 'customMetadata')[];
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

export interface R2Checksums {
  md5?: ArrayBuffer;
  sha1?: ArrayBuffer;
  sha256?: ArrayBuffer;
  sha384?: ArrayBuffer;
  sha512?: ArrayBuffer;
}

export interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

export interface R2Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
}

export interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}

export interface R2MultipartOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

export interface R2MultipartUpload {
  key: string;
  uploadId: string;
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob): Promise<R2UploadedPart>;
  abort(): Promise<void>;
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>;
}

export interface R2UploadedPart {
  partNumber: number;
  etag: string;
}

/**
 * Workers AI interface
 * @see https://developers.cloudflare.com/workers-ai/
 */
export interface Ai {
  run<T = unknown>(model: string, inputs: AiInput, options?: AiOptions): Promise<T>;
}

export interface AiInput {
  prompt?: string;
  messages?: AiMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  image?: number[];
  raw?: boolean;
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiOptions {
  gateway?: {
    id: string;
    skipCache?: boolean;
    cacheTtl?: number;
  };
}

/**
 * AI Text Generation Response
 */
export interface AiTextGenerationResponse {
  response?: string;
  tool_calls?: AiToolCall[];
}

export interface AiToolCall {
  name: string;
  arguments: unknown;
}

/**
 * Request context for Cloudflare Workers
 * Available in Next.js API routes when deployed to Cloudflare
 */
export interface CloudflareContext {
  env: CloudflareEnv;
  ctx: ExecutionContext;
}

/**
 * Execution context for Cloudflare Workers
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Helper function to get Cloudflare context from Next.js request
 * Note: This only works when deployed to Cloudflare Workers
 */
export function getCloudflareContext(): CloudflareContext | null {
  // In Cloudflare Workers with OpenNext, the context is available globally
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalContext = (globalThis as any).cloudflare;
  if (globalContext) {
    return {
      env: globalContext.env,
      ctx: globalContext.ctx,
    };
  }
  return null;
}

/**
 * Get D1 Database from context
 */
export function getD1(context: CloudflareContext | null): D1Database | null {
  return context?.env.DB ?? null;
}

/**
 * Get R2 Bucket from context
 */
export function getR2(context: CloudflareContext | null): R2Bucket | null {
  return context?.env.STORAGE ?? null;
}

/**
 * Get Workers AI from context
 */
export function getAI(context: CloudflareContext | null): Ai | null {
  return context?.env.AI ?? null;
}
