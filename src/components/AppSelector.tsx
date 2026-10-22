import React from 'react';
import { Palette, Trophy, Radio, ExternalLink } from 'lucide-react';

export type ActiveAppId = 'printer' | 'soccer';

interface AppSelectorProps {
  activeApp: ActiveAppId;
  onSelectApp: (appId: ActiveAppId) => void;
  isTikTokConnected: boolean;
  tiktokUsername: string;
}

export const AppSelector: React.FC<AppSelectorProps> = ({
  activeApp,
  onSelectApp,
  isTikTokConnected,
  tiktokUsername,
}) => {
  return (
    <div className="bg-neutral-900/95 border-b border-neutral-800 backdrop-blur-md px-4 py-2 sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Apps Toggle Tabs */}
        <div className="flex items-center space-x-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => onSelectApp('printer')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
              activeApp === 'printer'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Palette size={15} />
            <span>App 1: Impresora de Fotos</span>
          </button>

          <button
            onClick={() => onSelectApp('soccer')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
              activeApp === 'soccer'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Trophy size={15} />
            <span>App 2: Batalla de Clubes Sudamericanos</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeApp === 'soccer' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              20
            </span>
          </button>
        </div>

        {/* Stream Status Info */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isTikTokConnected ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
            <span className="font-semibold text-neutral-300">
              {isTikTokConnected ? (
                <>
                  TikTok Conectado: <span className="text-emerald-400 font-bold">@{tiktokUsername}</span>
                </>
              ) : (
                <span className="text-neutral-400">TikTok: Desconectado</span>
              )}
            </span>
          </div>

          {/* Quick link for OBS transparent source */}
          <a
            href={`/?app=${activeApp}&overlay=1`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 font-bold transition-colors"
            title="Abrir vista OBS de esta app"
          >
            <span>OBS Overlay</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
