import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { formatBreakdownLine, formatRollWhen, formatTotal } from '../format';
import { radius, useThemedStyles, type ThemeColors } from '../theme';
import type { DiceSort, HistoryItem } from '../types';
type Props = {
  items: HistoryItem[];
  onReroll: (expression: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onClearKeepFavorites: () => void;
  diceSort?: DiceSort;
};

function Checkbox({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[
        styles.checkbox,
        checked && styles.checkboxOn,
        disabled && styles.checkboxDisabled,
      ]}
    >
      {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
    </View>
  );
}

function HistoryRow({
  item,
  selecting,
  selected,
  onReroll,
  onToggleFavorite,
  onDelete,
  onLongPress,
  onToggleSelect,
  diceSort = 'rolled',
}: {
  item: HistoryItem;
  selecting: boolean;
  selected: boolean;
  onReroll: (expression: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onLongPress: () => void;
  onToggleSelect: () => void;
  diceSort?: DiceSort;
}) {
  const styles = useThemedStyles(createStyles);
  const card = (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={350}
      onPress={selecting ? onToggleSelect : undefined}
      style={[
        styles.item,
        item.favorite && styles.itemFavorite,
        selecting && selected && styles.itemSelected,
        selecting && item.favorite && styles.itemLocked,
      ]}
    >
      {selecting ? (
        <Checkbox checked={selected} disabled={item.favorite} />
      ) : (
        <Pressable
          style={styles.starBtn}
          onPress={() => onToggleFavorite(item.id)}
          hitSlop={8}
          accessibilityLabel={item.favorite ? 'Desfavoritar' : 'Favoritar'}
        >
          <Text style={[styles.star, item.favorite && styles.starOn]}>
            {item.favorite ? '★' : '☆'}
          </Text>
        </Pressable>
      )}

      <View style={styles.itemMain}>
        <Text style={styles.expr} numberOfLines={1}>
          {item.result.rawExpression}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {formatRollWhen(item.createdAt, item.timestamp)}
        </Text>
        {item.result.dice.length > 0 ? (
          <Text style={styles.breakdown} numberOfLines={2}>
            {formatBreakdownLine(item.result.dice, item.result.groups, diceSort)}
          </Text>
        ) : null}
      </View>

      <View style={styles.itemSide}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text
          style={styles.total}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {formatTotal(item.result.total)}
        </Text>
        {!selecting ? (
          <Pressable style={styles.reroll} onPress={() => onReroll(item.result.rawExpression)}>
            <Text style={styles.rerollText}>Rerolar</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );

  if (selecting) return card;

  return (
    <Swipeable
      overshootRight={false}
      friction={2}
      rightThreshold={72}
      renderRightActions={() => (
        <Pressable style={styles.deleteAction} onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteActionText}>Apagar</Text>
        </Pressable>
      )}
    >
      {card}
    </Swipeable>
  );
}

export function HistoryPanel({
  items,
  onReroll,
  onToggleFavorite,
  onDelete,
  onDeleteMany,
  onClearKeepFavorites,
  diceSort = 'rolled',
}: Props) {
  const styles = useThemedStyles(createStyles);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const favorites = items.filter((item) => item.favorite);
  const others = items.filter((item) => !item.favorite);
  const canClearOthers = others.length > 0;
  const selectableIds = useMemo(
    () => items.filter((item) => !item.favorite).map((item) => item.id),
    [items],
  );
  const selectedCount = selected.length;
  const allSelected = selectableIds.length > 0 && selectedCount === selectableIds.length;

  const exitSelect = () => {
    setSelecting(false);
    setSelected([]);
  };

  const enterSelect = (id?: string) => {
    setSelecting(true);
    setSelected(id && selectableIds.includes(id) ? [id] : []);
  };

  const toggleSelect = (id: string, isFavorite: boolean) => {
    if (isFavorite) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const selectAll = () => {
    setSelected(allSelected ? [] : [...selectableIds]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        {selecting ? (
          <>
            <View style={styles.toolbarText}>
              <Text style={styles.title}>Selecionar</Text>
              <Text style={styles.subtitle}>
                {selectedCount} selecionado{selectedCount === 1 ? '' : 's'} · favoritos de fora
              </Text>
            </View>
            <View style={styles.toolbarActions}>
              <Pressable style={styles.headerBtn} onPress={exitSelect}>
                <Text style={styles.headerBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.headerBtn, allSelected && styles.headerBtnActive]}
                onPress={selectAll}
                disabled={selectableIds.length === 0}
              >
                <Text style={[styles.headerBtnText, allSelected && styles.headerBtnTextActive]}>
                  {allSelected ? 'Limpar' : 'Tudo'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.clearBtn, selectedCount === 0 && styles.clearBtnDisabled]}
                onPress={() => {
                  if (selectedCount === 0) return;
                  onDeleteMany(selected);
                  exitSelect();
                }}
                disabled={selectedCount === 0}
              >
                <Text style={[styles.clearBtnText, selectedCount === 0 && styles.clearBtnTextDisabled]}>
                  Apagar
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.toolbarText}>
              <Text style={styles.title}>Histórico</Text>
              <Text style={styles.subtitle}>
                {favorites.length} favorito{favorites.length === 1 ? '' : 's'} · {items.length} no total
              </Text>
            </View>
            <Pressable
              style={[styles.clearBtn, !canClearOthers && styles.clearBtnDisabled]}
              onPress={onClearKeepFavorites}
              disabled={!canClearOthers}
            >
              <Text style={[styles.clearBtnText, !canClearOthers && styles.clearBtnTextDisabled]}>
                Limpar tudo
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {items.length === 0 ? (
          <Text style={styles.empty}>
            Nenhuma rolagem ainda.{'\n'}Volte ao rolador e jogue os dados.
          </Text>
        ) : (
          <>
            <Text style={styles.section}>Favoritos</Text>
            {favorites.length === 0 ? (
              <Text style={styles.emptySoft}>Toque na estrela de uma rolagem para guardar.</Text>
            ) : (
              favorites.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  selecting={selecting}
                  selected={false}
                  onReroll={onReroll}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDelete}
                  onLongPress={() => enterSelect()}
                  onToggleSelect={() => undefined}
                  diceSort={diceSort}
                />
              ))
            )}

            <Text style={[styles.section, styles.sectionLater]}>Outras rolagens</Text>
            {others.length === 0 ? (
              <Text style={styles.emptySoft}>
                {favorites.length > 0
                  ? 'O restante foi limpo. Os favoritos continuam acima.'
                  : 'Nada por aqui.'}
              </Text>
            ) : (
              others.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  selecting={selecting}
                  selected={selected.includes(item.id)}
                  onReroll={onReroll}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDelete}
                  onLongPress={() => enterSelect(item.id)}
                  onToggleSelect={() => toggleSelect(item.id, item.favorite)}
                  diceSort={diceSort}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
  screen: {
    flex: 1,
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  toolbarText: {
    flexShrink: 1,
    minWidth: 0,
  },
  toolbarActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.faint,
    fontSize: 11,
    marginTop: 2,
  },
  headerBtn: {
    backgroundColor: colors.keypadAlt,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerBtnActive: {
    backgroundColor: '#312e81',
  },
  headerBtnText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  headerBtnTextActive: {
    color: colors.indigo,
  },
  clearBtn: {
    backgroundColor: '#450a0a99',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearBtnDisabled: {
    opacity: 0.4,
  },
  clearBtnText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
  clearBtnTextDisabled: {
    color: colors.faint,
  },
  list: {
    padding: 12,
    gap: 8,
    paddingBottom: 24,
  },
  section: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  sectionLater: {
    marginTop: 12,
  },
  empty: {
    color: colors.faint,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 36,
    lineHeight: 20,
  },
  emptySoft: {
    color: colors.faint,
    fontSize: 13,
    lineHeight: 18,
  },
  deleteAction: {
    width: 88,
    marginLeft: 8,
    backgroundColor: '#b91c1c',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  item: {
    backgroundColor: colors.chip,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  itemFavorite: {
    borderColor: '#b45309',
    backgroundColor: '#1c1917',
  },
  itemSelected: {
    borderColor: colors.indigoStrong,
    backgroundColor: colors.keypad,
  },
  itemLocked: {
    opacity: 0.55,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.indigoStrong,
    borderColor: colors.indigoStrong,
  },
  checkboxDisabled: {
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  starBtn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    color: colors.faint,
    fontSize: 22,
  },
  starOn: {
    color: '#fbbf24',
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  expr: {
    color: colors.indigo,
    fontWeight: '700',
  },
  time: {
    color: colors.faint,
    fontSize: 11,
  },
  breakdown: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  diceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  more: {
    color: colors.faint,
    fontSize: 11,
    alignSelf: 'center',
  },
  itemSide: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 2,
  },
  totalLabel: {
    color: colors.faint,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    width: '100%',
  },
  total: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    width: '100%',
  },
  reroll: {
    marginTop: 4,
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.keypadAlt,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  rerollText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  };
}
