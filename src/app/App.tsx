import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { mobileInput } from "../game/Player";
import { useGame } from "../game/state";
import { storyScenes, totalStoryBeats } from "../game/story";
import { gameAudio } from "../game/audio";
import { puzzleFor, totalPuzzles } from "../game/puzzles";
import { PuzzleOverlay } from "./PuzzleOverlay";
import { playerPosition } from "../game/Player";
import { isDialogueAdvanceKey } from "./keyboard";

// Keep title/about content lightweight. Three.js, Rapier, and authored scene
// kits load only after the player starts the journey, reducing first-paint
// cost without changing the playable scene graph.
const GameCanvas = lazy(async () => {
  const module = await import("../game/GameCanvas");
  return { default: module.GameCanvas };
});

function NavigationCue({
  target,
  nearby,
  onGuide,
}: {
  target: [number, number];
  nearby: boolean;
  onGuide: () => void;
}) {
  const [reading, setReading] = useState({
    direction: "ahead",
    distance: 0,
    playerX: 0,
    playerZ: 7,
  });
  useEffect(() => {
    const update = () => {
      const dx = target[0] - playerPosition.x;
      const dz = target[1] - playerPosition.z;
      const directions = [
        "north",
        "north-east",
        "east",
        "south-east",
        "south",
        "south-west",
        "west",
        "north-west",
      ];
      const index = Math.round(Math.atan2(dx, -dz) / (Math.PI / 4) + 8) % 8;
      setReading({
        direction: directions[index],
        distance: Math.round(Math.hypot(dx, dz)),
        playerX: playerPosition.x,
        playerZ: playerPosition.z,
      });
    };
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [target[0], target[1]]);
  return (
    <button
      className="navigation-cue"
      data-direction={reading.direction}
      data-distance={reading.distance}
      data-nearby={nearby}
      data-player-x={reading.playerX.toFixed(2)}
      data-player-z={reading.playerZ.toFixed(2)}
      onClick={onGuide}
      disabled={nearby}
    >
      {nearby ? "Within reach" : `${reading.direction} · ${reading.distance}m`}
    </button>
  );
}

function Title() {
  const start = useGame((s) => s.start);
  const soundEnabled = useGame((s) => s.soundEnabled);
  return (
    <main className="title-screen" data-testid="title-screen">
      <section className="title-hero" aria-labelledby="game-title">
        <div className="title-copy">
          <p className="eyebrow">AN INTERACTIVE DREAM</p>
          <h1 id="game-title">
            Pilgrim’s
            <br />
            <em>Progress</em>
          </h1>
          <p className="subtitle">The Narrow Way</p>
          <p className="intro">
            A story-driven 3D adaptation of John Bunyan’s 1678 allegory. Walk
            with Christian from the City of Destruction through the Celestial
            City, where every person, place, and trial carries a deeper
            meaning.
          </p>
          <div className="title-actions">
            <button
              className="primary"
              autoFocus
              onClick={() => {
                // The title action is a trusted gesture. Use it to unlock the
                // audio graph so first-time players hear the Dream bed without
                // needing to discover a secondary HUD toggle first.
                if (!soundEnabled) {
                  gameAudio.setEnabled(true);
                  useGame.setState({ soundEnabled: true });
                }
                start();
              }}
            >
              Begin the journey <span>→</span>
            </button>
            <a href="#about-the-work">About this adaptation</a>
          </div>
          <p className="hint">
            Move with WASD or arrow keys · Interact with E · Drag to look 360°
            · Press R to recenter
          </p>
          <p className="generation-credit">
            Generated using GPT 5.6 Sol on Codex.
          </p>
        </div>
        <div className="title-art" aria-label="Journey overview">
          <div className="title-vignette" aria-hidden="true" />
          <dl className="journey-facts">
            <div>
              <dt>{storyScenes.length}</dt>
              <dd>chapters playable</dd>
            </div>
            <div>
              <dt>{totalStoryBeats}</dt>
              <dd>story beats</dd>
            </div>
            <div>
              <dt>{totalPuzzles}</dt>
              <dd>symbolic trials</dd>
            </div>
          </dl>
          <blockquote>
            “I saw a man clothed with rags… and a great burden upon his back.”
            <cite>John Bunyan, The Pilgrim’s Progress</cite>
          </blockquote>
        </div>
      </section>

      <section className="story-about" id="about-the-work">
        <header>
          <p className="eyebrow">BOOK, DREAM, AND PLAYABLE JOURNEY</p>
          <h2>A seventeenth-century pilgrimage, rebuilt as a world to explore.</h2>
          <p>
            The Narrow Way invites new readers into Bunyan’s allegory without
            pretending to replace it. Play the journey here, then meet the
            original work in its own words.
          </p>
        </header>

        <div className="about-grid">
          <article>
            <span>01</span>
            <p className="eyebrow">THE ORIGINAL WORK</p>
            <h3>The Pilgrim’s Progress by John Bunyan</h3>
            <p>
              First published in 1678, Part One is told under the similitude of
              a dream. It follows Christian from the City of Destruction toward
              the Celestial City. Along the road, characters and landscapes
              embody fear, pride, compromise, grace, perseverance, fellowship,
              and hope.
            </p>
          </article>
          <article>
            <span>02</span>
            <p className="eyebrow">OUR ADAPTATION</p>
            <h3>From allegorical page to interactive place</h3>
            <p>
              We preserved Bunyan’s route, major characters, symbols, and
              Christian theological arc, then translated them into 3D
              exploration, conversations, discernment puzzles, conflict,
              companionship, and a pilgrim’s journal. Dialogue is sometimes
              condensed or newly written for play, while environments are
              visual interpretations of the text.
            </p>
          </article>
        </div>

        <aside className="reader-card">
          <div>
            <p className="eyebrow">READ THE SOURCE</p>
            <h3>The Pilgrim’s Progress — Part One</h3>
            <p>
              Complete, unabridged reading edition · 66 pages · PDF · 850 KB
            </p>
          </div>
          <div className="reader-actions">
            <a
              className="primary"
              href="/downloads/the-pilgrims-progress-john-bunyan.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Read the book <span>↗</span>
            </a>
            <a
              href="https://johnbunyan.org/donate/"
              target="_blank"
              rel="noreferrer"
            >
              Courtesy and support ↗
            </a>
          </div>
          <small>
            PDF supplied through the John Bunyan Museum website; this edition
            was published by Chapel Library. Its reproduction notice remains
            included in the unchanged file.
          </small>
        </aside>

        <footer>
          This independent browser adaptation is a work in progress. The
          journey now continues from the City of Destruction through Doubting
          Castle, the river, and the Celestial City. Generated using GPT 5.6
          Sol on Codex.
        </footer>
      </section>
    </main>
  );
}
function Controls() {
  const press = (x: number, z: number) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    mobileInput.x = x;
    mobileInput.z = z;
  };
  const release = () => {
    mobileInput.x = 0;
    mobileInput.z = 0;
  };
  const buttonProps = (x: number, z: number, label: string) => ({
    type: "button" as const,
    "aria-label": label,
    onPointerDown: press(x, z),
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
  });
  return (
    <div className="mobile-controls">
      <button {...buttonProps(-1, 0, "Move left")}>
        ←
      </button>
      <button {...buttonProps(0, -1, "Move forward")}>
        ↑
      </button>
      <button {...buttonProps(0, 1, "Move backward")}>
        ↓
      </button>
      <button {...buttonProps(1, 0, "Move right")}>
        →
      </button>
    </div>
  );
}

