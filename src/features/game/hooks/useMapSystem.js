import { useState, useCallback, useRef } from 'react';
import {
  NODE_TYPES,
  NODE_WEIGHTS,
  NON_NORMAL_WEIGHTS,
  TOTAL_STAGES,
  ROUNDS_PER_STAGE,
  ACT_STRUCTURE,
} from '../constants/mapDefinitions';

// Gewichteter Zufallswürfel fuer Node-Typen
function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [type, weight] of entries) {
    r -= weight;
    if (r <= 0) return type;
  }
  return entries[0][0];
}

// Waehlt einen gewichteten Non-Normal Typ fuer Diversity Guarantee
function pickWeightedNonNormal(weights) {
  return weightedRandom(weights);
}

// Generiert eine vollstaendige Map gemaess ACT_STRUCTURE
function generateMapData() {
  const stages = [];

  for (let stageNum = 1; stageNum <= TOTAL_STAGES; stageNum++) {
    const stageIdx = stageNum - 1;
    const act = ACT_STRUCTURE[stageNum];

    if (act.forced) {
      let forcedType;
      if (act.forced === 'boss') {
        forcedType = NODE_TYPES.BOSS;
      } else if (act.forced === 'mini_boss') {
        forcedType = NODE_TYPES.MINI_BOSS;
      } else if (act.forced === 'normal') {
        forcedType = NODE_TYPES.NORMAL;
      } else if (act.forced === 'shop_or_exchange') {
        forcedType = Math.random() < 0.5 ? NODE_TYPES.SHOP : NODE_TYPES.EXCHANGE;
      } else {
        forcedType = act.forced;
      }
      stages.push([{ type: forcedType, stageIndex: stageIdx, optionIndex: 0 }]);
    } else {
      const count = act.options ?? 3;
      const stageNodes = [];
      for (let optIdx = 0; optIdx < count; optIdx++) {
        stageNodes.push({
          type: weightedRandom(NODE_WEIGHTS),
          stageIndex: stageIdx,
          optionIndex: optIdx,
        });
      }

      // Phase 1: Diversity Guarantee — wenn alle Nodes NORMAL sind, einen ersetzen
      const allNormal = stageNodes.every(n => n.type === NODE_TYPES.NORMAL);
      if (allNormal) {
        const replaceIdx = Math.floor(Math.random() * stageNodes.length);
        stageNodes[replaceIdx].type = pickWeightedNonNormal(NON_NORMAL_WEIGHTS);
      }

      stages.push(stageNodes);
    }
  }

  // Shop/Rest-Guarantees fuer options-Stages (2-3 und 5-7)
  const optionStageIndices = [1, 2, 4, 5, 6]; // 0-indexed: stages 2,3,5,6,7
  const optionNodes = optionStageIndices.flatMap(idx => stages[idx] ?? []);

  const hasShop = optionNodes.some(n => n.type === NODE_TYPES.SHOP);
  const hasRest = optionNodes.some(n => n.type === NODE_TYPES.REST);

  if (!hasShop) {
    const normalNodes = optionNodes.filter(n => n.type === NODE_TYPES.NORMAL);
    if (normalNodes.length > 0) {
      const target = normalNodes[Math.floor(Math.random() * normalNodes.length)];
      stages[target.stageIndex][target.optionIndex].type = NODE_TYPES.SHOP;
    }
  }
  if (!hasRest) {
    const normalNodes = optionNodes.filter(n => n.type === NODE_TYPES.NORMAL);
    if (normalNodes.length > 0) {
      const target = normalNodes[Math.floor(Math.random() * normalNodes.length)];
      stages[target.stageIndex][target.optionIndex].type = NODE_TYPES.REST;
    }
  }

  return {
    stages,
    currentStage: 1,
    currentNodeType: NODE_TYPES.NORMAL,
    chosenPath: [],
  };
}

