// Single source of truth for die colours, shared by the dice tray UI and
// the share-link codec.
//
// ⚠️ ORDER IS SIGNIFICANT: share links encode a die's colour by its INDEX in
// this array. Only ever APPEND new colours to the end — never reorder or
// remove entries, or existing share links will decode to the wrong colours.
export const DICE_COLORS = [
  { id: 'white', label: 'White', die: '#f4f1ea', pip: '#1a1a1a' },
  { id: 'red', label: 'Red', die: '#b02a2a', pip: '#ffffff' },
  { id: 'blue', label: 'Blue', die: '#2a4bb0', pip: '#ffffff' },
  { id: 'green', label: 'Green', die: '#2a8a4a', pip: '#ffffff' },
  { id: 'yellow', label: 'Yellow', die: '#e8c53a', pip: '#1a1a1a' },
  { id: 'purple', label: 'Purple', die: '#6a2ab0', pip: '#ffffff' },
  { id: 'black', label: 'Black', die: '#1c1c1c', pip: '#f0f0f0' },
]

export const DICE_COLOR_IDS = DICE_COLORS.map((c) => c.id)

export const colorById = (id) =>
  DICE_COLORS.find((c) => c.id === id) ?? DICE_COLORS[0]
