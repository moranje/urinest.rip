import designTokens from "./beslismodel.tokens.json";

type ThemeMode = "dark" | "light";
type ThemeMetadata = {
  backgroundColor: Record<ThemeMode, string>;
  themeColor: Record<ThemeMode, string>;
};

type BeslismodelTokenExport = {
  $extensions: {
    "wtf.oranje.beslismodel": {
      theme: ThemeMetadata;
    };
  };
};

const metadata = (designTokens as BeslismodelTokenExport).$extensions["wtf.oranje.beslismodel"];

export const THEME_BACKGROUND_COLORS = metadata.theme.backgroundColor;
export const THEME_COLORS = metadata.theme.themeColor;
