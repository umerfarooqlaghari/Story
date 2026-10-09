import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoryBookmark {
  storyId: string;
  storyTitle: string;
  audioPosition: number; // in seconds
  audioDuration: number; // in seconds
  voiceId?: string;
  textScrollPercent?: number; // 0 - 100
  updatedAt: string;
}

const BOOKMARKS_STORAGE_KEY = '@story_bookmarks_v1';

type BookmarkListener = (bookmarks: Record<string, StoryBookmark>) => void;
const listeners: Set<BookmarkListener> = new Set();

export const addBookmarkListener = (listener: BookmarkListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = (bookmarks: Record<string, StoryBookmark>) => {
  listeners.forEach((fn) => {
    try {
      fn(bookmarks);
    } catch (e) {
      console.log('Bookmark listener error:', e);
    }
  });
};

/**
 * Retrieve all saved bookmarks keyed by storyId or title
 */
export async function getAllBookmarks(): Promise<Record<string, StoryBookmark>> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.log('Error fetching bookmarks:', err);
    return {};
  }
}

/**
 * Retrieve bookmark for a specific story
 */
export async function getStoryBookmark(storyId: string, title?: string): Promise<StoryBookmark | null> {
  try {
    const bookmarks = await getAllBookmarks();
    if (bookmarks[storyId]) return bookmarks[storyId];
    if (title && bookmarks[title]) return bookmarks[title];
    return null;
  } catch (err) {
    console.log('Error getting bookmark:', err);
    return null;
  }
}

/**
 * Save or update bookmark for a story
 */
export async function saveStoryBookmark(bookmark: Omit<StoryBookmark, 'updatedAt'>): Promise<void> {
  try {
    const bookmarks = await getAllBookmarks();
    const entry: StoryBookmark = {
      ...bookmark,
      updatedAt: new Date().toISOString()
    };
    const key = bookmark.storyId || bookmark.storyTitle || 'story';
    if (bookmark.storyId && bookmark.storyTitle && bookmarks[bookmark.storyTitle]) {
      delete bookmarks[bookmark.storyTitle];
    }
    bookmarks[key] = entry;
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    notifyListeners(bookmarks);
  } catch (err) {
    console.log('Error saving bookmark:', err);
  }
}

/**
 * Delete a bookmark once story is finished or manually cleared
 */
export async function deleteStoryBookmark(storyId?: string, title?: string): Promise<void> {
  try {
    const bookmarks = await getAllBookmarks();
    if (storyId) {
      delete bookmarks[storyId];
    }
    if (title) {
      delete bookmarks[title];
    }
    Object.keys(bookmarks).forEach((k) => {
      const b = bookmarks[k];
      if ((storyId && b.storyId === storyId) || (title && b.storyTitle === title)) {
        delete bookmarks[k];
      }
    });
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    notifyListeners(bookmarks);
  } catch (err) {
    console.log('Error deleting bookmark:', err);
  }
}

/**
 * Format timestamp in MM:SS
 */
export function formatBookmarkTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
