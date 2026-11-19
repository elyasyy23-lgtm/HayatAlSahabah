/**
 * Copy helper shared by the Support and Donate screens.
 *
 * The value is written verbatim — never trimmed, shortened or reformatted —
 * so a wallet address or an ID on the clipboard is exactly what is on screen.
 * Resolves false when the platform clipboard refuses, so the caller can stay
 * silent instead of showing a false "Copied" state.
 */
export type ClipboardWrite = (value: string) => Promise<unknown>;

export async function copyExact(write: ClipboardWrite, value: string): Promise<boolean> {
  if (!value) return false;
  try {
    await write(value);
    return true;
  } catch {
    return false;
  }
}