function FirstObjectiveCoach({
  nearby,
  guided,
  onGuide,
}: {
  nearby: boolean;
  guided: boolean;
  onGuide: () => void;
}) {
  const onboarding = useGame((state) => state.onboarding);
  const [showRescue, setShowRescue] = useState(false);
  const learned = [
    onboarding.moved,
    onboarding.looked,
    onboarding.interacted,
  ].filter(Boolean).length;

  useEffect(() => {
    setShowRescue(false);
    if (nearby || onboarding.firstObjectiveCompleted) return;
    const timer = window.setTimeout(() => setShowRescue(true), 7_000);
    return () => window.clearTimeout(timer);
  }, [
    nearby,
    onboarding.moved,
    onboarding.looked,
    onboarding.firstObjectiveCompleted,
  ]);

  if (onboarding.firstObjectiveCompleted)
    return (
      <section
        className="first-objective-coach complete"
        data-testid="first-objective-coach"
        role="status"
        aria-live="polite"
      >
        <strong>✓ Lantern lit</strong>
        <span>Controls remain available from Pause.</span>
      </section>
    );

  return (
    <section
      className="first-objective-coach"
      data-testid="first-objective-coach"
      aria-label="First objective controls"
    >
      <header>
        <strong>First steps</strong>
        <span>{learned} / 3 learned</span>
      </header>
      <ol>
        <li
          data-milestone="moved"
          data-complete={String(onboarding.moved)}
        >
          <i>{onboarding.moved ? "✓" : "1"}</i>
          <span className="tutorial-desktop-copy">
            <kbd>WASD</kbd> or <kbd>arrows</kbd> Move
          </span>
          <span className="tutorial-mobile-copy">Use arrow buttons to move</span>
        </li>
        <li
          data-milestone="looked"
          data-complete={String(onboarding.looked)}
        >
          <i>{onboarding.looked ? "✓" : "2"}</i>
          <span className="tutorial-desktop-copy">
            <kbd>Drag</kbd> Look around
          </span>
          <span className="tutorial-mobile-copy">Drag the world to look</span>
        </li>
        <li
          data-milestone="interacted"
          data-complete={String(onboarding.interacted)}
          data-ready={String(nearby)}
        >
          <i>{onboarding.interacted ? "✓" : "3"}</i>
          <span className="tutorial-desktop-copy">
            <kbd>E</kbd> {nearby ? "Light lantern" : "Interact"}
          </span>
          <span className="tutorial-mobile-copy">
            {nearby ? "Tap Light lantern" : "Tap action to interact"}
          </span>
        </li>
      </ol>
      {showRescue && !nearby && (
        <button
          className="tutorial-guide"
          disabled={guided}
          onClick={onGuide}
        >
          {guided ? "Guiding you to the lantern…" : "Guide me to the lantern"}
          <span>→</span>
        </button>
      )}
    </section>
  );
}

