export type GiftTier = 'heart' | 'flower' | 'donut' | 'big_gift';

export interface GiftDefinition {
  id: string;
  name: string;
  tier: GiftTier;
  coins: number;
  icon: string;
  badgeColor: string;
  description: string;
}

export interface DonorItem {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl: string;
  giftTier: GiftTier;
  giftName: string;
  coins: number;
  giftIcon: string;
  timestamp: number;
  comment?: string;
  status: 'drawing' | 'conveyor' | 'completed';
  drawnCanvasDataUrl?: string;
}

export interface StreamSettings {
  tiktokUsername: string;
  conveyorSpeed: number; // pixels per second (e.g. 60)
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  showBrushCursor: boolean;
  showPencilCursor?: boolean;
  autoSimulateRandomDonations: boolean;
  obsMode: boolean; // transparent background
  conveyorPosition: 'left' | 'right' | 'center';
  bannerText: string;
  drawOnLikes?: boolean; // trigger drawing when viewer gives screen likes / hearts
  likesThreshold?: number; // how many likes from a user needed to trigger drawing (e.g. 10)
}

export const PRESET_GIFTS: GiftDefinition[] = [
  {
    id: 'gift_yo',
    name: 'Escribir "yo" en el Chat',
    tier: 'heart',
    coins: 1,
    icon: '💬',
    badgeColor: 'from-slate-700 to-slate-900',
    description: 'Dibuja en Blanco y Negro (Sumi-e) cuando comentan "yo"',
  },
  {
    id: 'gift_flower',
    name: 'Flor',
    tier: 'flower',
    coins: 1,
    icon: '🌸',
    badgeColor: 'from-pink-500 to-rose-400',
    description: 'Regalo Flor (1 moneda) - Dibuja a Color Pequeño',
  },
  {
    id: 'gift_korean_heart',
    name: 'Corazoncito Coreano',
    tier: 'donut',
    coins: 5,
    icon: '🫰',
    badgeColor: 'from-rose-500 to-pink-600',
    description: 'Regalo Corazoncito Coreano (5 monedas) - Dibuja a Color Mediano',
  },
  {
    id: 'gift_rosquilla',
    name: 'Rosquilla / VIP',
    tier: 'big_gift',
    coins: 30,
    icon: '🍩',
    badgeColor: 'from-amber-400 via-yellow-500 to-amber-600',
    description: 'Regalo Rosquilla / VIP (30 monedas) - ¡Dibuja en PANTALLA COMPLETA con GOOT!',
  },
];
