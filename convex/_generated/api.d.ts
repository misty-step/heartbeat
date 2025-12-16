/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as checks from "../checks.js";
import type * as crons from "../crons.js";
import type * as incidents from "../incidents.js";
import type * as lib_visibility from "../lib/visibility.js";
import type * as migrations from "../migrations.js";
import type * as monitoring from "../monitoring.js";
import type * as monitors from "../monitors.js";
import type * as publicTypes from "../publicTypes.js";
import type * as slugs from "../slugs.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  checks: typeof checks;
  crons: typeof crons;
  incidents: typeof incidents;
  "lib/visibility": typeof lib_visibility;
  migrations: typeof migrations;
  monitoring: typeof monitoring;
  monitors: typeof monitors;
  publicTypes: typeof publicTypes;
  slugs: typeof slugs;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
