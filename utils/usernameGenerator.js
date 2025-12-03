const verbs = [
  "dwindling", "sparkling", "whispering", "roaring", "gleaming", "fading", "blooming", "crashing", "soaring", "whirling"
];

const nouns = [
  "officer", "explorer", "guardian", "warrior", "scholar", "artist", "pilot", "engineer", "adventurer", "dreamer"
];

export function randomUsername() {
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${verb}${noun}${randomNum}`;
}
