export const ROADMAP_STAGES = [
  "Linux",
  "Networking",
  "AWS Cloud Practitioner",
  "AWS Deep Dive",
  "AWS Hands-on",
  "Git",
  "Bash/Python",
  "Docker",
  "CI/CD",
  "Advanced AWS",
  "Cloud Projects",
  "Interview Preparation",
];

// Determine based on an array of logged categories how far the user has reached.
// A roadmap stage is considered 'completed' if the user has logged hours on it and moved to the next.
// We just find the highest index stage the user has logged.
// Returns an object containing the current stage index and arrays of completed/remaining.
export function calculateJourneyProgress(logs) {
  let highestIndex = 0;
  let loggedTopics = new Set(logs.map(log => log.category));

  ROADMAP_STAGES.forEach((stage, idx) => {
    if (loggedTopics.has(stage)) {
        highestIndex = Math.max(highestIndex, idx);
    }
  });

  const isCompleted = highestIndex === ROADMAP_STAGES.length - 1 && logs.filter(l => l.category === ROADMAP_STAGES[highestIndex]).length > 2; 
  // naive check: if they logged the last one a few times, maybe they are completely done.
  // Actually, we can just say current is highestIndex.

  const completed = ROADMAP_STAGES.slice(0, highestIndex);
  const current = ROADMAP_STAGES[highestIndex];
  const next = ROADMAP_STAGES.slice(highestIndex + 1);

  const percentage = Math.round(((highestIndex) / (ROADMAP_STAGES.length - 1)) * 100) || 0;

  return {
    highestIndex,
    completed,
    current,
    next,
    percentage
  };
}
