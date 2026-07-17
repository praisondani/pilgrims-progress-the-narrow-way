import { useEffect, useState } from "react";
import { GameCanvas } from "../game/GameCanvas";
import { mobileInput } from "../game/Player";
import { useGame } from "../game/state";
import { storyScenes, totalStoryBeats } from "../game/story";
import { gameAudio } from "../game/audio";
import { puzzleFor } from "../game/puzzles";
import { PuzzleOverlay } from "./PuzzleOverlay";
import { playerPosition } from "../game/Player";

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
            with Christian from the City of Destruction through Doubting
            Castle, where every person, place, and trial carries a deeper
            meaning.
          </p>
          <div className="title-actions">
            <button
              className="primary"
              autoFocus
              onClick={() => {
                gameAudio.start();
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
        </div>
        <div className="title-art" aria-label="Journey overview">
          <div className="title-vignette" aria-hidden="true" />
          <dl className="journey-facts">
            <div>
              <dt>25</dt>
              <dd>chapters playable</dd>
            </div>
            <div>
              <dt>191</dt>
              <dd>story beats</dd>
            </div>
            <div>
              <dt>47</dt>
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
          current journey reaches Doubting Castle; later chapters toward the
          Celestial City are in development.
        </footer>
      </section>
    </main>
  );
}
function Controls() {
  const press = (x: number, z: number) => () => {
    mobileInput.x = x;
    mobileInput.z = z;
  };
  const release = () => {
    mobileInput.x = 0;
    mobileInput.z = 0;
  };
  return (
    <div className="mobile-controls">
      <button onPointerDown={press(-1, 0)} onPointerUp={release}>
        ←
      </button>
      <button onPointerDown={press(0, -1)} onPointerUp={release}>
        ↑
      </button>
      <button onPointerDown={press(0, 1)} onPointerUp={release}>
        ↓
      </button>
      <button onPointerDown={press(1, 0)} onPointerUp={release}>
        →
      </button>
    </div>
  );
}
function Overlay() {
  const game = useGame();
  const scene = storyScenes[game.sceneIndex];
  const step = scene.steps[game.stepIndex];
  const completed =
    storyScenes
      .slice(0, game.sceneIndex)
      .reduce((n, s) => n + s.steps.length, 0) + game.stepIndex;
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
  return (
    <>
      <header className="hud" data-testid="game-hud">
        <div>
          <p>{scene.number}</p>
          <strong>{scene.title}</strong>
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
              game.toggleSound();
              gameAudio.start();
            }}
          >
            {game.soundEnabled ? "Sound on" : "Sound off"}
          </button>
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
      </aside>
      {game.nearby &&
        !game.dialogue &&
        !game.choosing &&
        !game.puzzleActive &&
        !game.sceneComplete && (
          <button className="interact-prompt" onClick={game.interact}>
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
      {game.puzzleActive && (
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
              {Math.round(((game.sceneIndex + 1) / storyScenes.length) * 100)}%
              complete
            </div>
            <button className="primary" autoFocus onClick={game.continueScene}>
              {game.sceneIndex === storyScenes.length - 1
                ? "Leave Doubting Castle"
                : "Continue the journey"}{" "}
              →
            </button>
          </section>
        </div>
      )}
      {game.gameComplete && (
        <div className="modal ending">
          <section>
            <p className="eyebrow">PROMISE REMEMBERED · DESPAIR ESCAPED</p>
            <h2>The mountains rise ahead.</h2>
            <p>
              Christian and Hopeful refused convenient religion and Lucre,
              owned the error of By-Path Meadow, remembered the Key of Promise,
              and escaped Doubting Castle together.
            </p>
            <div className="ending-road">
              Delectable Mountains · Ignorance · Little-Faith · Flatterer ·
              Enchanted Ground · Beulah · River · Celestial City
            </div>
            <button className="primary" autoFocus onClick={game.reset}>
              Dream again
            </button>
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
            <button className="primary" autoFocus onClick={game.toggleJournal}>
              Return to journey
            </button>
          </section>
        </div>
      )}
      {game.paused && !game.journalOpen && !game.gameComplete && (
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
              <button className="primary" autoFocus onClick={game.togglePause}>
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
      <GameCanvas />
      <Overlay />
    </main>
  ) : (
    <Title />
  );
}
