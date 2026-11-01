export const MOBILE_BUSINESS_STUB_MODULES = [] as const;

export function assertNoStubModules(
  nav: readonly { screen: string }[],
): { ok: true } | { ok: false; screens: string[] } {
  const screens = nav.filter((item) => item.screen === 'ModuleRecords').map((item) => item.screen);
  if (screens.length > 0) return { ok: false, screens };
  return { ok: true };
}
