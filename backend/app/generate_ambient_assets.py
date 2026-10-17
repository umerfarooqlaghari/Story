import math
import random
import struct
import wave
import os
import subprocess

SAMPLE_RATE = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), "assets", "ambient")
os.makedirs(OUT_DIR, exist_ok=True)

def write_mp3(samples_l, samples_r, name):
    wav_path = os.path.join(OUT_DIR, f"{name}.wav")
    mp3_path = os.path.join(OUT_DIR, f"{name}.mp3")
    n_samples = len(samples_l)

    # Normalize max peak to -3dB (0.707) to avoid any clipping
    max_peak = max(max(abs(s) for s in samples_l), max(abs(s) for s in samples_r), 0.0001)
    scale = 0.707 / max_peak

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for i in range(n_samples):
            sl = max(-1.0, min(1.0, samples_l[i] * scale))
            sr = max(-1.0, min(1.0, samples_r[i] * scale))
            il = int(sl * 32767.0)
            ir = int(sr * 32767.0)
            frames.extend(struct.pack("<hh", il, ir))
        wf.writeframes(frames)

    # Convert to 128kbps stereo MP3 via ffmpeg
    cmd = [
        "ffmpeg", "-y", "-i", wav_path,
        "-codec:a", "libmp3lame",
        "-b:a", "128k",
        "-ar", str(SAMPLE_RATE),
        "-ac", "2",
        mp3_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(wav_path):
        os.remove(wav_path)
    print(f"Synthesized {name}.mp3 ({os.path.getsize(mp3_path)} bytes, {round(n_samples/SAMPLE_RATE, 1)}s)")

# ----------------------------------------------------
# 1. LULLABY MUSIC BOX
# ----------------------------------------------------
def generate_music_box():
    duration = 32.0 # seconds
    n_samples = int(duration * SAMPLE_RATE)
    out_l = [0.0] * n_samples
    out_r = [0.0] * n_samples

    # Pentatonic scale frequencies
    # E4, G4, A4, B4, D5, E5, G5, A5
    notes_freq = {
        "E4": 329.63,
        "G4": 392.00,
        "A4": 440.00,
        "B4": 493.88,
        "C5": 523.25,
        "D5": 587.33,
        "E5": 659.25,
        "G5": 783.99,
        "A5": 880.00,
    }

    # Sequence of (time_sec, note_name, velocity)
    # Slow, peaceful 54 BPM lullaby melody
    melody = [
        (0.0, "E4", 0.6), (0.5, "G4", 0.5), (1.0, "B4", 0.6), (1.5, "E5", 0.7),
        (2.2, "D5", 0.6), (3.0, "B4", 0.55), (3.7, "G4", 0.5),
        (4.5, "A4", 0.55), (5.2, "B4", 0.6), (6.0, "D5", 0.65), (7.0, "B4", 0.5),
        (8.0, "G4", 0.6), (8.5, "B4", 0.55), (9.0, "D5", 0.6), (9.5, "E5", 0.7),
        (10.2, "G5", 0.65), (11.0, "E5", 0.6), (11.7, "D5", 0.5),
        (12.5, "B4", 0.55), (13.2, "A4", 0.5), (14.0, "G4", 0.55), (15.0, "E4", 0.6),
        # Second phrase
        (16.0, "G4", 0.55), (16.5, "A4", 0.5), (17.0, "B4", 0.6), (17.5, "D5", 0.65),
        (18.2, "E5", 0.7), (19.0, "D5", 0.6), (19.7, "B4", 0.55),
        (20.5, "A4", 0.5), (21.2, "G4", 0.5), (22.0, "A4", 0.55), (23.0, "B4", 0.6),
        (24.0, "E5", 0.65), (24.7, "D5", 0.6), (25.5, "B4", 0.55), (26.2, "G4", 0.5),
        (27.0, "E4", 0.55), (28.0, "G4", 0.45), (29.0, "E4", 0.5)
    ]

    for start_t, note, vel in melody:
        f = notes_freq[note]
        # Pan based on pitch: 0.0 (left) to 1.0 (right)
        pan = 0.3 + 0.4 * ((f - 300.0) / 600.0)
        pan = max(0.15, min(0.85, pan))
        start_idx = int(start_t * SAMPLE_RATE)

        # Bell / music box tine harmonics: fundamental, 2nd, 3rd, 4.2nd (metallic tine mode)
        decay_rate = 1.9 # exponential decay time constant
        note_len_samples = int(4.0 * SAMPLE_RATE)
        end_idx = min(n_samples, start_idx + note_len_samples)

        for i in range(start_idx, end_idx):
            t = (i - start_idx) / SAMPLE_RATE
            # Envelope: fast 2ms rise, then exponential decay
            env = (1.0 - math.exp(-t * 500.0)) * math.exp(-t / decay_rate) * vel
            # Timbre: combination of clean sine harmonics + mild metallic chime
            sample = (
                1.00 * math.sin(2.0 * math.pi * f * t) +
                0.35 * math.sin(2.0 * math.pi * 2.0 * f * t) +
                0.12 * math.sin(2.0 * math.pi * 3.0 * f * t) +
                0.08 * math.sin(2.0 * math.pi * 4.18 * f * t) +
                0.04 * math.sin(2.0 * math.pi * 5.43 * f * t)
            ) * env * 0.4

            out_l[i] += sample * (1.0 - pan)
            out_r[i] += sample * pan

    # Add soft warm ambient pad drone underneath (C & G soft tones)
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        warmth = (
            math.sin(2.0 * math.pi * 130.81 * t) * 0.025 +
            math.sin(2.0 * math.pi * 196.00 * t) * 0.020 +
            math.sin(2.0 * math.pi * 261.63 * t) * 0.015
        )
        out_l[i] += warmth
        out_r[i] += warmth

    write_mp3(out_l, out_r, "lullaby_music_box")

# ----------------------------------------------------
# 2. NIGHT CRICKETS
# ----------------------------------------------------
def generate_night_crickets():
    duration = 30.0 # seconds
    n_samples = int(duration * SAMPLE_RATE)
    out_l = [0.0] * n_samples
    out_r = [0.0] * n_samples

    # Soft nocturnal breeze: filtered pink noise
    b0_l, b1_l, b2_l = 0.0, 0.0, 0.0
    b0_r, b1_r, b2_r = 0.0, 0.0, 0.0
    random.seed(42)

    for i in range(n_samples):
        t = i / SAMPLE_RATE
        # Pink noise generator
        white_l = random.uniform(-1.0, 1.0)
        white_r = random.uniform(-1.0, 1.0)

        b0_l = 0.99886 * b0_l + white_l * 0.0555179
        b1_l = 0.99332 * b1_l + white_l * 0.0750759
        b2_l = 0.96900 * b2_l + white_l * 0.1538520
        pink_l = b0_l + b1_l + b2_l + white_l * 0.05

        b0_r = 0.99886 * b0_r + white_r * 0.0555179
        b1_r = 0.99332 * b1_r + white_r * 0.0750759
        b2_r = 0.96900 * b2_r + white_r * 0.1538520
        pink_r = b0_r + b1_r + b2_r + white_r * 0.05

        # Slow breeze modulation (0.1 Hz)
        breeze = 0.04 + 0.02 * math.sin(2.0 * math.pi * 0.1 * t + 0.5)
        out_l[i] = pink_l * breeze * 0.15
        out_r[i] = pink_r * breeze * 0.15

    # Cricket chirps: Natural rhythmic pulses around 4400Hz and 4800Hz
    # Cricket 1 (left side, frequency 4400Hz)
    def add_cricket_pulses(base_time, freq, pan, num_pulses=4, pulse_dur=0.016, gap_dur=0.010, amp=0.18):
        for p in range(num_pulses):
            start_p = base_time + p * (pulse_dur + gap_dur)
            start_i = int(start_p * SAMPLE_RATE)
            end_i = min(n_samples, start_i + int(pulse_dur * SAMPLE_RATE))
            for idx in range(start_i, end_i):
                t_local = (idx - start_i) / SAMPLE_RATE
                # Hann window envelope for each pulse
                win = 0.5 * (1.0 - math.cos(2.0 * math.pi * t_local / pulse_dur))
                # Carrier with 2nd harmonic
                carrier = math.sin(2.0 * math.pi * freq * t_local) + 0.25 * math.sin(2.0 * math.pi * (freq * 2.05) * t_local)
                val = carrier * win * amp
                out_l[idx] += val * (1.0 - pan)
                out_r[idx] += val * pan

    # Cricket 1 chirps rhythmically every ~1.2s on left (pan = 0.25)
    t_curr = 0.4
    while t_curr < duration - 1.0:
        add_cricket_pulses(t_curr, freq=4450.0, pan=0.25, num_pulses=3, amp=0.16)
        t_curr += random.uniform(1.1, 1.6)

    # Cricket 2 chirps on right (pan = 0.8) answering every ~1.8s
    t_curr2 = 1.0
    while t_curr2 < duration - 1.0:
        add_cricket_pulses(t_curr2, freq=4750.0, pan=0.78, num_pulses=4, amp=0.12)
        t_curr2 += random.uniform(1.5, 2.2)

    # Distant cricket 3 centered, very quiet
    t_curr3 = 0.8
    while t_curr3 < duration - 1.0:
        add_cricket_pulses(t_curr3, freq=4900.0, pan=0.5, num_pulses=3, amp=0.07)
        t_curr3 += random.uniform(2.0, 3.1)

    write_mp3(out_l, out_r, "night_crickets")

# ----------------------------------------------------
# 3. GENTLE RAIN
# ----------------------------------------------------
def generate_gentle_rain():
    duration = 30.0 # seconds
    n_samples = int(duration * SAMPLE_RATE)
    out_l = [0.0] * n_samples
    out_r = [0.0] * n_samples

    random.seed(99)
    # Pink noise filter state
    b0_l, b1_l, b2_l = 0.0, 0.0, 0.0
    b0_r, b1_r, b2_r = 0.0, 0.0, 0.0
    # Lowpass filter state (approx 1200 Hz cutoff)
    lp_l = 0.0
    lp_r = 0.0
    alpha = 0.16 # Low pass coefficient

    for i in range(n_samples):
        t = i / SAMPLE_RATE
        white_l = random.uniform(-1.0, 1.0)
        white_r = random.uniform(-1.0, 1.0)

        b0_l = 0.99886 * b0_l + white_l * 0.0555179
        b1_l = 0.99332 * b1_l + white_l * 0.0750759
        b2_l = 0.96900 * b2_l + white_l * 0.1538520
        pink_l = b0_l + b1_l + b2_l + white_l * 0.05

        b0_r = 0.99886 * b0_r + white_r * 0.0555179
        b1_r = 0.99332 * b1_r + white_r * 0.0750759
        b2_r = 0.96900 * b2_r + white_r * 0.1538520
        pink_r = b0_r + b1_r + b2_r + white_r * 0.05

        lp_l += alpha * (pink_l - lp_l)
        lp_r += alpha * (pink_r - lp_r)

        # Gentle natural swell
        swell = 0.22 + 0.04 * math.sin(2.0 * math.pi * 0.08 * t)
        out_l[i] = lp_l * swell
        out_r[i] = lp_r * swell

    # Add scattered tiny soothing droplet clicks on leaves/windowpane
    num_drops = int(duration * 25)
    for _ in range(num_drops):
        drop_time = random.uniform(0.1, duration - 0.2)
        idx_start = int(drop_time * SAMPLE_RATE)
        pan = random.uniform(0.15, 0.85)
        drop_len = int(0.015 * SAMPLE_RATE)
        f_drop = random.uniform(1100.0, 1800.0)
        amp = random.uniform(0.04, 0.10)
        for di in range(drop_len):
            if idx_start + di >= n_samples:
                break
            dt = di / SAMPLE_RATE
            env = math.exp(-dt * 300.0)
            val = math.sin(2.0 * math.pi * f_drop * dt) * env * amp
            out_l[idx_start + di] += val * (1.0 - pan)
            out_r[idx_start + di] += val * pan

    write_mp3(out_l, out_r, "gentle_rain")

# ----------------------------------------------------
# 4. OCEAN WAVES
# ----------------------------------------------------
def generate_ocean_waves():
    duration = 32.0 # seconds (approximately 4 swell cycles)
    n_samples = int(duration * SAMPLE_RATE)
    out_l = [0.0] * n_samples
    out_r = [0.0] * n_samples

    random.seed(1234)
    b0_l, b1_l, b2_l = 0.0, 0.0, 0.0
    b0_r, b1_r, b2_r = 0.0, 0.0, 0.0
    lp_l, lp_r = 0.0, 0.0

    cycle_period = 8.0 # seconds per wave surge

    for i in range(n_samples):
        t = i / SAMPLE_RATE
        white_l = random.uniform(-1.0, 1.0)
        white_r = random.uniform(-1.0, 1.0)

        b0_l = 0.99886 * b0_l + white_l * 0.0555179
        b1_l = 0.99332 * b1_l + white_l * 0.0750759
        b2_l = 0.96900 * b2_l + white_l * 0.1538520
        pink_l = b0_l + b1_l + b2_l + white_l * 0.05

        b0_r = 0.99886 * b0_r + white_r * 0.0555179
        b1_r = 0.99332 * b1_r + white_r * 0.0750759
        b2_r = 0.96900 * b2_r + white_r * 0.1538520
        pink_r = b0_r + b1_r + b2_r + white_r * 0.05

        # Dynamic swell phase: 0.0 to 1.0
        phase = (t % cycle_period) / cycle_period
        # Wave swell envelope: rises smoothly, peaks around 0.45, then long peaceful retreat
        if phase < 0.45:
            # Rise
            p = phase / 0.45
            swell_amp = 0.5 * (1.0 - math.cos(math.pi * p))
            cutoff_alpha = 0.08 + 0.14 * p # cutoff opens up on surge
        else:
            # Gentle wash retreat
            p = (phase - 0.45) / 0.55
            swell_amp = 0.5 * (1.0 + math.cos(math.pi * p))
            cutoff_alpha = 0.22 - 0.15 * p # cutoff closes down to deep rumble

        lp_l += cutoff_alpha * (pink_l - lp_l)
        lp_r += cutoff_alpha * (pink_r - lp_r)

        volume = 0.08 + 0.26 * swell_amp
        out_l[i] = lp_l * volume
        out_r[i] = lp_r * volume

    write_mp3(out_l, out_r, "ocean_waves")

if __name__ == "__main__":
    print("Generating curated ambient soundscapes...")
    generate_music_box()
    generate_night_crickets()
    generate_gentle_rain()
    generate_ocean_waves()
    print("All ambient tracks successfully generated!")
