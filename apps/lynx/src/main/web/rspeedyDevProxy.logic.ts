export function isRspeedyDevAsset(pathname: string): boolean {
  return (
    pathname.includes("__rspeedy") ||
    pathname.endsWith(".bundle") ||
    pathname.endsWith(".bundle.map")
  );
}
