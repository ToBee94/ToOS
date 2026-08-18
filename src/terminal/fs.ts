import type { MenuFolder, MenuItem, MenuLeaf } from "../components/CommandMenu";
import type { LinkItem } from "./types";

const isFolder = (it: MenuItem): it is MenuFolder => !("divider" in it) && "folder" in it;
const isLeaf = (it: MenuItem): it is MenuLeaf => !("divider" in it) && !("folder" in it);

/** Joins a `cwd` and a typed argument into a full path from the menu root
 *  — the string every path-aware command (`cat`/`open`/`rm`/`cd`/`ls`)
 *  resolves against. An arg naming `links` explicitly (`links`, `links/x`)
 *  is always root-anchored, the same way `~/links` is reachable from
 *  anywhere — so `rm links/x` still targets the link even while already
 *  `cd`'d into `links`, instead of doubling up into `links/links/x`. */
export const joinPath = (cwd: string, arg: string) => {
  if (!arg) return cwd;
  if (arg === "links" || arg.startsWith("links/")) return arg;
  return cwd ? `${cwd}/${arg}` : arg;
};

export type Resolved =
  | { kind: "leaf"; item: MenuLeaf }
  | { kind: "link"; link: LinkItem }
  | { kind: "dir" }
  | { kind: "notfound" };

/** Resolves a full path (from the menu root, `links/...` included) against
 *  the raw, un-flattened menu tree — walking through `folder` items exactly
 *  like a real filesystem walks directories. */
export function resolvePath(menu: MenuItem[], links: LinkItem[], path: string): Resolved {
  const segs = path.split("/").filter(Boolean);
  if (!segs.length) return { kind: "dir" };
  if (segs[0] === "links") {
    if (segs.length === 1) return links.length ? { kind: "dir" } : { kind: "notfound" };
    if (segs.length === 2) {
      const link = links.find((l) => l.name === segs[1]);
      return link ? { kind: "link", link } : { kind: "notfound" };
    }
    return { kind: "notfound" }; // no nested directories under ~/links
  }
  let node: MenuItem[] = menu;
  for (let i = 0; i < segs.length - 1; i++) {
    const folder = node.find((it) => isFolder(it) && it.id === segs[i]) as MenuFolder | undefined;
    if (!folder) return { kind: "notfound" };
    node = folder.items;
  }
  const last = segs[segs.length - 1];
  const hit = node.find((it) => (isFolder(it) || isLeaf(it)) && it.id === last);
  if (!hit) return { kind: "notfound" };
  if (isFolder(hit)) return { kind: "dir" };
  return { kind: "leaf", item: hit as MenuLeaf };
}

/** Finds the `MenuFolder` node at `path` (a non-empty, non-`links` path) by
 *  walking the raw menu tree — used by `rm -rf <folder>` to recursively
 *  collect what's inside. */
export function resolveFolder(menu: MenuItem[], path: string): MenuFolder | null {
  const segs = path.split("/").filter(Boolean);
  if (!segs.length) return null;
  let node: MenuItem[] = menu;
  let found: MenuFolder | null = null;
  for (const seg of segs) {
    const folder = node.find((it) => isFolder(it) && it.id === seg) as MenuFolder | undefined;
    if (!folder) return null;
    found = folder;
    node = folder.items;
  }
  return found;
}

/** Recursively collects every nested folder's own id under `items` — so
 *  `rm -rf <folder>` can hide the whole emptied subtree, not just its
 *  leaves. */
export function collectFolderIds(items: MenuItem[]): string[] {
  return items.flatMap((it) => (isFolder(it) ? [it.id, ...collectFolderIds(it.items)] : []));
}

export type ListedDir =
  | { kind: "links"; links: LinkItem[] }
  | { kind: "menu"; leaves: MenuLeaf[]; folders: MenuFolder[]; showLinksEntry: boolean };

/** Lists the direct children of a directory (root, a menu folder, or
 *  `links`) for `ls`/tab-completion. Returns `null` if `path` isn't a
 *  directory. */
export function listDir(menu: MenuItem[], links: LinkItem[], path: string): ListedDir | null {
  const segs = path.split("/").filter(Boolean);
  if (segs[0] === "links") {
    if (segs.length > 1) return null;
    return links.length ? { kind: "links", links } : null;
  }
  let node: MenuItem[] = menu;
  for (const seg of segs) {
    const folder = node.find((it) => isFolder(it) && it.id === seg) as MenuFolder | undefined;
    if (!folder) return null;
    node = folder.items;
  }
  return {
    kind: "menu",
    leaves: node.filter(isLeaf),
    folders: node.filter(isFolder),
    showLinksEntry: segs.length === 0 && links.length > 0,
  };
}
