import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import {
  computeCombinedVideoFilter,
  getBackgroundDetails,
  BACKGROUND_OPTIONS,
  FILTER_OPTIONS,
} from '../utils/mediaEffects';
import { getAudioConstraints } from '../utils/audioEffects';

describe('Efeitos de Vídeo, Áudio e Fundos Virtuais', () => {
  it('computeCombinedVideoFilter deve gerar string correta para filtros e ajustes', () => {
    // Normal / Sem filtro
    expect(computeCombinedVideoFilter({ filterId: 'normal' })).toBe('none');

    // Filtro sépia
    const sepiaFilter = computeCombinedVideoFilter({ filterId: 'sepia' });
    expect(sepiaFilter).toContain('sepia(0.85)');

    // Pouca iluminação e filtro de pele combinados
    const combined = computeCombinedVideoFilter({
      filterId: 'warm',
      lowLightAdjustment: true,
      smoothSkin: true,
    });
    expect(combined).toContain('sepia(0.3)');
    expect(combined).toContain('brightness(1.22)');
    expect(combined).toContain('contrast(0.96)');
  });

  it('getBackgroundDetails deve resolver opções predefinidas e personalizadas', () => {
    // Opção pré-definida
    const office = getBackgroundDetails('office');
    expect(office.type).toBe('image');
    expect(office.label).toBe('Escritório Corporativo');
    expect(office.imageUrl).toBeDefined();

    // Desfoque
    const blur = getBackgroundDetails('blur_low');
    expect(blur.type).toBe('blur');
    expect(blur.blurRadius).toBe(8);

    // Fundo personalizado (data URL)
    const custom = getBackgroundDetails('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==');
    expect(custom.type).toBe('image');
    expect(custom.id).toBe('custom');
    expect(custom.imageUrl).toContain('data:image/png');
  });

  it('getAudioConstraints deve configurar restrições para supressão de ruído e áudio original', () => {
    // Modo Padrão / Automático
    const normal = getAudioConstraints('medium', false);
    expect(normal.echoCancellation).toBe(true);
    expect(normal.noiseSuppression).toBe(true);
    expect(normal.autoGainControl).toBe(true);

    // Modo Áudio Original para Músicos
    const original = getAudioConstraints('high', true);
    expect(original.echoCancellation).toBe(false);
    expect(original.noiseSuppression).toBe(false);
    expect(original.autoGainControl).toBe(false);
    expect(original.channelCount).toEqual({ ideal: 2 });
  });

  it('BACKGROUND_OPTIONS e FILTER_OPTIONS contêm todas as opções necessárias', () => {
    expect(BACKGROUND_OPTIONS.some((b) => b.id === 'none')).toBe(true);
    expect(BACKGROUND_OPTIONS.some((b) => b.id === 'blur_low')).toBe(true);
    expect(BACKGROUND_OPTIONS.some((b) => b.id === 'blur_high')).toBe(true);
    expect(BACKGROUND_OPTIONS.some((b) => b.id === 'office')).toBe(true);
    expect(BACKGROUND_OPTIONS.some((b) => b.id === 'beach')).toBe(true);
    expect(BACKGROUND_OPTIONS.some((b) => b.id === 'modern')).toBe(true);

    expect(FILTER_OPTIONS.some((f) => f.id === 'normal')).toBe(true);
    expect(FILTER_OPTIONS.some((f) => f.id === 'warm')).toBe(true);
    expect(FILTER_OPTIONS.some((f) => f.id === 'cool')).toBe(true);
    expect(FILTER_OPTIONS.some((f) => f.id === 'sepia')).toBe(true);
    expect(FILTER_OPTIONS.some((f) => f.id === 'bw')).toBe(true);
  });
});
