/**
 * athena-js
 *
 * database driver API gateway SDK — Athena client for the Athena HTTP API
 * built by XYLEX Group
 */

// Athena client
export { createClient, AthenaClient } from "./supabase.js";
export { Backend } from "./gateway/types.js";
export type {
  RpcQueryBuilder,
  RpcOrderOptions,
  SupabaseClient,
  TableQueryBuilder,
  SupabaseResult,
} from "./supabase.js";
export type {
  AthenaRpcCallOptions,
  AthenaRpcFilter,
  AthenaRpcFilterOperator,
  AthenaRpcOrder,
  AthenaRpcPayload,
  BackendType,
  BackendConfig,
  AthenaGatewayCallOptions,
} from "./gateway/types.js";
