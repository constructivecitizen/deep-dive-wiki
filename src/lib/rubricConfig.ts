// Rubric stamp color treatments configuration
// Edit this file to add/modify rubric categories and their color styling

export const stampColorTreatments = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
    line: "bg-blue-300 dark:bg-blue-700",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
    line: "bg-red-300 dark:bg-red-700",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    line: "bg-amber-300 dark:bg-amber-700",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-300 dark:border-green-700",
    line: "bg-green-300 dark:bg-green-700",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
    line: "bg-purple-300 dark:bg-purple-700",
  },
  muted: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    line: "bg-border",
  },
} as const;

// Map rubric text (lowercase) to color treatment
// Add new rubrics here with their desired color treatment
export const rubricColorMap: Record<string, keyof typeof stampColorTreatments> = {
  background: "blue",
  "main goal": "blue",
  "main work": "blue",
  critical: "blue",
  important: "blue",
  "minor tips": "blue",
  tips: "blue",
  note: "blue",
  goal: "blue",
  goals: "blue",
};

// Defines the display order of rubrics when grouping siblings
// Rubrics not in this list will appear after all listed rubrics, in document order
// Items without any rubric will appear last
export const rubricOrder: string[] = [
  "background",
  "main goal",
  "main work",
  "goals",
  "goal",
  "critical",
  "important",
  "tips",
  "note",
  "minor tips",
];

// Get the sort order index for a rubric (lower = earlier in display)
// Returns a high number for unknown rubrics so they sort after known ones
export function getRubricOrderIndex(rubric: string | null): number {
  if (rubric === null) {
    return Number.MAX_SAFE_INTEGER; // No rubric = show last
  }
  const normalizedRubric = rubric.toLowerCase().trim();
  const index = rubricOrder.indexOf(normalizedRubric);
  if (index === -1) {
    return rubricOrder.length; // Unknown rubrics appear after known ones
  }
  return index;
}

// Get the color classes for a rubric stamp
export function getStampColors(rubric: string): (typeof stampColorTreatments)[keyof typeof stampColorTreatments] {
  const normalizedRubric = rubric.toLowerCase().trim();
  const treatment = rubricColorMap[normalizedRubric] || "muted";
  return stampColorTreatments[treatment];
}
