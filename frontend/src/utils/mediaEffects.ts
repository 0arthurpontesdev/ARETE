// Media effects and virtual background configurations

export interface BackgroundOption {
  id: string;
  label: string;
  icon: string;
  imageUrl?: string;
  type: 'none' | 'blur' | 'image';
  blurRadius?: number;
}

export interface VideoFilterOption {
  id: string;
  label: string;
  cssFilter: string;
}

// Curated high-resolution royalty-free virtual background images with high availability
export const VIRTUAL_BACKGROUNDS: Record<string, string> = {
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1280&q=80',
  modern: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1280&q=80',
  cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1280&q=80',
  studio: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80',
  nature: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1280&q=80',
};

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'none', label: 'Nenhum', icon: '🚫', type: 'none' },
  { id: 'blur_low', label: 'Desfoque Leve', icon: '🌫️', type: 'blur', blurRadius: 8 },
  { id: 'blur_high', label: 'Desfoque Intenso', icon: '💨', type: 'blur', blurRadius: 20 },
  { id: 'office', label: 'Escritório Corporativo', icon: '🏢', type: 'image', imageUrl: VIRTUAL_BACKGROUNDS.office },
  { id: 'beach', label: 'Praia Tropical', icon: '🏖️', type: 'image', imageUrl: VIRTUAL_BACKGROUNDS.beach },
  { id: 'modern', label: 'Sala Moderna', icon: '🛋️', type: 'image', imageUrl: VIRTUAL_BACKGROUNDS.modern },
  { id: 'cafe', label: 'Cafeteria Aconchegante', icon: '☕', type: 'image', imageUrl: VIRTUAL_BACKGROUNDS.cafe },
  { id: 'studio', label: 'Estúdio Minimalista', icon: '🎨', type: 'image', imageUrl: VIRTUAL_BACKGROUNDS.studio },
  { id: 'nature', label: 'Floresta Serena', icon: '🌲', type: 'image', imageUrl: VIRTUAL_BACKGROUNDS.nature },
];

export const FILTER_OPTIONS: VideoFilterOption[] = [
  { id: 'normal', label: 'Normal', cssFilter: 'none' },
  { id: 'warm', label: 'Aquecido', cssFilter: 'sepia(0.3) saturate(1.4) brightness(1.02)' },
  { id: 'cool', label: 'Refrescante', cssFilter: 'hue-rotate(185deg) saturate(0.85) contrast(1.05)' },
  { id: 'sepia', label: 'Sépia', cssFilter: 'sepia(0.85) contrast(1.1)' },
  { id: 'bw', label: 'P&B', cssFilter: 'grayscale(1) contrast(1.2)' },
  { id: 'vintage', label: 'Retrô Filme', cssFilter: 'sepia(0.4) contrast(1.15) brightness(0.95) saturate(1.2)' },
  { id: 'cyberpunk', label: 'Neon Cyber', cssFilter: 'saturate(1.8) contrast(1.25) hue-rotate(-20deg)' },
  { id: 'studio', label: 'Luz de Estúdio', cssFilter: 'brightness(1.08) contrast(1.08) saturate(1.05)' },
];

export interface VideoFilterSettings {
  filterId?: string;
  lowLightAdjustment?: boolean;
  smoothSkin?: boolean;
}

export function computeCombinedVideoFilter(settings: VideoFilterSettings): string {
  const parts: string[] = [];

  const foundFilter = FILTER_OPTIONS.find((f) => f.id === settings.filterId);
  if (foundFilter && foundFilter.cssFilter !== 'none') {
    parts.push(foundFilter.cssFilter);
  }

  if (settings.lowLightAdjustment) {
    parts.push('brightness(1.22) contrast(1.10) saturate(1.05)');
  }

  if (settings.smoothSkin) {
    parts.push('contrast(0.96) brightness(1.03) blur(0.4px)');
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function getBackgroundDetails(bgId: string, customUrl?: string): BackgroundOption {
  if (bgId.startsWith('data:') || bgId.startsWith('http://') || bgId.startsWith('https://')) {
    return {
      id: 'custom',
      label: 'Personalizado',
      icon: '🖼️',
      type: 'image',
      imageUrl: bgId,
    };
  }

  const option = BACKGROUND_OPTIONS.find((b) => b.id === bgId);
  if (option) {
    return option;
  }

  if (customUrl) {
    return {
      id: 'custom',
      label: 'Personalizado',
      icon: '🖼️',
      type: 'image',
      imageUrl: customUrl,
    };
  }

  return BACKGROUND_OPTIONS[0]; // 'none'
}
