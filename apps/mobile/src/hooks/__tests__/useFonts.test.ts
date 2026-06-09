import { renderHook, waitFor } from '@testing-library/react-native';
import { useFonts, FONT_FAMILIES } from '../useFonts';

describe('useFonts', () => {
  it('loads fonts and sets fontsLoaded to true', async () => {
    const { result } = renderHook(() => useFonts());

    await waitFor(() => {
      expect(result.current.fontsLoaded).toBe(true);
    });
    expect(result.current.fontError).toBeNull();
  });

  it('exports correct font family names', () => {
    expect(FONT_FAMILIES.display).toBe('Sora');
    expect(FONT_FAMILIES.body).toBe('Manrope');
    expect(FONT_FAMILIES.mono).toBe('JetBrainsMono');
  });

  it('exports weight-specific font names', () => {
    expect(FONT_FAMILIES.displayBold).toBe('Sora-Bold');
    expect(FONT_FAMILIES.bodyRegular).toBe('Manrope-Regular');
    expect(FONT_FAMILIES.monoMedium).toBe('JetBrainsMono-Medium');
  });
});
