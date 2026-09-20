import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const AVATAR_MAX = 18_000;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function colorForId(id: string): string {
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return colors[hash % colors.length];
}

export function normalizeAvatar(value: unknown): string {
  if (typeof value !== 'string') return '';
  const uri = value.trim();
  if (!uri.startsWith('data:image/')) return '';
  if (uri.length > AVATAR_MAX) return '';
  return uri;
}

export async function pickProfilePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]?.uri) return null;

  const source = result.assets[0].uri;
  const sizes = [96, 72, 56];
  const qualities = [0.55, 0.4, 0.28];

  for (const width of sizes) {
    for (const compress of qualities) {
      const out = await manipulateAsync(source, [{ resize: { width } }], {
        compress,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (!out.base64) continue;
      const uri = `data:image/jpeg;base64,${out.base64}`;
      if (uri.length <= AVATAR_MAX) return uri;
    }
  }
  return null;
}
