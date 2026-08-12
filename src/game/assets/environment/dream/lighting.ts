/**
 * Read a numeric Three.js uniform defensively.
 *
 * Environment resources can briefly outlive their React owner while a scene
 * transition is being committed. Keeping this boundary untyped at runtime
 * prevents a malformed/disposed material from taking down the render loop.
 */
export function readNumericUniform(
  material: unknown,
  key: string,
): { value: number } | undefined {
  if (!material || typeof material !== "object") return undefined;
  const uniforms = (material as { uniforms?: unknown }).uniforms;
  if (!uniforms || typeof uniforms !== "object") return undefined;
  const uniform = (uniforms as Record<string, unknown>)[key];
  if (!uniform || typeof uniform !== "object") return undefined;
  const value = (uniform as { value?: unknown }).value;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return uniform as { value: number };
}
