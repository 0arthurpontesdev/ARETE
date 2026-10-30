import React, { useRef, useEffect } from 'react';
import { getBackgroundDetails, computeCombinedVideoFilter } from '../../utils/mediaEffects';

interface VirtualVideoRendererProps {
  stream?: MediaStream | null;
  videoElementRef?: React.RefObject<HTMLVideoElement>;
  virtualBackground?: string;
  videoFilter?: string;
  lowLightAdjustment?: boolean;
  smoothSkin?: boolean;
  mirrorVideo?: boolean;
  customBackgroundUrl?: string;
  isLocal?: boolean;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const VirtualVideoRenderer: React.FC<VirtualVideoRendererProps> = ({
  stream,
  videoElementRef: externalVideoRef,
  virtualBackground = 'none',
  videoFilter = 'normal',
  lowLightAdjustment = false,
  smoothSkin = false,
  mirrorVideo = true,
  customBackgroundUrl,
  isLocal = true,
  width = '100%',
  height = '100%',
  style,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeVideoRef = externalVideoRef || localVideoRef;

  const bgDetails = getBackgroundDetails(virtualBackground, customBackgroundUrl);
  const combinedFilter = computeCombinedVideoFilter({
    filterId: videoFilter,
    lowLightAdjustment,
    smoothSkin,
  });

  const shouldMirror = isLocal ? mirrorVideo : false;
  const mirrorTransform = shouldMirror ? 'scaleX(-1)' : 'none';

  // Bind stream to video elements
  useEffect(() => {
    if (!stream) return;

    if (activeVideoRef.current && activeVideoRef.current.srcObject !== stream) {
      activeVideoRef.current.srcObject = stream;
    }
    if (bgVideoRef.current && bgVideoRef.current.srcObject !== stream) {
      bgVideoRef.current.srcObject = stream;
    }
  }, [stream, activeVideoRef]);

  const hasImageBackground = bgDetails.type === 'image' && bgDetails.imageUrl;
  const hasBlurBackground = bgDetails.type === 'blur';

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        backgroundColor: '#0a0a0c',
        borderRadius: style?.borderRadius ?? 0,
        ...style,
      }}
    >
      {/* 1. BACKGROUND LAYER */}
      {hasImageBackground && (
        <img
          src={bgDetails.imageUrl}
          alt={bgDetails.label}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {hasBlurBackground && (
        <video
          ref={bgVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: shouldMirror ? 'scaleX(-1) scale(1.12)' : 'scale(1.12)',
            filter: `blur(${bgDetails.blurRadius || 12}px) brightness(0.9)`,
            zIndex: 1,
          }}
        />
      )}

      {/* 2. FOREGROUND SUBJECT / MAIN VIDEO LAYER */}
      <video
        ref={activeVideoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: mirrorTransform,
          filter: combinedFilter,
          zIndex: 2,
          WebkitMaskImage:
            hasImageBackground || hasBlurBackground
              ? 'radial-gradient(ellipse 65% 82% at 50% 50%, black 52%, rgba(0,0,0,0.65) 75%, transparent 100%)'
              : 'none',
          maskImage:
            hasImageBackground || hasBlurBackground
              ? 'radial-gradient(ellipse 65% 82% at 50% 50%, black 52%, rgba(0,0,0,0.65) 75%, transparent 100%)'
              : 'none',
          transition: 'filter 0.25s ease, transform 0.2s ease',
        }}
      />
    </div>
  );
};
