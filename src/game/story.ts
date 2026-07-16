export type StepKind = 'book' | 'person' | 'light' | 'path' | 'mud' | 'gate' | 'portrait' | 'water' | 'fire' | 'armor' | 'cage' | 'cross' | 'roll'
export type StoryChoice = { label: string; response: string[] }
export type StoryStep = {
  id: string; objective: string; action: string; kind: StepKind; position: [number, number]
  dialogue: string[]; journal?: string; choices?: StoryChoice[]; burden?: number
}
export type StoryScene = {
  id: string; number: string; title: string; subtitle: string; meaning: string
  palette: { sky: string; ground: string; light: string; fog: string }
  steps: StoryStep[]
}

export const storyScenes: StoryScene[] = [
  {
    id: 'dream', number: 'PROLOGUE', title: 'The Dreamer', subtitle: 'A wilderness. A book. The beginning of a dream.',
    meaning: 'The journey is an allegory: visible places reveal invisible realities.',
    palette: { sky: '#111522', ground: '#29303a', light: '#9fb5d5', fog: '#151a27' },
    steps: [
      { id: 'lantern', objective: 'Find and light the abandoned lantern', action: 'Light lantern', kind: 'fire', position: [-5, -4], dialogue: ['NARRATOR: As I walked through the wilderness of this world, I came upon a certain place where there was a den.', 'Night gathers around you. One small flame makes the path visible.'], journal: 'The Dream — This adventure is a dream whose places and people carry spiritual meaning.' },
      { id: 'den', objective: 'Explore the shelter in the rocks', action: 'Enter the den', kind: 'path', position: [5, -5], dialogue: ['The rough shelter offers little comfort, yet exhaustion is stronger than fear.', 'You lie down to sleep—and the wilderness changes.'] },
      { id: 'dream-book', objective: 'Inspect the book inside the dream', action: 'Open the book', kind: 'book', position: [-4, 5], dialogue: ['In the dream you see a man clothed in rags, standing with his face turned away from his own house.', 'A book trembles in his hand. A great burden presses upon his back.'] },
      { id: 'become-christian', objective: 'Step into Christian’s story', action: 'Enter the dream', kind: 'light', position: [4, 5], dialogue: ['NARRATOR: I looked, and saw him open the book and read therein.', 'As he read, he wept and trembled. At last he cried out: “What shall I do?”'] },
    ],
  },
  {
    id: 'city', number: 'CHAPTER I', title: 'City of Destruction', subtitle: 'Home is familiar. Truth has made it impossible to remain.',
    meaning: 'The doomed city represents a life continuing without regard for judgment.',
    palette: { sky: '#21131d', ground: '#4a2828', light: '#d27b4d', fog: '#21131d' },
    steps: [
      { id: 'read-warning', objective: 'Read the troubling passage again', action: 'Read the Book', kind: 'book', position: [-5, -5], dialogue: ['CHRISTIAN: This book says our city will be burned with fire from heaven.', 'The words do not feel like distant history. As Christian understands them, the burden takes shape.'], journal: 'The Burden — The visible weight represents Christian’s guilt and fear after understanding his condition.', burden: 1 },
      { id: 'daily-work', objective: 'Try to complete an ordinary household task', action: 'Lift the wood', kind: 'path', position: [5, -5], dialogue: ['The wood that was light yesterday now feels impossibly heavy.', 'Every ordinary motion bends around the burden. Knowledge has changed Christian’s experience of home.'] },
      { id: 'family', objective: 'Tell your family what you have read', action: 'Speak with family', kind: 'person', position: [-5, 4], dialogue: ['WIFE: You have not slept. Put the book away and come back to yourself.', 'CHRISTIAN: I cannot pretend I did not read it. We are in danger—and I do not know the way of escape.'], choices: [{ label: 'Speak with conviction', response: ['CHRISTIAN: I love you too much to hide what I believe is true.', 'His family hears urgency, but cannot yet share his sight.'] }, { label: 'Admit your fear', response: ['CHRISTIAN: I am afraid, and I wish the words had left me unchanged.', 'Honesty softens his voice, though it does not remove the warning.'] }] },
      { id: 'child', objective: 'Comfort your frightened child', action: 'Kneel and comfort', kind: 'person', position: [4, 5], dialogue: ['CHRISTIAN: None of this is your fault. I am searching for the safe way.', 'For a moment the burden feels heavier, because leaving costs something real.'] },
      { id: 'market', objective: 'Pass through the city market', action: 'Listen to townspeople', kind: 'person', position: [-4, 0], dialogue: ['TOWNSMAN: Another prophecy? The walls stood yesterday. They will stand tomorrow.', 'Laughter, bargaining, and noise cover the cracks spreading through the stone.'] },
      { id: 'evangelist-glimpse', objective: 'Follow the figure beyond the city wall', action: 'Approach the stranger', kind: 'person', position: [5, 0], dialogue: ['A grave figure waits beyond the last house, holding a parchment.', 'EVANGELIST: Why do you cry?'] },
      { id: 'leave-city', objective: 'Choose whether to leave the City', action: 'Cross the boundary', kind: 'path', position: [0, -7], dialogue: [], choices: [{ label: 'Go forward', response: ['CHRISTIAN: Life—life—eternal life!', 'He runs from the city, fingers in his ears against the voices calling him home.'] }, { label: 'Look back once', response: ['Christian looks toward his home. Love remains, but the warning remains also.', 'Then he turns toward the open field.'] }], journal: 'City of Destruction — Familiarity can make danger feel harmless. Christian leaves because he trusts the warning.' },
    ],
  },
  {
    id: 'field', number: 'CHAPTER II', title: 'The Shining Light', subtitle: 'Conviction is tested by pressure, companionship, and direction.',
    meaning: 'Evangelist gives faithful direction. Obstinate refuses it; Pliable receives it without roots.',
    palette: { sky: '#18233a', ground: '#35445a', light: '#e8c77b', fog: '#1a2538' },
    steps: [
      { id: 'evangelist', objective: 'Ask Evangelist where to go', action: 'Speak with Evangelist', kind: 'person', position: [0, -5], dialogue: ['CHRISTIAN: I know I must flee, but I do not know where.', 'EVANGELIST: Do you see yonder Wicket Gate?', 'CHRISTIAN: No.', 'EVANGELIST: Do you see yonder shining light? Keep that light in your eye. Go directly toward it.'], journal: 'Evangelist — A faithful guide who points beyond himself toward the appointed way.' },
      { id: 'obstinate', objective: 'Answer Obstinate’s demand that you return', action: 'Face Obstinate', kind: 'person', position: [-5, 2], dialogue: [], choices: [{ label: 'Explain the promise', response: ['CHRISTIAN: I seek an inheritance incorruptible, kept safe for those who reach it.', 'OBSTINATE: Dreams and foolish words. I am going home.'] }, { label: 'Refuse the argument', response: ['CHRISTIAN: I cannot return merely because the road is hard to explain.', 'Obstinate leaves angry, preferring certainty without examination.'] }] },
      { id: 'pliable', objective: 'Tell Pliable what you hope to find', action: 'Speak with Pliable', kind: 'person', position: [5, 3], dialogue: ['PLIABLE: What happiness do you expect at the end?', 'Christian speaks of a kingdom without corruption, crowns that do not fade, and fellowship without grief.', 'PLIABLE: Then let us mend our pace! The reward sounds wonderful.'] },
      { id: 'fragment-one', objective: 'Recover the first fragment of guidance', action: 'Take fragment', kind: 'light', position: [-5, -5], dialogue: ['A word on the fragment reads: LOOK.', 'The distant light sharpens when Christian stops watching the city behind him.'] },
      { id: 'fragment-two', objective: 'Find the marker beside the narrow track', action: 'Read marker', kind: 'light', position: [5, -5], dialogue: ['The marker reads: KEEP THE LIGHT IN YOUR EYE.', 'Pliable hurries ahead, more excited by reward than attentive to the road.'] },
      { id: 'marsh-edge', objective: 'Inspect the unstable ground ahead', action: 'Test the ground', kind: 'mud', position: [0, 6], dialogue: ['The grass hides black water. Old steps lie buried beneath the mire.', 'Before either traveler can retreat, the ground gives way.'] },
    ],
  },
  {
    id: 'slough', number: 'CHAPTER III', title: 'Slough of Despond', subtitle: 'Fear turns the path beneath your feet into mire.',
    meaning: 'Discouragement deepens when guilt, fear, and confusion are faced without steady guidance.',
    palette: { sky: '#17201e', ground: '#34412f', light: '#a8b984', fog: '#1b2722' },
    steps: [
      { id: 'rise', objective: 'Struggle back to your feet', action: 'Push through the mud', kind: 'mud', position: [-4, -4], dialogue: ['Mud closes around Christian’s knees. The burden drags backward.', 'PLIABLE: Is this the happiness you promised me?'] },
      { id: 'pliable-return', objective: 'Respond as Pliable turns back', action: 'Call to Pliable', kind: 'person', position: [5, -4], dialogue: ['PLIABLE: If I get out alive, you may possess your brave country alone!', 'Freed of Christian’s burden, Pliable scrambles toward the City and disappears into the fog.'] },
      { id: 'step-one', objective: 'Pause and locate the first firm step', action: 'Stand on firm ground', kind: 'path', position: [-5, 0], dialogue: ['Panic makes every direction look the same. Stillness reveals the edge of an old stone.', 'These steps were placed here for travelers, but flood and neglect have hidden them.'] },
      { id: 'step-two', objective: 'Cross using the buried stone', action: 'Take careful step', kind: 'path', position: [4, 1], dialogue: ['The stone holds. The next appears only from this angle.', 'The burden sways, testing Christian’s balance.'] },
      { id: 'board', objective: 'Place the abandoned board across deep mud', action: 'Lay down board', kind: 'path', position: [-4, 5], dialogue: ['A broken board makes a narrow bridge. It does not remove the mire; it gives a way through it.'] },
      { id: 'sink', objective: 'Reach for the far bank', action: 'Reach upward', kind: 'mud', position: [5, 6], dialogue: ['The final bank collapses. Christian sinks to his chest.', 'A hand reaches through the fog.'] },
      { id: 'help', objective: 'Take Help’s hand', action: 'Accept help', kind: 'person', position: [0, -6], dialogue: ['HELP: Give me your hand.', 'CHRISTIAN: Why is there such a slough in this path?', 'HELP: Many fears and doubts settle here. The King’s laborers maintain steps, but burdened travelers do not always see them.', 'Help pulls Christian onto firm ground.'], journal: 'Slough of Despond — The way out exists, but discouragement can conceal help already provided.' },
    ],
  },
  {
    id: 'worldly', number: 'CHAPTER IV', title: 'The Easier Counsel', subtitle: 'A respectable road bends toward a mountain that cannot save.',
    meaning: 'Worldly Wiseman offers relief through reputation and self-reliance rather than transformation.',
    palette: { sky: '#3b3140', ground: '#665444', light: '#e0b177', fog: '#3a3038' },
    steps: [
      { id: 'meet-worldly', objective: 'Hear the gentleman at the crossroads', action: 'Speak with Worldly Wiseman', kind: 'person', position: [-4, -4], dialogue: ['WORLDLY WISEMAN: You look exhausted. Who advised you to carry that burden along such a dangerous road?', 'He is calm, articulate, and dressed like a man whose advice is often obeyed.'] },
      { id: 'counsel', objective: 'Consider Worldly Wiseman’s alternative', action: 'Listen to counsel', kind: 'person', position: [4, -3], dialogue: [], choices: [{ label: 'Ask about Morality', response: ['WORLDLY WISEMAN: In the pleasant village ahead lives Legality. He can teach you a respectable life and remove this scandalous burden.', 'The road is wide, bright, and carefully maintained.'] }, { label: 'Defend Evangelist', response: ['WORLDLY WISEMAN: Your Evangelist has sent you toward weariness and danger. I offer practical kindness.', 'His concern sounds reasonable—and Christian is tired.'] }] },
      { id: 'morality-road', objective: 'Explore the road toward the Village of Morality', action: 'Take the broad road', kind: 'path', position: [-5, 4], dialogue: ['Clean houses gleam in the valley. No mud stains this road.', 'Yet the shining light disappears behind the rising mountain.'] },
      { id: 'sinai', objective: 'Approach the overhanging mountain', action: 'Look up at Mount Sinai', kind: 'path', position: [5, 5], dialogue: ['The mountain leans over Christian as if it will crush him. Fire breaks across its summit.', 'Every command carved in the stone exposes another failure. None lifts the burden.'] },
      { id: 'falling-stone', objective: 'Take shelter from the falling stone', action: 'Shelter beneath ledge', kind: 'path', position: [-5, -5], dialogue: ['Stone crashes across the broad road. The promise of easy relief has become terror.', 'CHRISTIAN: I have left the appointed way. What have I done?'] },
      { id: 'evangelist-return', objective: 'Confess your detour to Evangelist', action: 'Speak with Evangelist', kind: 'person', position: [5, -5], dialogue: ['EVANGELIST: What are you doing here, Christian?', 'Christian cannot answer without shame.', 'EVANGELIST: The counsel was dangerous—but the Gate is still open. Return to the light. Do not refuse mercy because you wandered.'] },
      { id: 'return', objective: 'Return to the narrow path', action: 'Leave the broad road', kind: 'light', position: [0, 6], dialogue: ['Christian turns from Morality. The mountain recedes behind him.', 'Far ahead, a small gate glows in the gathering dark.'], journal: 'Mount Sinai — The law exposes guilt but cannot remove Christian’s burden. The right response is not despair, but return.' },
    ],
  },
  {
    id: 'gate', number: 'CHAPTER V', title: 'The Wicket Gate', subtitle: 'A narrow entrance under fire. Mercy waits inside.',
    meaning: 'The Gate marks entrance to the appointed way; Goodwill welcomes the one who truly knocks.',
    palette: { sky: '#111a2b', ground: '#39445a', light: '#ffc56e', fog: '#141d2c' },
    steps: [
      { id: 'approach', objective: 'Cross the exposed approach', action: 'Run to the stone cover', kind: 'path', position: [-5, -5], dialogue: ['Arrows strike the ground from a distant stronghold.', 'Accusing voices follow each shot: “Too late. Too stained. Turn back.”'] },
      { id: 'second-cover', objective: 'Advance when the arrows pause', action: 'Cross to the gate wall', kind: 'path', position: [5, -2], dialogue: ['The road narrows until only one traveler can approach at a time.', 'Warm light shines beneath an old wooden door.'] },
      { id: 'inscription', objective: 'Read the words above the gate', action: 'Read inscription', kind: 'book', position: [-3, 4], dialogue: ['Written above the door: KNOCK, AND IT SHALL BE OPENED UNTO YOU.', 'Christian raises his hand.'] },
      { id: 'knock-one', objective: 'Knock at the gate', action: 'Knock once', kind: 'gate', position: [3, 5], dialogue: ['The knock echoes. For a moment, nothing moves.', 'Another arrow breaks against the stone beside Christian.'] },
      { id: 'knock-two', objective: 'Knock again and call for mercy', action: 'Knock again', kind: 'gate', position: [-3, -4], dialogue: ['CHRISTIAN: May I enter? I am a burdened sinner from the City of Destruction!', 'Bolts turn from within.'] },
      { id: 'goodwill', objective: 'Take Goodwill’s hand', action: 'Enter the gate', kind: 'person', position: [4, -5], dialogue: ['Goodwill seizes Christian and pulls him through as arrows strike the door.', 'GOODWILL: No one who truly knocks is refused entrance.', 'Christian tells of the City, the Slough, and his detour toward Sinai.', 'GOODWILL: The way ahead is straight and narrow. First, visit the Interpreter. He will show you excellent things.'], journal: 'Wicket Gate — Christian enters by asking for mercy, not by proving that his journey has been flawless.' },
    ],
  },
  {
    id: 'interpreter', number: 'CHAPTER VI', title: 'The Interpreter’s House', subtitle: 'Seven rooms prepare the pilgrim to understand the road.',
    meaning: 'Spiritual realities are taught through images that Christian must observe, investigate, and remember.',
    palette: { sky: '#171222', ground: '#493c4e', light: '#e6aa60', fog: '#1b1524' },
    steps: [
      { id: 'portrait', objective: 'Aim the lamp toward the covered portrait', action: 'Reveal the portrait', kind: 'portrait', position: [-5, -5], dialogue: ['Light reveals a grave figure: eyes lifted toward heaven, truth in hand, the world behind him.', 'INTERPRETER: This is the likeness of a faithful guide. Remember it; many voices will claim authority.'], journal: 'Portrait — A true guide looks toward heaven, carries truth, and does not make the traveler dependent on himself.' },
      { id: 'parlor-sweep', objective: 'Observe the dusty parlor being swept', action: 'Watch the sweeping', kind: 'path', position: [5, -4], dialogue: ['A servant sweeps vigorously. Dust fills the room until Christian can hardly breathe.', 'INTERPRETER: The broom is the law. It reveals and stirs what was already here, but cannot cleanse the room.'] },
      { id: 'parlor-water', objective: 'Bring water to the dusty parlor', action: 'Sprinkle water', kind: 'water', position: [-5, 0], dialogue: ['A maiden sprinkles water. The dust settles and the room becomes clean.', 'INTERPRETER: The gospel reaches the heart with grace, doing what bare command could not.'] },
      { id: 'passion-patience', objective: 'Observe Passion and Patience', action: 'Wait and observe', kind: 'person', position: [5, 1], dialogue: ['Passion demands his treasure now, then wastes it before the day is over.', 'Patience receives nothing yet. Still, he remains peaceful.', 'INTERPRETER: The good of this age fades. Patience waits for what cannot be taken away.'] },
      { id: 'fire-wall', objective: 'Discover why the fire will not go out', action: 'Look behind the wall', kind: 'fire', position: [-5, 5], dialogue: ['Before the wall, an enemy pours water on the flame. Behind it, an unseen hand feeds oil into the fire.', 'INTERPRETER: Grace may secretly sustain what visible opposition tries to extinguish.'] },
      { id: 'warrior', objective: 'Take the symbolic armor and approach the palace', action: 'Put on armor', kind: 'armor', position: [5, 5], dialogue: ['Armed figures block a golden palace. A traveler writes down his name, puts on armor, and advances.', 'The vision freezes at the moment courage becomes action.', 'INTERPRETER: The way requires resolve—not confidence in strength, but willingness to persevere.'] },
      { id: 'cage', objective: 'Speak with the man in the iron cage', action: 'Approach the cage', kind: 'cage', position: [-4, -5], dialogue: ['The man sits in darkness, speaking without hope.', 'INTERPRETER: Do not treat truth lightly or cultivate despair. This room is a warning, not an invitation to abandon mercy.', 'Christian leaves sober, refusing both presumption and hopelessness.'] },
      { id: 'troubled-dream', objective: 'Walk through the final vision', action: 'Enter the vision', kind: 'light', position: [4, -4], dialogue: ['A man dreams of the sky darkening and a trumpet sounding. He wakes terrified that he is unprepared.', 'INTERPRETER: Keep watch. Let urgency produce faithfulness, not paralysis.', 'The house doors open. Beyond them, a road climbs toward a hill and a Cross.'], journal: 'Interpreter’s House — Seven visual lessons teach discernment, grace, patience, perseverance, warning, and readiness.' },
    ],
  },
  {
    id: 'cross', number: 'CHAPTER VII', title: 'The Cross', subtitle: 'The burden reaches the place where it can finally fall.',
    meaning: 'Christian does not cut away his own burden. It is released at the Cross and disappears into the open grave.',
    palette: { sky: '#6fa0bf', ground: '#647a55', light: '#fff0ba', fog: '#91adc0' },
    steps: [
      { id: 'hill-foot', objective: 'Begin the final climb', action: 'Climb the first rise', kind: 'path', position: [-5, -5], dialogue: ['The path rises sharply. Each step pulls against the burden.', 'Yet unlike Sinai, this hill does not threaten to crush Christian.'] },
      { id: 'hill-rest', objective: 'Rise after the burden forces you down', action: 'Stand again', kind: 'path', position: [5, -2], dialogue: ['Christian falls to one knee. The Cross is now visible above him.', 'He has no strength to remove the burden—only enough to continue carrying it toward that place.'] },
      { id: 'reach-cross', objective: 'Approach the Cross', action: 'Look upon the Cross', kind: 'cross', position: [0, 5], dialogue: ['Christian reaches the crest and looks up.', 'The straps around the burden loosen without his hand.'], burden: 0 },
      { id: 'burden-roll', objective: 'Follow the burden as it rolls away', action: 'Watch it fall', kind: 'path', position: [-5, 2], dialogue: ['The burden tumbles down the hill, gathering speed.', 'It falls into an open grave and is seen no more.', 'CHRISTIAN: He has given me rest by his sorrow, and life by his death.'] },
      { id: 'new-clothing', objective: 'Receive new clothing from the Shining Ones', action: 'Receive clean garments', kind: 'person', position: [5, 3], dialogue: ['FIRST SHINING ONE: Your sins are forgiven.', 'The rags are replaced with clean clothing.', 'SECOND SHINING ONE marks Christian as one belonging to the King.'] },
      { id: 'sealed-roll', objective: 'Receive and examine the sealed roll', action: 'Take the roll', kind: 'roll', position: [-4, -4], dialogue: ['THIRD SHINING ONE: Keep this roll. Read it as you travel and present it at the Celestial Gate.', 'The seal catches the morning light. This is testimony for the journey still ahead.'], journal: 'The Cross — Christian’s burden is removed through saving work outside himself. New clothing, a mark, and a sealed roll signify his changed standing.' },
      { id: 'overlook', objective: 'Look across the road still ahead', action: 'View the journey', kind: 'light', position: [4, -5], dialogue: ['From the overlook Christian sees Hill Difficulty, Palace Beautiful, dark valleys, distant Vanity Fair, Doubting Castle, the Delectable Mountains, and light beyond a river.', 'The road is far from finished—but Christian no longer walks beneath the old burden.', 'MVP COMPLETE — The journey will continue.'] },
    ],
  },
]

export const totalStoryBeats = storyScenes.reduce((sum, scene) => sum + scene.steps.length, 0)
