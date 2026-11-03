// Local fallback catalogue used when the Jamendo API key is missing or the
// request fails, so the Music feature always returns something useful.
// Tracks are examples of the shape returned by musicService — titles are
// illustrative fallback metadata, not licensed audio.
module.exports = {
  relax: [
    { title: 'Slow Tide', artist: 'Ambient Collective', category: 'relax', artwork: null, previewUrl: null },
    { title: 'Quiet Room', artist: 'Soft Focus', category: 'relax', artwork: null, previewUrl: null },
    { title: 'Evening Breath', artist: 'Nightflow', category: 'relax', artwork: null, previewUrl: null },
  ],
  happy: [
    { title: 'Sunny Steps', artist: 'Brightline', category: 'happy', artwork: null, previewUrl: null },
    { title: 'Good Day Groove', artist: 'Palm Radio', category: 'happy', artwork: null, previewUrl: null },
    { title: 'Light Feet', artist: 'Daybreakers', category: 'happy', artwork: null, previewUrl: null },
  ],
  focus: [
    { title: 'Deep Work', artist: 'Studytronic', category: 'focus', artwork: null, previewUrl: null },
    { title: 'Clear Mind', artist: 'Lo-Fi Labs', category: 'focus', artwork: null, previewUrl: null },
    { title: 'Steady State', artist: 'Focus Frame', category: 'focus', artwork: null, previewUrl: null },
  ],
  energy: [
    { title: 'Full Throttle', artist: 'Voltage', category: 'energy', artwork: null, previewUrl: null },
    { title: 'Move Now', artist: 'Pulse Drive', category: 'energy', artwork: null, previewUrl: null },
    { title: 'Rise Up', artist: 'Kinetic', category: 'energy', artwork: null, previewUrl: null },
  ],
  motivation: [
    { title: 'One More Step', artist: 'Forward Motion', category: 'motivation', artwork: null, previewUrl: null },
    { title: 'Rise & Grind', artist: 'Skyline Beats', category: 'motivation', artwork: null, previewUrl: null },
    { title: 'Push Through', artist: 'North Star', category: 'motivation', artwork: null, previewUrl: null },
  ],
  sleep: [
    { title: 'Gentle Static', artist: 'Nightwind', category: 'sleep', artwork: null, previewUrl: null },
    { title: 'Slow Waves', artist: 'Dreamlayer', category: 'sleep', artwork: null, previewUrl: null },
    { title: 'Last Light', artist: 'Hushtone', category: 'sleep', artwork: null, previewUrl: null },
  ],
  chill: [
    { title: 'Easy Afternoon', artist: 'Lounge Standard', category: 'chill', artwork: null, previewUrl: null },
    { title: 'Loose Ends', artist: 'Soft Static', category: 'chill', artwork: null, previewUrl: null },
    { title: 'Windows Down', artist: 'Driftwood', category: 'chill', artwork: null, previewUrl: null },
  ],
};
