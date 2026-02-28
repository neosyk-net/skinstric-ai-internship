"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/header/Header";
import ButtonIconTextShrink from "../../../components/ButtonIconTextShrink";

type SelectedBox = "race" | "age" | "sex";

type DominantValues = {
  race: string;
  age: string;
  sex: string;
};

type RankedItem = {
  label: string;
  score: number;
};

type RankedByCategory = {
  race: RankedItem[];
  age: RankedItem[];
  sex: RankedItem[];
};

const FALLBACK_VALUES: DominantValues = {
  race: "East asian",
  age: "20-29",
  sex: "Female",
};

const FALLBACK_RANKED: RankedByCategory = {
  race: [{ label: FALLBACK_VALUES.race, score: 96 }],
  age: [{ label: FALLBACK_VALUES.age, score: 96 }],
  sex: [{ label: FALLBACK_VALUES.sex, score: 96 }],
};

const RING_SIZE = 384;
const RING_STROKE_WIDTH = 3;
const RING_RADIUS = RING_SIZE / 2 - RING_STROKE_WIDTH / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_TRACK_COLOR = "#C1C2C3";
const RING_FILL_COLOR = "#1A1B1C";

const readString = (value: unknown) => (typeof value === "string" ? value : "");

const readNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const pickLabelFromObject = (source: Record<string, unknown>) => {
  const labelKeys = ["label", "name", "value", "range", "group", "class", "title"];
  for (const key of labelKeys) {
    const value = readString(source[key]).trim();
    if (value) return value;
  }
  return "";
};

const pickScoreFromObject = (source: Record<string, unknown>) => {
  const scoreKeys = ["confidence", "score", "probability", "percent", "percentage", "value"];
  for (const key of scoreKeys) {
    const value = readNumber(source[key]);
    if (value !== null) return value;
  }
  return null;
};

const extractHighestLabel = (node: unknown): string => {
  if (!node) return "";

  if (Array.isArray(node)) {
    let bestLabel = "";
    let bestScore = -Infinity;
    for (const item of node) {
      const asObject = toRecord(item);
      const label = pickLabelFromObject(asObject);
      const score = pickScoreFromObject(asObject);
      if (!label || score === null) continue;
      if (score > bestScore) {
        bestScore = score;
        bestLabel = label;
      }
    }
    return bestLabel;
  }

  const asObject = toRecord(node);
  const nestedArrays = ["predictions", "items", "classes", "values", "results", "data"];
  for (const key of nestedArrays) {
    const nested = asObject[key];
    if (Array.isArray(nested)) {
      const nestedBest = extractHighestLabel(nested);
      if (nestedBest) return nestedBest;
    }
  }

  const entries = Object.entries(asObject);
  let bestLabel = "";
  let bestScore = -Infinity;
  for (const [label, rawValue] of entries) {
    const score = readNumber(rawValue);
    if (score === null) continue;
    if (score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }

  if (bestLabel) return bestLabel;
  return "";
};

const extractRankedItems = (node: unknown): RankedItem[] => {
  if (!node) return [];

  if (Array.isArray(node)) {
    const items: RankedItem[] = [];
    for (const item of node) {
      const asObject = toRecord(item);
      const label = pickLabelFromObject(asObject).trim();
      const score = pickScoreFromObject(asObject);
      if (!label || score === null) continue;
      items.push({ label, score });
    }
    return items.sort((a, b) => b.score - a.score);
  }

  const asObject = toRecord(node);
  const nestedArrays = ["predictions", "items", "classes", "values", "results", "data"];
  for (const key of nestedArrays) {
    const nested = asObject[key];
    if (Array.isArray(nested)) {
      const nestedItems = extractRankedItems(nested);
      if (nestedItems.length) return nestedItems;
    }
  }

  const items: RankedItem[] = [];
  for (const [label, rawValue] of Object.entries(asObject)) {
    const score = readNumber(rawValue);
    if (score !== null) {
      items.push({ label, score });
      continue;
    }

    const nested = toRecord(rawValue);
    const nestedScore = pickScoreFromObject(nested);
    if (nestedScore === null) continue;
    const nestedLabel = pickLabelFromObject(nested).trim();
    items.push({ label: nestedLabel || label, score: nestedScore });
  }
  return items.sort((a, b) => b.score - a.score);
};

const findCategoryNode = (payload: Record<string, unknown>, category: SelectedBox): unknown => {
  const demographics = toRecord(payload.demographics);
  const predictions = toRecord(payload.predictions);
  const result = toRecord(payload.result);
  const data = toRecord(payload.data);
  const categoryAlias = category === "sex" ? "gender" : category;

  return (
    demographics[category] ??
    demographics[categoryAlias] ??
    payload[category] ??
    payload[categoryAlias] ??
    predictions[category] ??
    predictions[categoryAlias] ??
    result[category] ??
    result[categoryAlias] ??
    data[category] ??
    data[categoryAlias] ??
    null
  );
};

const normalizeBigAge = (age: string) => {
  if (!age) return "";
  const lowered = age.toLowerCase();
  if (lowered.includes("y.o")) return age;
  if (/\d/.test(age)) return `${age} y.o.`;
  return age;
};

const toTitleCase = (value: string) =>
  value.replace(/\b([a-z])/gi, (match) => match.toUpperCase());

const normalizeScoreToPercent = (score: number) => (score <= 1 ? score * 100 : score);
const formatPercent = (score: number) => `${Math.round(normalizeScoreToPercent(score))}%`;
const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));
const areLabelsEqual = (left: string, right: string) =>
  left.trim().toLowerCase() === right.trim().toLowerCase();