function Overlay() {
  const game = useGame();
  const audioState = useSyncExternalStore(
    gameAudio.subscribe,
    gameAudio.getSnapshot,
    gameAudio.getSnapshot,
  );
  const [storyMapOpen, setStoryMapOpen] = useState(false);
  const [replayDrawerIndex, setReplayDrawerIndex] = useState<number | null>(
    null,
  );
  const [replayBeatIndex, setReplayBeatIndex] = useState(0);
  const storyMapWasPaused = useRef(false);
  const chapterAction = useRef<HTMLButtonElement>(null);
  const endingAction = useRef<HTMLButtonElement>(null);
  const journalAction = useRef<HTMLButtonElement>(null);
  const pauseAction = useRef<HTMLButtonElement>(null);
  const storyMapAction = useRef<HTMLButtonElement>(null);
  const replayDrawerAction = useRef<HTMLButtonElement>(null);
  const scene = storyScenes[game.sceneIndex];
  const step = scene.steps[game.stepIndex];
  const progressSceneIndex =
    game.replayCheckpoint?.sceneIndex ?? game.sceneIndex;
  const progressStepIndex = game.replayCheckpoint?.stepIndex ?? game.stepIndex;
  const progressSceneComplete =
    game.replayCheckpoint?.sceneComplete ?? game.sceneComplete;
  const progressGameComplete =
    game.replayCheckpoint?.gameComplete ?? game.gameComplete;
  const completed =
    storyScenes
      .slice(0, progressSceneIndex)
      .reduce((n, s) => n + s.steps.length, 0) + progressStepIndex;
  const replayDrawerChapter =
    replayDrawerIndex == null ? null : storyScenes[replayDrawerIndex];
  useEffect(() => {
    const advanceDialogueFromKeyboard = (event: KeyboardEvent) => {
      if (!isDialogueAdvanceKey(event)) return;
      const state = useGame.getState();
      if (!state.dialogue) return;
      // Narration is a keyboard-first modal. Capture the key before the
      // focused button's native click synthesis or the Player listener can
      // advance twice / apply a jump while the line is open.
      event.preventDefault();
      event.stopPropagation();
      state.advanceDialogue();
    };
    window.addEventListener("keydown", advanceDialogueFromKeyboard, true);
    return () =>
      window.removeEventListener("keydown", advanceDialogueFromKeyboard, true);
  }, []);
  const openStoryMap = () => {
    storyMapWasPaused.current = game.paused;
    useGame.setState({ paused: true });
    setStoryMapOpen(true);
    if (game.replayCheckpoint) {
      setReplayDrawerIndex(game.sceneIndex);
      setReplayBeatIndex(game.stepIndex);
    } else {
      setReplayDrawerIndex(null);
      setReplayBeatIndex(0);
    }
  };
  const closeReplayDrawer = () => {
    setReplayDrawerIndex(null);
    setReplayBeatIndex(0);
  };
  const closeStoryMap = () => {
    setStoryMapOpen(false);
    closeReplayDrawer();
    useGame.setState({ paused: storyMapWasPaused.current });
  };
  const openReplayDrawer = (chapterIndex: number) => {
    setReplayDrawerIndex(chapterIndex);
    setReplayBeatIndex(
      game.replayCheckpoint && game.sceneIndex === chapterIndex
        ? game.stepIndex
        : 0,
    );
    window.setTimeout(() => replayDrawerAction.current?.focus(), 30);
  };
  const startReplayFromDrawer = () => {
    if (replayDrawerIndex == null) return;
    game.replayScene(replayDrawerIndex, replayBeatIndex);
    closeStoryMap();
  };
  const returnToSavedProgress = () => {
    if (game.replayCheckpoint) {
      game.returnFromReplay();
      closeStoryMap();
      return;
    }
    closeReplayDrawer();
  };
  useEffect(() => {
    if (!storyMapOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (replayDrawerIndex != null) {
        closeReplayDrawer();
        return;
      }
      closeStoryMap();
    };
    addEventListener("keydown", closeOnEscape);
    return () => removeEventListener("keydown", closeOnEscape);
  }, [storyMapOpen, replayDrawerIndex]);
  useEffect(() => {
    if (!game.message) return;
    const t = setTimeout(() => game.setMessage(), 2600);
    return () => clearTimeout(t);
  }, [game.message]);
  useEffect(() => {
    gameAudio.setEnabled(game.soundEnabled);
    gameAudio.scene(scene.id);
  }, [game.soundEnabled, scene.id]);
  useEffect(() => {
    if (game.dialogue) gameAudio.dialogue();
  }, [game.dialogueIndex, game.dialogue]);
  useEffect(() => {
    if (game.sceneComplete) gameAudio.chapter();
  }, [game.sceneComplete]);
  useEffect(() => {
    document.documentElement.dataset.textSize = game.textSize;
    document.documentElement.dataset.reducedMotion = String(game.reducedMotion);
  }, [game.textSize, game.reducedMotion]);
  useEffect(() => {
    const target = storyMapOpen
      ? replayDrawerChapter
        ? replayDrawerAction
        : storyMapAction
      : game.sceneComplete
      ? chapterAction
      : game.gameComplete
        ? endingAction
        : game.journalOpen
          ? journalAction
          : game.paused
            ? pauseAction
            : undefined;
    if (!target) return;
    const timer = window.setTimeout(() => target.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [
    storyMapOpen,
    replayDrawerChapter,
    game.sceneComplete,
    game.gameComplete,
    game.journalOpen,
    game.paused,
  ]);
  return (
    <>
      <header className="hud" data-testid="game-hud">
        <div>
          <p>{scene.number}</p>
          <strong>{scene.title}</strong>
          {game.replayCheckpoint && (
            <small className="replay-status">
              ↻ Replay · progress saved at {storyScenes[progressSceneIndex].title}
            </small>
          )}
        </div>
        <div className="story-progress">
          <span>
            {completed + 1} / {totalStoryBeats}
          </span>
          <i
            style={{ width: `${((completed + 1) / totalStoryBeats) * 100}%` }}
          />
        </div>
        <div className="hud-actions">
          <button onClick={game.cycleVisibility}>
            Visibility:{" "}
            {game.visibility === "highContrast" ? "contrast" : game.visibility}
          </button>
          <button
            aria-label="Toggle sound"
            onClick={() => {
              if (game.soundEnabled && audioState !== "playing") {
                gameAudio.start();
                return;
              }
              gameAudio.setEnabled(!game.soundEnabled);
              game.toggleSound();
            }}
          >
            {!game.soundEnabled
              ? "Sound off"
              : audioState === "blocked"
                ? "Start sound"
                : audioState === "error"
                  ? "Retry sound"
                  : audioState === "playing"
                    ? "Sound on"
                    : "Starting sound…"}
          </button>
          <button onClick={openStoryMap}>Story map</button>
          <button onClick={game.toggleJournal}>
            Journal <b>{game.journal.length}</b>
          </button>
          <button onClick={game.togglePause}>
            {game.paused && !game.journalOpen ? "Resume" : "Pause"}
          </button>
        </div>
      </header>
      <aside className="objective">
        <span>Current objective</span>
        <p>{step.objective}</p>
        <div className="inventory-status">
          <span>
            {game.burden
              ? "◆ Burden carried"
              : scene.id === "dream"
                ? "◇ The dream begins"
                : "✦ Burden released"}
          </span>
          {game.hasRoll && <span>▣ Sealed roll secured</span>}
          {game.hasKeyOfPromise && <span>◇ Key of Promise remembered</span>}
          {scene.id === "arbor" && !game.hasRoll && (
            <span className="warning">□ Sealed roll missing</span>
          )}
          {game.equipment.length > 0 && <span>⚔ Equipped for valleys</span>}
          {game.sceneIndex >= 20 && <span>◇ Hopeful travels with you</span>}
        </div>
        <NavigationCue
          target={step.position}
          nearby={game.nearby}
          onGuide={game.beginGuidedTravel}
        />
        {scene.id === "dream" && step.id === "lantern" && (
          <FirstObjectiveCoach
            nearby={game.nearby}
            guided={game.guidedTravel}
            onGuide={game.beginGuidedTravel}
          />
        )}
      </aside>
      {game.nearby &&
        !game.dialogue &&
        !game.choosing &&
        !game.puzzleActive &&
        !game.sceneComplete && (
          <button
            className="interact-prompt"
            onClick={() => {
              gameAudio.interact();
              game.interact();
            }}
          >
            <kbd>E</kbd> {step.action}
          </button>
        )}
      {game.message && <div className="toast">{game.message}</div>}
      {game.choosing && (
        <div className="dialogue choice">
          <p>How will Christian respond?</p>
          {step.choices?.map((choice, i) => (
            <button
              key={choice.label}
              autoFocus={i === 0}
              onClick={() => game.choose(i)}
            >
              {choice.label}
              <span>→</span>
            </button>
          ))}
        </div>
      )}
      {game.dialogue && (
        <button
          className="dialogue spoken"
          autoFocus
          aria-keyshortcuts="Enter"
          onClick={game.advanceDialogue}
        >
          <p>{game.dialogue[game.dialogueIndex]}</p>
          <small>
            {game.dialogueIndex + 1} / {game.dialogue.length} · Enter or click
            to continue →
          </small>
        </button>
      )}
      {(game.dialogue || game.choosing) && <div className="cinematic-bars" />}
      {game.puzzleActive && puzzleFor(scene.id, step.id) && (
        <PuzzleOverlay
          key={`${scene.id}:${step.id}`}
          puzzle={puzzleFor(scene.id, step.id)!}
        />
      )}
      <Controls />
      {game.sceneComplete && (
        <div className="modal chapter-card">
          <section>
            <p className="eyebrow">{scene.number} COMPLETE</p>
            <h2>{scene.title}</h2>
            <p>{scene.meaning}</p>
            <div className="chapter-progress">
              Journey{" "}
              {Math.round(
                ((progressSceneIndex + 1) / storyScenes.length) * 100,
              )}
              complete
            </div>
            <button
              ref={chapterAction}
              className="primary"
              onClick={game.continueScene}
            >
              {game.replayCheckpoint
                ? `Return to ${storyScenes[progressSceneIndex].title}`
                : game.sceneIndex === storyScenes.length - 1
                  ? "Enter the Celestial City"
                  : "Continue the journey"}{" "}
              →
            </button>
          </section>
        </div>
      )}
      {game.gameComplete && (
        <div className="modal ending">
          <section>
            <p className="eyebrow">PROMISE KEPT · THE CITY RECEIVED</p>
            <h2>The road ends in welcome.</h2>
            <p>
              Christian and Hopeful crossed the Delectable Mountains, stayed
              awake through the Enchanted Ground, entered Beulah, and crossed
              the river together. The road’s hardships become a testimony of
              grace rather than a record of self-rescue.
            </p>
            <div className="ending-road">
              Delectable Mountains · Enchanted Ground · Beulah · River ·
              Celestial City
            </div>
            <button ref={endingAction} className="primary" onClick={game.reset}>
              Dream again
            </button>
          </section>
        </div>
      )}
      {storyMapOpen && (
        <div
          className="modal story-map"
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-map-title"
        >
          <section
            className={
              replayDrawerChapter ? "story-map-shell drawer-open" : "story-map-shell"
            }
          >
            {replayDrawerChapter && replayDrawerIndex != null && (
              <aside
                className="replay-drawer"
                aria-label={`Replay controls for ${replayDrawerChapter.title}`}
              >
                <header className="replay-drawer-header">
                  <div>
                    <p className="eyebrow">Replay</p>
                    <h2 id="replay-drawer-title">{replayDrawerChapter.title}</h2>
                    <p>
                      Progress is preserved at{" "}
                      {storyScenes[progressSceneIndex].title}. Locked chapters
                      stay locked.
                    </p>
                  </div>
                  <button
                    className="replay-drawer-close"
                    onClick={closeReplayDrawer}
                    aria-label="Close replay drawer"
                  >
                    ✕
                  </button>
                </header>
                <div className="replay-drawer-body">
                  <p className="replay-drawer-label">Select beat</p>
                  <ol className="replay-beat-list">
                    {replayDrawerChapter.steps.map((beat, index) => {
                      const selected = index === replayBeatIndex;
                      return (
                        <li key={beat.id}>
                          <button
                            type="button"
                            className={
                              selected
                                ? "replay-beat selected"
                                : "replay-beat"
                            }
                            aria-pressed={selected}
                            onClick={() => setReplayBeatIndex(index)}
                          >
                            <span className="replay-beat-mark" aria-hidden="true">
                              {String(index + 1)}
                            </span>
                            <span className="replay-beat-copy">
                              <strong>{beat.action}</strong>
                              <small>{beat.objective}</small>
                            </span>
                            <span className="replay-beat-chevron" aria-hidden="true">
                              ›
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <footer className="replay-drawer-actions">
                  <button
                    ref={replayDrawerAction}
                    type="button"
                    className="replay-drawer-start"
                    onClick={startReplayFromDrawer}
                  >
                    Start replay
                  </button>
                  <button
                    type="button"
                    className="replay-drawer-return"
                    onClick={returnToSavedProgress}
                  >
                    Return to saved progress
                  </button>
                </footer>
              </aside>
            )}
            <div className="story-map-main">
              <header>
                <div>
                  <p className="eyebrow">THE ROAD AHEAD</p>
                  <h2 id="story-map-title">Story map</h2>
                  <p>
                    Replay any completed chapter without losing your current
                    journey. Future chapters remain locked until reached in
                    order.
                  </p>
                </div>
                <div className="story-map-header-actions">
                  <button
                    ref={storyMapAction}
                    className="story-map-close"
                    onClick={closeStoryMap}
                    aria-label="Close story map"
                  >
                    Close
                  </button>
                </div>
              </header>
              <ol className="story-map-grid">
                {storyScenes.map((chapter, index) => {
                  const isComplete =
                    progressGameComplete ||
                    index < progressSceneIndex ||
                    (index === progressSceneIndex && progressSceneComplete);
                  const isCurrent =
                    index === progressSceneIndex && !isComplete;
                  const isResumePoint =
                    Boolean(game.replayCheckpoint) &&
                    index === progressSceneIndex;
                  const isReplaying =
                    Boolean(game.replayCheckpoint) && index === game.sceneIndex;
                  const isDrawerTarget = replayDrawerIndex === index;
                  const status = isResumePoint
                    ? "Current journey"
                    : isReplaying
                      ? "Replaying"
                      : isComplete
                        ? "Completed"
                        : isCurrent
                          ? "In progress"
                          : "Locked";
                  return (
                    <li
                      key={chapter.id}
                      className={[
                        isResumePoint
                          ? "resume-point"
                          : isReplaying
                            ? "replaying"
                            : isComplete
                              ? "complete"
                              : isCurrent
                                ? "current"
                                : "locked",
                        isDrawerTarget ? "drawer-target" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-label={`${chapter.number}: ${chapter.title}, ${status}`}
                    >
                      <div>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <small>{status}</small>
                      </div>
                      <h3>{chapter.title}</h3>
                      <p>{chapter.meaning}</p>
                      <footer>
                        <span>{chapter.steps.length} story beats</span>
                        {!isComplete && !isCurrent && (
                          <b aria-hidden="true">◇</b>
                        )}
                      </footer>
                      {isResumePoint ? (
                        <button
                          className="chapter-replay resume"
                          onClick={() => {
                            setStoryMapOpen(false);
                            closeReplayDrawer();
                            game.returnFromReplay();
                          }}
                        >
                          Return here →
                        </button>
                      ) : isComplete ? (
                        <button
                          className="chapter-replay play"
                          onClick={() => openReplayDrawer(index)}
                          aria-label={`Replay ${chapter.title}`}
                          aria-expanded={isDrawerTarget}
                          aria-controls="replay-drawer-title"
                        >
                          <span aria-hidden="true">▶</span>
                          <span className="replay-play-label">Replay</span>
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </div>
      )}
      {game.journalOpen && (
        <div className="modal journal">
          <section>
            <p className="eyebrow">PILGRIM’S JOURNAL</p>
            <h2>Things seen on the way</h2>
            {game.journal.length ? (
              game.journal.map((entry, i) => {
                const [title, body] = entry.split(" — ");
                return (
                  <article key={entry}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </article>
                );
              })
            ) : (
              <p>Explore and interact to record people, places, and symbols.</p>
            )}
            <button
              ref={journalAction}
              className="primary"
              onClick={game.toggleJournal}
            >
              Return to journey
            </button>
          </section>
        </div>
      )}
      {game.paused &&
        !storyMapOpen &&
        !game.journalOpen &&
        !game.gameComplete && (
        <div className="modal">
          <section>
            <p className="eyebrow">JOURNEY PAUSED</p>
            <h2>Rest by the way.</h2>
            <p>Progress saves automatically after each story beat.</p>
            <p className="controls-reference">
              Move: WASD or arrow keys · Look: drag · Zoom: scroll · Recenter: R
              · Interact: E · Jog: Shift · Jump: Space
            </p>
            <div className="settings-grid">
              <button onClick={game.cycleVisibility}>
                Visibility <strong>{game.visibility}</strong>
              </button>
              <button onClick={game.cycleTextSize}>
                Text size <strong>{game.textSize}</strong>
              </button>
              <button onClick={game.toggleReducedMotion}>
                Reduced motion{" "}
                <strong>{game.reducedMotion ? "on" : "off"}</strong>
              </button>
              <button onClick={game.toggleCinematicCamera}>
                Cinematic camera{" "}
                <strong>{game.cinematicCamera ? "on" : "off"}</strong>
              </button>
            </div>
            <div className="modal-actions">
              <button
                ref={pauseAction}
                className="primary"
                onClick={game.togglePause}
              >
                Continue
              </button>
              <button onClick={game.reset}>Restart story</button>
              <button onClick={game.recoverCheckpoint}>
                Reload checkpoint
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
export function App() {
  const started = useGame((s) => s.started);
  return started ? (
    <main className="game" data-testid="game-screen">
      <Suspense
        fallback={
          <div className="scene-loader" role="status" aria-live="polite">
            <span>Preparing the road</span>
            <strong>The Dreamer</strong>
          </div>
        }
      >
        <GameCanvas />
      </Suspense>
      <Overlay />
    </main>
  ) : (
    <Title />
  );
}
