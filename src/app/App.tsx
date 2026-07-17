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
      <div className="title-vignette" />
      <section className="title-copy">
        <p className="eyebrow">AN INTERACTIVE DREAM</p>
        <h1>
          Pilgrim’s
          <br />
          <em>Progress</em>
        </h1>
        <p className="subtitle">The Narrow Way</p>
        <p className="intro">
          A detailed story journey from the City of Destruction through Vanity
          Fair. Explore, listen, discern, defend, endure, and carry Christian
          through each symbolic trial.
        </p>
        <button
          className="primary"
          onClick={() => {
            gameAudio.start();
            start();
          }}
        >
          Enter the dream <span>→</span>
        </button>
        <p className="hint">
          WASD or arrow keys to walk · E to interact · Shift to jog · Space to
          jump · Drag to look 360° · Scroll to zoom · R to recenter
        </p>
      </section>
      <blockquote>
        “I saw a man clothed with rags… and a great burden upon his back.”
      </blockquote>
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
          {scene.id === "arbor" && !game.hasRoll && (
            <span className="warning">□ Sealed roll missing</span>
          )}
          {game.equipment.length > 0 && <span>⚔ Equipped for valleys</span>}
          {scene.id === "hopeful" && <span>◇ Hopeful travels with you</span>}
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
            <button key={choice.label} onClick={() => game.choose(i)}>
              {choice.label}
              <span>→</span>
            </button>
          ))}
        </div>
      )}
      {game.dialogue && (
        <button className="dialogue spoken" onClick={game.advanceDialogue}>
          <p>{game.dialogue[game.dialogueIndex]}</p>
          <small>
            {game.dialogueIndex + 1} / {game.dialogue.length} · continue →
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
            <button className="primary" onClick={game.continueScene}>
              {game.sceneIndex === storyScenes.length - 1
                ? "Continue beyond Vanity"
                : "Continue the journey"}{" "}
              →
            </button>
          </section>
        </div>
      )}
      {game.gameComplete && (
        <div className="modal ending">
          <section>
            <p className="eyebrow">FAITHFUL REMEMBERED · HOPE RENEWED</p>
            <h2>The road continues.</h2>
            <p>
              Christian has resisted Apollyon, crossed the Shadow, received
              Faithful’s friendship and witness, escaped Vanity Fair, and
              welcomed Hopeful to the road.
            </p>
            <div className="ending-road">
              By-Ends · By-Path Meadow · Doubting Castle · Delectable Mountains
              · Beulah · River · Celestial City
            </div>
            <button className="primary" onClick={game.reset}>
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
            <button className="primary" onClick={game.toggleJournal}>
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
              <button className="primary" onClick={game.togglePause}>
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
