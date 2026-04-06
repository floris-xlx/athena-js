/**
 * athena gateway react module
 *
 * Low-level gateway hook. Most users should use createClient() and the query builder.
 */

export { useAthenaGateway } from "./use-athena-gateway.js";
export { AthenaGatewayError, isAthenaGatewayError } from "./errors.ts";
export type {
  AthenaGatewayHookConfig,
  AthenaGatewayHookResult,
  AthenaGatewayCallOptions,
  AthenaGatewayErrorCode,
  AthenaGatewayErrorDetails,
  AthenaRpcFilter,
  AthenaRpcFilterOperator,
  AthenaFetchPayload,
  AthenaInsertPayload,
  AthenaRpcOrder,
  AthenaRpcCallOptions,
  AthenaRpcPayload,
  AthenaUpdatePayload,
  AthenaDeletePayload,
  AthenaGatewayResponse,
} from "./types.js";
