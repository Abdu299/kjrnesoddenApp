export async function registerOrderPush(_uid: string) {}
export async function unregisterOrderPush() {}
export function listenForOrderPush(_open: (id: string) => void) { return () => {}; }
