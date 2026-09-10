// FILE: pathTree.ts
// Purpose: Build a sorted, path-compressed tree from repo-relative paths.
// Layer: Shared renderer-independent presentation policy

export interface PathTreeFileNode {
  readonly kind: 'file';
  readonly name: string;
  readonly path: string;
}

export interface PathTreeDirectoryNode {
  readonly kind: 'directory';
  readonly name: string;
  readonly path: string;
  readonly children: readonly PathTreeNode[];
}

export type PathTreeNode = PathTreeDirectoryNode | PathTreeFileNode;

interface MutableDirectory {
  readonly name: string;
  readonly path: string;
  readonly directories: Map<string, MutableDirectory>;
  readonly files: PathTreeFileNode[];
}

function createDirectory(name: string, path: string): MutableDirectory {
  return { name, path, directories: new Map(), files: [] };
}

function compareNodeName(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

function compressDirectory(node: PathTreeDirectoryNode): PathTreeDirectoryNode {
  let current = node;
  while (current.children.length === 1) {
    const onlyChild = current.children[0];
    if (!onlyChild || onlyChild.kind !== 'directory') break;
    current = {
      kind: 'directory',
      name: `${current.name}/${onlyChild.name}`,
      path: onlyChild.path,
      children: onlyChild.children,
    };
  }
  return current;
}

function finalizeDirectory(directory: MutableDirectory): PathTreeNode[] {
  const directories = [...directory.directories.values()]
    .map((child) =>
      compressDirectory({
        kind: 'directory',
        name: child.name,
        path: child.path,
        children: finalizeDirectory(child),
      })
    )
    .sort((left, right) => compareNodeName(left.name, right.name));
  const files = directory.files
    .slice()
    .sort((left, right) => compareNodeName(left.name, right.name));
  return [...directories, ...files];
}

export function buildPathTree(paths: readonly string[]): PathTreeNode[] {
  const root = createDirectory('', '');
  for (const rawPath of paths) {
    const path = rawPath.replace(/^\/+|\/+$/g, '');
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    const name = segments[segments.length - 1] as string;
    let directory = root;
    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index] as string;
      const childPath = directory.path ? `${directory.path}/${segment}` : segment;
      let child = directory.directories.get(segment);
      if (!child) {
        child = createDirectory(segment, childPath);
        directory.directories.set(segment, child);
      }
      directory = child;
    }
    directory.files.push({ kind: 'file', name, path });
  }
  return finalizeDirectory(root);
}

export function filterPathsForSearch(paths: readonly string[], query: string): string[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...paths];
  return paths.filter((path) => path.toLowerCase().includes(normalizedQuery));
}
