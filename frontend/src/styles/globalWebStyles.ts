import { Platform } from 'react-native';
import { ZoomTheme } from './theme';

export function injectGlobalWebStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const styleId = 'zoom-global-web-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    * {
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      background-color: ${ZoomTheme.colors.stageBg};
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
      overflow: hidden;
    }

    /* Custom Zoom Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.16);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.28);
    }

    /* Accessible Focus Ring */
    :focus-visible {
      outline: 2px solid ${ZoomTheme.colors.zoomBlue} !important;
      outline-offset: 2px !important;
    }

    /* Smooth Micro-interactions */
    button, [role="button"] {
      transition: background-color 0.15s ease, transform 0.1s ease, border-color 0.15s ease, box-shadow 0.15s ease !important;
    }

    /* Video rendering optimization */
    video {
      background-color: #000;
    }

    /* Floating Reactions Animation */
    @keyframes zoomFloatUp {
      0% {
        opacity: 0;
        transform: translateY(20px) scale(0.6);
      }
      20% {
        opacity: 1;
        transform: translateY(0px) scale(1.15);
      }
      75% {
        opacity: 1;
        transform: translateY(-50px) scale(1.2);
      }
      100% {
        opacity: 0;
        transform: translateY(-90px) scale(1.35);
      }
    }
  `;
  document.head.appendChild(style);
}
