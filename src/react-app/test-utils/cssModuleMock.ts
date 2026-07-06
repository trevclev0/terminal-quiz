export function mockCssModuleProxy() {
  return new Proxy({}, { get: (_, prop) => prop.toString() });
}
