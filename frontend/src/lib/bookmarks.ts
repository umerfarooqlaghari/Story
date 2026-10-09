export interface StoryBookmark {
  storyId?: string;
  storyTitle?: string;
  audioPosition: number; // in seconds
  audioDuration: number; // in seconds
  voiceId?: string;
  textScrollPercent?: number; // 0 - 100
  updatedAt: string;
}

const BOOKMARKS_STORAGE_KEY = '@story_bookmarks_v1';

export function getAllBookmarks(): Record<string, StoryBookmark> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.log('Error fetching bookmarks:', err);
    return {};
  }
}

export function getStoryBookmark(storyId?: string, title?: string): StoryBookmark | null {
  if (typeof window === 'undefined') return null;
  try {
    const bookmarks = getAllBookmarks();
    if (storyId && bookmarks[storyId]) return bookmarks[storyId];
    if (title && bookmarks[title]) return bookmarks[title];
    const found = Object.values(bookmarks).find((b) => (storyId && b.storyId === storyId) || (title && b.storyTitle === title));
    return found || null;
  } catch (err) {
    console.log('Error getting bookmark:', err);
    return null;
  }
}

export function addBookmarkListener(callback: (bookmarks: Record<string, StoryBookmark>) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => {
    callback(e.detail || getAllBookmarks());
  };
  window.addEventListener('bookmarks_updated', handler);
  return () => window.removeEventListener('bookmarks_updated', handler);
}

export function saveStoryBookmark(bookmark: Omit<StoryBookmark, 'updatedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const bookmarks = getAllBookmarks();
    const entry: StoryBookmark = {
      ...bookmark,
      updatedAt: new Date().toISOString()
    };
    const key = bookmark.storyId || bookmark.storyTitle || 'story';
    // Clean up any stale duplicate title key if storyId exists
    if (bookmark.storyId && bookmark.storyTitle && bookmarks[bookmark.storyTitle]) {
      delete bookmarks[bookmark.storyTitle];
    }
    bookmarks[key] = entry;
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent('bookmarks_updated', { detail: bookmarks }));
  } catch (err) {
    console.log('Error saving bookmark:', err);
  }
}

export function deleteStoryBookmark(storyId?: string, title?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const bookmarks = getAllBookmarks();
    if (storyId) {
      delete bookmarks[storyId];
    }
    if (title) {
      delete bookmarks[title];
    }
    // Also remove any entries matching either
    Object.keys(bookmarks).forEach((k) => {
      const b = bookmarks[k];
      if ((storyId && b.storyId === storyId) || (title && b.storyTitle === title)) {
        delete bookmarks[k];
      }
    });
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent('bookmarks_updated', { detail: bookmarks }));
  } catch (err) {
    console.log('Error deleting bookmark:', err);
  }
}

export function formatBookmarkTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
