export type StepKind =
  | "book"
  | "person"
  | "light"
  | "path"
  | "mud"
  | "gate"
  | "portrait"
  | "water"
  | "fire"
  | "armor"
  | "cage"
  | "cross"
  | "roll";
export type StoryChoice = { label: string; response: string[] };
export type StoryStep = {
  id: string;
  objective: string;
  action: string;
  kind: StepKind;
  position: [number, number];
  dialogue: string[];
  journal?: string;
  choices?: StoryChoice[];
  burden?: number;
  roll?: boolean;
  equipment?: string[];
};
export type StoryScene = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  meaning: string;
  palette: { sky: string; ground: string; light: string; fog: string };
  steps: StoryStep[];
};

export const storyScenes: StoryScene[] = [
  {
    id: "dream",
    number: "PROLOGUE",
    title: "The Dreamer",
    subtitle: "A wilderness. A book. The beginning of a dream.",
    meaning:
      "The journey is an allegory: visible places reveal invisible realities.",
    palette: {
      sky: "#111522",
      ground: "#29303a",
      light: "#9fb5d5",
      fog: "#151a27",
    },
    steps: [
      {
        id: "lantern",
        objective: "Find and light the abandoned lantern",
        action: "Light lantern",
        kind: "fire",
        position: [-5, -4],
        dialogue: [
          "NARRATOR: As I walked through the wilderness of this world, I came upon a certain place where there was a den.",
          "Night gathers around you. One small flame makes the path visible.",
        ],
        journal:
          "The Dream — This adventure is a dream whose places and people carry spiritual meaning.",
      },
      {
        id: "den",
        objective: "Explore the shelter in the rocks",
        action: "Enter the den",
        kind: "path",
        position: [5, -5],
        dialogue: [
          "The rough shelter offers little comfort, yet exhaustion is stronger than fear.",
          "You lie down to sleep—and the wilderness changes.",
        ],
      },
      {
        id: "dream-book",
        objective: "Inspect the book inside the dream",
        action: "Open the book",
        kind: "book",
        position: [-4, 5],
        dialogue: [
          "In the dream you see a man clothed in rags, standing with his face turned away from his own house.",
          "A book trembles in his hand. A great burden presses upon his back.",
        ],
      },
      {
        id: "become-christian",
        objective: "Step into Christian’s story",
        action: "Enter the dream",
        kind: "light",
        position: [4, 5],
        dialogue: [
          "NARRATOR: I looked, and saw him open the book and read therein.",
          "As he read, he wept and trembled. At last he cried out: “What shall I do?”",
        ],
      },
    ],
  },
  {
    id: "city",
    number: "CHAPTER I",
    title: "City of Destruction",
    subtitle: "Home is familiar. Truth has made it impossible to remain.",
    meaning:
      "The doomed city represents a life continuing without regard for judgment.",
    palette: {
      sky: "#21131d",
      ground: "#4a2828",
      light: "#d27b4d",
      fog: "#21131d",
    },
    steps: [
      {
        id: "read-warning",
        objective: "Read the troubling passage again",
        action: "Read the Book",
        kind: "book",
        position: [-5, -5],
        dialogue: [
          "CHRISTIAN: This book says our city will be burned with fire from heaven.",
          "The words do not feel like distant history. As Christian understands them, the burden takes shape.",
        ],
        journal:
          "The Burden — The visible weight represents Christian’s guilt and fear after understanding his condition.",
        burden: 1,
      },
      {
        id: "daily-work",
        objective: "Try to complete an ordinary household task",
        action: "Lift the wood",
        kind: "path",
        position: [5, -5],
        dialogue: [
          "The wood that was light yesterday now feels impossibly heavy.",
          "Every ordinary motion bends around the burden. Knowledge has changed Christian’s experience of home.",
        ],
      },
      {
        id: "family",
        objective: "Tell your family what you have read",
        action: "Speak with family",
        kind: "person",
        position: [-5, 4],
        dialogue: [
          "WIFE: You have not slept. Put the book away and come back to yourself.",
          "CHRISTIAN: I cannot pretend I did not read it. We are in danger—and I do not know the way of escape.",
        ],
        choices: [
          {
            label: "Speak with conviction",
            response: [
              "CHRISTIAN: I love you too much to hide what I believe is true.",
              "His family hears urgency, but cannot yet share his sight.",
            ],
          },
          {
            label: "Admit your fear",
            response: [
              "CHRISTIAN: I am afraid, and I wish the words had left me unchanged.",
              "Honesty softens his voice, though it does not remove the warning.",
            ],
          },
        ],
      },
      {
        id: "child",
        objective: "Comfort your frightened child",
        action: "Kneel and comfort",
        kind: "person",
        position: [4, 5],
        dialogue: [
          "CHRISTIAN: None of this is your fault. I am searching for the safe way.",
          "For a moment the burden feels heavier, because leaving costs something real.",
        ],
      },
      {
        id: "market",
        objective: "Pass through the city market",
        action: "Listen to townspeople",
        kind: "person",
        position: [-4, 0],
        dialogue: [
          "TOWNSMAN: Another prophecy? The walls stood yesterday. They will stand tomorrow.",
          "Laughter, bargaining, and noise cover the cracks spreading through the stone.",
        ],
      },
      {
        id: "evangelist-glimpse",
        objective: "Follow the figure beyond the city wall",
        action: "Approach the stranger",
        kind: "person",
        position: [5, 0],
        dialogue: [
          "A grave figure waits beyond the last house, holding a parchment.",
          "EVANGELIST: Why do you cry?",
        ],
      },
      {
        id: "leave-city",
        objective: "Choose whether to leave the City",
        action: "Cross the boundary",
        kind: "path",
        position: [0, -7],
        dialogue: [],
        choices: [
          {
            label: "Go forward",
            response: [
              "CHRISTIAN: Life—life—eternal life!",
              "He runs from the city, fingers in his ears against the voices calling him home.",
            ],
          },
          {
            label: "Look back once",
            response: [
              "Christian looks toward his home. Love remains, but the warning remains also.",
              "Then he turns toward the open field.",
            ],
          },
        ],
        journal:
          "City of Destruction — Familiarity can make danger feel harmless. Christian leaves because he trusts the warning.",
      },
    ],
  },
  {
    id: "field",
    number: "CHAPTER II",
    title: "The Shining Light",
    subtitle: "Conviction is tested by pressure, companionship, and direction.",
    meaning:
      "Evangelist gives faithful direction. Obstinate refuses it; Pliable receives it without roots.",
    palette: {
      sky: "#18233a",
      ground: "#35445a",
      light: "#e8c77b",
      fog: "#1a2538",
    },
    steps: [
      {
        id: "evangelist",
        objective: "Ask Evangelist where to go",
        action: "Speak with Evangelist",
        kind: "person",
        position: [0, -5],
        dialogue: [
          "CHRISTIAN: I know I must flee, but I do not know where.",
          "EVANGELIST: Do you see yonder Wicket Gate?",
          "CHRISTIAN: No.",
          "EVANGELIST: Do you see yonder shining light? Keep that light in your eye. Go directly toward it.",
        ],
        journal:
          "Evangelist — A faithful guide who points beyond himself toward the appointed way.",
      },
      {
        id: "obstinate",
        objective: "Answer Obstinate’s demand that you return",
        action: "Face Obstinate",
        kind: "person",
        position: [-5, 2],
        dialogue: [],
        choices: [
          {
            label: "Explain the promise",
            response: [
              "CHRISTIAN: I seek an inheritance incorruptible, kept safe for those who reach it.",
              "OBSTINATE: Dreams and foolish words. I am going home.",
            ],
          },
          {
            label: "Refuse the argument",
            response: [
              "CHRISTIAN: I cannot return merely because the road is hard to explain.",
              "Obstinate leaves angry, preferring certainty without examination.",
            ],
          },
        ],
      },
      {
        id: "pliable",
        objective: "Tell Pliable what you hope to find",
        action: "Speak with Pliable",
        kind: "person",
        position: [5, 3],
        dialogue: [
          "PLIABLE: What happiness do you expect at the end?",
          "Christian speaks of a kingdom without corruption, crowns that do not fade, and fellowship without grief.",
          "PLIABLE: Then let us mend our pace! The reward sounds wonderful.",
        ],
      },
      {
        id: "fragment-one",
        objective: "Recover the first fragment of guidance",
        action: "Take fragment",
        kind: "light",
        position: [-5, -5],
        dialogue: [
          "A word on the fragment reads: LOOK.",
          "The distant light sharpens when Christian stops watching the city behind him.",
        ],
      },
      {
        id: "fragment-two",
        objective: "Find the marker beside the narrow track",
        action: "Read marker",
        kind: "light",
        position: [5, -5],
        dialogue: [
          "The marker reads: KEEP THE LIGHT IN YOUR EYE.",
          "Pliable hurries ahead, more excited by reward than attentive to the road.",
        ],
      },
      {
        id: "marsh-edge",
        objective: "Inspect the unstable ground ahead",
        action: "Test the ground",
        kind: "mud",
        position: [0, 6],
        dialogue: [
          "The grass hides black water. Old steps lie buried beneath the mire.",
          "Before either traveler can retreat, the ground gives way.",
        ],
      },
    ],
  },
  {
    id: "slough",
    number: "CHAPTER III",
    title: "Slough of Despond",
    subtitle: "Fear turns the path beneath your feet into mire.",
    meaning:
      "Discouragement deepens when guilt, fear, and confusion are faced without steady guidance.",
    palette: {
      sky: "#17201e",
      ground: "#34412f",
      light: "#a8b984",
      fog: "#1b2722",
    },
    steps: [
      {
        id: "rise",
        objective: "Struggle back to your feet",
        action: "Push through the mud",
        kind: "mud",
        position: [-4, -4],
        dialogue: [
          "Mud closes around Christian’s knees. The burden drags backward.",
          "PLIABLE: Is this the happiness you promised me?",
        ],
      },
      {
        id: "pliable-return",
        objective: "Respond as Pliable turns back",
        action: "Call to Pliable",
        kind: "person",
        position: [5, -4],
        dialogue: [
          "PLIABLE: If I get out alive, you may possess your brave country alone!",
          "Freed of Christian’s burden, Pliable scrambles toward the City and disappears into the fog.",
        ],
      },
      {
        id: "step-one",
        objective: "Pause and locate the first firm step",
        action: "Stand on firm ground",
        kind: "path",
        position: [-5, 0],
        dialogue: [
          "Panic makes every direction look the same. Stillness reveals the edge of an old stone.",
          "These steps were placed here for travelers, but flood and neglect have hidden them.",
        ],
      },
      {
        id: "step-two",
        objective: "Cross using the buried stone",
        action: "Take careful step",
        kind: "path",
        position: [4, 1],
        dialogue: [
          "The stone holds. The next appears only from this angle.",
          "The burden sways, testing Christian’s balance.",
        ],
      },
      {
        id: "board",
        objective: "Place the abandoned board across deep mud",
        action: "Lay down board",
        kind: "path",
        position: [-4, 5],
        dialogue: [
          "A broken board makes a narrow bridge. It does not remove the mire; it gives a way through it.",
        ],
      },
      {
        id: "sink",
        objective: "Reach for the far bank",
        action: "Reach upward",
        kind: "mud",
        position: [5, 6],
        dialogue: [
          "The final bank collapses. Christian sinks to his chest.",
          "A hand reaches through the fog.",
        ],
      },
      {
        id: "help",
        objective: "Take Help’s hand",
        action: "Accept help",
        kind: "person",
        position: [0, -6],
        dialogue: [
          "HELP: Give me your hand.",
          "CHRISTIAN: Why is there such a slough in this path?",
          "HELP: Many fears and doubts settle here. The King’s laborers maintain steps, but burdened travelers do not always see them.",
          "Help pulls Christian onto firm ground.",
        ],
        journal:
          "Slough of Despond — The way out exists, but discouragement can conceal help already provided.",
      },
    ],
  },
  {
    id: "worldly",
    number: "CHAPTER IV",
    title: "The Easier Counsel",
    subtitle: "A respectable road bends toward a mountain that cannot save.",
    meaning:
      "Worldly Wiseman offers relief through reputation and self-reliance rather than transformation.",
    palette: {
      sky: "#3b3140",
      ground: "#665444",
      light: "#e0b177",
      fog: "#3a3038",
    },
    steps: [
      {
        id: "meet-worldly",
        objective: "Hear the gentleman at the crossroads",
        action: "Speak with Worldly Wiseman",
        kind: "person",
        position: [-4, -4],
        dialogue: [
          "WORLDLY WISEMAN: You look exhausted. Who advised you to carry that burden along such a dangerous road?",
          "He is calm, articulate, and dressed like a man whose advice is often obeyed.",
        ],
      },
      {
        id: "counsel",
        objective: "Consider Worldly Wiseman’s alternative",
        action: "Listen to counsel",
        kind: "person",
        position: [4, -3],
        dialogue: [],
        choices: [
          {
            label: "Ask about Morality",
            response: [
              "WORLDLY WISEMAN: In the pleasant village ahead lives Legality. He can teach you a respectable life and remove this scandalous burden.",
              "The road is wide, bright, and carefully maintained.",
            ],
          },
          {
            label: "Defend Evangelist",
            response: [
              "WORLDLY WISEMAN: Your Evangelist has sent you toward weariness and danger. I offer practical kindness.",
              "His concern sounds reasonable—and Christian is tired.",
            ],
          },
        ],
      },
      {
        id: "morality-road",
        objective: "Explore the road toward the Village of Morality",
        action: "Take the broad road",
        kind: "path",
        position: [-5, 4],
        dialogue: [
          "Clean houses gleam in the valley. No mud stains this road.",
          "Yet the shining light disappears behind the rising mountain.",
        ],
      },
      {
        id: "sinai",
        objective: "Approach the overhanging mountain",
        action: "Look up at Mount Sinai",
        kind: "path",
        position: [5, 5],
        dialogue: [
          "The mountain leans over Christian as if it will crush him. Fire breaks across its summit.",
          "Every command carved in the stone exposes another failure. None lifts the burden.",
        ],
      },
      {
        id: "falling-stone",
        objective: "Take shelter from the falling stone",
        action: "Shelter beneath ledge",
        kind: "path",
        position: [-5, -5],
        dialogue: [
          "Stone crashes across the broad road. The promise of easy relief has become terror.",
          "CHRISTIAN: I have left the appointed way. What have I done?",
        ],
      },
      {
        id: "evangelist-return",
        objective: "Confess your detour to Evangelist",
        action: "Speak with Evangelist",
        kind: "person",
        position: [5, -5],
        dialogue: [
          "EVANGELIST: What are you doing here, Christian?",
          "Christian cannot answer without shame.",
          "EVANGELIST: The counsel was dangerous—but the Gate is still open. Return to the light. Do not refuse mercy because you wandered.",
        ],
      },
      {
        id: "return",
        objective: "Return to the narrow path",
        action: "Leave the broad road",
        kind: "light",
        position: [0, 6],
        dialogue: [
          "Christian turns from Morality. The mountain recedes behind him.",
          "Far ahead, a small gate glows in the gathering dark.",
        ],
        journal:
          "Mount Sinai — The law exposes guilt but cannot remove Christian’s burden. The right response is not despair, but return.",
      },
    ],
  },
  {
    id: "gate",
    number: "CHAPTER V",
    title: "The Wicket Gate",
    subtitle: "A narrow entrance under fire. Mercy waits inside.",
    meaning:
      "The Gate marks entrance to the appointed way; Goodwill welcomes the one who truly knocks.",
    palette: {
      sky: "#111a2b",
      ground: "#39445a",
      light: "#ffc56e",
      fog: "#141d2c",
    },
    steps: [
      {
        id: "approach",
        objective: "Cross the exposed approach",
        action: "Run to the stone cover",
        kind: "path",
        position: [-5, -5],
        dialogue: [
          "Arrows strike the ground from a distant stronghold.",
          "Accusing voices follow each shot: “Too late. Too stained. Turn back.”",
        ],
      },
      {
        id: "second-cover",
        objective: "Advance when the arrows pause",
        action: "Cross to the gate wall",
        kind: "path",
        position: [5, -2],
        dialogue: [
          "The road narrows until only one traveler can approach at a time.",
          "Warm light shines beneath an old wooden door.",
        ],
      },
      {
        id: "inscription",
        objective: "Read the words above the gate",
        action: "Read inscription",
        kind: "book",
        position: [-3, 4],
        dialogue: [
          "Written above the door: KNOCK, AND IT SHALL BE OPENED UNTO YOU.",
          "Christian raises his hand.",
        ],
      },
      {
        id: "knock-one",
        objective: "Knock at the gate",
        action: "Knock once",
        kind: "gate",
        position: [3, 5],
        dialogue: [
          "The knock echoes. For a moment, nothing moves.",
          "Another arrow breaks against the stone beside Christian.",
        ],
      },
      {
        id: "knock-two",
        objective: "Knock again and call for mercy",
        action: "Knock again",
        kind: "gate",
        position: [-3, -4],
        dialogue: [
          "CHRISTIAN: May I enter? I am a burdened sinner from the City of Destruction!",
          "Bolts turn from within.",
        ],
      },
      {
        id: "goodwill",
        objective: "Take Goodwill’s hand",
        action: "Enter the gate",
        kind: "person",
        position: [4, -5],
        dialogue: [
          "Goodwill seizes Christian and pulls him through as arrows strike the door.",
          "GOODWILL: No one who truly knocks is refused entrance.",
          "Christian tells of the City, the Slough, and his detour toward Sinai.",
          "GOODWILL: The way ahead is straight and narrow. First, visit the Interpreter. He will show you excellent things.",
        ],
        journal:
          "Wicket Gate — Christian enters by asking for mercy, not by proving that his journey has been flawless.",
      },
    ],
  },
  {
    id: "interpreter",
    number: "CHAPTER VI",
    title: "The Interpreter’s House",
    subtitle: "Seven rooms prepare the pilgrim to understand the road.",
    meaning:
      "Spiritual realities are taught through images that Christian must observe, investigate, and remember.",
    palette: {
      sky: "#171222",
      ground: "#493c4e",
      light: "#e6aa60",
      fog: "#1b1524",
    },
    steps: [
      {
        id: "portrait",
        objective: "Aim the lamp toward the covered portrait",
        action: "Reveal the portrait",
        kind: "portrait",
        position: [-5, -5],
        dialogue: [
          "Light reveals a grave figure: eyes lifted toward heaven, truth in hand, the world behind him.",
          "INTERPRETER: This is the likeness of a faithful guide. Remember it; many voices will claim authority.",
        ],
        journal:
          "Portrait — A true guide looks toward heaven, carries truth, and does not make the traveler dependent on himself.",
      },
      {
        id: "parlor-sweep",
        objective: "Observe the dusty parlor being swept",
        action: "Watch the sweeping",
        kind: "path",
        position: [5, -4],
        dialogue: [
          "A servant sweeps vigorously. Dust fills the room until Christian can hardly breathe.",
          "INTERPRETER: The broom is the law. It reveals and stirs what was already here, but cannot cleanse the room.",
        ],
      },
      {
        id: "parlor-water",
        objective: "Bring water to the dusty parlor",
        action: "Sprinkle water",
        kind: "water",
        position: [-5, 0],
        dialogue: [
          "A maiden sprinkles water. The dust settles and the room becomes clean.",
          "INTERPRETER: The gospel reaches the heart with grace, doing what bare command could not.",
        ],
      },
      {
        id: "passion-patience",
        objective: "Observe Passion and Patience",
        action: "Wait and observe",
        kind: "person",
        position: [5, 1],
        dialogue: [
          "Passion demands his treasure now, then wastes it before the day is over.",
          "Patience receives nothing yet. Still, he remains peaceful.",
          "INTERPRETER: The good of this age fades. Patience waits for what cannot be taken away.",
        ],
      },
      {
        id: "fire-wall",
        objective: "Discover why the fire will not go out",
        action: "Look behind the wall",
        kind: "fire",
        position: [-5, 5],
        dialogue: [
          "Before the wall, an enemy pours water on the flame. Behind it, an unseen hand feeds oil into the fire.",
          "INTERPRETER: Grace may secretly sustain what visible opposition tries to extinguish.",
        ],
      },
      {
        id: "warrior",
        objective: "Take the symbolic armor and approach the palace",
        action: "Put on armor",
        kind: "armor",
        position: [5, 5],
        dialogue: [
          "Armed figures block a golden palace. A traveler writes down his name, puts on armor, and advances.",
          "The vision freezes at the moment courage becomes action.",
          "INTERPRETER: The way requires resolve—not confidence in strength, but willingness to persevere.",
        ],
      },
      {
        id: "cage",
        objective: "Speak with the man in the iron cage",
        action: "Approach the cage",
        kind: "cage",
        position: [-4, -5],
        dialogue: [
          "The man sits in darkness, speaking without hope.",
          "INTERPRETER: Do not treat truth lightly or cultivate despair. This room is a warning, not an invitation to abandon mercy.",
          "Christian leaves sober, refusing both presumption and hopelessness.",
        ],
      },
      {
        id: "troubled-dream",
        objective: "Walk through the final vision",
        action: "Enter the vision",
        kind: "light",
        position: [4, -4],
        dialogue: [
          "A man dreams of the sky darkening and a trumpet sounding. He wakes terrified that he is unprepared.",
          "INTERPRETER: Keep watch. Let urgency produce faithfulness, not paralysis.",
          "The house doors open. Beyond them, a road climbs toward a hill and a Cross.",
        ],
        journal:
          "Interpreter’s House — Seven visual lessons teach discernment, grace, patience, perseverance, warning, and readiness.",
      },
    ],
  },
  {
    id: "cross",
    number: "CHAPTER VII",
    title: "The Cross",
    subtitle: "The burden reaches the place where it can finally fall.",
    meaning:
      "Christian does not cut away his own burden. It is released at the Cross and disappears into the open grave.",
    palette: {
      sky: "#6fa0bf",
      ground: "#647a55",
      light: "#fff0ba",
      fog: "#91adc0",
    },
    steps: [
      {
        id: "hill-foot",
        objective: "Begin the final climb",
        action: "Climb the first rise",
        kind: "path",
        position: [-5, -5],
        dialogue: [
          "The path rises sharply. Each step pulls against the burden.",
          "Yet unlike Sinai, this hill does not threaten to crush Christian.",
        ],
      },
      {
        id: "hill-rest",
        objective: "Rise after the burden forces you down",
        action: "Stand again",
        kind: "path",
        position: [5, -2],
        dialogue: [
          "Christian falls to one knee. The Cross is now visible above him.",
          "He has no strength to remove the burden—only enough to continue carrying it toward that place.",
        ],
      },
      {
        id: "reach-cross",
        objective: "Approach the Cross",
        action: "Look upon the Cross",
        kind: "cross",
        position: [0, 5],
        dialogue: [
          "Christian reaches the crest and looks up.",
          "The straps around the burden loosen without his hand.",
        ],
        burden: 0,
      },
      {
        id: "burden-roll",
        objective: "Follow the burden as it rolls away",
        action: "Watch it fall",
        kind: "path",
        position: [-5, 2],
        dialogue: [
          "The burden tumbles down the hill, gathering speed.",
          "It falls into an open grave and is seen no more.",
          "CHRISTIAN: He has given me rest by his sorrow, and life by his death.",
        ],
      },
      {
        id: "new-clothing",
        objective: "Receive new clothing from the Shining Ones",
        action: "Receive clean garments",
        kind: "person",
        position: [5, 3],
        dialogue: [
          "FIRST SHINING ONE: Your sins are forgiven.",
          "The rags are replaced with clean clothing.",
          "SECOND SHINING ONE marks Christian as one belonging to the King.",
        ],
      },
      {
        id: "sealed-roll",
        objective: "Receive and examine the sealed roll",
        action: "Take the roll",
        kind: "roll",
        position: [-4, -4],
        dialogue: [
          "THIRD SHINING ONE: Keep this roll. Read it as you travel and present it at the Celestial Gate.",
          "The seal catches the morning light. This is testimony for the journey still ahead.",
        ],
        journal:
          "The Cross — Christian’s burden is removed through saving work outside himself. New clothing, a mark, and a sealed roll signify his changed standing.",
        roll: true,
      },
      {
        id: "overlook",
        objective: "Look across the road still ahead",
        action: "View the journey",
        kind: "light",
        position: [4, -5],
        dialogue: [
          "From the overlook Christian sees Hill Difficulty, Palace Beautiful, dark valleys, distant Vanity Fair, Doubting Castle, the Delectable Mountains, and light beyond a river.",
          "The road is far from finished—but Christian no longer walks beneath the old burden.",
          "The sealed roll rests near his heart as he starts down the hill.",
        ],
      },
    ],
  },
  {
    id: "sleepers",
    number: "CHAPTER VIII",
    title: "Three at the Roadside",
    subtitle: "Freedom cannot be forced upon those who will not wake.",
    meaning:
      "Simple, Sloth, and Presumption show three ways a warned traveler can remain bound: ignorance, delay, and false confidence.",
    palette: {
      sky: "#7f9eb2",
      ground: "#657955",
      light: "#f4d28a",
      fog: "#90a49c",
    },
    steps: [
      {
        id: "narrow-highway",
        objective: "Follow the raised highway beyond the Cross",
        action: "Step onto the highway",
        kind: "path",
        position: [0, -5],
        dialogue: [
          "A wall rises on either side of a narrow road laid out before Christian.",
          "His shoulders feel strange without the burden, but the sealed roll against his chest reminds him that freedom is a beginning, not an arrival.",
        ],
      },
      {
        id: "find-bonds",
        objective: "Inspect the chains beside the sleeping travelers",
        action: "Examine the bonds",
        kind: "path",
        position: [-4, -1],
        dialogue: [
          "Three men sleep beside the road with iron fetters around their ankles.",
          "The locks hang open. Nothing prevents them from standing except their refusal to wake.",
        ],
      },
      {
        id: "simple",
        objective: "Wake Simple and explain the danger",
        action: "Wake Simple",
        kind: "person",
        position: [-5, 4],
        dialogue: [
          "CHRISTIAN: Friend, danger is nearer than you understand. Your bonds are open—rise.",
          "SIMPLE: I see no danger. One road is much like another.",
          "He closes his eyes before Christian can point to the warning carved in the wall.",
        ],
        journal:
          "Simple — Ignorance is not safety. Simple refuses understanding even when truth is placed within reach.",
      },
      {
        id: "sloth",
        objective: "Urge Sloth to stand while daylight remains",
        action: "Wake Sloth",
        kind: "person",
        position: [0, 5],
        dialogue: [
          "CHRISTIAN: The sun is moving. Stand now, and I will help you onto the road.",
          "SLOTH: A little more sleep. I will rise when the danger feels urgent.",
          "His promise postpones obedience until the promised time disappears.",
        ],
        journal:
          "Sloth — Delay can become a decision. The open chain helps no one who will not rise.",
      },
      {
        id: "presumption",
        objective: "Challenge Presumption’s false confidence",
        action: "Wake Presumption",
        kind: "person",
        position: [5, 4],
        dialogue: [],
        choices: [
          {
            label: "Point to the open chain",
            response: [
              "CHRISTIAN: Freedom is offered, but you must wake and walk.",
              "PRESUMPTION: I have always expected a good end. Why trouble myself with watchfulness?",
            ],
          },
          {
            label: "Point to the narrow road",
            response: [
              "CHRISTIAN: Confidence is not the same as following the appointed road.",
              "PRESUMPTION: My confidence has carried me this far—though he has not moved at all.",
            ],
          },
        ],
        journal:
          "Presumption — Confidence without watchfulness mistakes expectation for faithfulness.",
      },
      {
        id: "leave-sleepers",
        objective: "Continue when the sleepers refuse help",
        action: "Return to the road",
        kind: "light",
        position: [0, -6],
        dialogue: [
          "Christian loosens every chain and leaves the warning within reach.",
          "He cannot make another person wake. He can remain compassionate without abandoning his own path.",
        ],
      },
    ],
  },
  {
    id: "wall",
    number: "CHAPTER IX",
    title: "Over the Wall",
    subtitle: "A shortcut can imitate the road without sharing its beginning.",
    meaning:
      "Formalist and Hypocrisy value appearance and custom while avoiding the Gate through which Christian entered.",
    palette: {
      sky: "#7895a7",
      ground: "#667a55",
      light: "#edcf87",
      fog: "#81988f",
    },
    steps: [
      {
        id: "wall-inscription",
        objective: "Read why the highway is enclosed by a wall",
        action: "Read the old stone",
        kind: "book",
        position: [-5, -4],
        dialogue: [
          "The inscription names the road Salvation and the wall protection, not imprisonment.",
          "A scraping sound comes from the field beyond it.",
        ],
      },
      {
        id: "formalist-arrives",
        objective: "Question the man climbing over the wall",
        action: "Speak with Formalist",
        kind: "person",
        position: [-4, 2],
        dialogue: [
          "FORMALIST: Our people have used this crossing for generations. A long custom should satisfy any gatekeeper.",
          "He dusts his fine coat and steps onto the highway as though entrance were a technicality.",
        ],
      },
      {
        id: "hypocrisy-arrives",
        objective: "Hear Hypocrisy defend the shortcut",
        action: "Speak with Hypocrisy",
        kind: "person",
        position: [4, 2],
        dialogue: [
          "HYPOCRISY: Once we walk beside you, who can tell how we entered?",
          "His clothes resemble a pilgrim’s, but he carries no roll and will not look back toward the Wicket Gate.",
        ],
      },
      {
        id: "discern-entry",
        objective: "Answer their claim that appearances are enough",
        action: "Make your answer",
        kind: "roll",
        position: [0, 5],
        dialogue: [],
        choices: [
          {
            label: "Show the sealed roll",
            response: [
              "CHRISTIAN: The King’s servants gave me this after I entered by the appointed way.",
              "FORMALIST: Paper and seals. We have respectable practice.",
            ],
          },
          {
            label: "Ask where their road began",
            response: [
              "CHRISTIAN: A path is known not only by where it lies, but by how one entered it.",
              "HYPOCRISY: Questions about beginnings are impolite among men who already look correct.",
            ],
          },
        ],
      },
      {
        id: "read-three-ways",
        objective: "Examine the sign where three roads divide",
        action: "Study the sign",
        kind: "book",
        position: [0, -1],
        dialogue: [
          "Three names have been cut into the post: DIFFICULTY, DANGER, and DESTRUCTION.",
          "Only the steep central way continues beneath the name of the highway.",
        ],
      },
      {
        id: "choose-difficulty",
        objective: "Keep to the steep road as the others turn aside",
        action: "Take the upward path",
        kind: "path",
        position: [0, -6],
        dialogue: [
          "Formalist chooses Danger because it looks level. Hypocrisy chooses Destruction because it bends downhill.",
          "Christian takes the path named Difficulty. The right road becomes steep, but it does not cease to be right.",
        ],
        journal:
          "Formalist and Hypocrisy — External resemblance cannot replace a true beginning or faithful direction.",
      },
    ],
  },
  {
    id: "hill",
    number: "CHAPTER X",
    title: "Hill Difficulty",
    subtitle: "Hardness is not proof that the road is wrong.",
    meaning:
      "Christian climbs the appointed way while easier roads conceal danger. Difficulty tests perseverance rather than direction.",
    palette: {
      sky: "#8299a8",
      ground: "#617052",
      light: "#f2d49a",
      fog: "#8d9a91",
    },
    steps: [
      {
        id: "hill-spring",
        objective: "Drink from the spring at the foot of the hill",
        action: "Drink and prepare",
        kind: "water",
        position: [-5, -5],
        dialogue: [
          "Cold water rises from the rock beside the true path.",
          "Christian drinks, secures the roll inside his coat, and studies the first ascent.",
        ],
      },
      {
        id: "lower-climb",
        objective: "Climb the first steep stone stair",
        action: "Begin climbing",
        kind: "path",
        position: [0, -2],
        dialogue: [
          "The stair rises almost directly above him. Without the burden he can breathe more freely, but the climb still demands effort.",
          "Behind him, the Cross remains visible in morning light.",
        ],
      },
      {
        id: "waterfall-crossing",
        objective: "Cross the wet ledge beside the waterfall",
        action: "Test each foothold",
        kind: "water",
        position: [5, 0],
        dialogue: [
          "Spray darkens the stones and hides their edges.",
          "Christian learns to place each foot before trusting his weight to it.",
        ],
      },
      {
        id: "weather-turn",
        objective: "Find shelter as the mountain weather changes",
        action: "Read the clouds",
        kind: "path",
        position: [-5, 2],
        dialogue: [
          "Clouds gather below the summit and swallow the view of the easier roads.",
          "The central path remains marked by worn steps and small cairns.",
        ],
      },
      {
        id: "cliff-cairns",
        objective: "Restore the fallen cairns along the cliff path",
        action: "Rebuild the markers",
        kind: "path",
        position: [4, 4],
        dialogue: [
          "Three stones return to their places, making the safe edge visible.",
          "The marker does not make the cliff less steep; it makes faithfulness possible.",
        ],
      },
      {
        id: "false-roads",
        objective: "Look down upon the ends of the easier roads",
        action: "Witness their end",
        kind: "light",
        position: [-4, 5],
        dialogue: [
          "Far below, one side road vanishes into a dark wood. The other ends above a broken ravine.",
          "No figures return from either way. Christian grieves, then turns toward the remaining climb.",
        ],
      },
      {
        id: "reach-arbor",
        objective: "Reach the shaded arbor near the summit",
        action: "Enter the shelter",
        kind: "gate",
        position: [0, 6],
        dialogue: [
          "A vine-covered shelter stands where the path briefly levels.",
          "A carved bench offers lawful rest before the last ascent.",
        ],
        journal:
          "Hill Difficulty — The appointed road may be demanding. Difficulty calls for perseverance, not suspicion of every hard path.",
      },
    ],
  },
  {
    id: "arbor",
    number: "CHAPTER XI",
    title: "The Lost Roll",
    subtitle: "Careless rest turns progress into costly return.",
    meaning:
      "The arbor is a gift misused. Christian’s sleep costs time, but honest backtracking restores what negligence lost.",
    palette: {
      sky: "#6e7890",
      ground: "#59654d",
      light: "#d9b77a",
      fog: "#747b7b",
    },
    steps: [
      {
        id: "arbor-seat",
        objective: "Sit within the shelter and review the journey",
        action: "Rest at the arbor",
        kind: "book",
        position: [0, -4],
        dialogue: [
          "Christian opens the sealed roll and reads until gratitude quiets his breathing.",
          "The shelter was built for rest, but comfort slowly becomes drowsiness.",
        ],
      },
      {
        id: "fall-asleep",
        objective: "Let the brief rest become an unintended sleep",
        action: "Close your eyes",
        kind: "path",
        position: [-4, 0],
        dialogue: [
          "The roll slips from Christian’s hand and settles beneath the bench.",
          "Sunlight moves across the floor while he sleeps beyond the rest he needed.",
        ],
        roll: false,
      },
      {
        id: "wake-late",
        objective: "Wake and hurry toward the summit gate",
        action: "Wake at the warning",
        kind: "light",
        position: [4, 1],
        dialogue: [
          "A distant voice cries, “Go to the ant, thou sluggard; consider her ways.”",
          "Christian wakes. The sun is already leaning west, and he leaves without checking beneath the bench.",
        ],
      },
      {
        id: "summit-check",
        objective: "Prepare the roll for the summit checkpoint",
        action: "Reach for the roll",
        kind: "roll",
        position: [0, 5],
        dialogue: [
          "Christian reaches inside his coat. The inner pocket is empty.",
          "The loss strikes harder than the climb: the roll was given freely, yet entrusted to his care.",
        ],
      },
      {
        id: "search-path",
        objective: "Search each place where the roll may have fallen",
        action: "Trace your steps",
        kind: "path",
        position: [5, -2],
        dialogue: [
          "He checks the wet ledge, the cairns, and every fold in the path.",
          "Daylight drains away while each mistaken search reminds him how costly carelessness can be.",
        ],
      },
      {
        id: "return-arbor",
        objective: "Backtrack fully to the arbor before darkness",
        action: "Search the shelter",
        kind: "gate",
        position: [-4, -4],
        dialogue: [
          "Christian returns to the place where he slept and kneels beside the bench.",
          "A faint line of gold shows beneath fallen leaves.",
        ],
      },
      {
        id: "recover-roll",
        objective: "Recover and secure the sealed roll",
        action: "Take the roll again",
        kind: "roll",
        position: [0, -5],
        dialogue: [
          "The seal is unbroken. Christian presses the roll to his chest with tears of relief.",
          "CHRISTIAN: How many sorrowful steps has one careless sleep required?",
          "He fastens the roll inside his coat and begins the climb again.",
        ],
        journal:
          "The Lost Roll — Grace is not permission for carelessness. Recovery may require humble return over ground already traveled.",
        roll: true,
      },
    ],
  },
  {
    id: "lions",
    number: "CHAPTER XII",
    title: "Lions in the Way",
    subtitle: "Fear reports what it sees; discernment asks what restrains it.",
    meaning:
      "Timorous and Mistrust retreat from a danger they have not examined. Christian advances and discovers the lions are chained.",
    palette: {
      sky: "#27334b",
      ground: "#4d5949",
      light: "#f0bd70",
      fog: "#343b48",
    },
    steps: [
      {
        id: "hear-running",
        objective: "Listen to the travelers running down the path",
        action: "Wait for the warning",
        kind: "path",
        position: [0, -5],
        dialogue: [
          "Two men stumble out of the dusk, looking behind them as they run.",
          "Their fear arrives before their explanation.",
        ],
      },
      {
        id: "timorous",
        objective: "Hear Timorous describe the lions ahead",
        action: "Question Timorous",
        kind: "person",
        position: [-4, -1],
        dialogue: [
          "TIMOROUS: We saw two lions in the path. Nothing beyond them can be worth such danger.",
          "He has measured their teeth from a distance but never looked for chains.",
        ],
      },
      {
        id: "mistrust",
        objective: "Answer Mistrust’s demand that you retreat",
        action: "Answer Mistrust",
        kind: "person",
        position: [4, -1],
        dialogue: [],
        choices: [
          {
            label: "Trust the marked path",
            response: [
              "CHRISTIAN: The path has carried me through danger before. I will not leave it because fear speaks first.",
              "MISTRUST: Then your confidence will be your death.",
            ],
          },
          {
            label: "Admit fear and continue",
            response: [
              "CHRISTIAN: I am afraid. Courage is not the absence of fear, but obedience while fear is present.",
              "MISTRUST shakes his head and follows Timorous downhill.",
            ],
          },
        ],
      },
      {
        id: "observe-lions",
        objective: "Approach slowly and observe both lions",
        action: "Study the danger",
        kind: "person",
        position: [0, 3],
        dialogue: [
          "Two lions roar from opposite sides of the narrow approach.",
          "Between their paws and the palace wall, iron chains glint whenever lightning breaks through the cloud.",
        ],
      },
      {
        id: "stay-center",
        objective: "Walk the center line beyond the reach of both chains",
        action: "Pass between the lions",
        kind: "path",
        position: [0, 6],
        dialogue: [
          "Christian keeps to the center. Claws strike the earth, but neither chain reaches the marked line.",
          "The danger was real. So was the provided way through it.",
        ],
      },
      {
        id: "watchful-call",
        objective: "Answer the porter calling from the palace",
        action: "Speak with Watchful",
        kind: "person",
        position: [0, -6],
        dialogue: [
          "WATCHFUL: Is your strength so small? Fear not the lions, for they are chained to test whether travelers keep the path.",
          "Warm windows glow beyond him. For the first time since the Cross, Christian sees a place prepared for fellowship.",
        ],
        journal:
          "Timorous and Mistrust — Fear may describe real danger while hiding the limits God has placed upon it.",
      },
    ],
  },
  {
    id: "palace",
    number: "CHAPTER XIII",
    title: "Palace Beautiful",
    subtitle:
      "Hospitality restores the pilgrim and fellowship prepares him for conflict.",
    meaning:
      "Palace Beautiful represents fellowship, teaching, hospitality, remembrance, and preparation for trials still ahead.",
    palette: {
      sky: "#26334f",
      ground: "#53624e",
      light: "#f5c97b",
      fog: "#35404d",
    },
    steps: [
      {
        id: "watchful-gate",
        objective: "Present yourself to Watchful at the palace gate",
        action: "Request lodging",
        kind: "gate",
        position: [0, -5],
        dialogue: [
          "WATCHFUL: From where have you come, and what do you seek?",
          "Christian tells of the City, the Gate, the Interpreter, the Cross, the lost roll, and the chained lions.",
          "Watchful calls for Discretion to examine the traveler.",
        ],
      },
      {
        id: "discretion",
        objective: "Answer Discretion’s questions truthfully",
        action: "Speak with Discretion",
        kind: "person",
        position: [-4, -2],
        dialogue: [],
        choices: [
          {
            label: "Tell the whole journey",
            response: [
              "CHRISTIAN: I have received mercy, wandered, been corrected, slept carelessly, and returned.",
              "DISCRETION: A truthful account is better than a polished disguise. Enter.",
            ],
          },
          {
            label: "Begin with the Cross",
            response: [
              "CHRISTIAN: Whatever else I tell, begin here: the burden I could not remove fell away at the Cross.",
              "DISCRETION: Then your failures need not be hidden, nor your progress credited to pride.",
            ],
          },
        ],
      },
      {
        id: "shared-meal",
        objective: "Join the household at the evening table",
        action: "Share the meal",
        kind: "path",
        position: [4, -1],
        dialogue: [
          "Bread, herbs, fruit, and warm broth cover the long table.",
          "No one asks Christian to earn his seat. Hospitality makes room before instruction begins.",
        ],
      },
      {
        id: "prudence",
        objective: "Tell Prudence how the journey changed your desires",
        action: "Speak with Prudence",
        kind: "person",
        position: [-5, 2],
        dialogue: [
          "PRUDENCE: Do you still think of the country from which you came?",
          "CHRISTIAN: I remember those I love, but I do not desire the life that kept us asleep.",
          "PRUDENCE: Then keep watch over memory: love may call you backward unless truth gives it direction.",
        ],
      },
      {
        id: "piety",
        objective: "Recount the turning points of the road for Piety",
        action: "Speak with Piety",
        kind: "person",
        position: [0, 3],
        dialogue: [
          "Piety listens as Christian describes Evangelist, the Slough, Goodwill, the Interpreter, and the Cross.",
          "PIETY: Rehearsing mercy strengthens memory before darker roads try to rewrite it.",
        ],
      },
      {
        id: "charity",
        objective: "Speak with Charity about the family left behind",
        action: "Speak with Charity",
        kind: "person",
        position: [5, 2],
        dialogue: [
          "CHARITY: Did you speak to your family before you left?",
          "CHRISTIAN: I warned them with tears. I could not make them see what I had seen.",
          "CHARITY: Keep love free from bitterness. Faithfulness does not require you to stop caring for those who refused the road.",
        ],
      },
      {
        id: "records",
        objective: "Explore the library of pilgrims who came before",
        action: "Study the records",
        kind: "book",
        position: [-4, 5],
        dialogue: [
          "The records tell of travelers sustained through floods, fire, weakness, and long delay.",
          "Christian’s road is personal, but it is not unprecedented. A great company has walked by promise.",
        ],
        journal:
          "Palace Records — Remembering faithful travelers gives perspective: Christian’s road is difficult, but he does not walk alone.",
      },
      {
        id: "armory",
        objective: "Receive equipment prepared for the road ahead",
        action: "Equip the armor",
        kind: "armor",
        position: [4, 5],
        dialogue: [
          "Watchful lays out a sword, shield, helmet, breastplate, and sturdy shoes.",
          "WATCHFUL: These are not ornaments. The valleys ahead will test whether truth remembered can become courage practiced.",
          "Christian fastens each piece and feels its weight settle into balance.",
        ],
        journal:
          "Palace Armory — Spiritual preparation is given for service and endurance, not display.",
        equipment: ["sword", "shield", "helmet", "breastplate", "shoes"],
      },
      {
        id: "peaceful-rest",
        objective: "Rest in the chamber named Peace",
        action: "Sleep until morning",
        kind: "light",
        position: [0, 6],
        dialogue: [
          "The chamber window faces east. Christian places the sealed roll beside his hand and sleeps without losing it.",
          "At dawn, the household gathers to bless his descent toward the Valley of Humiliation.",
          "He leaves rested, remembered, and equipped—yet still dependent upon the King who provided every gift.",
        ],
        journal:
          "Palace Beautiful — Fellowship offers rest, truth, loving examination, shared memory, and preparation for the road ahead.",
      },
    ],
  },
];

export const totalStoryBeats = storyScenes.reduce(
  (sum, scene) => sum + scene.steps.length,
  0,
);
