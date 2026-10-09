// Shared by the scripts that analyze upstream source with the TypeScript
// compiler API (generate-event-router.mjs, browser-environment-loader.mjs).

import { createRequire } from "node:module";

const ts = createRequire(import.meta.url)("typescript");

/** Identifier positions that name a member or label instead of referencing a binding. */
export function isReferencePosition(node) {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent)) return parent.name !== node;
  if (ts.isQualifiedName(parent)) return parent.right !== node;
  if (ts.isPropertyAssignment(parent)) return parent.name !== node;
  if (ts.isBindingElement(parent)) return parent.propertyName !== node;
  if (
    ts.isPropertySignature(parent) ||
    ts.isPropertyDeclaration(parent) ||
    ts.isMethodDeclaration(parent) ||
    ts.isMethodSignature(parent) ||
    ts.isGetAccessorDeclaration(parent) ||
    ts.isSetAccessorDeclaration(parent) ||
    ts.isEnumMember(parent) ||
    ts.isNamedTupleMember(parent)
  ) {
    return parent.name !== node;
  }
  if (ts.isJsxAttribute(parent)) return parent.name !== node;
  if (
    ts.isLabeledStatement(parent) ||
    ts.isBreakStatement(parent) ||
    ts.isContinueStatement(parent)
  ) {
    return false;
  }
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) return false;
  if (ts.isMetaProperty(parent)) return false;
  return true;
}
