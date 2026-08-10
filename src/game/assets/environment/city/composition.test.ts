import { describe, expect, it } from "vitest";
import {
  CITY_BUILDING_SITES,
  CITY_QUALITY_COUNTS,
  CITY_MARKET_STALL_POSITIONS,
  CITY_STORY_TARGETS,
  CITY_STREET_STONES,
  cityDistanceToTarget,
  citySiteClearsTarget,
} from "./composition";

describe("City authored composition", () => {
  it("keeps six stable framing sites and clears the active story target", () => {
    expect(CITY_BUILDING_SITES).toHaveLength(6);
    for (const target of CITY_STORY_TARGETS) {
      const visible = CITY_BUILDING_SITES.filter((site) =>
        citySiteClearsTarget(site, target),
      );
      expect(visible.length, `target ${target.join(",")}`).toBeGreaterThanOrEqual(5);
      expect(
        CITY_BUILDING_SITES.some(
          (site) => cityDistanceToTarget(site.position, target) <= 2.35,
        ),
        `target ${target.join(",")} should have one reserved site`,
      ).toBe(target[0] !== 0);
      for (const stall of CITY_MARKET_STALL_POSITIONS)
        expect(cityDistanceToTarget(stall, target), `stall near ${target.join(",")}`).toBeGreaterThan(2.35);
    }
  });

  it("reduces only non-essential dressing on low quality", () => {
    expect(CITY_QUALITY_COUNTS.low.streetStones).toBeLessThan(
      CITY_QUALITY_COUNTS.medium.streetStones,
    );
    expect(CITY_QUALITY_COUNTS.low.marketProps).toBeLessThan(
      CITY_QUALITY_COUNTS.medium.marketProps,
    );
    expect(CITY_QUALITY_COUNTS.low.skylineTowers).toBeLessThan(
      CITY_QUALITY_COUNTS.medium.skylineTowers,
    );
    expect(CITY_STREET_STONES.length).toBe(CITY_QUALITY_COUNTS.medium.streetStones);
  });
});