export function useMapSystem() {
  const [map, setMap] = useState(null);
  const [stageRound, setStageRound] = useState(1);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [showEliteReward, setShowEliteReward] = useState(false);
  const [showBossReward, setShowBossReward] = useState(false);

  // Ref fuer synchronen Zugriff innerhalb von Callbacks
  const mapRef = useRef(null);

  const generateMap = useCallback(() => {
    const newMap = generateMapData();
    mapRef.current = newMap;
    setMap(newMap);
    setStageRound(1);
    setShowStageComplete(false);
    setShowMap(false);
    setShowShop(false);
    setShowRest(false);
    setShowExchange(false);
    setShowEliteReward(false);
    setShowBossReward(false);
  }, []);

  // Wird nach jeder Antwort in handleNextPair aufgerufen
  const advanceStageRound = useCallback(() => {
    setStageRound(prev => {
      const next = prev + 1;
      if (next > ROUNDS_PER_STAGE) {
        setShowStageComplete(true);
        return prev;
      }
      return next;
    });
  }, []);

  // Wenn der Spieler "Continue" im StageCompleteScreen klickt
  const dismissStageComplete = useCallback(() => {
    setShowStageComplete(false);
    const currentMap = mapRef.current;
    if (currentMap && currentMap.currentStage >= TOTAL_STAGES) {
      return;
    }
    // Immer Map zeigen — auch bei forced Stages (Stage 4 Mini Boss, Stage 8, Stage 9 Boss)
    // Der Spieler sieht den erzwungenen Node und klickt ihn an um fortzufahren
    setShowMap(true);
  }, []);

  // Spieler waehlt einen Node-Pfad auf der Map
  const chooseNode = useCallback((optionIndex) => {
    const currentMap = mapRef.current;
    if (!currentMap) return;
    const stageIdx = currentMap.currentStage;
    const chosenNode = currentMap.stages[stageIdx]?.[optionIndex];
    if (!chosenNode) return;

    let selectedNodeType = chosenNode.type;

    // MYSTERY-Resolution: aufloesen zu einem konkreten Typ (nicht BOSS/SHOP — wird separat gehandled)
    if (selectedNodeType === NODE_TYPES.MYSTERY) {
      const mysteryPool = [NODE_TYPES.NORMAL, NODE_TYPES.ELITE, NODE_TYPES.REST, NODE_TYPES.EXCHANGE];
      selectedNodeType = mysteryPool[Math.floor(Math.random() * mysteryPool.length)];
    }

    setMap(prev => {
      if (!prev) return prev;
      const newChosenPath = [...prev.chosenPath, optionIndex];
      const newStage = prev.currentStage + 1;
      const updated = {
        ...prev,
        currentStage: newStage,
        currentNodeType: selectedNodeType,
        chosenPath: newChosenPath,
      };
      mapRef.current = updated;
      return updated;
    });

    setShowMap(false);
    setStageRound(1);

    if (selectedNodeType === NODE_TYPES.SHOP) {
      setShowShop(true);
    } else if (selectedNodeType === NODE_TYPES.REST) {
      setShowRest(true);
    } else if (selectedNodeType === NODE_TYPES.EXCHANGE) {
      setShowExchange(true);
    }
    // Normal/Elite/MiniBoss/Boss: Game.jsx startet die Stage via useEffect
  }, []);

  const completeShop = useCallback(() => {
    setShowShop(false);
    setStageRound(1);
  }, []);

  const completeRest = useCallback(() => {
    setShowRest(false);
    setStageRound(1);
  }, []);

  const completeExchange = useCallback(() => {
    setShowExchange(false);
    setStageRound(1);
  }, []);

  const completeEliteReward = useCallback(() => {
    setShowEliteReward(false);
  }, []);

  const completeBossReward = useCallback(() => {
    setShowBossReward(false);
  }, []);

  const triggerEliteReward = useCallback(() => {
    setShowEliteReward(true);
  }, []);

  const triggerBossReward = useCallback(() => {
    setShowBossReward(true);
  }, []);

  const getChosenPathSoFar = useCallback(() => {
    const currentMap = mapRef.current;
    if (!currentMap) return [];
    return currentMap.chosenPath.map((optIdx, i) => ({
      stage: i + 2,
      nodeType: currentMap.stages[i + 1]?.[optIdx]?.type ?? 'unknown',
    }));
  }, []);

  const getCardParams = useCallback(() => {
    const currentMap = mapRef.current;
    if (!currentMap) return {};
    if (currentMap.currentNodeType === NODE_TYPES.ELITE || currentMap.currentNodeType === NODE_TYPES.MINI_BOSS) {
      return { min_price: 5 };
    }
    return {};
  }, []);

  const reset = useCallback(() => {
    mapRef.current = null;
    setMap(null);
    setStageRound(1);
    setShowStageComplete(false);
    setShowMap(false);
    setShowShop(false);
    setShowRest(false);
    setShowExchange(false);
    setShowEliteReward(false);
    setShowBossReward(false);
  }, []);

  // Restore-Methode fuer Save/Load
  const restoreMap = useCallback((mapData, savedStageRound) => {
    mapRef.current = mapData;
    setMap(mapData);
    setStageRound(savedStageRound ?? 1);
    setShowStageComplete(false);
    setShowMap(false);
    setShowShop(false);
    setShowRest(false);
    setShowExchange(false);
    setShowEliteReward(false);
    setShowBossReward(false);
  }, []);

  const currentStage = map?.currentStage ?? 1;
  const currentNodeType = map?.currentNodeType ?? NODE_TYPES.NORMAL;

  return {
    map,
    stageRound,
    currentStage,
    currentNodeType,
    showStageComplete,
    showMap,
    showShop,
    showRest,
    showExchange,
    showEliteReward,
    showBossReward,
    openMap: () => { if (mapRef.current) setShowMap(true); },
    generateMap,
    advanceStageRound,
    chooseNode,
    completeShop,
    completeRest,
    completeExchange,
    completeEliteReward,
    completeBossReward,
    triggerEliteReward,
    triggerBossReward,
    dismissStageComplete,
    getChosenPathSoFar,
    getCardParams,
    reset,
    restoreMap,
  };
}
