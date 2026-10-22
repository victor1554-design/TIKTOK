import React, { useState } from 'react';
import { DonorItem, GiftTier, PRESET_GIFTS, StreamSettings } from '../types/tiktok';
import { PRESET_AVATARS } from '../utils/avatarPresets';
import {
  Heart,
  Flower2,
  Sparkles,
  Crown,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Play,
  RotateCcw,
  Radio,
  Sliders,
  Upload,
  User,
  History,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface StreamerConsoleProps {
  settings: StreamSettings;
  onUpdateSettings: (newSettings: Partial<StreamSettings>) => void;
  onTriggerGift: (tier: GiftTier, customName?: string, customAvatar?: string, customComment?: string) => void;
  onClearQueue: () => void;
  recentDonors: DonorItem[];
  isTikTokConnected: boolean;
  isConnecting?: boolean;
  connectionError?: string | null;
  onToggleTikTokConnection: () => void;
  totalLikesCount?: number;
  onSimulateLikes?: (count?: number) => void;
}

export const StreamerConsole: React.FC<StreamerConsoleProps> = ({
  settings,
  onUpdateSettings,
  onTriggerGift,
  onClearQueue,
  recentDonors,
  isTikTokConnected,
  isConnecting = false,
  connectionError = null,
  onToggleTikTokConnection,
  totalLikesCount = 0,
  onSimulateLikes,
}) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'custom' | 'settings' | 'history'>('simulator');
  const [customUsername, setCustomUsername] = useState('fan_tiktok');
  const [customComment, setCustomComment] = useState('¡Hola streamer! Aquí mi donación ❤️');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].dataUrl);
  const [copiedObsLink, setCopiedObsLink] = useState(false);
  const [selectedGiftSlot1, setSelectedGiftSlot1] = useState('yo');
  const [selectedGiftSlot2, setSelectedGiftSlot2] = useState('Flor');
  const [selectedGiftSlot3, setSelectedGiftSlot3] = useState('Corazoncito Coreano');
  const [selectedGiftSlot4, setSelectedGiftSlot4] = useState('Rosquilla / VIP');

  const handleCopyObsLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?overlay=1`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedObsLink(true);
      setTimeout(() => setCopiedObsLink(false), 2500);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Top Header & TikTok Live Connection status */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
              Panel de Transmisión TikTok Live
            </h2>
            <p className="text-xs text-slate-400">
              Controla donaciones, velocidad de corredora y fuente OBS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyObsLink}
              className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
              title="Copiar enlace transparente para OBS Studio o TikTok Live Studio"
            >
              {copiedObsLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedObsLink ? '¡Enlace Copiado!' : 'Copiar URL para OBS'}</span>
            </button>
          </div>
        </div>

        {/* Live TikTok Streamer Bar */}
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-2">
          <div className="flex-1 flex items-center gap-2 px-2">
            <span className="text-xs font-bold text-slate-400">@</span>
            <input
              type="text"
              value={settings.tiktokUsername}
              onChange={(e) => onUpdateSettings({ tiktokUsername: e.target.value })}
              placeholder="tu_usuario_de_tiktok"
              disabled={isConnecting || isTikTokConnected}
              className="w-full bg-transparent text-xs font-semibold text-white placeholder-slate-500 focus:outline-none disabled:opacity-70"
            />
          </div>
          <button
            onClick={onToggleTikTokConnection}
            disabled={isConnecting}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              isConnecting
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-wait'
                : isTikTokConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                : 'bg-rose-600 text-white hover:bg-rose-500'
            }`}
          >
            {isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isTikTokConnected ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Radio className="h-3.5 w-3.5" />
            )}
            <span>
              {isConnecting
                ? 'Conectando...'
                : isTikTokConnected
                ? 'En Vivo (Desconectar)'
                : 'Conectar Live'}
            </span>
          </button>
        </div>

        {/* Status / Error feedback */}
        {connectionError && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-[11px] text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Error de conexión TikTok Live: </span>
              <span>{connectionError}</span>
              {connectionError.includes('EulerStream') || connectionError.includes('Business plan') || connectionError.includes('signature') ? (
                <p className="mt-1 text-[10px] text-amber-300/90 bg-amber-950/60 p-2 rounded-lg border border-amber-500/30">
                  💡 <strong>Nota sobre la API de firma (EulerStream):</strong> El conector externo de TikTok requiere un servicio de firma de peticiones (EulerStream) que ahora solicita un plan comercial para conexiones remotas en vivo. Puedes realizar <strong>todas tus pruebas interactivas</strong> (impresora continua, selector de regalos, chat "yo", likes y juego de fútbol) usando el <strong>Disparador Rápido</strong> de abajo sin necesidad de servicio externo.
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-rose-300/80">
                  Asegúrate de que el usuario esté transmitiendo en vivo actualmente en TikTok. No se permiten conexiones falsas en pruebas reales.
                </p>
              )}
            </div>
          </div>
        )}

        {isTikTokConnected && (
          <div className="mt-2.5 flex flex-col gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-[11px] text-emerald-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-emerald-200">En Vivo con @{settings.tiktokUsername}</span>
              </div>
              <span className="flex items-center gap-1 font-mono font-bold text-rose-300 bg-rose-950/70 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-[11px] shadow-sm">
                ❤️ {totalLikesCount.toLocaleString()} likes en vivo
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-emerald-900/40 text-[10px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 inline-block"></span>
                <span>
                  {settings.drawOnLikes !== false
                    ? `Likes de pantalla: Dibuja cada ${settings.likesThreshold || 10} toques ❤️`
                    : 'Likes de pantalla: Desactivados (solo regalos)'}
                </span>
              </span>
              <span className="text-amber-300 font-semibold">🎁 Regalos: Al instante</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 pt-2 gap-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2 transition-colors ${
            activeTab === 'simulator'
              ? 'bg-slate-900 text-white font-bold border-t border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>Disparador Rápido</span>
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2 transition-colors ${
            activeTab === 'custom'
              ? 'bg-slate-900 text-white font-bold border-t border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Donante Personalizado</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2 transition-colors ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white font-bold border-t border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Ajustes & OBS</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2 transition-colors ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white font-bold border-t border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Historial ({recentDonors.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* TAB 1: QUICK SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Configuración de Escucha y Disparadores (4 Niveles)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* 1. PEQUEÑO NEGRO (CHAT / TEXTO) */}
                <div className="flex flex-col rounded-2xl border border-slate-700 bg-slate-800/90 p-3.5 shadow-md">
                  <div className="flex w-full items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xl border border-slate-700">
                      💬
                    </span>
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                      Pequeño Negro (B&N)
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="font-bold text-white text-xs">Chat / Palabra clave</div>
                      <select
                        value={selectedGiftSlot1}
                        onChange={(e) => setSelectedGiftSlot1(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none focus:border-slate-500"
                      >
                        <option value="yo">Escribir "yo"</option>
                        <option value="hola">Escribir "hola"</option>
                        <option value="gg">Escribir "gg"</option>
                        <option value="dibujo">Escribir "dibujo"</option>
                      </select>
                    </div>
                    <button
                      onClick={() => onTriggerGift('heart', 'fan_chat', undefined, `💬 Escribió "${selectedGiftSlot1}"`)}
                      className="w-full rounded-xl bg-slate-700 py-1.5 text-xs font-bold text-white hover:bg-slate-600 transition-all active:scale-95"
                    >
                      Probar Disparo B&N
                    </button>
                  </div>
                </div>

                {/* 2. PEQUEÑO COLOR (FLOR / REGALO 1) */}
                <div className="flex flex-col rounded-2xl border border-pink-900/60 bg-gradient-to-br from-pink-950/40 to-slate-800 p-3.5 shadow-md">
                  <div className="flex w-full items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-900/50 text-xl border border-pink-700/50">
                      🌸
                    </span>
                    <span className="rounded-full bg-pink-950 px-2 py-0.5 text-[10px] font-bold text-pink-300 border border-pink-700/60">
                      Pequeño Color
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="font-bold text-white text-xs">Regalo (1 Moneda)</div>
                      <select
                        value={selectedGiftSlot2}
                        onChange={(e) => setSelectedGiftSlot2(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-pink-900 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="Flor">Flor (1 moneda)</option>
                        <option value="Rosa">Rosa (1 moneda)</option>
                        <option value="Girasol">Girasol (1 moneda)</option>
                      </select>
                    </div>
                    <button
                      onClick={() => onTriggerGift('flower', 'fan_flor', undefined, `🌸 Regalo ${selectedGiftSlot2}`)}
                      className="w-full rounded-xl bg-pink-600/60 border border-pink-500/40 py-1.5 text-xs font-bold text-pink-100 hover:bg-pink-600 transition-all active:scale-95"
                    >
                      Probar Flor
                    </button>
                  </div>
                </div>

                {/* 3. MEDIANO COLOR (CORAZONCITO / REGALO 2) */}
                <div className="flex flex-col rounded-2xl border border-rose-900/60 bg-gradient-to-br from-rose-950/40 to-slate-800 p-3.5 shadow-md">
                  <div className="flex w-full items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-900/50 text-xl border border-rose-700/50">
                      🫰
                    </span>
                    <span className="rounded-full bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-700/60">
                      Mediano Color
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="font-bold text-white text-xs">Regalo (5 Monedas)</div>
                      <select
                        value={selectedGiftSlot3}
                        onChange={(e) => setSelectedGiftSlot3(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-rose-900 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="Corazoncito Coreano">Corazoncito Coreano (5)</option>
                        <option value="Gafas de sol">Gafas de sol (5)</option>
                        <option value="Perfume">Perfume (5)</option>
                      </select>
                    </div>
                    <button
                      onClick={() => onTriggerGift('donut', 'fan_coreano', undefined, `🫰 Regalo ${selectedGiftSlot3}`)}
                      className="w-full rounded-xl bg-rose-600/60 border border-rose-500/40 py-1.5 text-xs font-bold text-rose-100 hover:bg-rose-600 transition-all active:scale-95"
                    >
                      Probar Mediano
                    </button>
                  </div>
                </div>

                {/* 4. GRANDE / GOOT (ROSQUILLA / VIP / REGALO 3) */}
                <div className="flex flex-col rounded-2xl border-2 border-yellow-500/80 bg-gradient-to-br from-amber-950/60 via-yellow-900/40 to-slate-800 p-3.5 shadow-lg">
                  <div className="flex w-full items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/20 text-xl border border-yellow-500/60">
                      🍩
                    </span>
                    <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                      Grande + GOOT
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="font-bold text-amber-200 text-xs">Regalo (30 Monedas)</div>
                      <select
                        value={selectedGiftSlot4}
                        onChange={(e) => setSelectedGiftSlot4(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-yellow-500/60 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none focus:border-yellow-400"
                      >
                        <option value="Rosquilla / VIP">Rosquilla / VIP (30+)</option>
                        <option value="León">León (29999+)</option>
                        <option value="Universo">Universo (34999+)</option>
                      </select>
                    </div>
                    <button
                      onClick={() => onTriggerGift('big_gift', 'fan_rosquilla', undefined, `🍩 Regalo ${selectedGiftSlot4}`)}
                      className="w-full rounded-xl bg-yellow-500 py-1.5 text-xs font-black text-slate-950 hover:bg-yellow-400 transition-all active:scale-95 shadow"
                    >
                      Probar Grande
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Screen Likes Simulator */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                  <span>Probar Taps de Pantalla (Likes gratuitos)</span>
                </div>
                <div className="text-[11px] text-rose-300/70">
                  Simula un espectador dando {settings.likesThreshold || 10} toques a la pantalla
                </div>
              </div>
              <button
                onClick={() =>
                  onSimulateLikes
                    ? onSimulateLikes(settings.likesThreshold || 10)
                    : onTriggerGift(
                        'heart',
                        'fan_taps',
                        undefined,
                        `❤️ ${settings.likesThreshold || 10} likes en pantalla`
                      )
                }
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-600/30 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-600/50 transition-all active:scale-95"
              >
                <span>+ {settings.likesThreshold || 10} Likes ❤️</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM DONOR */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400">Nombre de Usuario de TikTok</label>
              <div className="mt-1 flex items-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
                <span className="text-slate-400 font-bold">@</span>
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  className="ml-1 w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
                  placeholder="usuario_donante"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">Comentario / Mensaje</label>
              <input
                type="text"
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
                placeholder="¡Gracias por el directo!"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block">
                Selecciona Avatar o Sube una Foto
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.dataUrl)}
                    className={`relative shrink-0 rounded-full p-0.5 transition-all ${
                      selectedAvatar === av.dataUrl
                        ? 'ring-2 ring-rose-500 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av.dataUrl} alt={av.name} className="h-11 w-11 rounded-full object-cover" />
                  </button>
                ))}

                <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-slate-600 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-400 transition-colors">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-400 mb-2 block">
                Enviar con Regalo:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onTriggerGift('heart', customUsername, selectedAvatar, customComment)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-all"
                >
                  <span>❤️ Corazón (B&N)</span>
                </button>
                <button
                  onClick={() => onTriggerGift('flower', customUsername, selectedAvatar, customComment)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-pink-800/80 bg-pink-950/40 py-2.5 text-xs font-bold text-pink-200 hover:bg-pink-900/60 transition-all"
                >
                  <span>🌸 Flor (Color Chico)</span>
                </button>
                <button
                  onClick={() => onTriggerGift('donut', customUsername, selectedAvatar, customComment)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-800/80 bg-amber-950/40 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-900/60 transition-all"
                >
                  <span>🍩 Donut (Color Mediano)</span>
                </button>
                <button
                  onClick={() => onTriggerGift('big_gift', customUsername, selectedAvatar, customComment)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500 bg-yellow-500/20 py-2.5 text-xs font-black text-yellow-300 hover:bg-yellow-500/30 transition-all"
                >
                  <span>👑 Mega GOOT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS & OBS */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Speed Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Velocidad de Ascenso de la Corredora</span>
                <span className="font-mono text-cyan-400">{settings.conveyorSpeed} px/s</span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="5"
                value={settings.conveyorSpeed}
                onChange={(e) => onUpdateSettings({ conveyorSpeed: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Tranquilo (30)</span>
                <span>Normal (60)</span>
                <span>Rápido (120)</span>
              </div>
            </div>

            {/* LIKES & CORAZONES DE PANTALLA CONFIGURATION */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-rose-200">
                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                    <span>Dibujar con Likes de Pantalla (Taps ❤️)</span>
                  </div>
                  <div className="text-xs text-rose-300/80">
                    Dibuja la foto del espectador cuando toca la pantalla de TikTok
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      drawOnLikes: settings.drawOnLikes === false ? true : false,
                    })
                  }
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    settings.drawOnLikes !== false
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.drawOnLikes !== false ? 'Activado' : 'Desactivado'}
                </button>
              </div>

              {settings.drawOnLikes !== false && (
                <div className="pt-2 border-t border-rose-900/40">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                    <span>Likes requeridos por espectador para dibujar foto:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {settings.likesThreshold || 10} likes
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 5, 10, 15, 25].map((val) => (
                      <button
                        key={val}
                        onClick={() => onUpdateSettings({ likesThreshold: val })}
                        className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                          (settings.likesThreshold || 10) === val
                            ? 'bg-rose-600 text-white border border-rose-400 shadow'
                            : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {val === 1 ? '1 tap' : `${val} ❤️`}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    💡 Recomendado: 10 o 15 likes. Fomenta que la gente toque repetidamente tu directo en TikTok y suba tu interacción antes de que su avatar se dibuje.
                  </p>
                </div>
              )}
            </div>

            {/* Audio Toggle & Volume */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  {settings.soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                  <span>Sonidos de Dibujo y Fanfarria</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                    settings.soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.soundEnabled ? 'Activado' : 'Silencio'}
                </button>
              </div>

              {settings.soundEnabled && (
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Volumen</span>
                    <span className="font-mono">{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) => onUpdateSettings({ soundVolume: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Paintbrush tip visibility */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div>
                <div className="text-sm font-semibold text-slate-200">Pincel Artístico 🖌️</div>
                <div className="text-xs text-slate-400">Pincel con cerdas y tinta fluida para pintar en 2s</div>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({
                    showBrushCursor: !settings.showBrushCursor,
                    showPencilCursor: !settings.showBrushCursor,
                  })
                }
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  settings.showBrushCursor ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.showBrushCursor ? 'Visible' : 'Oculto'}
              </button>
            </div>

            {/* Clear queue */}
            <div className="pt-2">
              <button
                onClick={onClearQueue}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-900/60 bg-rose-950/30 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/50 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Vaciar Cola de la Corredora</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {recentDonors.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">
                Aún no hay donaciones registradas en esta sesión.
              </p>
            ) : (
              recentDonors.map((donor) => (
                <div
                  key={donor.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={donor.drawnCanvasDataUrl || donor.avatarUrl}
                      alt={donor.username}
                      className="h-9 w-9 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">@{donor.username}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>{donor.giftIcon}</span>
                        <span>{donor.giftName}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    +{donor.coins}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
