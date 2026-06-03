/* eslint-disable security/detect-non-literal-fs-filename */
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

const requiredStoryContracts = [
  {
    file: "src/stories/ActionRow.stories.ts",
    title: 'title: "Primitives/ActionRow"',
    exports: ["Default", "Disabled", "LongText"],
  },
  {
    file: "src/stories/Button.stories.ts",
    title: 'title: "Primitives/Button"',
    exports: ["Primary", "AllVariants"],
  },
  {
    file: "src/stories/ProgressBar.stories.ts",
    title: 'title: "Primitives/ProgressBar"',
    exports: ["Default", "ClampedOverMax"],
  },
  {
    file: "src/stories/LogoSvg.stories.ts",
    title: 'title: "Primitives/LogoSvg"',
    exports: ["Default", "HeaderSize", "Animated"],
  },
  {
    file: "src/stories/FormControls.stories.ts",
    title: 'title: "Primitives/FormControls"',
    exports: ["Inputs", "SelectionControls", "IconButtonsAndTooltip", "AllControls"],
  },
  {
    file: "src/stories/Chip.stories.ts",
    title: 'title: "Primitives/Chip"',
    exports: ["Filled", "ExternalLink", "LongText"],
  },
  {
    file: "src/stories/TextLink.stories.ts",
    title: 'title: "Primitives/TextLink"',
    exports: ["External", "Internal", "LongText"],
  },
  {
    file: "src/stories/ChoiceOption.stories.ts",
    title: 'title: "Molecules/ChoiceOption"',
    exports: ["LongText", "WithoutKeyboardPrefix"],
  },
  {
    file: "src/stories/Notice.stories.ts",
    title: 'title: "Molecules/Notice"',
    exports: ["LongCopy", "AllVariants"],
  },
  {
    file: "src/stories/SegmentedControl.stories.ts",
    title: 'title: "Molecules/SegmentedControl"',
    exports: ["ThemeToggle", "LongLabels"],
  },
  {
    file: "src/stories/QuestionPanel.stories.ts",
    title: 'title: "Organisms/QuestionPanel"',
    exports: ["SingleSelect", "MultiSelectLongCopy"],
  },
  {
    file: "src/stories/MultiInputPanel.stories.ts",
    title: 'title: "Organisms/MultiInputPanel"',
    exports: ["CvrmInputs", "Incomplete", "LongClinicalLabels"],
  },
  {
    file: "src/stories/ResultTemplate.stories.ts",
    title: 'title: "Templates/ResultTemplate"',
    exports: ["TreatmentResult", "LongClinicalCopy"],
  },
  {
    file: "src/stories/LandingTemplate.stories.ts",
    title: 'title: "Templates/LandingTemplate"',
    exports: ["FivePrimaryFlows", "SecondaryGuidelines"],
  },
];

describe("storybook coverage", () => {
  it("documents primitives, molecules, organisms and templates", () => {
    const stories = readdirSync("src/stories").filter((file) => file.endsWith(".stories.ts"));

    expect(stories).toEqual(
      expect.arrayContaining([
        "ActionRow.stories.ts",
        "Button.stories.ts",
        "Card.stories.ts",
        "Chip.stories.ts",
        "TextLink.stories.ts",
        "FormControls.stories.ts",
        "LogoSvg.stories.ts",
      ]),
    );
    expect(stories).toEqual(
      expect.arrayContaining([
        "ChoiceOption.stories.ts",
        "Notice.stories.ts",
        "SegmentedControl.stories.ts",
      ]),
    );
    expect(stories).toEqual(
      expect.arrayContaining(["QuestionPanel.stories.ts", "MultiInputPanel.stories.ts"]),
    );
    expect(stories).toEqual(
      expect.arrayContaining(["ResultTemplate.stories.ts", "LandingTemplate.stories.ts"]),
    );
  });

  it("keeps stories for critical states and long clinical copy", () => {
    for (const contract of requiredStoryContracts) {
      const story = read(contract.file);

      expect(story, contract.file).toContain(contract.title);
      expect(story, contract.file).toContain('tags: ["autodocs"]');
      for (const exportName of contract.exports) {
        expect(story, contract.file).toContain(`export const ${exportName}`);
      }
    }
  });
});
