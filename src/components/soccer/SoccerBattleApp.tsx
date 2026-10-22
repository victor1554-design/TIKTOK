import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SoccerTeam, UserAffiliation, SoccerVoteLog, GiftVoteType } from '../../types/soccer';
import { INITIAL_SOCCER_TEAMS } from '../../data/southAmericanTeams';
import { ClubCrest } from './ClubCrest';
import { soccerAudio } from '../../utils/soccerAudio';
import { 
  Trophy, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  Flame, 
  Sparkles,
  ExternalLink,
  Users,
  Timer as TimerIcon,
  Crown,
  Monitor
} from 'lucide-react';

interface SoccerBattleAppProps {
  isObsOverlay?: boolean;
  isTikTokConnected: boolean;
  tiktokUsername: string;
  onOpenConnectModal?: () => void;
  onOpenObsGuide?: () => void;
}

export const SoccerBattleApp: React.FC<SoccerBattleAppProps> = ({
  isObsOverlay = false,
  isTikTokConnected,
  tiktokUsername,
  onOpenConnectModal,
  onOpenObsGuide,
}) => {
  // Load saved teams from localStorage or default
  const [teams, setTeams] = useState<SoccerTeam[]>(() => {
    try {
      const saved = localStorage.getItem('tiktok_soccer_teams_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SOCCER_TEAMS;
  });

  // User affiliations map: uniqueId (lowercase) -> UserAffiliation
  const [affiliations, setAffiliations] = useState<Record<string, UserAffiliation>>(() => {
    try {
      const saved = localStorage.getItem('tiktok_soccer_affiliations_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Unassigned donations waiting for user to type club name
  const [pendingDonations, setPendingDonations] = useState<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    giftName: string;
    giftIcon: string;
    points: number;
    timestamp: number;
  }[]>([]);

  // Recent vote logs
  const [voteLogs, setVoteLogs] = useState<SoccerVoteLog[]>([]);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundVolume, setSoundVolume] = useState<number>(0.7);

  // Active celebration banner (for gifts)
  const [celebration, setCelebration] = useState<{
    teamName: string;
    teamId: string;
    donorName: string;
    donorAvatar: string;
    points: number;
    giftIcon: string;
    giftName: string;
  } | null>(null);

  // Round Winner Modal / Announcement
  const [roundWinner, setRoundWinner] = useState<{
    team: SoccerTeam;
    roundNumber: number;
  } | null>(null);

  // Streamer controls
  const [selectedTeamId, setSelectedTeamId] = useState<string>('boca');
  const [copiedObs, setCopiedObs] = useState<boolean>(false);
  const [autoAssignUnknownToSelected, setAutoAssignUnknownToSelected] = useState<boolean>(false);

  // ========================================================
  // ROUND TIMER SYSTEM (5 min, 10 min, etc.)
  // ========================================================
  const [roundDurationMinutes, setRoundDurationMinutes] = useState<number>(5);
  const [secondsLeft, setSecondsLeft] = useState<number>(5 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const timerRef = useRef<any>(null);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tiktok_soccer_teams_v2', JSON.stringify(teams));
    } catch {}
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem('tiktok_soccer_affiliations_v2', JSON.stringify(affiliations));
    } catch {}
  }, [affiliations]);

  // Audio settings sync
  useEffect(() => {
    soccerAudio.setEnabled(soundEnabled);
    soccerAudio.setVolume(soundVolume);
  }, [soundEnabled, soundVolume]);

  // 1. Right Screen: Ranking of Votes in Active Round (Top 20 Teams)
  const top20ByPoints = useMemo(() => {
    const sorted = [...teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.votesCount - a.votesCount;
    });
    return sorted.slice(0, 20);
  }, [teams]);

  // 2. Left Screen: Historical Ranking of Championships / Times Won (Palmarés)
  const rankedByWins = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.winsCount !== a.winsCount) return b.winsCount - a.winsCount;
      return b.points - a.points;
    });
  }, [teams]);

  const maxPoints = useMemo(() => {
    return Math.max(...top20ByPoints.map((t) => t.points), 1);
  }, [top20ByPoints]);

  const currentLeader = top20ByPoints[0];

  // Helper: Find which team matches a comment (ONLY club name / hashtag, NO pure numbers!)
  const findTeamForComment = useCallback((comment: string): SoccerTeam | null => {
    if (!comment) return null;
    let clean = comment.toLowerCase().trim();

    // Ignore if it's purely digits or # followed by only digits
    if (/^#?\d+$/.test(clean)) {
      return null;
    }

    // Remove leading # for flexible matching
    const noHash = clean.replace(/^#/, '');

    for (const team of teams) {
      const teamHash = team.hashtag.toLowerCase().replace(/^#/, '');
      const teamNameLower = team.name.toLowerCase();

      // Exact hashtag or word match
      if (noHash === teamHash || clean === team.hashtag.toLowerCase()) {
        return team;
      }

      // Exact team name match or contains full team name
      if (clean === teamNameLower || clean.includes(teamNameLower)) {
        return team;
      }

      // Check aliases (all non-numeric)
      for (const alias of team.aliases) {
        const al = alias.toLowerCase().replace(/^#/, '');
        if (noHash === al || clean.includes(al)) {
          return team;
        }
      }
    }
    return null;
  }, [teams]);

  // Apply vote points to a specific team
  const addPointsToTeam = useCallback(
    (
      teamId: string,
      points: number,
      donor: { username: string; displayName?: string; avatarUrl?: string },
      giftInfo: { giftName: string; giftIcon: string; giftType: GiftVoteType }
    ) => {
      // Play sound
      if (giftInfo.giftType === 'lion' || points >= 100) {
        soccerAudio.playLionSound();
      } else if (giftInfo.giftType === 'donut' || points >= 10) {
        soccerAudio.playDonutSound();
      } else if (giftInfo.giftType === 'rose' || points >= 5) {
        soccerAudio.playRoseSound();
      } else {
        soccerAudio.playHeartSound();
      }

      setTeams((prevTeams) => {
        return prevTeams.map((t) => {
          if (t.id === teamId) {
            const updatedRecent = [
              {
                username: donor.displayName || donor.username,
                avatarUrl: donor.avatarUrl || '',
                points,
                giftIcon: giftInfo.giftIcon,
                timestamp: Date.now(),
              },
              ...t.recentDonors.slice(0, 3),
            ];
            return {
              ...t,
              points: t.points + points,
              votesCount: t.votesCount + 1,
              recentDonors: updatedRecent,
            };
          }
          return t;
        });
      });

      const targetTeam = teams.find((t) => t.id === teamId);
      const teamName = targetTeam ? targetTeam.name : teamId;

      const cleanUser = donor.username.toLowerCase().trim();
      setAffiliations((prev) => {
        const existing = prev[cleanUser];
        return {
          ...prev,
          [cleanUser]: {
            uniqueId: cleanUser,
            displayName: donor.displayName || donor.username,
            avatarUrl: donor.avatarUrl || existing?.avatarUrl || '',
            teamId,
            assignedAt: existing?.assignedAt || Date.now(),
            totalPointsContributed: (existing?.totalPointsContributed || 0) + points,
          },
        };
      });

      const newLog: SoccerVoteLog = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: donor.username,
        displayName: donor.displayName || donor.username,
        avatarUrl: donor.avatarUrl || '',
        teamId,
        teamName,
        giftName: giftInfo.giftName,
        giftIcon: giftInfo.giftIcon,
        pointsAdded: points,
        timestamp: Date.now(),
      };
      setVoteLogs((prev) => [newLog, ...prev.slice(0, 24)]);

      setCelebration({
        teamName,
        teamId,
        donorName: donor.displayName || donor.username,
        donorAvatar: donor.avatarUrl || '',
        points,
        giftIcon: giftInfo.giftIcon,
        giftName: giftInfo.giftName,
      });

      setTimeout(() => {
        setCelebration((curr) => (curr?.donorName === (donor.displayName || donor.username) ? null : curr));
      }, 3500);
    },
    [teams]
  );

  // Incoming TikTok Live Chat Event
  const handleIncomingChat = useCallback(
    (chat: { uniqueId: string; displayName: string; comment: string; avatarUrl: string }) => {
      const cleanUser = chat.uniqueId.toLowerCase().trim();
      const matchedTeam = findTeamForComment(chat.comment);

      if (matchedTeam) {
        setAffiliations((prev) => ({
          ...prev,
          [cleanUser]: {
            uniqueId: cleanUser,
            displayName: chat.displayName || chat.uniqueId,
            avatarUrl: chat.avatarUrl || prev[cleanUser]?.avatarUrl || '',
            teamId: matchedTeam.id,
            assignedAt: Date.now(),
            totalPointsContributed: prev[cleanUser]?.totalPointsContributed || 0,
            lastComment: chat.comment,
          },
        }));

        soccerAudio.playWhistleSound();

        // Process any pending donations
        setPendingDonations((prevPending) => {
          const userPendings = prevPending.filter((p) => p.username.toLowerCase() === cleanUser);
          if (userPendings.length > 0) {
            for (const p of userPendings) {
              addPointsToTeam(
                matchedTeam.id,
                p.points,
                { username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl },
                { giftName: p.giftName, giftIcon: p.giftIcon, giftType: 'custom' }
              );
            }
          }
          return prevPending.filter((p) => p.username.toLowerCase() !== cleanUser);
        });
      }
    },
    [findTeamForComment, addPointsToTeam]
  );

  // Incoming TikTok Live Gift Event
  const handleIncomingGift = useCallback(
    (gift: {
      username: string;
      nickname?: string;
      avatarUrl: string;
      giftTier?: string;
      giftName: string;
      coins?: number;
      giftIcon?: string;
      repeatCount?: number;
    }) => {
      const cleanUser = gift.username.toLowerCase().trim();
      const count = Math.max(1, gift.repeatCount || 1);
      const giftLower = (gift.giftName || '').toLowerCase();

      // Exact points:
      // Corazón: 1 punto
      // Rosa: 5 puntos
      // Donut: 10 puntos
      // León: 150 puntos
      let basePoints = 1;
      let giftType: GiftVoteType = 'heart';
      let icon = '❤️';

      if (giftLower.includes('lion') || giftLower.includes('león') || giftLower.includes('leon') || (gift.coins && gift.coins >= 1000)) {
        basePoints = 150;
        giftType = 'lion';
        icon = '🦁';
      } else if (giftLower.includes('donut') || giftLower.includes('dona') || giftLower.includes('doughnut') || (gift.coins && gift.coins >= 30)) {
        basePoints = 10;
        giftType = 'donut';
        icon = '🍩';
      } else if (giftLower.includes('rose') || giftLower.includes('rosa') || giftLower.includes('flor') || giftLower.includes('flower')) {
        basePoints = 5;
        giftType = 'rose';
        icon = '🌹';
      } else {
        basePoints = 1;
        giftType = 'heart';
        icon = '❤️';
      }

      const totalPoints = basePoints * count;
      const affiliation = affiliations[cleanUser];

      if (affiliation) {
        addPointsToTeam(
          affiliation.teamId,
          totalPoints,
          { username: gift.username, displayName: gift.nickname || gift.username, avatarUrl: gift.avatarUrl },
          { giftName: `${gift.giftName} (x${count})`, giftIcon: icon, giftType }
        );
      } else if (autoAssignUnknownToSelected && selectedTeamId) {
        addPointsToTeam(
          selectedTeamId,
          totalPoints,
          { username: gift.username, displayName: gift.nickname || gift.username, avatarUrl: gift.avatarUrl },
          { giftName: `${gift.giftName} (x${count})`, giftIcon: icon, giftType }
        );
      } else {
        soccerAudio.playHeartSound();
        setPendingDonations((prev) => [
          {
            id: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            username: gift.username,
            displayName: gift.nickname || gift.username,
            avatarUrl: gift.avatarUrl,
            giftName: `${gift.giftName} (x${count})`,
            giftIcon: icon,
            points: totalPoints,
            timestamp: Date.now(),
          },
          ...prev.slice(0, 8),
        ]);
      }
    },
    [affiliations, autoAssignUnknownToSelected, selectedTeamId, addPointsToTeam]
  );

  // SSE Stream Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connectSSE() {
      eventSource = new EventSource('/api/tiktok/stream');

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'chat') {
            handleIncomingChat(parsed.data);
          } else if (parsed.type === 'gift') {
            handleIncomingGift(parsed.data);
          } else if (parsed.type === 'like') {
            const likeData = parsed.data;
            const cleanUser = (likeData.username || '').toLowerCase().trim();
            const affiliation = affiliations[cleanUser];
            if (affiliation) {
              addPointsToTeam(
                affiliation.teamId,
                1,
                { username: likeData.username, displayName: likeData.nickname || likeData.username, avatarUrl: likeData.avatarUrl },
                { giftName: `❤️ ${likeData.likeCount || 1} Likes`, giftIcon: '❤️', giftType: 'heart' }
              );
            }
          }
        } catch (err) {
          console.error('Error procesando evento TikTok:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        reconnectTimeout = setTimeout(connectSSE, 4000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [handleIncomingChat, handleIncomingGift]);

  // ========================================================
  // TIMER TICK LOGIC & FINISH ROUND HANDLER
  // ========================================================
  const handleFinishRound = useCallback(() => {
    setIsTimerRunning(false);

    if (top20ByPoints.length > 0) {
      const winner = top20ByPoints[0];
      // Increment winner's championship / victories count!
      setTeams((prev) =>
        prev.map((t) => (t.id === winner.id ? { ...t, winsCount: t.winsCount + 1 } : t))
      );

      // Play victory fanfare
      soccerAudio.playVictoryFanfare();

      // Show winner modal
      setRoundWinner({
        team: { ...winner, winsCount: winner.winsCount + 1 },
        roundNumber,
      });
    }
  }, [top20ByPoints, roundNumber]);

  useEffect(() => {
    if (!isTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, handleFinishRound]);

  // Start new round (resets current round points to 0, resets timer, increments round #, keeps winsCount!)
  const handleStartNewRound = (newDurationMinutes?: number) => {
    const mins = newDurationMinutes || roundDurationMinutes;
    setRoundDurationMinutes(mins);
    setSecondsLeft(mins * 60);
    setIsTimerRunning(true);
    setRoundWinner(null);
    setRoundNumber((r) => r + 1);

    // Reset current round points for fresh battle, but RETAIN winsCount!
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        points: 0,
        votesCount: 0,
        recentDonors: [],
      }))
    );
    setPendingDonations([]);
    setVoteLogs([]);
  };

  // Change duration preset
  const handleSelectDuration = (minutes: number) => {
    setRoundDurationMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setIsTimerRunning(false);
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Reset everything to factory initial
  const handleFactoryReset = () => {
    setTeams(INITIAL_SOCCER_TEAMS);
    setAffiliations({});
    setPendingDonations([]);
    setVoteLogs([]);
    setRoundNumber(1);
    setSecondsLeft(roundDurationMinutes * 60);
    setIsTimerRunning(false);
    setRoundWinner(null);
  };

  // Copy OBS URL
  const handleCopyObsUrl = () => {
    const url = `${window.location.origin}/?app=soccer&overlay=1`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedObs(true);
      setTimeout(() => setCopiedObs(false), 2000);
    });
  };

  // ========================================================
  // RENDER: OBS DEDICATED OVERLAY VIEW (TWO SCREENS)
  // ========================================================
  if (isObsOverlay) {
    return (
      <div className="relative w-screen h-screen bg-transparent overflow-hidden select-none p-3 font-sans text-white">
        {/* Top Header: Timer + Live Game Info + Gifts Legend */}
        <div className="bg-gradient-to-r from-neutral-950/95 via-neutral-900/95 to-neutral-950/95 border border-amber-500/40 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md mb-2.5 flex items-center justify-between">
          {/* Left: Round & Live Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
              ⚽
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black uppercase tracking-wider text-amber-400">
                  Batalla Sudamericana
                </span>
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span>EN VIVO</span>
                </span>
                <span className="text-xs font-mono font-bold text-neutral-400">
                  Ronda #{roundNumber}
                </span>
              </div>
              <div className="text-xs text-neutral-300 font-medium">
                Escribe en el chat el <span className="text-amber-300 font-bold">NOMBRE</span> de tu equipo (ej: <code className="text-amber-300 font-bold">#boca</code>, <code className="text-amber-300 font-bold">#river</code>) y dona
              </div>
            </div>
          </div>

          {/* Center: Big Countdown Timer */}
          <div className="flex items-center space-x-2 bg-neutral-950 border border-amber-500/50 rounded-xl px-4 py-1.5 shadow-lg">
            <TimerIcon size={18} className={`${isTimerRunning ? 'text-amber-400 animate-pulse' : 'text-neutral-500'}`} />
            <span className="font-mono text-2xl font-black tracking-widest text-amber-400">
              {formatTime(secondsLeft)}
            </span>
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              {secondsLeft === 0 ? 'FIN' : isTimerRunning ? 'RESTANTE' : 'PAUSA'}
            </span>
          </div>

          {/* Right: Gift Points Legend */}
          <div className="flex items-center space-x-2 bg-neutral-900/90 border border-neutral-700/60 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center space-x-1 pr-2 border-r border-neutral-700">
              <span className="text-base">❤️</span>
              <span className="font-bold text-white">1 pt</span>
            </div>
            <div className="flex items-center space-x-1 pr-2 border-r border-neutral-700">
              <span className="text-base">🌹</span>
              <span className="font-bold text-white">5 pts</span>
            </div>
            <div className="flex items-center space-x-1 pr-2 border-r border-neutral-700">
              <span className="text-base">🍩</span>
              <span className="font-bold text-white">10 pts</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-base">🦁</span>
              <span className="font-black text-amber-400">150 pts</span>
            </div>
          </div>
        </div>

        {/* Celebration Toast (pops up over stream) */}
        {celebration && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-neutral-950 px-5 py-2.5 rounded-2xl shadow-2xl border-2 border-white flex items-center space-x-3">
              <span className="text-3xl">{celebration.giftIcon}</span>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  ¡Gran Donación de @{celebration.donorName}!
                </div>
                <div className="text-sm font-extrabold text-neutral-950">
                  +{celebration.points} pts para {celebration.teamName} 🚀
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Round Winner Overlay Modal */}
        {roundWinner && (
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-amber-950 border-2 border-amber-400 rounded-3xl p-6 text-center max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <span className="text-5xl mb-2 inline-block animate-bounce">🏆</span>
              <div className="text-xs uppercase font-black tracking-widest text-amber-400">
                ¡FINAL DE LA RONDA #{roundWinner.roundNumber}!
              </div>
              <h2 className="text-3xl font-black text-white mt-1 mb-2">
                ¡{roundWinner.team.name} Campeón!
              </h2>

              <div className="my-4 flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-neutral-950 border border-amber-500/50 flex items-center justify-center p-3 shadow-xl">
                  <ClubCrest
                    teamId={roundWinner.team.id}
                    size={60}
                    primaryColor={roundWinner.team.primaryColor}
                    secondaryColor={roundWinner.team.secondaryColor}
                    shortName={roundWinner.team.shortName}
                  />
                </div>
              </div>

              <div className="text-amber-300 font-extrabold text-lg">
                ⭐ {roundWinner.team.winsCount} Victorias Históricas
              </div>
              <p className="text-xs text-neutral-400 mt-1 mb-4">
                Ganó esta ronda con {roundWinner.team.points.toLocaleString()} puntos de sus hinchas
              </p>

              <button
                onClick={() => handleStartNewRound()}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg transition-colors"
              >
                Iniciar Siguiente Ronda (5 Min)
              </button>
            </div>
          </div>
        )}

        {/* TWO SCREENS LAYOUT (LEFT: HISTORICAL WINS / RIGHT: LIVE VOTES TOP 20) */}
        <div className="grid grid-cols-2 gap-3 h-[calc(100vh-85px)]">
          {/* PANTALLA 1 (IZQUIERDA): RANKING HISTÓRICO DE VECES GANADAS */}
          <div className="bg-neutral-900/85 border border-amber-500/30 rounded-2xl p-2.5 backdrop-blur-md flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <Trophy size={16} className="text-amber-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Palmarés Histórico (Veces Ganadas)
                </h2>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                Partidas Ganadas
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {rankedByWins.slice(0, 20).map((team, index) => {
                const isChampion = index === 0 && team.winsCount > 0;
                return (
                  <div
                    key={`hist_${team.id}`}
                    className={`rounded-xl border px-2.5 py-1.5 flex items-center justify-between transition-colors ${
                      isChampion
                        ? 'bg-amber-500/15 border-amber-400/80 shadow-md'
                        : team.winsCount > 0
                        ? 'bg-neutral-850 border-neutral-700/80'
                        : 'bg-neutral-900/50 border-neutral-800/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-5 text-center text-xs font-bold text-neutral-400">
                        {index + 1}º
                      </span>
                      <span className="text-sm">{team.flag}</span>
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        <ClubCrest
                          teamId={team.id}
                          size={24}
                          primaryColor={team.primaryColor}
                          secondaryColor={team.secondaryColor}
                          shortName={team.shortName}
                        />
                      </div>
                      <span className="text-xs font-bold text-white truncate">{team.name}</span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <span className="text-amber-400 font-black text-sm">
                        {team.winsCount}
                      </span>
                      <span className="text-xs">🏆</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANTALLA 2 (DERECHA): RANKING DE VOTOS EN VIVO (TOP 20) */}
          <div className="bg-neutral-900/85 border border-neutral-700/80 rounded-2xl p-2.5 backdrop-blur-md flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <Flame size={16} className="text-amber-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white">
                  Votación en Vivo (Top 20 de la Ronda)
                </h2>
              </div>
              <span className="text-[10px] text-amber-300 font-mono font-bold">
                Actualizado en tiempo real
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {top20ByPoints.map((team, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                const progress = Math.max(5, Math.round((team.points / maxPoints) * 100));

                return (
                  <div
                    key={`live_${team.id}`}
                    className={`relative overflow-hidden rounded-xl border px-2.5 py-1.5 flex items-center justify-between transition-all duration-300 ${
                      isFirst
                        ? 'bg-neutral-900/90 border-amber-400 shadow-md shadow-amber-500/20'
                        : isSecond
                        ? 'bg-neutral-900/85 border-slate-300/60'
                        : isThird
                        ? 'bg-neutral-900/85 border-amber-700/60'
                        : 'bg-neutral-900/70 border-neutral-800'
                    }`}
                  >
                    {/* Animated Progress Bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 opacity-20 pointer-events-none transition-all duration-500 rounded-xl"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: team.primaryColor === '#ffffff' ? team.secondaryColor : team.primaryColor,
                      }}
                    />

                    {/* Rank Badge & Crest */}
                    <div className="flex items-center space-x-2 z-10 min-w-0">
                      <div className="w-5 text-center font-black shrink-0">
                        {isFirst ? (
                          <span className="text-sm">🥇</span>
                        ) : isSecond ? (
                          <span className="text-xs">🥈</span>
                        ) : isThird ? (
                          <span className="text-xs">🥉</span>
                        ) : (
                          <span className="text-xs text-neutral-400 font-bold">{index + 1}º</span>
                        )}
                      </div>

                      <span className="text-sm">{team.flag}</span>
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        <ClubCrest
                          teamId={team.id}
                          size={25}
                          primaryColor={team.primaryColor}
                          secondaryColor={team.secondaryColor}
                          shortName={team.shortName}
                        />
                      </div>

                      <div className="truncate">
                        <div className="text-xs font-black text-white truncate">{team.name}</div>
                        <div className="text-[10px] text-amber-300/80 font-mono">
                          {team.hashtag}
                        </div>
                      </div>
                    </div>

                    {/* Points Total */}
                    <div className="text-right z-10 shrink-0 ml-2">
                      <div
                        className={`font-black tracking-tight ${
                          isFirst
                            ? 'text-sm text-amber-400'
                            : isSecond
                            ? 'text-xs text-slate-200'
                            : isThird
                            ? 'text-xs text-amber-500'
                            : 'text-xs text-white'
                        }`}
                      >
                        {team.points.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-neutral-400 uppercase font-semibold">pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: STREAMER STUDIO CONSOLE & DASHBOARD
  // ========================================================
  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Banner & Timer Controls */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Title & Connection Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
              ⚽
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black tracking-wide text-white">
                  Batalla Sudamericana de Fútbol
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {teams.length} Equipos en Catálogo
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ronda #{roundNumber}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Dos pantallas: Palmarés de Campeonatos (Izquierda) + Votación en Vivo Top 20 (Derecha)
              </p>
            </div>
          </div>

          {/* Round Timer & Controls */}
          <div className="flex items-center space-x-2 bg-neutral-950 border border-neutral-800 rounded-xl p-1.5 shadow">
            {/* Duration Selector */}
            <div className="flex items-center space-x-1 pr-2 border-r border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-semibold px-1">Tiempo:</span>
              {[3, 5, 10, 15].map((m) => (
                <button
                  key={m}
                  onClick={() => handleSelectDuration(m)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                    roundDurationMinutes === m
                      ? 'bg-amber-500 text-neutral-950'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {/* Live Clock Display */}
            <div className="px-3 flex items-center space-x-2">
              <TimerIcon size={16} className={isTimerRunning ? 'text-amber-400 animate-pulse' : 'text-neutral-500'} />
              <span className="font-mono text-xl font-black text-amber-400 tracking-wider">
                {formatTime(secondsLeft)}
              </span>
            </div>

            {/* Play / Pause Button */}
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 shadow transition-colors ${
                isTimerRunning
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
              <span>{isTimerRunning ? 'Pausar' : 'Iniciar'}</span>
            </button>

            {/* Restart Current Round */}
            <button
              onClick={() => handleStartNewRound()}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center space-x-1 transition-colors"
              title="Reiniciar ronda actual con puntajes a cero (mantiene palmarés)"
            >
              <RotateCcw size={13} />
              <span>Nueva Ronda</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* TikTok Status */}
            <div
              onClick={onOpenConnectModal}
              className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                isTikTokConnected
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isTikTokConnected ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                }`}
              />
              <span>{isTikTokConnected ? `@${tiktokUsername}` : 'Conectar TikTok'}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 transition-colors"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Copy OBS URL */}
            <button
              onClick={handleCopyObsUrl}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center space-x-1.5 shadow transition-colors"
            >
              {copiedObs ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedObs ? '¡Copiado!' : 'Copiar URL OBS'}</span>
            </button>

            {/* OBS Guide Modal Trigger */}
            {onOpenObsGuide && (
              <button
                onClick={onOpenObsGuide}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-cyan-300 font-bold text-xs flex items-center space-x-1 transition-colors"
                title="Ver pasos e instrucciones para conectar OBS"
              >
                <Monitor size={14} />
                <span>Pasos OBS</span>
              </button>
            )}

            {/* Open Overlay in New Tab */}
            <a
              href="/?app=soccer&overlay=1"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 transition-colors"
              title="Abrir vista completa transparente para OBS"
            >
              <ExternalLink size={16} />
            </a>

            {/* Factory Reset */}
            <button
              onClick={handleFactoryReset}
              title="Reiniciar todo a valores iniciales"
              className="px-2 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-semibold"
            >
              Reset Total
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Screen Studio Viewport */}
      <div className="max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* PANTALLA 1 (IZQUIERDA): RANKING HISTÓRICO DE VECES GANADAS (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-md flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <Trophy size={18} className="text-amber-400" />
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-wider">
                    Palmarés de Campeonatos
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Historial de veces que cada club ha ganado el juego
                  </p>
                </div>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                {rankedByWins.filter((t) => t.winsCount > 0).length} Campeones
              </span>
            </div>

            {/* Historical Champions List */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1 flex-1">
              {rankedByWins.map((team, index) => {
                const isChampion = index === 0 && team.winsCount > 0;
                return (
                  <div
                    key={`hist_ctrl_${team.id}`}
                    className={`rounded-xl border px-3 py-2 flex items-center justify-between transition-colors ${
                      isChampion
                        ? 'bg-amber-500/15 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                        : team.winsCount > 0
                        ? 'bg-neutral-850 border-neutral-750'
                        : 'bg-neutral-850/50 border-neutral-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="w-5 text-center text-xs font-bold text-neutral-400">
                        {index + 1}º
                      </span>
                      <span className="text-base">{team.flag}</span>
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        <ClubCrest
                          teamId={team.id}
                          size={26}
                          primaryColor={team.primaryColor}
                          secondaryColor={team.secondaryColor}
                          shortName={team.shortName}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{team.name}</div>
                        <div className="text-[10px] text-neutral-400">{team.country}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-amber-400 font-black text-sm">
                        {team.winsCount}
                      </span>
                      <span className="text-xs">🏆</span>
                      {/* Manual +1 win button for streamer */}
                      <button
                        onClick={() =>
                          setTeams((prev) =>
                            prev.map((t) => (t.id === team.id ? { ...t, winsCount: t.winsCount + 1 } : t))
                          )
                        }
                        title="Sumar 1 victoria manual"
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-300"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANTALLA 2 (DERECHA): VOTACIÓN EN VIVO DE LA RONDA ACTUAL (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Top Leader Showcase Card */}
          {currentLeader && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-amber-500/40 flex items-center justify-center p-2 shadow-lg">
                      <ClubCrest
                        teamId={currentLeader.id}
                        size={50}
                        primaryColor={currentLeader.primaryColor}
                        secondaryColor={currentLeader.secondaryColor}
                        shortName={currentLeader.shortName}
                      />
                    </div>
                    <span className="absolute -top-2 -left-2 text-xl">👑</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                        1º LÍDER DE LA RONDA #{roundNumber}
                      </span>
                      <span className="text-base">{currentLeader.flag}</span>
                    </div>
                    <h2 className="text-xl font-black text-white">{currentLeader.name}</h2>
                    <p className="text-xs text-neutral-400">
                      Votar en chat: <span className="text-amber-300 font-bold">{currentLeader.hashtag}</span> (sin números)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-amber-400 tracking-tight">
                    {currentLeader.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-400 uppercase font-bold">Puntos Ronda</div>
                  <div className="text-[11px] text-amber-300/80 font-semibold mt-0.5">
                    {currentLeader.votesCount} votos
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Donations Alert */}
          {pendingDonations.length > 0 && (
            <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles size={14} className="animate-spin text-amber-400" />
                  <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                    Donaciones esperando nombre de club ({pendingDonations.length})
                  </span>
                </div>
                <label className="text-[11px] text-neutral-300 flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAssignUnknownToSelected}
                    onChange={(e) => setAutoAssignUnknownToSelected(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Auto-asignar al seleccionado</span>
                </label>
              </div>

              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {pendingDonations.map((pending) => (
                  <div
                    key={pending.id}
                    className="bg-neutral-900/90 border border-neutral-700/80 rounded-lg p-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{pending.giftIcon}</span>
                      <span className="font-bold text-white">@{pending.displayName}</span>
                      <span className="text-neutral-400">
                        envió {pending.giftName} (+{pending.points} pts)
                      </span>
                    </div>

                    <select
                      onChange={(e) => {
                        const targetId = e.target.value;
                        if (targetId) {
                          addPointsToTeam(
                            targetId,
                            pending.points,
                            {
                              username: pending.username,
                              displayName: pending.displayName,
                              avatarUrl: pending.avatarUrl,
                            },
                            { giftName: pending.giftName, giftIcon: pending.giftIcon, giftType: 'custom' }
                          );
                          setPendingDonations((curr) => curr.filter((p) => p.id !== pending.id));
                        }
                      }}
                      defaultValue=""
                      className="bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="" disabled>
                        Asignar club...
                      </option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.flag} {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 20 Live Ranked Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-md flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Flame size={18} className="text-amber-400" />
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">
                  Ranking de Votos en Vivo (Top 20 de la Ronda)
                </h3>
              </div>
              <span className="text-xs text-neutral-400">
                Se actualiza automáticamente con cada regalo
              </span>
            </div>

            {/* Rows List */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {top20ByPoints.map((team, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;
                const progress = Math.max(5, Math.round((team.points / maxPoints) * 100));
                const isSelected = selectedTeamId === team.id;

                return (
                  <div
                    key={`live_table_${team.id}`}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`cursor-pointer relative overflow-hidden rounded-xl border transition-all duration-200 px-3 py-2 flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400/80 ring-1 ring-amber-400/40'
                        : isFirst
                        ? 'bg-neutral-850 border-amber-500/40'
                        : 'bg-neutral-850/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Background Progress Bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 opacity-15 pointer-events-none rounded-xl transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: team.primaryColor === '#ffffff' ? team.secondaryColor : team.primaryColor,
                      }}
                    />

                    {/* Rank, Crest & Info */}
                    <div className="flex items-center space-x-2.5 z-10 min-w-0">
                      <div className="w-6 text-center font-black shrink-0">
                        {isFirst ? (
                          <span className="text-base">🥇</span>
                        ) : isSecond ? (
                          <span className="text-sm">🥈</span>
                        ) : isThird ? (
                          <span className="text-sm">🥉</span>
                        ) : (
                          <span className="text-xs text-neutral-400">{idx + 1}º</span>
                        )}
                      </div>

                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <ClubCrest
                          teamId={team.id}
                          size={30}
                          primaryColor={team.primaryColor}
                          secondaryColor={team.secondaryColor}
                          shortName={team.shortName}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-extrabold text-white truncate">{team.name}</span>
                          <span className="text-xs">{team.flag}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center space-x-2">
                          <span className="font-mono text-amber-300">{team.hashtag}</span>
                          <span>·</span>
                          <span>{team.votesCount} votos</span>
                          <span>·</span>
                          <span>🏆 {team.winsCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Points & Quick Streamer Simulators */}
                    <div className="flex items-center space-x-3 z-10 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-black text-amber-400 tracking-tight">
                          {team.points.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-neutral-400 uppercase font-bold">pts</div>
                      </div>

                      {/* Simulator Buttons */}
                      <div className="hidden sm:flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addPointsToTeam(
                              team.id,
                              1,
                              { username: 'streamer', displayName: 'Streamer' },
                              { giftName: 'Corazón', giftIcon: '❤️', giftType: 'heart' }
                            );
                          }}
                          title="Simular Corazón (+1 pt)"
                          className="px-1.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-white"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addPointsToTeam(
                              team.id,
                              5,
                              { username: 'streamer', displayName: 'Streamer' },
                              { giftName: 'Rosa', giftIcon: '🌹', giftType: 'rose' }
                            );
                          }}
                          title="Simular Rosa (+5 pts)"
                          className="px-1.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-white"
                        >
                          🌹
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addPointsToTeam(
                              team.id,
                              10,
                              { username: 'streamer', displayName: 'Streamer' },
                              { giftName: 'Donut', giftIcon: '🍩', giftType: 'donut' }
                            );
                          }}
                          title="Simular Donut (+10 pts)"
                          className="px-1.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-white"
                        >
                          🍩
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addPointsToTeam(
                              team.id,
                              150,
                              { username: 'streamer', displayName: 'Streamer' },
                              { giftName: 'León', giftIcon: '🦁', giftType: 'lion' }
                            );
                          }}
                          title="Simular León (+150 pts)"
                          className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-xs font-bold text-amber-300"
                        >
                          🦁 150
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Streamer Simulation Panel for any team */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-neutral-400 font-semibold">Simular donación para:</span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.flag} {t.name} ({t.points} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    addPointsToTeam(
                      selectedTeamId,
                      1,
                      { username: 'sim_viewer', displayName: 'Espectador' },
                      { giftName: 'Corazón', giftIcon: '❤️', giftType: 'heart' }
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center space-x-1"
                >
                  <span>❤️</span>
                  <span>+1</span>
                </button>
                <button
                  onClick={() =>
                    addPointsToTeam(
                      selectedTeamId,
                      5,
                      { username: 'sim_viewer', displayName: 'Espectador' },
                      { giftName: 'Rosa', giftIcon: '🌹', giftType: 'rose' }
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center space-x-1"
                >
                  <span>🌹</span>
                  <span>+5</span>
                </button>
                <button
                  onClick={() =>
                    addPointsToTeam(
                      selectedTeamId,
                      10,
                      { username: 'sim_viewer', displayName: 'Espectador' },
                      { giftName: 'Donut', giftIcon: '🍩', giftType: 'donut' }
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center space-x-1"
                >
                  <span>🍩</span>
                  <span>+10</span>
                </button>
                <button
                  onClick={() =>
                    addPointsToTeam(
                      selectedTeamId,
                      150,
                      { username: 'super_fan', displayName: 'Super Donante' },
                      { giftName: 'León', giftIcon: '🦁', giftType: 'lion' }
                    )
                  }
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-xs font-black text-amber-300 flex items-center space-x-1"
                >
                  <span>🦁</span>
                  <span>+150</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
