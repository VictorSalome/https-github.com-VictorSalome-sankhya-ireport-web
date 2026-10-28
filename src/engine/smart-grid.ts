/**
 * Smart Grid Engine - JasperReports / Canva-style Layout Slots & Auto-Fit
 * Calculates layout slots for bands based on presets and dimensions.
 */

export type BandLayoutPreset =
  | '1-col'
  | '2-col-50-50'
  | '2-col-33-67'
  | '2-col-67-33'
  | '3-col-equal'
  | '4-grid-2x2';

export interface LayoutSlot {
  id: string;
  label: string;
  x: number; // relativo à banda
  y: number; // relativo à banda
  width: number;
  height: number;
}

export const PT_PER_MM = 2.83465;

export function ptToMm(pt: number): number {
  return Math.round((pt / PT_PER_MM) * 10) / 10;
}

export function mmToPt(mm: number): number {
  return Math.round(mm * PT_PER_MM);
}

/**
 * Pure function to calculate layout slots for a band given a preset, width, height, and gap.
 */
export function calculateBandSlots(
  preset: BandLayoutPreset,
  colW: number,
  bandH: number,
  gap = 12
): LayoutSlot[] {
  const safeW = Math.max(0, colW);
  const safeH = Math.max(0, bandH);

  switch (preset) {
    case '1-col': {
      return [
        {
          id: 'slot-1',
          label: 'Coluna Única',
          x: 0,
          y: 0,
          width: safeW,
          height: safeH,
        },
      ];
    }

    case '2-col-50-50': {
      const w1 = Math.floor((safeW - gap) / 2);
      const w2 = Math.max(0, safeW - gap - w1);
      return [
        {
          id: 'slot-1',
          label: 'Coluna 1 (50%)',
          x: 0,
          y: 0,
          width: Math.max(0, w1),
          height: safeH,
        },
        {
          id: 'slot-2',
          label: 'Coluna 2 (50%)',
          x: Math.max(0, w1) + gap,
          y: 0,
          width: w2,
          height: safeH,
        },
      ];
    }

    case '2-col-33-67': {
      const w1 = Math.floor((safeW - gap) * 0.33);
      const w2 = Math.max(0, safeW - gap - w1);
      return [
        {
          id: 'slot-1',
          label: 'Coluna 1 (33%)',
          x: 0,
          y: 0,
          width: Math.max(0, w1),
          height: safeH,
        },
        {
          id: 'slot-2',
          label: 'Coluna 2 (67%)',
          x: Math.max(0, w1) + gap,
          y: 0,
          width: w2,
          height: safeH,
        },
      ];
    }

    case '2-col-67-33': {
      const w1 = Math.floor((safeW - gap) * 0.67);
      const w2 = Math.max(0, safeW - gap - w1);
      return [
        {
          id: 'slot-1',
          label: 'Coluna 1 (67%)',
          x: 0,
          y: 0,
          width: Math.max(0, w1),
          height: safeH,
        },
        {
          id: 'slot-2',
          label: 'Coluna 2 (33%)',
          x: Math.max(0, w1) + gap,
          y: 0,
          width: w2,
          height: safeH,
        },
      ];
    }

    case '3-col-equal': {
      const w = Math.floor((safeW - 2 * gap) / 3);
      const w3 = Math.max(0, safeW - 2 * gap - 2 * w);
      return [
        {
          id: 'slot-1',
          label: 'Coluna 1 (33%)',
          x: 0,
          y: 0,
          width: Math.max(0, w),
          height: safeH,
        },
        {
          id: 'slot-2',
          label: 'Coluna 2 (33%)',
          x: Math.max(0, w) + gap,
          y: 0,
          width: Math.max(0, w),
          height: safeH,
        },
        {
          id: 'slot-3',
          label: 'Coluna 3 (34%)',
          x: (Math.max(0, w) + gap) * 2,
          y: 0,
          width: w3,
          height: safeH,
        },
      ];
    }

    case '4-grid-2x2': {
      const w1 = Math.floor((safeW - gap) / 2);
      const w2 = Math.max(0, safeW - gap - w1);
      const h1 = Math.floor((safeH - gap) / 2);
      const h2 = Math.max(0, safeH - gap - h1);
      return [
        {
          id: 'slot-1',
          label: 'Quadrante 1 (Sup. Esq.)',
          x: 0,
          y: 0,
          width: Math.max(0, w1),
          height: Math.max(0, h1),
        },
        {
          id: 'slot-2',
          label: 'Quadrante 2 (Sup. Dir.)',
          x: Math.max(0, w1) + gap,
          y: 0,
          width: w2,
          height: Math.max(0, h1),
        },
        {
          id: 'slot-3',
          label: 'Quadrante 3 (Inf. Esq.)',
          x: 0,
          y: Math.max(0, h1) + gap,
          width: Math.max(0, w1),
          height: h2,
        },
        {
          id: 'slot-4',
          label: 'Quadrante 4 (Inf. Dir.)',
          x: Math.max(0, w1) + gap,
          y: Math.max(0, h1) + gap,
          width: w2,
          height: h2,
        },
      ];
    }

    default: {
      return [
        {
          id: 'slot-1',
          label: 'Coluna Única',
          x: 0,
          y: 0,
          width: safeW,
          height: safeH,
        },
      ];
    }
  }
}

/**
 * Finds the slot containing coordinates (x, y) relative to the band.
 */
export function findSlotAtPosition(
  slots: LayoutSlot[],
  x: number,
  y: number
): LayoutSlot | null {
  for (const slot of slots) {
    if (
      x >= slot.x &&
      x <= slot.x + slot.width &&
      y >= slot.y &&
      y <= slot.y + slot.height
    ) {
      return slot;
    }
  }
  return null;
}

/**
 * Calculates element dimensions to auto-fit into a slot with optional padding.
 */
export function fitElementToSlot(
  slot: LayoutSlot,
  padding = 0
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.round(slot.x + padding),
    y: Math.round(slot.y + padding),
    width: Math.max(10, Math.round(slot.width - padding * 2)),
    height: Math.max(10, Math.round(slot.height - padding * 2)),
  };
}