const getIndexForLabel = (rows: RankedItem[], label: string) => {
  const index = rows.findIndex((row) => areLabelsEqual(row.label, label));
  return index >= 0 ? index : 0;
};

const getAgeLowerBound = (label: string) => {
  const match = label.trim().match(/^(\d+)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
};

const sortAgeRows = (rows: RankedItem[]) =>
  [...rows].sort((a, b) => {
    const aPercent = normalizeScoreToPercent(a.score);
    const bPercent = normalizeScoreToPercent(b.score);
    const aRounded = Math.round(aPercent);
    const bRounded = Math.round(bPercent);

    // Primary order follows what the UI shows (rounded whole %).
    if (bRounded !== aRounded) return bRounded - aRounded;

    // Polish rule: when ages share displayed 0%, force natural bucket order.
    if (aRounded === 0 && bRounded === 0) {
      return getAgeLowerBound(a.label) - getAgeLowerBound(b.label);
    }

    // For non-zero ties, keep hidden hierarchy by raw score.
    if (bPercent !== aPercent) return bPercent - aPercent;

    return 0;
  });

const enrichSexRankedItems = (items: RankedItem[]) => {
  if (items.length !== 1) return items;

  const only = items[0];
  const normalizedLabel = only.label.trim().toLowerCase();
  if (normalizedLabel !== "female" && normalizedLabel !== "male") return items;

  const normalizedScore = normalizeScoreToPercent(only.score);
  const complementLabel = normalizedLabel === "female" ? "male" : "female";
  const complementScore = Math.max(0, 100 - normalizedScore);

  const completed = [
    { label: only.label, score: only.score },
    { label: complementLabel, score: complementScore },
  ];

  return completed.sort((a, b) => normalizeScoreToPercent(b.score) - normalizeScoreToPercent(a.score));
};

export default function DemographicsSummaryPage() {
  const router = useRouter();
  const [selectedBox, setSelectedBox] = useState<SelectedBox>("race");
  const [selectedRightRowIndex, setSelectedRightRowIndex] = useState(0);
  const [originalValues, setOriginalValues] = useState<DominantValues>(FALLBACK_VALUES);
  const [confirmedValues, setConfirmedValues] = useState<DominantValues>(FALLBACK_VALUES);
  const [rankedByCategory, setRankedByCategory] = useState<RankedByCategory>(FALLBACK_RANKED);

  useEffect(() => {
    const raw = localStorage.getItem("skinstric_phase_two_response");
    if (!raw) return;

    try {
      const parsed = toRecord(JSON.parse(raw));
      const raceNode = findCategoryNode(parsed, "race");
      const ageNode = findCategoryNode(parsed, "age");
      const sexNode = findCategoryNode(parsed, "sex");
      const race = extractHighestLabel(raceNode) || FALLBACK_VALUES.race;
      const age = extractHighestLabel(ageNode) || FALLBACK_VALUES.age;
      const sex = extractHighestLabel(sexNode) || FALLBACK_VALUES.sex;
      const raceRanked = extractRankedItems(raceNode);
      const ageRanked = sortAgeRows(extractRankedItems(ageNode));
      const sexRanked = enrichSexRankedItems(extractRankedItems(sexNode));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOriginalValues({ race, age, sex });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfirmedValues({ race, age, sex });
      setRankedByCategory({
        race: raceRanked.length ? raceRanked : FALLBACK_RANKED.race,
        age: ageRanked.length ? ageRanked : FALLBACK_RANKED.age,
        sex: enrichSexRankedItems(sexRanked.length ? sexRanked : FALLBACK_RANKED.sex),
      });
    } catch {
      // Keep fallback values if payload is missing or malformed.
    }
  }, []);

  const selectedPanelLabel =
    selectedBox === "race" ? "RACE" : selectedBox === "age" ? "AGE" : "SEX";
  const dominantDisplayValue =
    selectedBox === "race"
      ? toTitleCase(confirmedValues.race)
      : selectedBox === "age"
        ? normalizeBigAge(confirmedValues.age)
        : toTitleCase(confirmedValues.sex);
  const activeRows = rankedByCategory[selectedBox];
  const activePercentScore = activeRows[selectedRightRowIndex]?.score ?? activeRows[0]?.score ?? 0;
  const selectedRow = activeRows[selectedRightRowIndex] ?? activeRows[0] ?? null;
  const selectedRowLabel = selectedRow?.label ?? "";
  const confirmedLabelForSelectedBox = confirmedValues[selectedBox];
  const originalLabelForSelectedBox = originalValues[selectedBox];
  const hasPendingConfirmChange =
    Boolean(selectedRowLabel) && !areLabelsEqual(selectedRowLabel, confirmedLabelForSelectedBox);
  const hasPendingResetForSelectedBox = !areLabelsEqual(
    confirmedLabelForSelectedBox,
    originalLabelForSelectedBox,
  );
  const activePercent = clampPercent(normalizeScoreToPercent(activePercentScore));
  const activePercentNumber = `${activePercent}`;
  const activeRingOffset = RING_CIRCUMFERENCE * (1 - activePercent / 100);

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-[#FCFCFC]">
      <Header showEnterCodeButton={false} locationLabel="ANALYSIS" />

      <div className="absolute left-8 top-[86px] text-[#1A1B1C]">
        <p className="h-6 w-[227px] text-[16px] font-semibold uppercase leading-[24px] tracking-[-0.02em]">
          A.I ANALYSIS
        </p>
      </div>

      <p className="absolute left-[29px] top-[115px] h-16 w-[505px] text-[72px] font-normal uppercase leading-[64px] tracking-[-0.06em] text-[#1A1B1C]">
        DEMOGRAPHICS
      </p>
      <p className="absolute left-[32px] top-[190px] h-6 w-[227px] text-[14px] font-normal uppercase leading-[24px] tracking-[0em] text-[#1A1B1C]">
        PREDICTED RACE &amp; AGE
      </p>

      <div className="absolute left-[256px] top-[304px] h-[544px] w-[1168px] border-t-2 border-[#1A1B1C] bg-[#F3F3F4]" />
      <p className="absolute left-[271px] top-[324px] h-10 whitespace-nowrap text-[40px] font-normal leading-[40px] tracking-[-0.05em] text-[#1A1B1C]">
        {dominantDisplayValue}
      </p>
      <svg
        className="pointer-events-none absolute left-[1024px] top-[440px] h-[384px] w-[384px]"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        aria-hidden="true"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={RING_TRACK_COLOR}
          strokeWidth={RING_STROKE_WIDTH}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={RING_FILL_COLOR}
          strokeWidth={RING_STROKE_WIDTH}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={activeRingOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          style={{ transition: "stroke-dashoffset 520ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <p className="absolute left-[1189px] top-[609.96px] h-10 w-[49px] text-right text-[40px] font-normal leading-[40px] tracking-[-0.05em] text-[#1A1B1C]">
        {activePercentNumber}
      </p>
      <p className="absolute left-[1239px] top-[598px] h-10 w-5 text-[24px] font-normal leading-[40px] tracking-[-0.05em] text-[#1A1B1C]">
        %
      </p>
      <div className="absolute left-[1440px] top-[304px] h-[544px] w-[448px] border-t-2 border-[#1A1B1C] bg-[#F3F3F4]" />
      <p className="absolute left-[1456px] top-[318px] h-6 w-[52px] text-[16px] font-bold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C] opacity-80">
        {selectedPanelLabel}
      </p>
      <p className="absolute left-[1747px] top-[318px] h-6 w-[126px] text-right text-[16px] font-bold uppercase leading-[24px] tracking-[-0.02em] text-[#1A1B1C] opacity-80">
        A.I CONFIDENCE
      </p>
      {activeRows.map((row, index) => {
        const isRowSelected = index === selectedRightRowIndex;
        const rowTop = 352 + index * 48;
        const rowLabel =
          selectedBox === "age" ? row.label : toTitleCase(row.label);
        return (
          <div key={`${selectedBox}-${row.label}-${index}`}>
            <button
              className={`absolute left-[1440px] h-12 w-[448px] transition-colors duration-300 ease-out ${
                isRowSelected ? "bg-[#1A1B1C]" : "bg-[#F3F3F4] hover:bg-[#E1E1E2]"
              }`}
              style={{ top: `${rowTop}px` }}
              onClick={() => setSelectedRightRowIndex(index)}
              aria-label={`Demographics list row ${index + 1}`}
            />
            <span
              className={`pointer-events-none absolute left-[1456px] inline-flex h-3 w-3 items-center justify-center transition-colors duration-300 ${
                isRowSelected ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
              }`}
              style={{ top: `${rowTop + 18}px` }}
              aria-hidden="true"
            >
              <span className="relative h-[10px] w-[10px] rotate-45 border border-current">
                {isRowSelected ? (
                  <span className="absolute left-1/2 top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 bg-[#FCFCFC]" />
                ) : null}
              </span>
            </span>
            <p
              className={`pointer-events-none absolute left-[1480px] h-6 whitespace-nowrap text-[16px] font-normal leading-[24px] tracking-[-0.02em] transition-colors duration-300 ${
                isRowSelected ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
              }`}
              style={{ top: `${rowTop + 12}px` }}
            >
              {rowLabel}
            </p>
            <p
              className={`pointer-events-none absolute left-[1836px] h-6 w-[37px] whitespace-nowrap text-right text-[16px] font-normal leading-[24px] tracking-[-0.02em] transition-colors duration-300 ${
                isRowSelected ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
              }`}
              style={{ top: `${rowTop + 12}px` }}
            >
              {formatPercent(row.score)}
            </p>
          </div>
        );
      })}
      <button
        className={`absolute left-[32px] top-[304px] h-[104px] w-[208px] cursor-pointer border-t-2 border-[#1A1B1C] transition-colors duration-300 ease-out ${
          selectedBox === "race" ? "bg-[#1A1B1C]" : "bg-[#F3F3F4] hover:bg-[#E1E1E2]"
        }`}
        onClick={() => {
          setSelectedBox("race");
          setSelectedRightRowIndex(getIndexForLabel(rankedByCategory.race, confirmedValues.race));
        }}
      >
        <span
          className={`absolute left-4 top-[11px] h-6 whitespace-nowrap text-left text-[16px] font-semibold uppercase leading-[24px] tracking-normal transition-colors duration-300 ${
            selectedBox === "race" ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
          }`}
        >
          {confirmedValues.race}
        </span>
        <span
          className={`absolute left-4 top-[67px] h-6 w-[41px] text-left text-[16px] font-semibold uppercase leading-[24px] tracking-normal transition-colors duration-300 ${
            selectedBox === "race" ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
          }`}
        >
          RACE
        </span>
      </button>
      <button
        className={`absolute left-[32px] top-[416px] h-[104px] w-[208px] cursor-pointer border-t-2 border-[#1A1B1C] transition-colors duration-300 ease-out ${
          selectedBox === "age" ? "bg-[#1A1B1C]" : "bg-[#F3F3F4] hover:bg-[#E1E1E2]"
        }`}
        onClick={() => {
          setSelectedBox("age");
          setSelectedRightRowIndex(getIndexForLabel(rankedByCategory.age, confirmedValues.age));
        }}
      >
        <span
          className={`absolute left-4 top-[11px] h-6 w-[80px] whitespace-nowrap text-left text-[16px] font-semibold uppercase leading-[24px] tracking-normal transition-colors duration-300 ${
            selectedBox === "age" ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
          }`}
        >
          {confirmedValues.age}
        </span>
        <span
          className={`absolute left-4 top-[67px] h-6 w-[35px] text-left text-[16px] font-semibold uppercase leading-[24px] tracking-normal transition-colors duration-300 ${
            selectedBox === "age" ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
          }`}
        >
          AGE
        </span>
      </button>
      <button
        className={`absolute left-[32px] top-[528px] h-[104px] w-[208px] cursor-pointer border-t-2 border-[#1A1B1C] transition-colors duration-300 ease-out ${
          selectedBox === "sex" ? "bg-[#1A1B1C]" : "bg-[#F3F3F4] hover:bg-[#E1E1E2]"
        }`}
        onClick={() => {
          setSelectedBox("sex");
          setSelectedRightRowIndex(getIndexForLabel(rankedByCategory.sex, confirmedValues.sex));
        }}
      >
        <span
          className={`absolute left-4 top-[11px] h-6 w-[60px] text-left text-[16px] font-semibold uppercase leading-[24px] tracking-normal transition-colors duration-300 ${
            selectedBox === "sex" ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
          }`}
        >
          {confirmedValues.sex}
        </span>
        <span
          className={`absolute left-4 top-[67px] h-6 w-[28px] text-left text-[16px] font-semibold uppercase leading-[24px] tracking-normal transition-colors duration-300 ${
            selectedBox === "sex" ? "text-[#FCFCFC]" : "text-[#1A1B1C]"
          }`}
        >
          SEX
        </span>
      </button>
      <p className="absolute left-[821px] top-[894px] h-6 w-[317px] whitespace-nowrap text-[16px] font-normal leading-[24px] tracking-[-0.02em] text-[#A0A4AB]">
        If A.I. estimate is wrong, select the correct one.
      </p>

      <div className="absolute bottom-9 left-8">
        <ButtonIconTextShrink
          label="BACK"
          direction="left"
          frameWidthClass="w-[97px]"
          textWidthClass="w-[37px]"
          textClassName="opacity-70"
          className="cursor-pointer"
          expandOnHover
          expandMode="icon"
          baseWidth={97}
          expandedWidth={97}
          baseHeight={44}
          expandedHeight={44}
          baseGap={16}
          expandedGap={16}
          baseIconSize={44}
          expandedIconSize={54}
          onClick={() => router.push("/analysis")}
        />
      </div>
      <button
        type="button"
        className={`absolute bottom-9 left-[1703px] inline-flex h-[35px] w-[73px] cursor-pointer items-center justify-center gap-2 border px-4 pb-[10px] pt-[9px] text-[14px] font-semibold uppercase leading-[16px] tracking-[-0.02em] transition-colors duration-200 ${
          hasPendingResetForSelectedBox
            ? "border-[#1A1B1C] bg-[#1A1B1C] text-[#FCFCFC] hover:bg-[#111215]"
            : "border-[#1A1B1C] bg-transparent text-[#1A1B1C] hover:bg-[#EDEDF0]"
        }`}
        onClick={() => {
          setConfirmedValues((previous) => ({
            ...previous,
            [selectedBox]: originalValues[selectedBox],
          }));
          setSelectedRightRowIndex(getIndexForLabel(rankedByCategory[selectedBox], originalValues[selectedBox]));
        }}
      >
        RESET
      </button>
      <button
        type="button"
        className={`absolute bottom-9 left-[1793px] inline-flex h-[35px] w-[95px] items-center justify-center gap-2 px-4 pb-[10px] pt-[9px] text-[14px] font-semibold uppercase leading-[16px] tracking-[-0.02em] transition-colors duration-200 ${
          hasPendingConfirmChange
            ? "cursor-pointer border border-[#1A1B1C] bg-[#1A1B1C] text-[#FCFCFC] hover:bg-[#111215]"
            : "cursor-pointer border border-[#1A1B1C] bg-transparent text-[#1A1B1C] hover:bg-[#EDEDF0]"
        }`}
        onClick={() => {
          const nextDefault = selectedRow;
          if (!nextDefault) return;
          setConfirmedValues((previous) => ({
            ...previous,
            [selectedBox]: nextDefault.label,
          }));
        }}
      >
        CONFIRM
      </button>
    </section>
  );
}
