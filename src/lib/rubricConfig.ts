// Rubric stamp color treatments configuration
// Edit this file to add/modify rubric categories and their color styling

export const stampColorTreatments = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700'
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700'
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700'
  },
  muted: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border'
  }
} as const;

// Map rubric text (lowercase) to color treatment
// Add new rubrics here with their desired color treatment
export const rubricColorMap: Record<string, keyof typeof stampColorTreatments> = {
  'background': 'blue',
  'main goal': 'blue',
  'main work': 'blue',
  'critical': 'red',
  'minor tip': 'amber',
  'tip': 'green',
  'note': 'green',
  'goal': 'purple',
  'goals': 'purple',
};

// Get the color classes for a rubric stamp
export function getStampColors(rubric: string): typeof stampColorTreatments[keyof typeof stampColorTreatments] {
  const normalizedRubric = rubric.toLowerCase().trim();
  const treatment = rubricColorMap[normalizedRubric] || 'muted';
  return stampColorTreatments[treatment];
}
