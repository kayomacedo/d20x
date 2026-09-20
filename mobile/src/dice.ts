import type { DiceGroup, DieRoll, RollResult } from './types';

function evaluateArithmetic(input: string): number {
  let i = 0;
  const s = input.replace(/\s+/g, '');

  const peek = () => s[i];
  const consume = () => s[i++];

  const parseNumber = (): number => {
    const start = i;
    while (peek() && /[0-9.]/.test(peek())) consume();
    if (start === i) {
      throw new Error('Erro de sintaxe matemática na expressão');
    }
    const n = Number(s.slice(start, i));
    if (Number.isNaN(n)) {
      throw new Error('Erro de sintaxe matemática na expressão');
    }
    return n;
  };

  const parseFactor = (): number => {
    if (peek() === '+') {
      consume();
      return parseFactor();
    }
    if (peek() === '-') {
      consume();
      return -parseFactor();
    }
    if (peek() === '(') {
      consume();
      const value = parseExpression();
      if (peek() !== ')') {
        throw new Error('Erro de sintaxe matemática na expressão');
      }
      consume();
      return value;
    }
    return parseNumber();
  };

  const parseTerm = (): number => {
    let left = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parseFactor();
      if (op === '*') {
        left *= right;
      } else {
        if (right === 0) throw new Error('Divisão por zero');
        left /= right;
      }
    }
    return left;
  };

  const parseExpression = (): number => {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  const result = parseExpression();
  if (i !== s.length) {
    throw new Error('Expressão inválida');
  }
  return result;
}

function mergeResults(original: string, parts: RollResult[]): RollResult {
  return {
    rawExpression: original,
    total: parts.reduce((sum, part) => sum + part.total, 0),
    dice: parts.flatMap((part) => part.dice),
    groups: parts.flatMap((part) => part.groups),
    maxCrits: parts.reduce((sum, part) => sum + part.maxCrits, 0),
    minCrits: parts.reduce((sum, part) => sum + part.minCrits, 0),
  };
}

export function parseAndRollExpression(inputStr: string): RollResult | null {
  const expr = inputStr.toLowerCase().replace(/\s+/g, '');
  if (!expr) return null;

  const repeated = expr.match(/^(\d{1,2})#(.+)$/);
  if (repeated) {
    const times = Number.parseInt(repeated[1], 10);
    const inner = repeated[2];
    if (times < 1 || times > 20) {
      throw new Error('Repetições do # ficam entre 1 e 20');
    }
    if (!inner || inner.includes('#')) {
      throw new Error('Fórmula depois do # inválida');
    }
    const parts: RollResult[] = [];
    for (let i = 0; i < times; i += 1) {
      const part = parseAndRollExpression(inner);
      if (part) parts.push(part);
    }
    return parts.length ? mergeResults(inputStr, parts) : null;
  }

  const allDice: DieRoll[] = [];
  const groups: DiceGroup[] = [];
  const diceRegex = /(\d*)d(\d+)(kh\d+|kl\d+|dh\d+|dl\d+|d\d+)?/gi;

  const expandedExpr = expr.replace(diceRegex, (_match, countStr, sidesStr, modifier) => {
    const count = countStr === '' ? 1 : parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);

    if (count <= 0 || sides <= 0 || count > 200 || sides > 1000) {
      throw new Error('Quantidade ou lados do dado fora do limite (máx 200d1000)');
    }

    const rawRolls: number[] = [];
    for (let i = 0; i < count; i += 1) {
      rawRolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const keptFlags = new Array(count).fill(true);

    if (modifier) {
      const modType = String(modifier.match(/^[a-z]+/i)?.[0] ?? '');
      const modNum = parseInt(String(modifier).replace(/^[a-z]+/i, ''), 10) || 1;
      const indexed = rawRolls.map((val, idx) => ({ val, idx }));

      if (modType === 'kh' || modType === 'dh') {
        indexed.sort((a, b) => b.val - a.val);
        indexed.forEach((item, rank) => {
          keptFlags[item.idx] = modType === 'kh' ? rank < modNum : rank >= modNum;
        });
      } else if (modType === 'kl' || modType === 'd' || modType === 'dl') {
        indexed.sort((a, b) => a.val - b.val);
        indexed.forEach((item, rank) => {
          keptFlags[item.idx] = modType === 'kl' ? rank < modNum : rank >= modNum;
        });
      }
    }

    let sumForThisGroup = 0;
    const groupRolls: DieRoll[] = [];
    rawRolls.forEach((value, idx) => {
      const isKept = keptFlags[idx];
      if (isKept) sumForThisGroup += value;
      const die: DieRoll = {
        sides,
        value,
        isMin: value === 1,
        isMax: value === sides,
        isKept,
      };
      groupRolls.push(die);
      allDice.push(die);
    });

    groups.push({
      notation: `${count}d${sides}${modifier ?? ''}`,
      sides,
      rolls: groupRolls,
      subtotal: sumForThisGroup,
    });

    return String(sumForThisGroup);
  });

  if (/[^0-9+\-*/().]/.test(expandedExpr)) {
    throw new Error('Expressão inválida');
  }

  const total = evaluateArithmetic(expandedExpr);
  const keptDice = allDice.filter((die) => die.isKept);

  return {
    rawExpression: inputStr,
    total,
    dice: allDice,
    groups,
    maxCrits: keptDice.filter((die) => die.isMax).length,
    minCrits: keptDice.filter((die) => die.isMin).length,
  };
}

export function appendDiceToExpression(current: string, dieType: string): string {
  const val = current.trim();
  if (val === '' || /[+\-*/(]\s*$/.test(val)) {
    return `${current}1${dieType}`;
  }
  if (/\d+$/.test(val)) {
    return `${current}${dieType}`;
  }
  return `${current}+1${dieType}`;
}
