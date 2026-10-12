import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Modal,
  Switch,
  Alert,
  Linking,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/clients';
import { useSubscription } from '../hooks/useSubscription';
import { clearUserSession } from '../lib/auth';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  getAllBookmarks,
  addBookmarkListener,
  formatBookmarkTime,
  deleteStoryBookmark,
  StoryBookmark
} from '../lib/bookmarks';

// Custom SVG Icons
const BookmarkIcon = ({ size = 18, color = '#dc2626' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);

const PlayIcon = ({ size = 13, color = '#ffffff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m5 3 14 9-14 9V3z" />
  </Svg>
);

const TrashIcon = ({ size = 14, color = '#ef4444' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </Svg>
);
const MenuIcon = ({ size = 20, color = '#0f172a' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

const CloseIcon = ({ size = 20, color = '#0f172a' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

const UserIcon = ({ size = 13, color = '#64748b' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const CrownIcon = ({ size = 13, color = '#d97706' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </Svg>
);

const TimerIcon = ({ size = 13, color = '#15803d' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="13" r="8" />
    <Path d="M12 9v4l2 1M10 2h4M12 2v3" />
  </Svg>
);

const SparkleIcon = ({ size = 18, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
  </Svg>
);

const ChevronRightIcon = ({ size = 14, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
);

const ChevronDownIcon = ({ size = 16, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m6 9 6 6 6-6" />
  </Svg>
);

const ChevronUpIcon = ({ size = 16, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m18 15-6-6-6 6" />
  </Svg>
);

const MoonIcon = ({ size = 18, color = '#38bdf8' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Svg>
);

const SunIcon = ({ size = 18, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="4" />
    <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Svg>
);

const BookOpenIcon = ({ size = 18, color = '#6366f1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Svg>
);

const HelpCircleIcon = ({ size = 18, color = '#6366f1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </Svg>
);

const MessageSquareIcon = ({ size = 18, color = '#6366f1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const ShieldIcon = ({ size = 18, color = '#6366f1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

const FileTextIcon = ({ size = 18, color = '#6366f1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </Svg>
);

const HeadphonesIcon = ({ size = 22, color = '#6366f1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);

import { STORY_COVERS, DEFAULT_COVER, StoryCoverInfo } from '../lib/storyCovers';

interface StoryBook {
  id: string;
  title: string;
  author?: string;
  category: string;
  content: string;
  audio_url?: string;
  coverStyle: StoryCoverInfo;
}

const CATEGORY_CONFIG: Record<string, { acrylicColor: string; acrylicBorder: string }> = {
  'Fairy Tales': {
    acrylicColor: 'rgba(245, 158, 11, 0.42)', // Amber glass
    acrylicBorder: 'rgba(251, 191, 36, 0.55)'
  },
  'Bedtime Classics': {
    acrylicColor: 'rgba(59, 130, 246, 0.40)', // Ocean blue glass
    acrylicBorder: 'rgba(147, 197, 253, 0.55)'
  },
  'Adventure & Magic': {
    acrylicColor: 'rgba(255, 255, 255, 0.65)', // Frosted pearl glass
    acrylicBorder: 'rgba(255, 255, 255, 0.85)'
  },
  'Fables & Legends': {
    acrylicColor: 'rgba(239, 68, 68, 0.42)', // Ruby red glass
    acrylicBorder: 'rgba(254, 202, 202, 0.60)'
  }
};

const FAQS_DATA = [
  {
    q: "How does the 10-Minute Free Trial work?",
    a: "Every guest user is allotted 10 minutes (600 seconds) of free AI-narrated storytelling. The timer runs only while audio is playing. Once expired, you can unlock unlimited listening with Pro."
  },
  {
    q: "Are the stories and narrations stored permanently?",
    a: "Yes! Every audio narration is saved permanently in cloud storage once generated. You will never wait twice or re-generate previous chapters."
  },
  {
    q: "Can I choose different narrator voices?",
    a: "Yes, you can choose from our curated voices: George (Warm Storyteller), Sarah (Gentle & Soothing), Lily (Calm & Soft), Charlie (Adventure), and Laura (Playful)."
  },
  {
    q: "How do I cancel or manage my subscription?",
    a: "Subscriptions can be managed or canceled anytime via your Apple ID Subscriptions or Google Play Account settings with zero cancellation fees."
  }
];

export default function HomeScreen({ navigation }: any) {
  const { isPremium, trialSecondsRemaining, user } = useSubscription();
  const [shelves, setShelves] = useState<Array<{ category: string; books: StoryBook[] }>>([]);
  const [loading, setLoading] = useState(true);

  // Sidebar Hamburger Drawer & Theme States
  const [menuOpen, setMenuOpen] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [activeModal, setActiveModal] = useState<null | 'faqs' | 'support' | 'privacy' | 'terms' | 'bookmarks'>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Bookmarks state (persisted listening and reading progress)
  const [bookmarks, setBookmarks] = useState<Record<string, StoryBookmark>>({});

  useEffect(() => {
    fetchStories();
    getAllBookmarks().then(setBookmarks);

    const unsub = addBookmarkListener((updated) => {
      setBookmarks(updated);
    });

    return () => unsub();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        // Group the 20 stories by their 4 categories
        const categoryOrder = ['Fairy Tales', 'Bedtime Classics', 'Adventure & Magic', 'Fables & Legends'];
        const grouped: Record<string, StoryBook[]> = {
          'Fairy Tales': [],
          'Bedtime Classics': [],
          'Adventure & Magic': [],
          'Fables & Legends': []
        };

        data.forEach((s) => {
          const cat = s.category || 'Fairy Tales';
          const style = STORY_COVERS[s.title] || DEFAULT_COVER;

          const storyBook: StoryBook = {
            id: s.id,
            title: s.title,
            author: s.author || 'Classic Author',
            category: cat,
            content: s.content || '',
            audio_url: s.audio_url,
            coverStyle: style
          };

          if (grouped[cat]) {
            grouped[cat].push(storyBook);
          } else {
            grouped['Fairy Tales'].push(storyBook);
          }
        });

        const formattedShelves = categoryOrder
          .filter((cat) => grouped[cat] && grouped[cat].length > 0)
          .map((cat) => ({
            category: cat,
            books: grouped[cat]
          }));

        setShelves(formattedShelves);
      }
    } catch (err) {
      console.log('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTrialTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleBookPress = (story: StoryBook) => {
    navigation.navigate('Player', { story, isClassic: true });
  };

  const handleSupportEmail = () => {
    Linking.openURL('mailto:info@alpha-devs.cloud?subject=StoryTime Support Request').catch(() => {
      Alert.alert('Support Email', 'Please reach out to info@alpha-devs.cloud');
    });
  };

  const renderBookCover = (book: StoryBook) => {
    const { coverStyle } = book;
    const bookmark = bookmarks[book.id] || bookmarks[book.title];

    return (
      <TouchableOpacity
        key={book.id}
        activeOpacity={0.88}
        onPress={() => handleBookPress(book)}
        style={[styles.bookCard, { backgroundColor: coverStyle.bgColor }]}
      >
        {/* Realistic High-Resolution Storybook Cover Illustration */}
        <Image
          source={{ uri: coverStyle.imageUrl }}
          style={styles.coverArtworkImage}
          resizeMode="cover"
        />

        {/* Vintage Atmospheric Vignette & Dark Readability Gradients */}
        <View style={[styles.coverGradientVignette, { backgroundColor: coverStyle.bgColor }]} />
        <View style={styles.coverDarkGradientBottom} />

        {/* Gilded Victorian Gold-Foil Ornate Frame */}
        <View style={[styles.gildedGoldFrame, { borderColor: coverStyle.goldFoil || '#fbbf24' }]}>
          {/* Victorian Corner Accents */}
          <View style={[styles.cornerAccentTL, { borderColor: coverStyle.goldFoil || '#fbbf24' }]} />
          <View style={[styles.cornerAccentTR, { borderColor: coverStyle.goldFoil || '#fbbf24' }]} />
          <View style={[styles.cornerAccentBL, { borderColor: coverStyle.goldFoil || '#fbbf24' }]} />
          <View style={[styles.cornerAccentBR, { borderColor: coverStyle.goldFoil || '#fbbf24' }]} />

          {/* Top Foil Category Stamp */}
          <View style={styles.topFoilBadge}>
            <Text style={[styles.topFoilText, { color: coverStyle.goldFoil || '#fbbf24' }]}>
              ★ {book.category.toUpperCase()} ★
            </Text>
          </View>

          {/* Bottom Title & Author Plate */}
          <View style={styles.coverTextContainer}>
            <Text
              style={[
                styles.bookTitleText,
                { color: coverStyle.textColor || '#ffffff' },
                book.title.length > 20 && { fontSize: 10, lineHeight: 13 }
              ]}
              numberOfLines={2}
            >
              {book.title}
            </Text>
            {coverStyle.subtitle ? (
              <Text style={[styles.bookSubtitleText, { color: coverStyle.accentColor }]} numberOfLines={1}>
                {coverStyle.subtitle}
              </Text>
            ) : null}
            {book.author && (
              <Text style={[styles.bookAuthorText, { color: coverStyle.goldFoil || '#fef08a' }]} numberOfLines={1}>
                {book.author.toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Authentic Crimson Satin Bookmark Ribbon for in-progress books */}
        {bookmark && bookmark.audioPosition > 3 && (
          <View style={styles.bookmarkRibbonAnchor} pointerEvents="none">
            {/* Crimson ribbon strap hanging over top edge */}
            <View style={styles.bookmarkRibbonStrap}>
              <View style={styles.bookmarkRibbonHighlight} />
              <BookmarkIcon size={8} color="#fef08a" />
            </View>
            {/* Ribbon swallowtail / pointed cut */}
            <View style={styles.bookmarkRibbonNotchRow}>
              <View style={styles.bookmarkRibbonPointLeft} />
              <View style={styles.bookmarkRibbonPointRight} />
            </View>
            {/* In-progress timestamp badge */}
            <View style={styles.bookmarkPillBadge}>
              <Text style={styles.bookmarkPillText}>
                {formatBookmarkTime(bookmark.audioPosition)}
              </Text>
            </View>
          </View>
        )}

        {/* Realistic Left Leather Spine with Embossed Gold Ribs */}
        <View style={[styles.spineWrap, { backgroundColor: coverStyle.spineColor || '#0b1320' }]}>
          <View style={styles.spineRib} />
          <View style={styles.spineRib} />
          <View style={styles.spineRib} />
        </View>

        {/* Recessed Spine Hinge Gutter Shadow */}
        <View style={styles.spineHingeShadow} />

        {/* 3D Stacked Paper Edge along the right rim */}
        <View style={styles.paperEdgeStrip}>
          <View style={styles.paperEdgeLine} />
          <View style={styles.paperEdgeLine} />
        </View>

        {/* Diagonal Satin Varnish / Cover Gloss Sheen */}
        <View style={styles.coverGlossOverlay} />
      </TouchableOpacity>
    );
  };

  const themeBg = isNightMode ? '#0b0f19' : '#ffffff';
  const themeCardBg = isNightMode ? '#131b2e' : '#f8fafc';
  const themeTextColor = isNightMode ? '#f8fafc' : '#0f172a';
  const themeSubtextColor = isNightMode ? '#94a3b8' : '#64748b';

  // Compute active bookmarks and flattened books list
  const allBooks = shelves.flatMap((s) => s.books);
  const bookmarkList = Object.values(bookmarks).filter((b) => b && b.audioPosition > 3);
  const bookmarkCount = bookmarkList.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBg }]}>
      <StatusBar barStyle={isNightMode ? 'light-content' : 'dark-content'} backgroundColor={themeBg} />

      {/* Top Utility Header with Hamburger Icon */}
      <View style={styles.topUtilityBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Hamburger Menu Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.hamburgerButton, isNightMode && styles.hamburgerButtonDark]}
            onPress={() => setMenuOpen(true)}
          >
            <MenuIcon size={19} color={isNightMode ? '#ffffff' : '#0f172a'} />
          </TouchableOpacity>

          {/* Profile Pill */}
          <TouchableOpacity
            style={[styles.profilePill, isNightMode && styles.profilePillDark]}
            onPress={() => navigation.navigate('Auth')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <UserIcon size={13} color={user ? (isNightMode ? '#38bdf8' : '#0f172a') : '#64748b'} />
              <Text style={[styles.profilePillText, user && { color: isNightMode ? '#ffffff' : '#0f172a', fontWeight: '700' }]}>
                {user ? (user.email ? user.email.split('@')[0] : 'Profile') : 'Sign In'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* PRO / Free Trial Pill */}
        <TouchableOpacity
          style={[styles.trialBadge, isPremium ? styles.proBadge : styles.trialActiveBadge]}
          onPress={() => navigation.navigate('Paywall')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {isPremium ? (
              <CrownIcon size={13} color="#ffffff" />
            ) : (
              <TimerIcon size={13} color="#15803d" />
            )}
            <Text style={[styles.trialBadgeText, isPremium && styles.proBadgeText]}>
              {isPremium ? 'PRO UNLIMITED' : `Free Trial: ${formatTrialTime(trialSecondsRemaining)}`}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Top Main Navigation / Branding Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerSubtitle, { color: themeSubtextColor }]}>My Favourite</Text>
        <Text style={[styles.headerMainTitle, { color: themeTextColor }]}>BOOKS</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={isNightMode ? '#38bdf8' : '#000000'} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {shelves.map((shelf) => {
            const config = CATEGORY_CONFIG[shelf.category] || CATEGORY_CONFIG['Fairy Tales'];

            return (
              <View key={shelf.category} style={styles.shelfSection}>
                {/* Category Title + Count & Arrows */}
                <View style={styles.shelfHeaderRow}>
                  <Text style={[styles.shelfCategoryTitle, { color: themeTextColor }]}>{shelf.category}</Text>
                  <View style={styles.shelfNavGroup}>
                    <Text style={[styles.shelfCountText, { color: themeSubtextColor }]}>{shelf.books.length} books</Text>
                    <Text style={[styles.shelfArrowText, { color: themeSubtextColor }]}>‹   ›</Text>
                  </View>
                </View>

                {/* Horizontal Bookshelf Container */}
                <View style={styles.shelfBooksContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.shelfScrollTrack}
                  >
                    {shelf.books.map((book) => renderBookCover(book))}
                  </ScrollView>

                  {/* Glass Acrylic Railing */}
                  <View
                    style={[
                      styles.acrylicRailing,
                      {
                        backgroundColor: config.acrylicColor,
                        borderColor: config.acrylicBorder
                      }
                    ]}
                    pointerEvents="none"
                  >
                    <View style={styles.metallicScrewPin}>
                      <View style={styles.screwInnerHighlight}>
                        <View style={styles.screwSlotLine} />
                      </View>
                    </View>

                    <CrownIcon size={13} color="#78350f" />

                    <View style={styles.metallicScrewPin}>
                      <View style={styles.screwInnerHighlight}>
                        <View style={styles.screwSlotLine} />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* Floating Add Books / Create Custom Story Button */}
      <View style={styles.bottomFloatingContainer}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.addBooksButton, isNightMode && { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 }]}
          onPress={() => navigation.navigate('GenerateStory')}
        >
          <Text style={styles.addBooksButtonText}>Add Books</Text>
        </TouchableOpacity>
      </View>

      {/* ================= SIDEBAR HAMBURGER DRAWER MODAL ================= */}
      <Modal
        visible={menuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <TouchableOpacity
            style={styles.drawerBackdropPress}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />

          <View style={[styles.drawerContent, { backgroundColor: isNightMode ? '#0f172a' : '#ffffff' }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.drawerLogoBadge}>
                  <BookOpenIcon size={16} color="#ffffff" />
                </View>
                <View>
                  <Text style={[styles.drawerBrandTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>StoryTime</Text>
                  <Text style={styles.drawerBrandSub}>Bedtime Stories & Audio</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setMenuOpen(false)}
                style={[styles.drawerCloseBtn, isNightMode && { backgroundColor: '#1e293b' }]}
              >
                <CloseIcon size={18} color={isNightMode ? '#ffffff' : '#0f172a'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
              {/* Night Mode Switch Card */}
              <View style={[styles.menuOptionCard, isNightMode && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[styles.menuItemIconWrap, { backgroundColor: isNightMode ? '#1e293b' : '#f1f5f9' }]}>
                    {isNightMode ? <MoonIcon size={18} color="#38bdf8" /> : <SunIcon size={18} color="#f59e0b" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuOptionTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>Night Mode</Text>
                    <Text style={styles.menuOptionDesc}>Soothing dark bedtime palette</Text>
                  </View>
                </View>
                <Switch
                  value={isNightMode}
                  onValueChange={setIsNightMode}
                  trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Pro Unlimited Banner */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.proCardBanner, isPremium && styles.proCardBannerActive]}
                onPress={() => {
                  setMenuOpen(false);
                  navigation.navigate('Paywall');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.menuItemIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <CrownIcon size={18} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.proBannerTitle}>
                      {isPremium ? 'PRO Member Active' : 'Upgrade to PRO'}
                    </Text>
                    <Text style={styles.proBannerSub}>
                      {isPremium ? 'Unlimited listening enabled' : 'Full unabridged stories • $30/mo'}
                    </Text>
                  </View>
                  <ChevronRightIcon size={16} color="#ffffff" />
                </View>
              </TouchableOpacity>

              {/* Navigation Options List */}
              <View style={styles.menuList}>
                {/* My Bookmarks */}
                <TouchableOpacity
                  style={[styles.menuRowItem, isNightMode && { borderBottomColor: '#1e293b' }]}
                  onPress={() => setActiveModal('bookmarks')}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.menuItemIconWrap, { backgroundColor: isNightMode ? '#3f1d24' : '#ffe4e6' }]}>
                      <BookmarkIcon size={16} color="#e11d48" />
                    </View>
                    <View>
                      <Text style={[styles.menuItemText, { color: isNightMode ? '#f1f5f9' : '#1e293b' }]}>My Bookmarks</Text>
                      {bookmarkCount > 0 && (
                        <Text style={styles.bookmarkSubCount}>
                          {bookmarkCount} {bookmarkCount === 1 ? 'story' : 'stories'} in progress
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {bookmarkCount > 0 && (
                      <View style={styles.bookmarkCountBadge}>
                        <Text style={styles.bookmarkCountBadgeText}>{bookmarkCount}</Text>
                      </View>
                    )}
                    <ChevronRightIcon size={14} color={isNightMode ? '#64748b' : '#94a3b8'} />
                  </View>
                </TouchableOpacity>

                {/* FAQs */}
                <TouchableOpacity
                  style={[styles.menuRowItem, isNightMode && { borderBottomColor: '#1e293b' }]}
                  onPress={() => setActiveModal('faqs')}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={styles.menuItemIconWrap}>
                      <HelpCircleIcon size={16} color={isNightMode ? '#818cf8' : '#6366f1'} />
                    </View>
                    <Text style={[styles.menuItemText, { color: isNightMode ? '#f1f5f9' : '#1e293b' }]}>FAQs</Text>
                  </View>
                  <ChevronRightIcon size={14} color={isNightMode ? '#64748b' : '#94a3b8'} />
                </TouchableOpacity>

                {/* Support Page */}
                <TouchableOpacity
                  style={[styles.menuRowItem, isNightMode && { borderBottomColor: '#1e293b' }]}
                  onPress={() => setActiveModal('support')}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={styles.menuItemIconWrap}>
                      <MessageSquareIcon size={16} color={isNightMode ? '#38bdf8' : '#0284c7'} />
                    </View>
                    <Text style={[styles.menuItemText, { color: isNightMode ? '#f1f5f9' : '#1e293b' }]}>Support & Help</Text>
                  </View>
                  <ChevronRightIcon size={14} color={isNightMode ? '#64748b' : '#94a3b8'} />
                </TouchableOpacity>

                {/* Privacy Policy */}
                <TouchableOpacity
                  style={[styles.menuRowItem, isNightMode && { borderBottomColor: '#1e293b' }]}
                  onPress={() => setActiveModal('privacy')}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={styles.menuItemIconWrap}>
                      <ShieldIcon size={16} color={isNightMode ? '#34d399' : '#059669'} />
                    </View>
                    <Text style={[styles.menuItemText, { color: isNightMode ? '#f1f5f9' : '#1e293b' }]}>Privacy Policy</Text>
                  </View>
                  <ChevronRightIcon size={14} color={isNightMode ? '#64748b' : '#94a3b8'} />
                </TouchableOpacity>

                {/* Terms & Disclosures */}
                <TouchableOpacity
                  style={[styles.menuRowItem, isNightMode && { borderBottomColor: '#1e293b' }]}
                  onPress={() => setActiveModal('terms')}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={styles.menuItemIconWrap}>
                      <FileTextIcon size={16} color={isNightMode ? '#fbbf24' : '#d97706'} />
                    </View>
                    <Text style={[styles.menuItemText, { color: isNightMode ? '#f1f5f9' : '#1e293b' }]}>Terms of Service</Text>
                  </View>
                  <ChevronRightIcon size={14} color={isNightMode ? '#64748b' : '#94a3b8'} />
                </TouchableOpacity>
              </View>

              {/* Account Section */}
              <View style={[styles.drawerAccountCard, isNightMode && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <UserIcon size={16} color={isNightMode ? '#38bdf8' : '#0f172a'} />
                  <Text style={[styles.accountEmailText, { color: isNightMode ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                    {user?.email || 'Guest Listener'}
                  </Text>
                </View>

                {user ? (
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={async () => {
                      await clearUserSession();
                      setMenuOpen(false);
                    }}
                  >
                    <Text style={styles.logoutBtnText}>Sign Out</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.signInBtn}
                    onPress={() => {
                      setMenuOpen(false);
                      navigation.navigate('Auth');
                    }}
                  >
                    <Text style={styles.signInBtnText}>Sign In / Register</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* App Version Info */}
              <Text style={styles.drawerFooterText}>
                StoryTime for Kids • v1.2.0 • COPPA Safe
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= SECONDARY DETAIL MODALS (FAQS, SUPPORT, PRIVACY, TERMS) ================= */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={[styles.detailModalSafe, { backgroundColor: isNightMode ? '#0b0f19' : '#ffffff' }]}>
          {/* Detail Modal Header */}
          <View style={styles.detailModalHeader}>
            <Text style={[styles.detailModalTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>
              {activeModal === 'bookmarks' && 'My Bookmarks'}
              {activeModal === 'faqs' && 'Frequently Asked Questions'}
              {activeModal === 'support' && 'Help & Customer Support'}
              {activeModal === 'privacy' && 'Privacy Policy & Disclosures'}
              {activeModal === 'terms' && 'Terms of Service'}
            </Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.detailCloseBtn}>
              <CloseIcon size={20} color={isNightMode ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.detailModalBody} showsVerticalScrollIndicator={false}>
            {/* BOOKMARKS MODAL CONTENT */}
            {activeModal === 'bookmarks' && (
              <View style={{ gap: 14 }}>
                {bookmarkList.length === 0 ? (
                  <View style={styles.emptyBookmarksWrap}>
                    <View style={styles.emptyBookmarksIconWrap}>
                      <BookmarkIcon size={28} color="#94a3b8" />
                    </View>
                    <Text style={[styles.emptyBookmarksTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>
                      No Saved Bookmarks Yet
                    </Text>
                    <Text style={[styles.emptyBookmarksDesc, { color: isNightMode ? '#94a3b8' : '#64748b' }]}>
                      When you listen to or read any story, your exact place is automatically bookmarked here so you can pick up right where you left off!
                    </Text>
                  </View>
                ) : (
                  bookmarkList.map((bm) => {
                    const matchingBook = allBooks.find((b) => b.id === bm.storyId || b.title === bm.storyTitle);
                    const percent = bm.audioDuration > 0 ? Math.min(100, Math.round((bm.audioPosition / bm.audioDuration) * 100)) : 0;

                    return (
                      <View
                        key={bm.storyId || bm.storyTitle}
                        style={[styles.bookmarkCard, isNightMode && { backgroundColor: '#131b2e', borderColor: '#1e293b' }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          {matchingBook?.coverStyle?.imageUrl ? (
                            <Image
                              source={{ uri: matchingBook.coverStyle.imageUrl }}
                              style={styles.bookmarkCoverThumb}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.bookmarkCoverThumbFallback, { backgroundColor: '#be123c' }]}>
                              <BookmarkIcon size={16} color="#ffffff" />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.bookmarkStoryTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                              {bm.storyTitle || matchingBook?.title || 'Story'}
                            </Text>
                            <Text style={[styles.bookmarkStoryTime, { color: isNightMode ? '#94a3b8' : '#64748b' }]}>
                              Left off at {formatBookmarkTime(bm.audioPosition)} {bm.audioDuration > 0 ? `• ${percent}% completed` : ''}
                            </Text>
                            {/* Progress mini bar */}
                            <View style={styles.bookmarkMiniProgressBar}>
                              <View style={[styles.bookmarkMiniProgressFill, { width: `${percent}%` }]} />
                            </View>
                          </View>
                        </View>

                        <View style={styles.bookmarkActionRow}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.bookmarkResumeBtn}
                            onPress={() => {
                              setActiveModal(null);
                              setMenuOpen(false);
                              if (matchingBook) {
                                navigation.navigate('Player', { story: matchingBook, isClassic: true });
                              }
                            }}
                          >
                            <PlayIcon size={11} color="#ffffff" />
                            <Text style={styles.bookmarkResumeBtnText}>Resume</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.bookmarkDeleteBtn}
                            onPress={async () => {
                              await deleteStoryBookmark(bm.storyId, bm.storyTitle);
                              const updated = await getAllBookmarks();
                              setBookmarks(updated);
                            }}
                          >
                            <TrashIcon size={14} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
            {/* FAQS MODAL CONTENT */}
            {activeModal === 'faqs' && (
              <View style={{ gap: 14 }}>
                {FAQS_DATA.map((item, idx) => {
                  const isExpanded = expandedFaqIndex === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.88}
                      style={[styles.faqCard, isNightMode && { backgroundColor: '#131b2e', borderColor: '#1e293b' }]}
                      onPress={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    >
                      <View style={styles.faqHeader}>
                        <Text style={[styles.faqQText, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>{item.q}</Text>
                        {isExpanded ? (
                          <ChevronUpIcon size={16} color="#94a3b8" />
                        ) : (
                          <ChevronDownIcon size={16} color="#94a3b8" />
                        )}
                      </View>
                      {isExpanded && (
                        <Text style={[styles.faqAText, { color: isNightMode ? '#cbd5e1' : '#475569' }]}>
                          {item.a}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* SUPPORT MODAL CONTENT */}
            {activeModal === 'support' && (
              <View style={{ gap: 16 }}>
                <View style={[styles.supportCard, isNightMode && { backgroundColor: '#131b2e', borderColor: '#1e293b' }]}>
                  <View style={{ marginBottom: 12 }}>
                    <HeadphonesIcon size={24} color={isNightMode ? '#38bdf8' : '#6366f1'} />
                  </View>
                  <Text style={[styles.supportTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>Direct Assistance</Text>
                  <Text style={[styles.supportBody, { color: isNightMode ? '#cbd5e1' : '#475569' }]}>
                    Have questions about stories, narrator voices, or billing? Our dedicated family support team is available 7 days a week.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.contactSupportBtn}
                    onPress={handleSupportEmail}
                  >
                    <Text style={styles.contactSupportBtnText}>Email: info@alpha-devs.cloud</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.supportCard, isNightMode && { backgroundColor: '#131b2e', borderColor: '#1e293b' }]}>
                  <Text style={[styles.supportTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>Average Response Time</Text>
                  <Text style={[styles.supportBody, { color: isNightMode ? '#cbd5e1' : '#475569' }]}>
                    Under 12 hours for all subscription and playback inquiries.
                  </Text>
                </View>
              </View>
            )}

            {/* PRIVACY POLICY MODAL CONTENT */}
            {activeModal === 'privacy' && (
              <View style={{ gap: 16 }}>
                <Text style={[styles.legalSectionTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>
                  Children’s Online Privacy Protection (COPPA)
                </Text>
                <Text style={[styles.legalParagraph, { color: isNightMode ? '#cbd5e1' : '#475569' }]}>
                  StoryTime for Kids is committed to protecting the privacy of young readers and families. We do not collect personal identification from children under 13 without verified parental consent.
                </Text>

                <Text style={[styles.legalSectionTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>
                  Audio & Voice Synthesis
                </Text>
                <Text style={[styles.legalParagraph, { color: isNightMode ? '#cbd5e1' : '#475569' }]}>
                  All narration is synthesized safely using approved ElevenLabs AI voice models and delivered through encrypted CDN storage. We never record or store the user’s microphone or biometric data.
                </Text>

                <Text style={[styles.legalSectionTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>
                  Trial & Subscription Tracking
                </Text>
                <Text style={[styles.legalParagraph, { color: isNightMode ? '#cbd5e1' : '#475569' }]}>
                  We store anonymous device identifiers solely to track the 10-minute trial duration and prevent subscription fraud. We never sell your data to third-party ad networks.
                </Text>
              </View>
            )}

            {/* TERMS MODAL CONTENT */}
            {activeModal === 'terms' && (
              <View style={{ gap: 16 }}>
                <Text style={[styles.legalSectionTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>
                  Subscription Terms
                </Text>
                <Text style={[styles.legalParagraph, { color: isNightMode ? '#cbd5e1' : '#475569' }]}>
                  StoryTime Pro provides unlimited audio listening to all classical books. Plans are billed monthly at $30/month or annually at $320/year. Payment is charged to your Apple or Google account upon confirmation.
                </Text>

                <Text style={[styles.legalSectionTitle, { color: isNightMode ? '#ffffff' : '#0f172a' }]}>
                  Auto-Renewal & Cancellation
                </Text>
                <Text style={[styles.legalParagraph, { color: isNightMode ? '#cbd5e1' : '#475569' }]}>
                  Subscriptions automatically renew unless auto-renew is disabled at least 24 hours prior to the end of the current billing cycle. You may cancel at any time within your device’s store settings.
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
  },
  hamburgerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  hamburgerButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155'
  },
  profilePill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  profilePillDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155'
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  trialBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18
  },
  trialActiveBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  proBadge: {
    backgroundColor: '#000000'
  },
  trialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  proBadgeText: {
    color: '#ffffff'
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  headerMainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
    marginTop: -2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  shelfSection: {
    marginBottom: 24,
  },
  shelfHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  shelfCategoryTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  shelfNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shelfCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  shelfArrowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginLeft: 4,
  },
  shelfBooksContainer: {
    position: 'relative',
    height: 184,
  },
  shelfScrollTrack: {
    paddingHorizontal: 20,
    gap: 14,
    alignItems: 'flex-start',
  },
  bookCard: {
    width: 114,
    height: 168,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  coverArtworkImage: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 3,
    bottom: 0,
    opacity: 0.88,
  },
  coverGradientVignette: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 3,
    bottom: 0,
    opacity: 0.28,
  },
  coverDarkGradientBottom: {
    position: 'absolute',
    left: 12,
    right: 3,
    bottom: 0,
    height: 86,
    backgroundColor: 'rgba(0, 0, 0, 0.74)',
  },
  gildedGoldFrame: {
    position: 'absolute',
    top: 7,
    left: 17,
    right: 8,
    bottom: 7,
    borderWidth: 1,
    borderRadius: 3,
    padding: 6,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cornerAccentTL: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 7,
    height: 7,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerAccentTR: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerAccentBL: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 7,
    height: 7,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerAccentBR: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 7,
    height: 7,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  topFoilBadge: {
    alignItems: 'center',
    paddingVertical: 1,
  },
  topFoilText: {
    fontSize: 6.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  coverTextContainer: {
    marginTop: 'auto',
  },
  bookTitleText: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  bookSubtitleText: {
    fontSize: 7.5,
    fontStyle: 'italic',
    lineHeight: 10,
    marginBottom: 3,
    opacity: 0.92,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bookAuthorText: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spineWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 13,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 22,
    zIndex: 3,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.45)',
  },
  spineRib: {
    width: 7,
    height: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.55)',
    borderRadius: 1,
  },
  spineHingeShadow: {
    position: 'absolute',
    top: 0,
    left: 13,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 4,
  },
  paperEdgeStrip: {
    position: 'absolute',
    top: 2,
    right: 0,
    bottom: 2,
    width: 3,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 3,
    justifyContent: 'space-evenly',
  },
  paperEdgeLine: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  coverGlossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 50,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    borderRightWidth: 114,
    borderRightColor: 'transparent',
    zIndex: 5,
  },
  acrylicRailing: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  metallicScrewPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#cbd5e1',
    borderWidth: 1.2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 1.5,
  },
  screwInnerHighlight: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screwSlotLine: {
    width: 5,
    height: 1.2,
    backgroundColor: '#475569',
    borderRadius: 0.6,
  },
  bottomFloatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  addBooksButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 38,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  addBooksButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ================= DRAWER STYLES =================
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
  },
  drawerBackdropPress: {
    flex: 1,
  },
  drawerContent: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    paddingTop: 54,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  drawerLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBrandTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  drawerBrandSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerScroll: {
    paddingBottom: 40,
  },
  menuOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  menuOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuOptionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  proCardBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  proCardBannerActive: {
    backgroundColor: '#15803d',
  },
  proBannerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  proBannerSub: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  menuList: {
    marginBottom: 20,
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  drawerAccountCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  accountEmailText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  logoutBtn: {
    marginTop: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  signInBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  drawerFooterText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },

  // ================= DETAIL MODAL STYLES =================
  detailModalSafe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  detailModalBody: {
    padding: 20,
  },
  faqCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: 10,
  },
  faqAText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  supportCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    textAlign: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  supportBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
  },
  contactSupportBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  contactSupportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  legalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  legalParagraph: {
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 12,
  },
  // Ribbon Bookmark on Book Cover Styles
  bookmarkRibbonAnchor: {
    position: 'absolute',
    top: -1,
    right: 14,
    zIndex: 25,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 3,
    elevation: 9,
  },
  bookmarkRibbonStrap: {
    width: 20,
    height: 34,
    backgroundColor: '#b91c1c', // Royal crimson satin
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    alignItems: 'center',
    paddingTop: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  bookmarkRibbonHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 2.5,
    width: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  bookmarkRibbonNotchRow: {
    flexDirection: 'row',
    width: 20,
    height: 6,
  },
  bookmarkRibbonPointLeft: {
    width: 10,
    height: 6,
    backgroundColor: '#b91c1c',
    borderBottomRightRadius: 5,
  },
  bookmarkRibbonPointRight: {
    width: 10,
    height: 6,
    backgroundColor: '#b91c1c',
    borderBottomLeftRadius: 5,
  },
  bookmarkPillBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  bookmarkPillText: {
    color: '#fef08a',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // Drawer Bookmarks Meta Styles
  bookmarkSubCount: {
    fontSize: 11,
    color: '#e11d48',
    fontWeight: '600',
    marginTop: 1,
  },
  bookmarkCountBadge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bookmarkCountBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  // Bookmarks Modal List Styles
  emptyBookmarksWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyBookmarksIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyBookmarksTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBookmarksDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  bookmarkCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  bookmarkCoverThumb: {
    width: 44,
    height: 62,
    borderRadius: 4,
  },
  bookmarkCoverThumbFallback: {
    width: 44,
    height: 62,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkStoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  bookmarkStoryTime: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  bookmarkMiniProgressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bookmarkMiniProgressFill: {
    height: '100%',
    backgroundColor: '#e11d48',
    borderRadius: 2,
  },
  bookmarkActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 8,
  },
  bookmarkResumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bookmarkResumeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  bookmarkDeleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});
