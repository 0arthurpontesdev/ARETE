import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import {
  Pen,
  Highlighter,
  Stamp,
  Eraser,
  Undo2,
  Trash2,
  X,
  Palette,
  Check,
  Star,
  ArrowRight,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { AnnotationPoint } from '../../types';

interface ScreenAnnotationCanvasProps {
  isActive: boolean;
  onClose: () => void;
}

type ToolType = 'pen' | 'highlighter' | 'stamp_star' | 'stamp_check' | 'stamp_arrow' | 'eraser';

const COLORS = ['#E02828', '#23D160', '#0E72ED', '#FFA502', '#FFFFFF'];

export const ScreenAnnotationCanvas: React.FC<ScreenAnnotationCanvasProps> = ({
  isActive,
  onClose,
}) => {
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState('#E02828');
  const [strokes, setStrokes] = useState<Array<AnnotationPoint[]>>([]);
  const isDrawing = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw all strokes
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.length === 0) return;
      const first = stroke[0];

      if (first.tool.startsWith('stamp_')) {
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let emoji = '⭐';
        if (first.tool === 'stamp_check') emoji = '✔️';
        if (first.tool === 'stamp_arrow') emoji = '➔';
        stroke.forEach((pt) => {
          ctx.fillText(emoji, pt.x, pt.y);
        });
        return;
      }

      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.strokeStyle = first.color;
      ctx.lineWidth = first.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (first.tool === 'highlighter') {
        ctx.globalAlpha = 0.4;
      } else {
        ctx.globalAlpha = 1.0;
      }

      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });
  }, [strokes]);

  if (!isActive) return null;

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawing.current = true;
    const strokeWidth = currentTool === 'highlighter' ? 14 : 3;

    if (currentTool.startsWith('stamp_')) {
      const newStampPoint: AnnotationPoint = {
        x,
        y,
        tool: currentTool,
        color: currentColor,
        strokeWidth: 24,
      };
      setStrokes((prev) => [...prev, [newStampPoint]]);
      isDrawing.current = false;
      return;
    }

    const newPoint: AnnotationPoint = {
      x,
      y,
      tool: currentTool,
      color: currentColor,
      strokeWidth,
    };
    setStrokes((prev) => [...prev, [newPoint]]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || Platform.OS !== 'web' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const strokeWidth = currentTool === 'highlighter' ? 14 : 3;
    const newPoint: AnnotationPoint = {
      x,
      y,
      tool: currentTool,
      color: currentColor,
      strokeWidth,
    };

    setStrokes((prev) => {
      if (prev.length === 0) return [[newPoint]];
      const lastStroke = [...prev[prev.length - 1], newPoint];
      return [...prev.slice(0, -1), lastStroke];
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
  };

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Interactive Web Canvas */}
      {Platform.OS === 'web' && (
        <canvas
          ref={canvasRef as any}
          width={1280}
          height={720}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: currentTool === 'eraser' ? 'crosshair' : 'default',
            zIndex: 10,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}

      {/* Floating Annotation Toolbar */}
      <View style={styles.toolbarCard} pointerEvents="auto">
        <View style={styles.toolsGroup}>
          <TouchableOpacity
            style={[styles.toolBtn, currentTool === 'pen' && styles.toolBtnActive]}
            onPress={() => setCurrentTool('pen')}
            accessibilityLabel="Caneta"
          >
            <Pen size={16} color={currentTool === 'pen' ? '#FFF' : ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, currentTool === 'highlighter' && styles.toolBtnActive]}
            onPress={() => setCurrentTool('highlighter')}
            accessibilityLabel="Marca-texto"
          >
            <Highlighter
              size={16}
              color={currentTool === 'highlighter' ? '#FFF' : ZoomTheme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, currentTool === 'stamp_star' && styles.toolBtnActive]}
            onPress={() => setCurrentTool('stamp_star')}
            accessibilityLabel="Carimbo de Estrela"
          >
            <Star
              size={16}
              color={currentTool === 'stamp_star' ? '#FFF' : ZoomTheme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, currentTool === 'stamp_check' && styles.toolBtnActive]}
            onPress={() => setCurrentTool('stamp_check')}
            accessibilityLabel="Carimbo de Check"
          >
            <Check
              size={16}
              color={currentTool === 'stamp_check' ? '#FFF' : ZoomTheme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, currentTool === 'eraser' && styles.toolBtnActive]}
            onPress={() => setCurrentTool('eraser')}
            accessibilityLabel="Borracha"
          >
            <Eraser
              size={16}
              color={currentTool === 'eraser' ? '#FFF' : ZoomTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Color Palette */}
        <View style={styles.colorsGroup}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                currentColor === color && styles.colorDotSelected,
              ]}
              onPress={() => setCurrentColor(color)}
            />
          ))}
        </View>

        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actionsGroup}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleUndo} accessibilityLabel="Desfazer">
            <Undo2 size={16} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleClear} accessibilityLabel="Limpar Tudo">
            <Trash2 size={16} color={ZoomTheme.colors.dangerRed} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Fechar Anotações">
            <X size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  toolbarCard: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 29, 33, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 60,
    gap: 8,
  },
  toolsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: {
    padding: 8,
    borderRadius: 16,
  },
  toolBtnActive: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
  },
  colorsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  colorDotSelected: {
    borderColor: '#FFF',
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
