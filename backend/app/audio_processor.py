import os
import subprocess
import tempfile
import uuid
from typing import Optional, Tuple, Dict, Any, List

# Absolute path to ambient soundscape assets
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets", "ambient")

CURATED_AMBIENT_TRACKS: List[Dict[str, Any]] = [
    {
        "id": "lullaby_music_box",
        "name": "Starlight Music Box",
        "description": "Gentle, sparkling bedtime music box lullaby tones.",
        "category": "Lullaby",
        "filename": "lullaby_music_box.mp3"
    },
    {
        "id": "night_crickets",
        "name": "Night Meadow",
        "description": "Soft summer night breeze with distant gentle crickets.",
        "category": "Nature",
        "filename": "night_crickets.mp3"
    },
    {
        "id": "gentle_rain",
        "name": "Cozy Rain",
        "description": "Calming, rhythmic sleep rain softly tapping on leaves.",
        "category": "Weather",
        "filename": "gentle_rain.mp3"
    },
    {
        "id": "ocean_waves",
        "name": "Calm Harbor",
        "description": "Slow, peaceful rhythmic ocean waves washing gently ashore.",
        "category": "Ocean",
        "filename": "ocean_waves.mp3"
    }
]

DEFAULT_AMBIENT_TRACK_ID = "lullaby_music_box"

def get_ambient_track_info(track_id: Optional[str]) -> Dict[str, Any]:
    """Retrieves metadata for an ambient track or returns the default."""
    if not track_id:
        track_id = DEFAULT_AMBIENT_TRACK_ID
    for track in CURATED_AMBIENT_TRACKS:
        if track["id"] == track_id:
            return track
    return CURATED_AMBIENT_TRACKS[0]

def get_ambient_file_path(track_id: Optional[str]) -> Optional[str]:
    """Resolves the local static file path for the given ambient track."""
    track_info = get_ambient_track_info(track_id)
    file_path = os.path.join(ASSETS_DIR, track_info["filename"])
    if os.path.isfile(file_path):
        return file_path
    # Fallback to default
    default_path = os.path.join(ASSETS_DIR, f"{DEFAULT_AMBIENT_TRACK_ID}.mp3")
    if os.path.isfile(default_path):
        return default_path
    return None

def detect_ambient_track_from_context(text: str = "", title: str = "", category: str = "") -> str:
    """
    Intelligently selects a theme-matched bedtime ambient soundscape
    based on story title, category, or narrative keywords.
    """
    combined = f"{title} {category} {text}".lower()

    if any(k in combined for k in ["ocean", "sea", "wave", "harbor", "mermaid", "ship", "sail", "water", "island", "beach", "tide"]):
        return "ocean_waves"
    if any(k in combined for k in ["rain", "storm", "droplet", "cloud", "cozy", "puddle", "autumn", "winter", "patter"]):
        return "gentle_rain"
    if any(k in combined for k in ["forest", "meadow", "cricket", "wood", "nature", "tree", "garden", "night", "owl", "starry", "stars"]):
        return "night_crickets"

    return DEFAULT_AMBIENT_TRACK_ID

