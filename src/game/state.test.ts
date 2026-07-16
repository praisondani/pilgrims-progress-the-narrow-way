import { beforeEach, describe, expect, it } from 'vitest'
import { useGame } from './state'
import { storyScenes } from './story'

describe('story progression state machine', () => {
  beforeEach(() => useGame.getState().reset())

  it('does not allow remote interaction', () => {
    useGame.getState().interact()
    expect(useGame.getState().dialogue).toBeUndefined()
    expect(useGame.getState().stepIndex).toBe(0)
  })

  it('advances only after all dialogue is read', () => {
    useGame.setState({stepIndex:1})
    useGame.getState().setNearby(true); useGame.getState().interact()
    const lines = storyScenes[0].steps[1].dialogue.length
    for (let i=0; i<lines-1; i++) useGame.getState().advanceDialogue()
    expect(useGame.getState().stepIndex).toBe(1)
    useGame.getState().advanceDialogue()
    expect(useGame.getState().stepIndex).toBe(2)
  })

  it('requires a response at choice beats', () => {
    useGame.setState({ sceneIndex: 1, stepIndex: 2, nearby: true })
    useGame.getState().interact()
    expect(useGame.getState().choosing).toBe(true)
    useGame.getState().choose(0)
    expect(useGame.getState().dialogue?.length).toBeGreaterThan(0)
  })

  it('gates scene transitions behind the final beat', () => {
    useGame.setState({ sceneIndex: 0, stepIndex: storyScenes[0].steps.length-1, nearby: true })
    useGame.getState().interact()
    while (useGame.getState().dialogue) useGame.getState().advanceDialogue()
    expect(useGame.getState().sceneComplete).toBe(true)
    useGame.getState().continueScene()
    expect(useGame.getState().sceneIndex).toBe(1)
    expect(useGame.getState().stepIndex).toBe(0)
  })
})
