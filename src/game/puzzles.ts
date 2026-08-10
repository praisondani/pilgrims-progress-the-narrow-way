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
  "humiliation:damaged-road": {
    type: "sequence",
    title: "Read the battlefield",
    instruction:
      "Preparation begins before danger speaks. Read the marks without surrendering to imagination.",
    options: ["Check the wind", "Trace the heavy prints", "Ready the shield"],
    solution: [1, 0, 2],
  },
  "humiliation:catalogue-failures": {
    type: "focus",
    title: "Facts without the false verdict",
    instruction:
      "Hold failure and mercy in view together. Do not deny either one.",
    target: 52,
    tolerance: 5,
    low: "Excuse every failure",
    high: "Let failure erase mercy",
  },
  "humiliation:raise-shield": {
    type: "sequence",
    title: "Stand under accusation",
    instruction:
      "Watch the attack, protect your ground, then answer when the noise has passed.",
    options: ["Raise the shield", "Listen for the strike", "Answer with truth"],
    solution: [1, 0, 2],
  },
  "humiliation:recover-sword": {
    type: "focus",
    title: "Reach from the ground",
    instruction:
      "Panic stretches the distance. Fix attention on the hilt and recover what was dropped.",
    target: 82,
    tolerance: 6,
    low: "Apollyon above",
    high: "Sword within reach",
  },
  "humiliation:final-resistance": {
    type: "sequence",
    title: "Persevere",
    instruction:
      "Courage is practiced through repeated defense, truth, and faithful advance.",
    options: ["Advance", "Answer", "Guard"],
    solution: [2, 1, 0, 2, 0],
  },
  "shadow:listen-wind": {
    type: "focus",
    title: "Hear the open path",
    instruction:
      "Separate the steady path-tone from the hollow ditch and sound-swallowing mire.",
    target: 41,
    tolerance: 5,
    low: "Hollow ditch",
    high: "Silent mire",
  },
  "shadow:ditch-crossing": {
    type: "sequence",
    title: "Follow the clean echo",
    instruction:
      "Test sound before weight where the path cannot be seen.",
    options: ["Tap the stone", "Step toward the short echo", "Call into the ditch"],
    solution: [0, 1, 0, 1],
  },
  "shadow:false-lanterns": {
    type: "sequence",
    title: "Reject the wandering lights",
    instruction:
      "A trustworthy light reveals the path; a false one keeps moving the destination.",
    options: ["Watch the path marker", "Chase the brightest glow", "Check the light against the wind"],
    solution: [2, 0],
  },
  "shadow:whispered-voice": {
    type: "focus",
    title: "Recover your own voice",
    instruction:
      "Speak the remembered prayer steadily until the intrusive whisper loses its rhythm.",
    target: 68,
    tolerance: 6,
    low: "Whispered suggestion",
    high: "Prayer spoken aloud",
  },
  "shadow:fire-mouth": {
    type: "sequence",
    title: "Cross between breaths",
    instruction:
      "Listen for the vent’s pattern and move during the safe interval.",
    options: ["Hear the intake", "Cross", "Wait through the flame"],
    solution: [2, 0, 1],
  },
  "shadow:narrowest-path": {
    type: "focus",
    title: "Balance ditch and mire",
    instruction:
      "Keep your weight centered where fear pulls toward both hazards.",
    target: 50,
    tolerance: 4,
    low: "Ditch",
    high: "Mire",
  },
  "faithful:adam-memory": {
    type: "sequence",
    title: "Read Adam’s contract",
    instruction:
      "Look beyond attractive wages to ownership, debt, and freedom to leave.",
    options: ["Read the inheritance", "Find the hidden debt", "Ask who owns the servant"],
    solution: [0, 1, 2],
  },
  "talkative:evidence-table": {
    type: "sequence",
    title: "Test speech by fruit",
    instruction:
      "Discern character without relying on charisma or rumor alone.",
    options: ["Observe repeated conduct", "Hear the claim", "Test response to correction"],
    solution: [1, 0, 2],
  },
  "vanity:public-disorder": {
    type: "sequence",
    title: "Protect people in the crowd",
    instruction:
      "Make space for the vulnerable before trying to defend your reputation.",
    options: ["Brace the cart", "Open a clear path", "Answer the accusation"],
    solution: [0, 1],
  },
  "vanity:witnesses-false": {
    type: "sequence",
    title: "Compare the witnesses",
    instruction:
      "Place the claims beside one another and identify what cannot both be true.",
    options: ["Mark shared hostility", "Separate claims from motives", "Compare contradictions"],
    solution: [1, 2, 0],
  },
  "vanity:faithful-witness": {
    type: "focus",
    title: "Keep watch without spectacle",
    instruction:
      "Honor Faithful’s witness without turning suffering into entertainment.",
    target: 36,
    tolerance: 6,
    low: "Look away entirely",
    high: "Consume the spectacle",
  },
  "vanity:christian-escape": {
    type: "sequence",
    title: "Leave the prison unseen",
    instruction:
      "Follow the help offered through the dispute without mistaking escape for superiority.",
    options: ["Wait for the guard turn", "Follow the marked passage", "Claim public victory"],
    solution: [0, 1],
  },
  "hopeful:companion-ledge": {
    type: "sequence",
    title: "Cross as companions",
    instruction:
      "Each traveler gives and receives help according to the obstacle.",
    options: ["Brace the ledge", "Offer a hand", "Steady the loose stone"],
    solution: [0, 1, 2],
  },
  "hopeful:carry-light": {
    type: "focus",
    title: "Share light and attention",
    instruction:
      "Let Hopeful hold the lamp where Christian can read the sealed roll clearly.",
    target: 63,
    tolerance: 5,
    low: "Marker in shadow",
    high: "Glare on the roll",
  },
  "byends:profit-question": {
    type: "sequence",
    title: "Separate work from leverage",
    instruction:
      "A good result does not justify reshaping conviction to obtain it.",
    options: ["Name the honest work", "Identify who rules the choice", "Measure the possible gain"],
    solution: [0, 2, 1],
  },
  "demas:inspect-shaft": {
    type: "focus",
    title: "Look beneath the silver",
    instruction:
      "Hold the glitter in view while bringing the fractured shaft edge into focus.",
    target: 28,
    tolerance: 5,
    low: "Fractured ledge",
    high: "Silver glare",
  },
  "demas:hidden-cost": {
    type: "sequence",
    title: "Trace the collapse",
    instruction:
      "Follow how one profitable removal transfers danger to everyone below.",
    options: ["Mark the support", "Trace the fault", "Remove the bright piece"],
    solution: [1, 0],
  },
  "bypath:rocky-road": {
    type: "focus",
    title: "Walk rough ground",
    instruction:
      "Choose a steady pace that protects the feet without abandoning the road.",
    target: 43,
    tolerance: 6,
    low: "Stop entirely",
    high: "Rush carelessly",
  },
  "bypath:meadow-view": {
    type: "sequence",
    title: "Compare more than the first mile",
    instruction:
      "Immediate softness cannot prove the meadow keeps the highway’s direction.",
    options: ["Check the distant fence", "Feel the first grass", "Trace the highway marker"],
    solution: [2, 0, 1],
  },
  "bypath:hidden-pit": {
    type: "sequence",
    title: "Stop before the unseen edge",
    instruction:
      "Vain-confidence’s speed is no substitute for testing the ground.",
    options: ["Probe the darkness", "Follow his lantern", "Brace Hopeful"],
    solution: [0, 2],
  },
  "bypath:storm-return": {
    type: "focus",
    title: "Find the fence through rain",
    instruction:
      "Listen for water striking wood rather than chasing every flash of lightning.",
    target: 71,
    tolerance: 6,
    low: "Flooded hollow",
    high: "Fence echo",
  },
  "doubting:wake-cell": {
    type: "sequence",
    title: "Inventory what remains",
    instruction:
      "Despair claims nothing remains. Account carefully before accepting its conclusion.",
    options: ["Find Hopeful", "Check the sealed roll", "Count the locked doors"],
    solution: [0, 1, 2],
  },
  "doubting:measure-days": {
    type: "focus",
    title: "Mark returning light",
    instruction:
      "Hold attention on the narrow window until gray distinguishes itself from endless dark.",
    target: 62,
    tolerance: 5,
    low: "Night’s claim",
    high: "Dawn’s change",
  },
  "doubting:prayer-night": {
    type: "focus",
    title: "Pray without forcing the hour",
    instruction:
      "Balance honest desire for release with endurance, memory, and attention.",
    target: 47,
    tolerance: 5,
    low: "Demand instant relief",
    high: "Stop asking entirely",
  },
  "doubting:remember-key": {
    type: "sequence",
    title: "Recover forgotten promise",
    instruction:
      "Search what Christian already carries before accepting that no key exists.",
    options: ["Feel the inner coat", "Rehearse the promise", "Search the empty straw"],
    solution: [1, 0],
  },
  "doubting:unlock-cell": {
    type: "sequence",
    title: "Open the castle locks",
    instruction:
      "Try promise practically, steady it together, and continue through resistance.",
    options: ["Fit the key", "Hopeful steadies it", "Turn through resistance"],
    solution: [0, 1, 2],
  },
  "doubting:courtyard-escape": {
    type: "sequence",
    title: "Cross the searching courtyard",
    instruction:
      "Move between the Giant’s steps and use shadow as cover without losing the outer gate.",
    options: ["Wait behind the buttress", "Cross to the gate", "Run toward the Giant"],
    solution: [0, 1, 0, 1],
  },
};
export const puzzleFor = (sceneId: string, stepId: string) =>
  puzzles[`${sceneId}:${stepId}`];

export const totalPuzzles = Object.keys(puzzles).length;
