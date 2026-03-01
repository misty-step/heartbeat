/**
 * Serialize a JSON-LD object for safe injection via dangerouslySetInnerHTML.
 *
 * JSON.stringify does NOT escape < > & by default. A monitor name containing
 * </script> would terminate the script block and allow script injection on
 * public status pages. Unicode escapes are valid JSON and invisible to browsers.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
