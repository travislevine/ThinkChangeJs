export const COLOURS = [
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Black",
  "White",
  "Silver",
  "Orange",
  "Purple",
  "Pink",
  "Other",
] as const

export type Colour = (typeof COLOURS)[number]

