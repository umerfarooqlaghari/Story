import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  PanResponder,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useSubscription } from '../hooks/useSubscription';
import { API_BASE_URL } from '../lib/config';
import { STORY_COVERS, DEFAULT_COVER } from '../lib/storyCovers';
import {
  getStoryBookmark,
  saveStoryBookmark,
  deleteStoryBookmark,
  formatBookmarkTime,
  StoryBookmark
} from '../lib/bookmarks';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Custom SVG Icons
const BookmarkIcon = ({ size = 18, color = '#f59e0b', filled = false }: { size?: number; color?: string; filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);
const ChevronLeftIcon = ({ size = 16, color = '#334155' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 18-6-6 6-6" />
  </Svg>
);

const CrownIcon = ({ size = 13, color = '#ffffff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </Svg>
);

const ClockIcon = ({ size = 13, color = '#15803d' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const BookOpenIcon = ({ size = 26, color = '#6366f1' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Svg>
);

const PlayIcon = ({ size = 16, color = '#ffffff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m5 3 14 9-14 9V3z" />
  </Svg>
);

const PauseIcon = ({ size = 16, color = '#ffffff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="6" y="4" width="4" height="16" rx="1" />
    <Rect x="14" y="4" width="4" height="16" rx="1" />
  </Svg>
);

const StopIcon = ({ size = 14, color = '#b91c1c' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="5" y="5" width="14" height="14" rx="2" />
  </Svg>
);

const RewindIcon = ({ size = 16, color = '#334155' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <Path d="M3 3v5h5" />
  </Svg>
);

const ForwardIcon = ({ size = 16, color = '#334155' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.74 2.74L21 8" />
    <Path d="M21 3v5h-5" />
  </Svg>
);

const CURATED_VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', role: 'Warm Storyteller' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', role: 'Gentle & Soothing' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', role: 'Calm & Soft' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', role: 'Deep & Whimsical' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', role: 'Playful & Vibrant' }
];

export default function PlayerScreen({ route, navigation }: any) {
  const { story } = route.params || {};
  const { isPremium, trialSecondsRemaining, recordListeningSeconds, user } = useSubscription();

  const [activeVoice, setActiveVoice] = useState('JBFqnCBsd6RMkjVDRZzb'); // George as default
  const [audioUrl, setAudioUrl] = useState<string | null>(story?.audio_url || null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Audio player hook and reactive status hook (with 250ms status updates)
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const timerRef = useRef<any>(null);

  // Multi-part story playback & timing states
  const initialStoryWords = (story?.content || '').trim().split(/\s+/).filter(Boolean).length;
  const initialEstimatedDuration = Math.max(60, Math.round((initialStoryWords / 140) * 60));

  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [totalParts, setTotalParts] = useState(1);
  const [chunkDurations, setChunkDurations] = useState<number[]>([initialEstimatedDuration]);
  const [totalStoryDuration, setTotalStoryDuration] = useState<number>(initialEstimatedDuration);
  const [downloadingNextPart, setDownloadingNextPart] = useState(false);
  const partAudioCacheRef = useRef<{ [key: string]: string }>({});
  const autoAdvancingRef = useRef(false);

  // Scrubber drag & drop states
  const [trackWidth, setTrackWidth] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(0); // 0.0 to 1.0

  // Bookmark progress state
  const [savedBookmark, setSavedBookmark] = useState<StoryBookmark | null>(null);
  const [hasDismissedBookmark, setHasDismissedBookmark] = useState(false);
  const lastSavedTimeRef = useRef<number>(0);

  // Helper to compute cumulative offsets for each part
  const getPartOffsets = (durations: number[]) => {
    const offsets = [0];
    for (let i = 0; i < durations.length - 1; i++) {
      offsets.push(offsets[i] + (durations[i] || 60));
    }
    return offsets;
  };

  const partOffsets = getPartOffsets(chunkDurations);
  const currentPartOffset = partOffsets[currentPartIndex] || 0;

  // Full story duration and overall progress
  const effectiveDuration = totalStoryDuration > 0 ? totalStoryDuration : (status.duration || 0);
  const overallCurrentTime = currentPartOffset + (status.currentTime || 0);

  const displayTime = isScrubbing
    ? scrubProgress * effectiveDuration
    : overallCurrentTime;

  const currentProgress = effectiveDuration > 0
    ? Math.max(0, Math.min(1, displayTime / effectiveDuration))
    : 0;

  // Load existing bookmark on mount
  useEffect(() => {
    if (story?.id || story?.title) {
      getStoryBookmark(story.id, story.title).then((bm) => {
        if (bm && bm.audioPosition > 3) {
          setSavedBookmark(bm);
        }
      });
    }
  }, [story?.id, story?.title]);

  // Auto-save audio bookmark progress as overall story playback advances
  useEffect(() => {
    const curTime = overallCurrentTime;
    const dur = effectiveDuration;

    // Save every 4 seconds while playing
    if (status.playing && curTime > 2 && Math.abs(curTime - lastSavedTimeRef.current) >= 4) {
      lastSavedTimeRef.current = curTime;
      saveStoryBookmark({
        storyId: story?.id,
        storyTitle: story?.title,
        audioPosition: curTime,
        audioDuration: dur,
        voiceId: activeVoice
      });
    }

    // Story finished: automatically clear the bookmark when reaching the very end of final part
    if (dur > 0 && curTime >= dur - 2 && currentPartIndex === totalParts - 1) {
      deleteStoryBookmark(story?.id, story?.title);
      setSavedBookmark(null);
    }
  }, [overallCurrentTime, status.playing, effectiveDuration, activeVoice, story?.id, story?.title, currentPartIndex, totalParts]);

  // Auto-advance to next part when current part nears completion or ends
  useEffect(() => {
    const curTime = status.currentTime || 0;
    const dur = status.duration || 0;
    const hasNext = currentPartIndex < totalParts - 1;

    if (dur > 0 && hasNext && !autoAdvancingRef.current) {
      if (curTime >= dur - 1.2 || status.playbackState === 'ended') {
        autoAdvancingRef.current = true;
        loadStoryPart(currentPartIndex + 1, activeVoice, true).then(() => {
          setTimeout(() => {
            autoAdvancingRef.current = false;
          }, 2000);
        });
      }
    }
  }, [status.currentTime, status.duration, status.playbackState, currentPartIndex, totalParts, activeVoice]);

  const prefetchNextPart = async (nextPartIdx: number, voiceId: string) => {
    if (nextPartIdx >= totalParts) return;
    const cacheKey = `${story?.id || story?.title}_${voiceId}_part${nextPartIdx}`;
    if (partAudioCacheRef.current[cacheKey]) return;

    try {
      setDownloadingNextPart(true);
      const res = await fetch(`${API_BASE_URL}/api/get-or-generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story?.id,
          voice_id: voiceId,
          text_content: story?.content || '',
          part_index: nextPartIdx
        })
      });
      const data = await res.json();
      if (data.audio_url) {
        partAudioCacheRef.current[cacheKey] = data.audio_url;
        if (data.total_duration) setTotalStoryDuration(data.total_duration);
        if (data.chunk_durations && Array.isArray(data.chunk_durations)) {
          setChunkDurations(data.chunk_durations);
        }
      }
    } catch (e) {
      console.log('Prefetch next part error:', e);
    } finally {
      setDownloadingNextPart(false);
    }
  };

  const loadStoryPart = async (
    partIdx: number,
    voiceId: string,
    autoPlay = true,
    seekToOffset: number | null = null
  ) => {
    if (!isPremium && trialSecondsRemaining <= 0) {
      navigation.navigate('Paywall');
      return;
    }

    const cacheKey = `${story?.id || story?.title}_${voiceId}_part${partIdx}`;
    const cachedUrl = partAudioCacheRef.current[cacheKey];

    if (cachedUrl) {
      setCurrentPartIndex(partIdx);
      setAudioUrl(cachedUrl);
      try {
        player.replace({ uri: cachedUrl });
        if (seekToOffset !== null && seekToOffset > 0) {
          await player.seekTo(seekToOffset);
        }
        if (autoPlay) {
          player.play();
        }
      } catch (err) {
        console.log('Play cached part error:', err);
      }
      if (partIdx + 1 < totalParts) {
        prefetchNextPart(partIdx + 1, voiceId);
      }
      return;
    }

    setLoadingAudio(true);
    setStatusText(partIdx === 0 ? 'Preparing narration...' : `Downloading Part ${partIdx + 1}...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/get-or-generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: story?.id,
          voice_id: voiceId,
          text_content: story?.content || 'Once upon a time...',
          part_index: partIdx
        })
      });

      const data = await res.json();
      if (data.audio_url) {
        partAudioCacheRef.current[cacheKey] = data.audio_url;
        if (data.total_parts) setTotalParts(data.total_parts);
        if (data.total_duration) setTotalStoryDuration(data.total_duration);
        if (data.chunk_durations && Array.isArray(data.chunk_durations)) {
          setChunkDurations(data.chunk_durations);
        }

        setCurrentPartIndex(partIdx);
        setAudioUrl(data.audio_url);
        setStatusText(
          data.total_parts > 1
            ? `Part ${partIdx + 1} of ${data.total_parts}`
            : data.cached ? 'Loaded from audio cache' : 'Freshly narrated by ElevenLabs'
        );

        try {
          player.replace({ uri: data.audio_url });
          if (seekToOffset !== null && seekToOffset > 0) {
            await player.seekTo(seekToOffset);
          }
          if (autoPlay) {
            player.play();
          }
        } catch (playErr) {
          console.log('Audio replace/play error:', playErr);
        }

        if (data.has_next_part) {
          prefetchNextPart(partIdx + 1, voiceId);
        }
      } else {
        setStatusText('Could not load audio variant');
      }
    } catch (e: any) {
      console.log('Error loading voice part:', e);
      setStatusText('Audio service unavailable');
    } finally {
      setLoadingAudio(false);
    }
  };

  const seekToOverallTime = async (targetOverallTime: number) => {
    let targetPart = 0;
    let offsetInPart = targetOverallTime;
    for (let i = 0; i < chunkDurations.length; i++) {
      const pStart = partOffsets[i] || 0;
      const pDur = chunkDurations[i] || 60;
      if (targetOverallTime >= pStart && (targetOverallTime < pStart + pDur || i === chunkDurations.length - 1)) {
        targetPart = i;
        offsetInPart = Math.max(0, targetOverallTime - pStart);
        break;
      }
    }

    if (targetPart === currentPartIndex) {
      try {
        await player.seekTo(offsetInPart);
      } catch (e) {
        console.log('Seek error:', e);
      }
    } else {
      await loadStoryPart(targetPart, activeVoice, status.playing, offsetInPart);
    }
  };

  const handleResumeBookmark = async () => {
    if (!savedBookmark) return;
    setHasDismissedBookmark(true);
    await seekToOverallTime(savedBookmark.audioPosition);
    player.play();
  };

  const handleManualBookmark = async () => {
    const curTime = overallCurrentTime;
    const dur = effectiveDuration;
    await saveStoryBookmark({
      storyId: story?.id,
      storyTitle: story?.title,
      audioPosition: curTime,
      audioDuration: dur,
      voiceId: activeVoice
    });
    setSavedBookmark({
      storyId: story?.id,
      storyTitle: story?.title,
      audioPosition: curTime,
      audioDuration: dur,
      voiceId: activeVoice,
      updatedAt: new Date().toISOString()
    });
    Alert.alert(
      'Bookmark Saved',
      `Saved listening bookmark at ${formatBookmarkTime(curTime)}. You can resume anytime!`,
      [{ text: 'OK' }]
    );
  };

  // Configure iOS audio session for silent mode override
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true
    }).catch((err) => {
      console.log('Audio mode config error:', err);
    });
  }, []);

  // Story initialization & voice reset
  useEffect(() => {
    try {
      player.pause();
    } catch {}

    setAudioUrl(story?.audio_url || null);
    setActiveVoice('JBFqnCBsd6RMkjVDRZzb');
    setStatusText('');
    setCurrentPartIndex(0);

    // Initial load of part 0 metadata and audio
    loadStoryPart(0, 'JBFqnCBsd6RMkjVDRZzb', false);

    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [story?.id]);

  // 10-Minute Free Trial Countdown while audio is actively playing
  useEffect(() => {
    if (status.playing && !isPremium) {
      timerRef.current = setInterval(() => {
        if (trialSecondsRemaining <= 1) {
          player.pause();
          clearInterval(timerRef.current);
          Alert.alert(
            '10-Minute Free Trial Ended',
            'You have reached the end of your free storytelling trial. Subscribe to Monthly or Yearly for unlimited listening!',
            [{ text: 'View Plans', onPress: () => navigation.navigate('Paywall') }]
          );
        } else {
          recordListeningSeconds(1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status.playing, isPremium, trialSecondsRemaining]);

  const formatTrialTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatAudioTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const promptSignInForAudio = () => {
    Alert.alert(
      'Sign In Required',
      'Audio narration requires a parent account. Please sign in or register to start listening to stories!',
      [
        { text: 'Read Only', style: 'cancel' },
        { text: 'Sign In / Register', onPress: () => navigation.navigate('Auth') }
      ]
    );
  };

  const fetchAudioForVoice = async (voiceId: string, autoPlay = true) => {
    if (autoPlay && !user) {
      promptSignInForAudio();
      return;
    }
    setActiveVoice(voiceId);
    await loadStoryPart(0, voiceId, autoPlay);
  };

  const handlePlayToggle = async () => {
    if (!user) {
      promptSignInForAudio();
      return;
    }

    if (!isPremium && trialSecondsRemaining <= 0) {
      navigation.navigate('Paywall');
      return;
    }

    if (!audioUrl) {
      await fetchAudioForVoice(activeVoice, true);
      return;
    }

    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleStop = async () => {
    try {
      player.pause();
      await seekToOverallTime(0);
    } catch (e) {
      console.log('Stop error:', e);
    }
  };

  const handleRewind = async (seconds: number = 10) => {
    if (!user) {
      promptSignInForAudio();
      return;
    }
    const targetOverall = Math.max(0, overallCurrentTime - seconds);
    await seekToOverallTime(targetOverall);
  };

  const handleFastForward = async (seconds: number = 10) => {
    if (!user) {
      promptSignInForAudio();
      return;
    }
    const targetOverall = Math.min(effectiveDuration, overallCurrentTime + seconds);
    await seekToOverallTime(targetOverall);
  };

  const handleBack = () => {
    try {
      player.pause();
    } catch {}
    if (overallCurrentTime > 2) {
      saveStoryBookmark({
        storyId: story?.id,
        storyTitle: story?.title,
        audioPosition: overallCurrentTime,
        audioDuration: effectiveDuration,
        voiceId: activeVoice
      });
    }
    navigation.goBack();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsScrubbing(true);
        const touchX = evt.nativeEvent.locationX;
        if (trackWidth > 0) {
          const ratio = Math.max(0, Math.min(1, touchX / trackWidth));
          setScrubProgress(ratio);
        }
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        if (trackWidth > 0) {
          const ratio = Math.max(0, Math.min(1, touchX / trackWidth));
          setScrubProgress(ratio);
        }
      },
      onPanResponderRelease: async (evt) => {
        const touchX = evt.nativeEvent.locationX;
        if (trackWidth > 0 && effectiveDuration > 0) {
          const ratio = Math.max(0, Math.min(1, touchX / trackWidth));
          const targetOverall = ratio * effectiveDuration;
          await seekToOverallTime(targetOverall);
        }
        setIsScrubbing(false);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      }
    })
  ).current;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Bar with Trial Indicator & Manual Bookmark */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeftIcon size={16} color="#334155" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Manual Bookmark Action */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.bookmarkNavBtn}
              onPress={handleManualBookmark}
            >
              <BookmarkIcon size={16} color="#d97706" filled={!!savedBookmark} />
              <Text style={styles.bookmarkNavText}>Bookmark</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.trialBadge, (user && isPremium) ? styles.proBadge : styles.trialActiveBadge]}
              onPress={() => navigation.navigate('Paywall')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {(user && isPremium) ? (
                  <CrownIcon size={13} color="#ffffff" />
                ) : user ? (
                  <ClockIcon size={13} color="#15803d" />
                ) : (
                  <CrownIcon size={13} color="#7c3aed" />
                )}
                <Text style={[styles.trialBadgeText, (user && isPremium) && styles.proBadgeText]}>
                  {(user && isPremium) ? 'PRO' : user ? `Trial: ${formatTrialTime(trialSecondsRemaining)}` : 'PRO Plans'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Realistic 3D Hardcover Book Showcase */}
        {(() => {
          const cover = STORY_COVERS[story?.title] || DEFAULT_COVER;
          return (
            <View style={styles.bookHeaderContainer}>
              <View style={[styles.playerBookCard, { backgroundColor: cover.bgColor }]}>
                {/* Real Illustrated Artwork */}
                <Image
                  source={{ uri: cover.imageUrl }}
                  style={styles.playerCoverImage}
                  resizeMode="cover"
                />
                {/* Atmospheric Vignette & Gradients */}
                <View style={[styles.playerVignette, { backgroundColor: cover.bgColor }]} />
                <View style={styles.playerDarkGradient} />

                {/* Gilded Victorian Gold Frame */}
                <View style={[styles.playerGoldFrame, { borderColor: cover.goldFoil || '#fbbf24' }]}>
                  <View style={[styles.playerCornerTL, { borderColor: cover.goldFoil || '#fbbf24' }]} />
                  <View style={[styles.playerCornerTR, { borderColor: cover.goldFoil || '#fbbf24' }]} />
                  <View style={[styles.playerCornerBL, { borderColor: cover.goldFoil || '#fbbf24' }]} />
                  <View style={[styles.playerCornerBR, { borderColor: cover.goldFoil || '#fbbf24' }]} />

                  <View style={styles.playerTopFoil}>
                    <Text style={[styles.playerTopFoilText, { color: cover.goldFoil || '#fbbf24' }]}>
                      ★ {story?.category?.toUpperCase() || 'CLASSIC FAIRY TALE'} ★
                    </Text>
                  </View>

                  <View style={styles.playerTitlePlate}>
                    <Text style={[styles.playerTitleText, { color: cover.textColor || '#ffffff' }]} numberOfLines={2}>
                      {story?.title?.replace(/\n/g, ' ')}
                    </Text>
                    {cover.subtitle ? (
                      <Text style={[styles.playerSubtitleText, { color: cover.accentColor }]} numberOfLines={1}>
                        {cover.subtitle}
                      </Text>
                    ) : null}
                    {story?.author && (
                      <Text style={[styles.playerAuthorText, { color: cover.goldFoil || '#fef08a' }]} numberOfLines={1}>
                        {story.author.toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>

                {/* 3D Spine on Left */}
                <View style={[styles.playerSpine, { backgroundColor: cover.spineColor || '#0b1320' }]}>
                  <View style={styles.playerSpineRib} />
                  <View style={styles.playerSpineRib} />
                  <View style={styles.playerSpineRib} />
                </View>
                <View style={styles.playerSpineShadow} />

                {/* 3D Paper Page Edge on Right */}
                <View style={styles.playerPaperEdge} />

                {/* Diagonal Gloss Sheen */}
                <View style={styles.playerGloss} />
              </View>
            </View>
          );
        })()}

        {/* ElevenLabs Voice Switcher */}
        <View style={styles.voiceSection}>
          <Text style={styles.sectionLabel}>Narrator Voice (ElevenLabs AI)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceRow}>
            {CURATED_VOICES.map((v) => {
              const isSelected = activeVoice === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.8}
                  onPress={() => fetchAudioForVoice(v.id, true)}
                  style={[styles.voicePill, isSelected && styles.activeVoicePill]}
                >
                  <Text style={[styles.voiceName, isSelected && styles.activeVoiceText]}>{v.name}</Text>
                  <Text style={[styles.voiceRole, isSelected && styles.activeVoiceSubtext]}>{v.role}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* RESUME BOOKMARK PROMPT BANNER */}
        {savedBookmark && savedBookmark.audioPosition > 3 && !hasDismissedBookmark && (
          <View style={styles.bookmarkBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.bookmarkBadgeIcon}>
                <BookmarkIcon size={18} color="#b45309" filled />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookmarkBannerTitle}>You left off here</Text>
                <Text style={styles.bookmarkBannerSub}>
                  At {formatBookmarkTime(savedBookmark.audioPosition)} of {savedBookmark.audioDuration > 0 ? formatBookmarkTime(savedBookmark.audioDuration) : 'story'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.bookmarkResumeBtn}
                onPress={handleResumeBookmark}
              >
                <Text style={styles.bookmarkResumeText}>
                  Resume ({formatBookmarkTime(savedBookmark.audioPosition)})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bookmarkDismissBtn}
                onPress={() => setHasDismissedBookmark(true)}
              >
                <Text style={styles.bookmarkDismissText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Comprehensive Audio Player Deck with Scrubbing & Transport Controls */}
        <View style={styles.playerCard}>
          {loadingAudio ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#0f172a" />
              <Text style={styles.loadingText}>{statusText || 'Synthesizing voice...'}</Text>
            </View>
          ) : (
            <View style={styles.playerControls}>
              {/* Part Indicator & Prefetch Status */}
              {totalParts > 1 && (
                <View style={styles.partsHeaderRow}>
                  <View style={styles.partIndicatorBadge}>
                    <Text style={styles.partIndicatorText}>Part {currentPartIndex + 1} of {totalParts}</Text>
                  </View>
                  {downloadingNextPart ? (
                    <View style={styles.prefetchIndicator}>
                      <ActivityIndicator size="small" color="#6366f1" style={{ transform: [{ scale: 0.65 }] }} />
                      <Text style={styles.prefetchText}>Buffering next part...</Text>
                    </View>
                  ) : (
                    <Text style={styles.partDurationNote}>
                      {formatAudioTime(chunkDurations[currentPartIndex] || 0)} this segment
                    </Text>
                  )}
                </View>
              )}

              {/* Interactive Timeline Scrubber (Full Story Timeline) */}
              <View style={styles.scrubberSection}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatAudioTime(displayTime)}</Text>
                  <Text style={styles.timeTotalText}>
                    {effectiveDuration > 0 ? formatAudioTime(effectiveDuration) : '0:00'}
                  </Text>
                </View>

                <View
                  style={styles.progressBarWrapper}
                  onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                  {...panResponder.panHandlers}
                >
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.max(0, Math.min(100, currentProgress * 100))}%` }
                      ]}
                    />
                  </View>

                  {/* Draggable Scrubber Thumb */}
                  <View
                    style={[
                      styles.scrubberThumb,
                      isScrubbing && styles.scrubberThumbActive,
                      {
                        left: `${Math.max(0, Math.min(100, currentProgress * 100))}%`
                      }
                    ]}
                  />
                </View>
              </View>

              {/* Main Transport Buttons: Rewind, Play/Pause, Fast-Forward, Stop */}
              <View style={styles.transportRow}>
                {/* Rewind 10s */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.transportSecButton}
                  onPress={() => handleRewind(10)}
                >
                  <RewindIcon size={16} color="#334155" />
                  <Text style={styles.transportSecLabel}>-10s</Text>
                </TouchableOpacity>

                {/* Main Play / Pause Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[styles.mainPlayButton, status.playing && styles.mainPlayButtonActive]}
                  onPress={handlePlayToggle}
                >
                  {status.playing ? (
                    <PauseIcon size={16} color="#ffffff" />
                  ) : (
                    <PlayIcon size={16} color="#ffffff" />
                  )}
                  <Text style={styles.mainPlayText}>
                    {!user
                      ? 'Sign In to Listen'
                      : audioUrl
                      ? status.playing ? 'Pause' : 'Play Narration'
                      : 'Listen with ElevenLabs'}
                  </Text>
                </TouchableOpacity>

                {/* Fast-Forward 10s */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.transportSecButton}
                  onPress={() => handleFastForward(10)}
                >
                  <ForwardIcon size={16} color="#334155" />
                  <Text style={styles.transportSecLabel}>+10s</Text>
                </TouchableOpacity>

                {/* Stop & Reset Button */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.stopButton}
                  onPress={handleStop}
                >
                  <StopIcon size={14} color="#b91c1c" />
                  <Text style={styles.stopLabel}>Stop</Text>
                </TouchableOpacity>
              </View>

              {/* Cache & Status Indicator */}
              {statusText ? (
                <Text style={styles.cacheNotice}>{statusText}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Story Whole Content Reader */}
        <View style={styles.readerContainer}>
          <Text style={styles.readerHeading}>Full Story</Text>
          <Text style={styles.storyContent}>
            {story?.content || 'No text content available for this story.'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155'
  },
  bookmarkNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  bookmarkNavText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  bookmarkBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 16,
    flexDirection: 'column',
    gap: 10,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookmarkBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  bookmarkBannerSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 1,
  },
  bookmarkResumeBtn: {
    backgroundColor: '#b45309',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  bookmarkResumeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  bookmarkDismissBtn: {
    backgroundColor: '#fef3c7',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  bookmarkDismissText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '600',
  },
  trialBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12
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
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46'
  },
  proBadgeText: {
    color: '#ffffff'
  },
  bookHeaderContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  playerBookCard: {
    width: 140,
    height: 200,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  playerCoverImage: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 4,
    bottom: 0,
    opacity: 0.9,
  },
  playerVignette: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 4,
    bottom: 0,
    opacity: 0.28,
  },
  playerDarkGradient: {
    position: 'absolute',
    left: 14,
    right: 4,
    bottom: 0,
    height: 95,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  playerGoldFrame: {
    position: 'absolute',
    top: 8,
    left: 20,
    right: 9,
    bottom: 8,
    borderWidth: 1,
    borderRadius: 4,
    padding: 7,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  playerCornerTL: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  playerCornerTR: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  playerCornerBL: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  playerCornerBR: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  playerTopFoil: {
    alignItems: 'center',
    paddingVertical: 1,
  },
  playerTopFoilText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  playerTitlePlate: {
    marginTop: 'auto',
  },
  playerTitleText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  playerSubtitleText: {
    fontSize: 8.5,
    fontStyle: 'italic',
    lineHeight: 11,
    marginBottom: 3,
    opacity: 0.92,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  playerAuthorText: {
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  playerSpine: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 26,
    zIndex: 3,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.45)',
  },
  playerSpineRib: {
    width: 8,
    height: 2.5,
    backgroundColor: 'rgba(251, 191, 36, 0.55)',
    borderRadius: 1,
  },
  playerSpineShadow: {
    position: 'absolute',
    top: 0,
    left: 15,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 4,
  },
  playerPaperEdge: {
    position: 'absolute',
    top: 3,
    right: 0,
    bottom: 3,
    width: 4,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 3,
  },
  playerGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 60,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    borderRightWidth: 140,
    borderRightColor: 'transparent',
    zIndex: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4
  },
  author: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8
  },
  categoryPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    textTransform: 'uppercase'
  },
  voiceSection: {
    marginBottom: 20
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 10
  },
  voiceRow: {
    gap: 8,
    paddingVertical: 4
  },
  voicePill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 110
  },
  activeVoicePill: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a'
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937'
  },
  activeVoiceText: {
    color: '#ffffff'
  },
  voiceRole: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2
  },
  activeVoiceSubtext: {
    color: '#cbd5e1'
  },
  playerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155'
  },
  playerControls: {
    width: '100%'
  },
  scrubberSection: {
    width: '100%',
    marginBottom: 16
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    fontVariant: ['tabular-nums']
  },
  timeTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    fontVariant: ['tabular-nums']
  },
  progressBarWrapper: {
    height: 28,
    justifyContent: 'center',
    position: 'relative'
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 3
  },
  scrubberThumb: {
    position: 'absolute',
    top: 6,
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3
  },
  scrubberThumbActive: {
    transform: [{ scale: 1.3 }],
    backgroundColor: '#f59e0b'
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4
  },
  transportSecButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 54
  },
  transportSecIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155'
  },
  transportSecLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1
  },
  mainPlayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6
  },
  mainPlayButtonActive: {
    backgroundColor: '#1e293b'
  },
  mainPlayIcon: {
    color: '#ffffff',
    fontSize: 16
  },
  mainPlayText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  stopButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 48
  },
  stopIcon: {
    fontSize: 12,
    color: '#b91c1c'
  },
  stopLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
    marginTop: 1
  },
  cacheNotice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
    marginTop: 12
  },
  readerContainer: {
    backgroundColor: '#fffdfa',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#f1efe7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4
  },
  readerHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 12
  },
  storyContent: {
    fontSize: 17,
    lineHeight: 28,
    color: '#27272a',
    fontFamily: 'Georgia',
    letterSpacing: 0.2
  },
  partsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2
  },
  partIndicatorBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe'
  },
  partIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338ca'
  },
  partDurationNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  prefetchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  prefetchText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1'
  }
});
