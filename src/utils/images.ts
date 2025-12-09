/**
 * Centralized image utilities for consistent fallback handling
 */

/**
 * Default avatar placeholder - uses a data URI SVG for reliability
 * This ensures the fallback always works, even offline
 */
export const DEFAULT_AVATAR_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Ccircle cx='50' cy='40' r='18' fill='%239CA3AF'/%3E%3Cellipse cx='50' cy='85' rx='28' ry='22' fill='%239CA3AF'/%3E%3C/svg%3E`;

/**
 * Alternative avatar colors for variety
 */
const AVATAR_COLORS = [
  { bg: '#E5E7EB', fg: '#9CA3AF' }, // Gray
  { bg: '#DBEAFE', fg: '#3B82F6' }, // Blue
  { bg: '#D1FAE5', fg: '#10B981' }, // Green
  { bg: '#FEE2E2', fg: '#EF4444' }, // Red
  { bg: '#FEF3C7', fg: '#F59E0B' }, // Yellow
  { bg: '#E0E7FF', fg: '#6366F1' }, // Indigo
  { bg: '#FCE7F3', fg: '#EC4899' }, // Pink
];

/**
 * Generate a consistent color based on a string (e.g., user name or ID)
 */
const getColorFromString = (str: string): { bg: string; fg: string } => {
  if (!str) return AVATAR_COLORS[0];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/**
 * Generate an SVG avatar with initials
 */
export const generateInitialsAvatar = (name: string): string => {
  const initials = name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  
  const colors = getColorFromString(name);
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='${encodeURIComponent(colors.bg)}'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-size='36' font-weight='bold' fill='${encodeURIComponent(colors.fg)}' text-anchor='middle' dominant-baseline='central'%3E${initials}%3C/text%3E%3C/svg%3E`;
};

/**
 * Get avatar URL with fallback
 * @param avatarUrl - The original avatar URL (can be null/undefined)
 * @param name - The user's name for generating initials fallback
 * @returns A valid image URL
 */
export const getAvatarUrl = (avatarUrl: string | null | undefined, name?: string): string => {
  if (avatarUrl && avatarUrl.trim() !== '') {
    return avatarUrl;
  }
  
  if (name && name.trim() !== '') {
    return generateInitialsAvatar(name);
  }
  
  return DEFAULT_AVATAR_PLACEHOLDER;
};

/**
 * Handle image load error by setting fallback
 * Use this as onError handler for img elements
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackName?: string
): void => {
  const target = event.currentTarget;
  
  // Prevent infinite loop if fallback also fails
  if (target.dataset.fallbackApplied === 'true') {
    return;
  }
  
  target.dataset.fallbackApplied = 'true';
  target.src = fallbackName 
    ? generateInitialsAvatar(fallbackName) 
    : DEFAULT_AVATAR_PLACEHOLDER;
};

/**
 * Default thumbnail placeholder for resources/content
 */
export const DEFAULT_THUMBNAIL_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23F3F4F6'/%3E%3Cpath d='M150 70 L180 110 L120 110 Z' fill='%239CA3AF'/%3E%3Ccircle cx='130' cy='85' r='12' fill='%239CA3AF'/%3E%3Crect x='100' y='120' width='100' height='8' rx='4' fill='%23D1D5DB'/%3E%3Crect x='120' y='135' width='60' height='6' rx='3' fill='%23E5E7EB'/%3E%3C/svg%3E`;

/**
 * Get thumbnail URL with fallback
 */
export const getThumbnailUrl = (thumbnailUrl: string | null | undefined): string => {
  if (thumbnailUrl && thumbnailUrl.trim() !== '') {
    return thumbnailUrl;
  }
  return DEFAULT_THUMBNAIL_PLACEHOLDER;
};
