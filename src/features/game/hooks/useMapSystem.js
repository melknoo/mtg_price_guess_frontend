import { useState, useCallback, useRef } from 'react';
import {
  NODE_TYPES,
  NODE_WEIGHTS,
  TOTAL_STAGES,
  ROUNDS_PER_STAGE,
  MAP_OPTIONS_PER_STAGE,
} from '../constants/mapDefinitions';

// Gewichteter Zufallswürfel für Node-Typen
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

// Generiert eine vollständige Map mit 5 Stages
function generateMapData() {
  const stages = [];

  // Stage 1-4: je 2 Optionen (Normal, Elite, Shop oder Rest)
  for (let stageIdx = 0; stageIdx < TOTAL_STAGES - 1; stageIdx++) {
    const stageNodes = [];
    for (let optIdx = 0; optIdx < MAP_OPTIONS_PER_STAGE; optIdx++) {
      stageNodes.push({
        type: weightedRandom(NODE_WEIGHTS),
        stageIndex: stageIdx,
        optionIndex: optIdx,
      });
    }
    stages.push(stageNodes);
  }

  // Stage 5: immer Boss (eine Option)
  stages.push([{ type: NODE_TYPES.BOSS, stageIndex: TOTAL_STAGES - 1, optionIndex: 0 }]);

  // Garantie: mind. 1 Shop + 1 Rest im Run (Stages 0-3)
  const allNodes = stages.slice(0, TOTAL_STAGES - 1).flat();
  const hasShop = allNodes.some(n => n.type === NODE_TYPES.SHOP);
  const hasRest = allNodes.some(n => n.type === NODE_TYPES.REST);

  if (!hasShop) {
    // Ersetze einen Random-Normal-Node durch Shop
    const normalNodes = allNodes.filter(n => n.type === NODE_TYPES.NORMAL);
    if (normalNodes.length > 0) {
      const target = normalNodes[Math.floor(Math.random() * normalNodes.length)];
      stages[target.stageIndex][target.optionIndex].type = NODE_TYPES.SHOP;
    }
  }
  if (!hasRest) {
    // Ersetze einen anderen Random-Normal-Node durch Rest
    const normalNodes = allNodes.filter(n => n.type === NODE_TYPES.NORMAL);
    if (normalNodes.length > 0) {
      const target = normalNodes[Math.floor(Math.random() * normalNodes.length)];
      stages[target.stageIndex][target.optionIndex].type = NODE_TYPES.REST;
    }
  }

  return {
    stages,           // stages[stageIdx][optionIdx] = Node
    currentStage: 1,  // 1-indexed, 1 = erste Stage
    currentNodeType: NODE_TYPES.NORMAL,
    chosenPath: [],   // chosenPath[stageIdx] = gewählter optionIndex
  };
}

export function useMapSystem() {
  const [map, setMap] = useState(null);
  const [stageRound, setStageRound] = useState(1);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [showEliteReward, setShowEliteReward] = useState(false);
  const [showBossReward, setShowBossReward] = useState(false);

  // Ref für synchronen Zugriff innerhalb von Callbacks
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
    setShowEliteReward(false);
    setShowBossReward(false);
  }, []);

  // Wird nach jeder Antwort in handleNextPair aufgerufen
  const advanceStageRound = useCallback(() => {
    setStageRound(prev => {
      const next = prev + 1;
      if (next > ROUNDS_PER_STAGE) {
        // Stage komplett
        setShowStageComplete(true);
        return prev; // bleibt auf 10 bis nächste Stage startet
      }
      return next;
    });
  }, []);

  // Wenn der Spieler "Continue" im StageCompleteScreen klickt
  const dismissStageComplete = useCallback(() => {
    setShowStageComplete(false);
    // Bei letzter Stage (Boss) gibt es keine weitere Map-Auswahl
    const currentMap = mapRef.current;
    if (currentMap && currentMap.currentStage >= TOTAL_STAGES) {
      // Run beendet — Game.jsx handled Game Over
      return;
    }
    setShowMap(true);
  }, []);

  // Spieler wählt einen Node-Pfad auf der Map
  const chooseNode = useCallback((optionIndex) => {
    // Node-Typ SYNCHRON aus mapRef lesen BEVOR setMap aufgerufen wird
    // (mapRef.current inside setMap updater wird async geupdated in React 18)
    const currentMap = mapRef.current;
    if (!currentMap) return;
    const stageIdx = currentMap.currentStage; // Stage 1 auto-gespielt → nächste wählbare = currentStage
    const chosenNode = currentMap.stages[stageIdx]?.[optionIndex];
    if (!chosenNode) return;
    const selectedNodeType = chosenNode.type;

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
    setStageRound(1); // Stage-Runden-Counter für nächste Stage zurücksetzen

    if (selectedNodeType === NODE_TYPES.SHOP) {
      setShowShop(true);
    } else if (selectedNodeType === NODE_TYPES.REST) {
      setShowRest(true);
    }
    // Normal/Elite/Boss: Game.jsx startet die Stage via useEffect
  }, []);

  const completeShop = useCallback(() => {
    setShowShop(false);
    setStageRound(1);
  }, []);

  const completeRest = useCallback(() => {
    setShowRest(false);
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

  // Gibt Backend-freundliches Array zurück: [{stage:2, nodeType:'elite'}, ...]
  // chosenPath[i] = Wahl für den (i+1)-ten Map-Choice = stageIdx i+1 (Stage 2, 3, 4, 5)
  const getChosenPathSoFar = useCallback(() => {
    const currentMap = mapRef.current;
    if (!currentMap) return [];
    return currentMap.chosenPath.map((optIdx, i) => ({
      stage: i + 2,                                          // Stage 2, 3, 4, 5
      nodeType: currentMap.stages[i + 1]?.[optIdx]?.type ?? 'unknown',
    }));
  }, []);

  // Gibt Extra-Params für useCardLoader zurück (Elite: teurere Karten)
  const getCardParams = useCallback(() => {
    const currentMap = mapRef.current;
    if (!currentMap) return {};
    if (currentMap.currentNodeType === NODE_TYPES.ELITE) {
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
    showEliteReward,
    showBossReward,
    generateMap,
    advanceStageRound,
    chooseNode,
    completeShop,
    completeRest,
    completeEliteReward,
    completeBossReward,
    triggerEliteReward,
    triggerBossReward,
    dismissStageComplete,
    getChosenPathSoFar,
    getCardParams,
    reset,
  };
}
