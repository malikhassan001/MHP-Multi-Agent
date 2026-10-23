import type { Asset, Track } from "./types";

export const SAMPLE_SCRIPT = `# Scene 1: Dawn over the city | 6s
VO: Every morning, the city wakes up before we do.
Visual: aerial drone shot of skyline at sunrise, golden haze
Camera: slow push-in
Mood: hopeful

# Scene 2: First pour | 5s
VO: Small rituals set the rhythm for the day.
Visual: barista pouring milk into espresso, cafe steam
Camera: macro, shallow focus
Mood: warm

# Scene 3: Neon commute | 6s
VO: Then everything starts to move — faster, brighter, together.
Visual: cyclist riding through rain soaked neon streets at night
Camera: tracking shot
Mood: energetic

# Scene 4: Golden hour | 5s
VO: We pause, just long enough to notice.
Visual: friends on a rooftop garden at sunset
Camera: wide, gentle drift
Mood: nostalgic

# Scene 5: City in flow | 6s
VO: This is the flow. And it never really stops.
Visual: long exposure night city light trails on highways
Camera: locked-off timelapse
Mood: epic`;

export const SAMPLE_ASSETS: Asset[] = [
  { id: "a_dawn", name: "Skyline_Dawn.png", kind: "image", duration: 6, src: "/flow/scene-dawn.png", tags: ["skyline", "sunrise", "dawn", "aerial", "city"], sizeMb: 2.4, addedLabel: "Generated" },
  { id: "a_cafe", name: "Cafe_Pour.png", kind: "image", duration: 5, src: "/flow/scene-cafe.png", tags: ["barista", "cafe", "espresso", "coffee", "steam"], sizeMb: 2.1, addedLabel: "Generated" },
  { id: "a_cyclist", name: "Neon_Cyclist.png", kind: "image", duration: 6, src: "/flow/scene-cyclist.png", tags: ["cyclist", "neon", "rain", "street"], sizeMb: 2.6, addedLabel: "Generated" },
  { id: "a_rooftop", name: "Rooftop_Sunset.png", kind: "image", duration: 5, src: "/flow/scene-rooftop.png", tags: ["rooftop", "sunset", "friends", "garden"], sizeMb: 2.3, addedLabel: "Generated" },
  { id: "a_night", name: "Light_Trails.png", kind: "image", duration: 6, src: "/flow/scene-night.png", tags: ["night", "light trails", "highway", "long exposure"], sizeMb: 2.5, addedLabel: "Generated" },
  { id: "a_vo_main", name: "Narration_Take3.wav", kind: "voice", duration: 24.5, tags: ["narration", "voice"], sizeMb: 4.2, addedLabel: "Recorded" },
  { id: "a_vo_alt", name: "Narration_Alt_Warm.wav", kind: "voice", duration: 22.1, tags: ["narration", "warm"], sizeMb: 3.8, addedLabel: "TTS" },
  { id: "a_music_pulse", name: "Urban_Pulse_120bpm.mp3", kind: "music", duration: 32, tags: ["upbeat", "electronic"], sizeMb: 5.1, addedLabel: "Library" },
  { id: "a_music_ambient", name: "Glass_Ambience.mp3", kind: "music", duration: 45, tags: ["ambient", "calm"], sizeMb: 6.8, addedLabel: "Library" },
  { id: "a_sfx_whoosh", name: "Whoosh_Transition.wav", kind: "sfx", duration: 1.2, tags: ["transition"], sizeMb: 0.3, addedLabel: "Library" },
  { id: "a_sfx_rain", name: "City_Rain_Loop.wav", kind: "sfx", duration: 6, tags: ["rain", "ambience"], sizeMb: 1.1, addedLabel: "Library" },
  { id: "a_sfx_bell", name: "Bike_Bell.wav", kind: "sfx", duration: 0.8, tags: ["bike"], sizeMb: 0.1, addedLabel: "Library" },
];

export const INITIAL_TRACKS: Track[] = [
  { id: "t_video", name: "Scenes", kind: "video", muted: false, solo: false, locked: false, volume: 1 },
  { id: "t_caption", name: "Captions", kind: "caption", muted: false, solo: false, locked: false, volume: 1 },
  { id: "t_voice", name: "Voice-over", kind: "voice", muted: false, solo: false, locked: false, volume: 0.9 },
  { id: "t_music", name: "Music", kind: "music", muted: false, solo: false, locked: false, volume: 0.55 },
  { id: "t_sfx", name: "SFX", kind: "sfx", muted: false, solo: false, locked: false, volume: 0.7 },
];