def mix_voice_with_ambient(
    voice_audio_bytes: bytes,
    ambient_track_id: Optional[str] = None,
    ambient_volume_db: float = -18.0
) -> Tuple[bytes, str, bool]:
    """
    Layers a soothing, low-volume royalty-free ambient soundscape loop underneath
    the ElevenLabs voiceover track before uploading to persistent storage.

    Features:
    - Audio Balancing: Ambient track reduced to -18dB relative to voice.
    - Duration Mismatch: Ambient seamlessly loops via FFmpeg stream_loop.
    - Soft Fades: 1.2s ambient fade-in and 2.0s fade-out at narration conclusion.
    - Compression: Outputs 128kbps stereo MP3 optimized for mobile streaming.
    - Fallback: Gracefully returns raw voiceover bytes if FFmpeg fails or times out.

    Returns:
        (final_audio_bytes, used_ambient_track_id, has_sfx_boolean)
    """
    if not voice_audio_bytes:
        return voice_audio_bytes, (ambient_track_id or ""), False

    track_info = get_ambient_track_info(ambient_track_id)
    chosen_id = track_info["id"]
    ambient_file = get_ambient_file_path(chosen_id)

    if not ambient_file or not os.path.isfile(ambient_file):
        print(f"[AudioProcessor] Ambient file not found for track '{chosen_id}', skipping mix.")
        return voice_audio_bytes, chosen_id, False

    temp_voice_path = None
    temp_mixed_path = None

    try:
        # Create temp files for processing
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f_voice:
            f_voice.write(voice_audio_bytes)
            temp_voice_path = f_voice.name

        temp_mixed_path = os.path.join(tempfile.gettempdir(), f"mixed_{uuid.uuid4().hex}.mp3")

        # 1. Probe voice duration
        dur_cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            temp_voice_path
        ]
        res = subprocess.run(dur_cmd, capture_output=True, text=True, timeout=8)
        dur_str = res.stdout.strip()
        voice_duration = float(dur_str) if dur_str else 0.0

        if voice_duration <= 0.5:
            print("[AudioProcessor] Voice duration too short to mix, returning raw audio.")
            return voice_audio_bytes, chosen_id, False

        # 2. Build FFmpeg filtergraph:
        # - Stream 0 (voice) normalized to 44.1kHz stereo
        # - Stream 1 (ambient) looped indefinitely via -stream_loop -1, resampled to 44.1kHz stereo
        # - Ambient volume adjusted to target bedtime level (-18dB)
        # - Trim ambient to match voice duration exactly
        # - Smooth fade-in and smooth fade-out ending exactly at voice conclusion
        # - amix with normalize=0 ensures voice track retains 100% full original gain
        fade_in_len = min(1.2, max(0.2, round(voice_duration * 0.25, 2)))
        fade_out_len = min(2.0, max(0.5, round(voice_duration * 0.35, 2)))
        fade_out_start = max(0.0, round(voice_duration - fade_out_len, 2))

        filter_graph = (
            f"[0:a]aformat=sample_rates=44100:channel_layouts=stereo[voice];"
            f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,"
            f"volume={ambient_volume_db}dB,"
            f"atrim=0:{voice_duration},"
            f"afade=t=in:st=0:d={fade_in_len},"
            f"afade=t=out:st={fade_out_start}:d={fade_out_len}[amb];"
            f"[voice][amb]amix=inputs=2:duration=first:normalize=0[out]"
        )

        mix_cmd = [
            "ffmpeg", "-y",
            "-i", temp_voice_path,
            "-stream_loop", "-1", "-i", ambient_file,
            "-filter_complex", filter_graph,
            "-map", "[out]",
            "-codec:a", "libmp3lame",
            "-b:a", "128k",
            "-ar", "44100",
            "-ac", "2",
            temp_mixed_path
        ]

        # 3. Execute FFmpeg with timeout
        mix_res = subprocess.run(
            mix_cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=25
        )

        if mix_res.returncode == 0 and os.path.isfile(temp_mixed_path) and os.path.getsize(temp_mixed_path) > 1000:
            with open(temp_mixed_path, "rb") as mf:
                mixed_bytes = mf.read()
            print(f"[AudioProcessor] Successfully layered ambient SFX '{chosen_id}' ({len(mixed_bytes)} bytes, dur: {voice_duration:.1f}s)")
            return mixed_bytes, chosen_id, True
        else:
            err_msg = mix_res.stderr.decode(errors="ignore") if mix_res.stderr else "Unknown error"
            print(f"[AudioProcessor] FFmpeg failed ({mix_res.returncode}): {err_msg[:200]}, falling back to raw voice.")
            return voice_audio_bytes, chosen_id, False

    except Exception as e:
        print(f"[AudioProcessor] Exception during audio mixing: {e}. Gracefully serving raw voice.")
        return voice_audio_bytes, chosen_id, False

    finally:
        # Cleanup temporary files
        if temp_voice_path and os.path.exists(temp_voice_path):
            try:
                os.remove(temp_voice_path)
            except OSError:
                pass
        if temp_mixed_path and os.path.exists(temp_mixed_path):
            try:
                os.remove(temp_mixed_path)
            except OSError:
                pass
