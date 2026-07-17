export type SequencePuzzle = {
  type: "sequence";
  title: string;
  instruction: string;
  options: string[];
  solution: number[];
};
export type FocusPuzzle = {
  type: "focus";
  title: string;
  instruction: string;
  target: number;
  tolerance: number;
  low: string;
  high: string;
};
export type Puzzle = SequencePuzzle | FocusPuzzle;
export const puzzles: Record<string, Puzzle> = {
  "dream:lantern": {
    type: "sequence",
    title: "Kindle the lantern",
    instruction: "Protect the weak flame from the wilderness wind.",
    options: ["Cup the wick", "Strike the flint", "Open the lantern"],
    solution: [2, 0, 1],
  },
  "field:fragment-one": {
    type: "focus",
    title: "Keep the light in view",
    instruction:
      "Turn away from the City until the distant light becomes clear.",
    target: 72,
    tolerance: 8,
    low: "Looking back",
    high: "Looking ahead",
  },
  "slough:step-one": {
    type: "sequence",
    title: "Read the mire",
    instruction:
      "Panic makes Christian sink. Find firm ground through patient attention.",
    options: ["Observe the ripples", "Rush forward", "Test the pale stone"],
    solution: [0, 2],
  },
  "slough:board": {
    type: "sequence",
    title: "Bridge the deep mud",
    instruction: "Prepare the broken board before trusting your weight to it.",
    options: ["Brace the far end", "Test the depth", "Cross slowly"],
    solution: [1, 0, 2],
  },
  "worldly:falling-stone": {
    type: "sequence",
    title: "Shelter beneath Sinai",
    instruction:
      "The broad road is collapsing. Read the mountain before moving.",
    options: ["Wait for the tremor", "Run to the ledge", "Shield the burden"],
    solution: [0, 2, 1],
  },
  "gate:approach": {
    type: "sequence",
    title: "Cross under fire",
    instruction:
      "Advance between volleys instead of answering every accusing voice.",
    options: ["Listen for the lull", "Answer the voices", "Move to cover"],
    solution: [0, 2],
  },
  "interpreter:portrait": {
    type: "focus",
    title: "Reveal the portrait",
    instruction:
      "Aim the lamp until the guide’s face and the book in his hand are visible.",
    target: 64,
    tolerance: 6,
    low: "World behind",
    high: "Eyes toward heaven",
  },
  "interpreter:warrior": {
    type: "sequence",
    title: "Advance with courage",
    instruction: "Reach the palace by balancing defense and resolve.",
    options: ["Raise the shield", "Advance", "Turn back"],
    solution: [0, 1, 0, 1],
  },
  "cross:reach-cross": {
    type: "focus",
    title: "The final ascent",
    instruction:
      "Keep Christian’s attention on the Cross while the burden pulls backward.",
    target: 86,
    tolerance: 7,
    low: "Weight behind",
    high: "Cross ahead",
  },
  "wall:read-three-ways": {
    type: "sequence",
    title: "Read the divided road",
    instruction:
      "Compare each road with the name and direction of the highway before choosing.",
    options: [
      "Read where each side road ends",
      "Trace the highway marker",
      "Choose the level ground",
    ],
    solution: [1, 0],
  },
  "hill:waterfall-crossing": {
    type: "sequence",
    title: "Cross the wet ledge",
    instruction:
      "Water hides the safest footholds. Test the crossing before committing your weight.",
    options: [
      "Test the stone",
      "Secure your next handhold",
      "Rush through the spray",
    ],
    solution: [0, 1, 0, 1],
  },
  "hill:cliff-cairns": {
    type: "sequence",
    title: "Restore the cliff markers",
    instruction:
      "Rebuild the cairn from its stable foundation so later travelers can see the edge.",
    options: [
      "Set the broad stone",
      "Balance the marker",
      "Place the middle stone",
    ],
    solution: [0, 2, 1],
  },
  "arbor:return-arbor": {
    type: "focus",
    title: "Search the fading light",
    instruction:
      "Look beneath comfort rather than searching only the road ahead.",
    target: 34,
    tolerance: 6,
    low: "Path ahead",
    high: "Beneath the bench",
  },
  "lions:observe-lions": {
    type: "focus",
    title: "See the limits of danger",
    instruction:
      "Hold your gaze long enough to distinguish the lions from the chains restraining them.",
    target: 78,
    tolerance: 6,
    low: "Teeth and claws",
    high: "Chains and center line",
  },
  "palace:armory": {
    type: "sequence",
    title: "Prepare for the valleys",
    instruction:
      "Equip for steady movement, defense, and faithful action—not display.",
    options: ["Fasten the shoes", "Raise the shield", "Take the sword"],
    solution: [0, 1, 2],
  },
};
export const puzzleFor = (sceneId: string, stepId: string) =>
  puzzles[`${sceneId}:${stepId}`];
