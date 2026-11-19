export type Route =
  | { name: 'home' }
  | { name: 'toc'; parentId?: number }
  | { name: 'reader'; nodeId: number; blockId?: number }
  | { name: 'search' }
  | { name: 'bookmarks' }
  | { name: 'settings' }
  | { name: 'about' }
  | { name: 'volumes' }
  | { name: 'help' }
  | { name: 'share' }
  | { name: 'support' }
  | { name: 'donate' }
  | { name: 'logs' }
  | { name: 'audit' };

export type Nav = {
  go: (r: Route) => void;
  back: () => void;
  openDrawer: () => void;
};
