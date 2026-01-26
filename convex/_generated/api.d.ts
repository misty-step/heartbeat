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
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as incidents from "../incidents.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_urlValidation from "../lib/urlValidation.js";
import type * as lib_visibility from "../lib/visibility.js";
import type * as migrations from "../migrations.js";
import type * as monitoring from "../monitoring.js";
import type * as monitors from "../monitors.js";
import type * as notifications from "../notifications.js";
import type * as publicTypes from "../publicTypes.js";
import type * as slugs from "../slugs.js";
import type * as stripe from "../stripe.js";
import type * as subscriptions from "../subscriptions.js";
import type * as userSettings from "../userSettings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  checks: typeof checks;
  constants: typeof constants;
  crons: typeof crons;
  http: typeof http;
  incidents: typeof incidents;
  "lib/email": typeof lib_email;
  "lib/urlValidation": typeof lib_urlValidation;
  "lib/visibility": typeof lib_visibility;
  migrations: typeof migrations;
  monitoring: typeof monitoring;
  monitors: typeof monitors;
  notifications: typeof notifications;
  publicTypes: typeof publicTypes;
  slugs: typeof slugs;
  stripe: typeof stripe;
  subscriptions: typeof subscriptions;
  userSettings: typeof userSettings;
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
