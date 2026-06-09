import { useEffect, useState } from 'react';

export interface FontLoadResult {
  fontsLoaded: boolean;
  fontError: Error | null;
}

const FONT_MAP: Record<string, string> = {
  'Sora-Regular': 'Sora-Regular',
  'Sora-Medium': 'Sora-Medium',
  'Sora-SemiBold': 'Sora-SemiBold',
  'Sora-Bold': 'Sora-Bold',
  'Sora-ExtraBold': 'Sora-ExtraBold',
  'Manrope-Regular': 'Manrope-Regular',
  'Manrope-Medium': 'Manrope-Medium',
  'Manrope-SemiBold': 'Manrope-SemiBold',
  'Manrope-Bold': 'Manrope-Bold',
  'Manrope-ExtraBold': 'Manrope-ExtraBold',
  'JetBrainsMono-Regular': 'JetBrainsMono-Regular',
  'JetBrainsMono-Medium': 'JetBrainsMono-Medium',
  'JetBrainsMono-Bold': 'JetBrainsMono-Bold',
};

export const FONT_FAMILIES = {
  display: 'Sora',
  body: 'Manrope',
  mono: 'JetBrainsMono',

  displayRegular: 'Sora-Regular',
  displayMedium: 'Sora-Medium',
  displaySemiBold: 'Sora-SemiBold',
  displayBold: 'Sora-Bold',
  displayExtraBold: 'Sora-ExtraBold',

  bodyRegular: 'Manrope-Regular',
  bodyMedium: 'Manrope-Medium',
  bodySemiBold: 'Manrope-SemiBold',
  bodyBold: 'Manrope-Bold',
  bodyExtraBold: 'Manrope-ExtraBold',

  monoRegular: 'JetBrainsMono-Regular',
  monoMedium: 'JetBrainsMono-Medium',
  monoBold: 'JetBrainsMono-Bold',
} as const;

export const useFonts = (): FontLoadResult => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const Font = require('expo-font');
        const fontAssets: Record<string, any> = {};

        for (const [name, _file] of Object.entries(FONT_MAP)) {
          try {
            fontAssets[name] = require(`../../assets/fonts/${name}.ttf`);
          } catch {
            // Font file not yet added — skip silently
          }
        }

        if (Object.keys(fontAssets).length > 0) {
          await Font.loadAsync(fontAssets);
        }

        setFontsLoaded(true);
      } catch (error) {
        setFontError(error instanceof Error ? error : new Error('Font loading failed'));
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

  return { fontsLoaded, fontError };
};
