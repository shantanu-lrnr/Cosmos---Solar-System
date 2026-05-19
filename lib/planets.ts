export type PlanetColor = {
  primary: string;
  secondary: string;
  glow: string;
};

export type Ring = {
  inner: number;
  outer: number;
  color: string;
  opacity: number;
  tilt: number;
};

export type Moon = {
  id: string;
  name: string;
  radius: number;
  distance: number;
  speed: number;      // negative = retrograde orbit
  color: string;
  inclination?: number; // radians, orbital tilt vs. the planet equator
};

export type Planet = {
  id: string;
  name: string;
  tagline: string;
  type: 'star' | 'rocky' | 'gas' | 'ice';
  radius: number;
  distance: number;     // scene units from sun center
  orbitSpeed: number;   // angular speed factor
  rotationSpeed: number;
  axialTilt: number;    // radians
  color: PlanetColor;
  emissive?: number;
  ring?: Ring;
  moons?: Moon[];
  atmosphere?: { color: string; intensity: number };
  // Info
  facts: {
    diameter: string;
    mass: string;
    gravity: string;
    day: string;
    year: string;
    temperature: string;
    moons: string;
    distanceFromSun: string;
    composition: string;
    discovered: string;
  };
  description: string;
  funFacts: string[];
};

// Scene scale: not to real scale. Distances/sizes chosen for cinematic readability.
export const PLANETS: Planet[] = [
  {
    id: 'sun',
    name: 'Sun',
    tagline: 'The Heart of our System',
    type: 'star',
    radius: 7.5,
    distance: 0,
    orbitSpeed: 0,
    rotationSpeed: 0.04,
    axialTilt: 0.12,
    emissive: 2.0,
    color: {
      primary: '#ffb058',
      secondary: '#ff7028',
      glow: '#ff9542',
    },
    atmosphere: { color: '#ff8a3d', intensity: 1.2 },
    facts: {
      diameter: '1,391,400 km',
      mass: '1.989 × 10³⁰ kg',
      gravity: '274 m/s²',
      day: '~27 Earth days',
      year: '—',
      temperature: '5,500 °C (surface) · 15M °C (core)',
      moons: '0',
      distanceFromSun: '0 AU',
      composition: 'Hydrogen (73%) · Helium (25%)',
      discovered: 'Prehistory',
    },
    description:
      'The Sun is a G-type main-sequence star at the center of our solar system. Its gravity holds the entire system together and its energy drives life on Earth.',
    funFacts: [
      'Contains 99.86% of the solar system mass',
      'Light takes ~8 minutes 20 seconds to reach Earth',
      'A single sunspot can be larger than our planet',
    ],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    tagline: 'The Swift Messenger',
    type: 'rocky',
    radius: 0.55,
    distance: 14,
    orbitSpeed: 0.42,
    rotationSpeed: 0.005,
    axialTilt: 0.0006,
    color: { primary: '#b8b1a5', secondary: '#6f6a62', glow: '#d2c9b8' },
    facts: {
      diameter: '4,879 km',
      mass: '3.30 × 10²³ kg',
      gravity: '3.7 m/s²',
      day: '58.6 Earth days',
      year: '88 Earth days',
      temperature: '-173 °C to 427 °C',
      moons: '0',
      distanceFromSun: '0.39 AU',
      composition: 'Iron core · Silicate mantle',
      discovered: 'Known to ancients',
    },
    description:
      'The smallest planet and closest to the Sun. Mercury has dramatic temperature swings and almost no atmosphere to retain heat.',
    funFacts: [
      'A year on Mercury is 88 Earth days',
      'It has wrinkles called "Lobate Scarps"',
      'Its iron core takes up ~75% of its radius',
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    tagline: 'The Veiled Inferno',
    type: 'rocky',
    radius: 0.95,
    distance: 19,
    orbitSpeed: 0.31,
    rotationSpeed: -0.002,
    axialTilt: 3.09,
    color: { primary: '#f4d4a0', secondary: '#c08a3d', glow: '#ffd98a' },
    atmosphere: { color: '#ffd28a', intensity: 0.7 },
    facts: {
      diameter: '12,104 km',
      mass: '4.87 × 10²⁴ kg',
      gravity: '8.87 m/s²',
      day: '243 Earth days',
      year: '225 Earth days',
      temperature: '465 °C',
      moons: '0',
      distanceFromSun: '0.72 AU',
      composition: 'CO₂ atmosphere · Rocky surface',
      discovered: 'Known to ancients',
    },
    description:
      'Earth\'s "sister planet" — but its dense CO₂ atmosphere creates a runaway greenhouse effect making it the hottest world in our system.',
    funFacts: [
      'Rotates backwards compared to most planets',
      'A day on Venus is longer than its year',
      'Atmospheric pressure is 92× that of Earth',
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    tagline: 'The Pale Blue Dot',
    type: 'rocky',
    radius: 1,
    distance: 25,
    orbitSpeed: 0.22,
    rotationSpeed: 0.04,
    axialTilt: 0.41,
    color: { primary: '#3b82f6', secondary: '#1e3a8a', glow: '#60a5fa' },
    atmosphere: { color: '#60a5fa', intensity: 1.2 },
    moons: [
      { id: 'luna', name: 'Moon', radius: 0.27, distance: 2.2, speed: 1.2, color: '#cfcfcf' },
    ],
    facts: {
      diameter: '12,742 km',
      mass: '5.97 × 10²⁴ kg',
      gravity: '9.81 m/s²',
      day: '24 hours',
      year: '365.25 days',
      temperature: '-88 °C to 58 °C',
      moons: '1',
      distanceFromSun: '1 AU',
      composition: 'Iron core · Silicate · Water · Atmosphere',
      discovered: '—',
    },
    description:
      'The only known world that harbors life. A delicate balance of water, atmosphere and a protective magnetic field cradles biological diversity.',
    funFacts: [
      '71% of the surface is water',
      'Has a powerful magnetosphere shielding us from solar wind',
      'The Moon is moving away ~3.8 cm/year',
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    tagline: 'The Red Frontier',
    type: 'rocky',
    radius: 0.7,
    distance: 32,
    orbitSpeed: 0.17,
    rotationSpeed: 0.038,
    axialTilt: 0.44,
    color: { primary: '#e07b53', secondary: '#7a2f1c', glow: '#ff9b6a' },
    atmosphere: { color: '#ff7a4d', intensity: 0.35 },
    moons: [
      { id: 'phobos', name: 'Phobos', radius: 0.1, distance: 1.5, speed: 2.2, color: '#9a8e80' },
      { id: 'deimos', name: 'Deimos', radius: 0.08, distance: 2.0, speed: 1.6, color: '#a89c8a' },
    ],
    facts: {
      diameter: '6,779 km',
      mass: '6.42 × 10²³ kg',
      gravity: '3.71 m/s²',
      day: '24h 37m',
      year: '687 Earth days',
      temperature: '-87 °C to -5 °C',
      moons: '2',
      distanceFromSun: '1.52 AU',
      composition: 'Iron oxide surface · Thin CO₂ atmosphere',
      discovered: 'Known to ancients',
    },
    description:
      'The red planet, home to the tallest volcano and deepest canyon in the solar system. A primary target for human exploration.',
    funFacts: [
      'Olympus Mons is 22 km tall — nearly 3× Everest',
      'Mars has seasons like Earth',
      'Dust storms can engulf the entire planet',
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    tagline: 'The Cosmic Giant',
    type: 'gas',
    radius: 3.5,
    distance: 45,
    orbitSpeed: 0.094,
    rotationSpeed: 0.09,
    axialTilt: 0.05,
    color: { primary: '#e7c8a0', secondary: '#8a5a32', glow: '#f5d9a8' },
    moons: [
      // Inner small moons
      { id: 'amalthea', name: 'Amalthea', radius: 0.09, distance: 4.55, speed: 2.25, color: '#b06149', inclination: 0.04 },
      { id: 'thebe',    name: 'Thebe',    radius: 0.07, distance: 4.95, speed: 2.05, color: '#8a7c6e', inclination: 0.07 },
      // Galilean moons
      { id: 'io',       name: 'Io',       radius: 0.18, distance: 5.40, speed: 1.80, color: '#f3d36b' },
      { id: 'europa',   name: 'Europa',   radius: 0.16, distance: 6.40, speed: 1.30, color: '#e7d6b0' },
      { id: 'ganymede', name: 'Ganymede', radius: 0.22, distance: 7.80, speed: 0.95, color: '#b8a890' },
      { id: 'callisto', name: 'Callisto', radius: 0.20, distance: 9.40, speed: 0.70, color: '#827566' },
      // Outer irregular moons — inclined + retrograde for variety
      { id: 'himalia',  name: 'Himalia',  radius: 0.07, distance: 12.0, speed:  0.32, color: '#5a544e', inclination: 0.50 },
      { id: 'pasiphae', name: 'Pasiphae', radius: 0.05, distance: 15.5, speed: -0.16, color: '#3e3934', inclination: 0.80 },
    ],
    facts: {
      diameter: '139,820 km',
      mass: '1.898 × 10²⁷ kg',
      gravity: '24.79 m/s²',
      day: '9h 56m',
      year: '11.86 Earth years',
      temperature: '-108 °C',
      moons: '95+',
      distanceFromSun: '5.2 AU',
      composition: 'Hydrogen · Helium · Storms',
      discovered: 'Known to ancients',
    },
    description:
      'A gas giant so massive it could fit all other planets inside it. Its Great Red Spot is a storm raging for centuries.',
    funFacts: [
      'Has the strongest magnetic field of any planet',
      'Its moon Europa hides a subsurface ocean',
      'Jupiter shields inner planets from comets',
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    tagline: 'The Ringed Wonder',
    type: 'gas',
    radius: 3,
    distance: 58,
    orbitSpeed: 0.07,
    rotationSpeed: 0.082,
    axialTilt: 0.47,
    color: { primary: '#e9d49b', secondary: '#8a6a3a', glow: '#fde6b1' },
    ring: { inner: 4, outer: 6.5, color: '#e9d49b', opacity: 0.85, tilt: 0.42 },
    moons: [
      // The six major rounded moons (inner → outer)
      { id: 'mimas',     name: 'Mimas',     radius: 0.09, distance:  7.40, speed: 1.55, color: '#d6d8db' },
      { id: 'enceladus', name: 'Enceladus', radius: 0.10, distance:  8.10, speed: 1.30, color: '#eef6ff' },
      { id: 'tethys',    name: 'Tethys',    radius: 0.12, distance:  8.80, speed: 1.10, color: '#e6ecef' },
      { id: 'dione',     name: 'Dione',     radius: 0.13, distance:  9.60, speed: 0.90, color: '#c4c8cb' },
      { id: 'rhea',      name: 'Rhea',      radius: 0.15, distance: 10.60, speed: 0.75, color: '#cfd3d5' },
      { id: 'titan',     name: 'Titan',     radius: 0.25, distance: 12.50, speed: 0.50, color: '#d4a85f' },
      // Outer — dual-tone Iapetus + retrograde Phoebe
      { id: 'iapetus',   name: 'Iapetus',   radius: 0.14, distance: 16.00, speed:  0.27, color: '#4a3c30', inclination: 0.27 },
      { id: 'phoebe',    name: 'Phoebe',    radius: 0.06, distance: 19.00, speed: -0.14, color: '#3a352f', inclination: 0.60 },
    ],
    facts: {
      diameter: '116,460 km',
      mass: '5.68 × 10²⁶ kg',
      gravity: '10.44 m/s²',
      day: '10h 33m',
      year: '29.5 Earth years',
      temperature: '-138 °C',
      moons: '146+',
      distanceFromSun: '9.58 AU',
      composition: 'Hydrogen · Helium · Ice rings',
      discovered: 'Known to ancients',
    },
    description:
      'Famous for its dazzling rings of ice and rock, Saturn is the least dense planet — it would float in water (if you found a big enough ocean).',
    funFacts: [
      'Rings span 282,000 km but are only ~10m thick',
      'Hosts a hexagonal storm at its north pole',
      'Titan has lakes of liquid methane',
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    tagline: 'The Tilted Ice World',
    type: 'ice',
    radius: 2,
    distance: 72,
    orbitSpeed: 0.048,
    rotationSpeed: -0.06,
    axialTilt: 1.71,
    color: { primary: '#9fe1e0', secondary: '#3a7c84', glow: '#b8f0ef' },
    atmosphere: { color: '#a5f3fc', intensity: 0.5 },
    ring: { inner: 2.6, outer: 3.2, color: '#9fe1e0', opacity: 0.35, tilt: 1.5 },
    moons: [
      { id: 'portia',  name: 'Portia',  radius: 0.06, distance: 2.70, speed: 1.90, color: '#918d88' },
      { id: 'puck',    name: 'Puck',    radius: 0.07, distance: 3.05, speed: 1.75, color: '#8a8783' },
      { id: 'miranda', name: 'Miranda', radius: 0.08, distance: 3.90, speed: 1.50, color: '#cdd6db' },
      { id: 'ariel',   name: 'Ariel',   radius: 0.13, distance: 4.80, speed: 1.20, color: '#d8e2e6' },
      { id: 'umbriel', name: 'Umbriel', radius: 0.13, distance: 5.80, speed: 1.00, color: '#6a6c70' },
      { id: 'titania', name: 'Titania', radius: 0.18, distance: 7.00, speed: 0.75, color: '#b8a89a' },
      { id: 'oberon',  name: 'Oberon',  radius: 0.16, distance: 8.50, speed: 0.60, color: '#8e8076' },
    ],
    facts: {
      diameter: '50,724 km',
      mass: '8.68 × 10²⁵ kg',
      gravity: '8.87 m/s²',
      day: '17h 14m',
      year: '84 Earth years',
      temperature: '-195 °C',
      moons: '27+',
      distanceFromSun: '19.2 AU',
      composition: 'Hydrogen · Helium · Methane ice',
      discovered: '1781 — William Herschel',
    },
    description:
      'Uranus rolls through space on its side — its axis tilted 98°. Methane in its atmosphere gives it that distinctive aquamarine glow.',
    funFacts: [
      'Rotates on its side — unique among planets',
      'Has 13 known faint rings',
      'Coldest planetary atmosphere in the solar system',
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    tagline: 'The Distant Storm',
    type: 'ice',
    radius: 1.95,
    distance: 84,
    orbitSpeed: 0.038,
    rotationSpeed: 0.065,
    axialTilt: 0.49,
    color: { primary: '#3b6fe0', secondary: '#1e3a8a', glow: '#5b8def' },
    atmosphere: { color: '#5b8def', intensity: 0.9 },
    moons: [
      { id: 'despina', name: 'Despina', radius: 0.05, distance: 2.55, speed: 2.20, color: '#7a7b7e' },
      { id: 'galatea', name: 'Galatea', radius: 0.06, distance: 2.85, speed: 1.95, color: '#7d7e80' },
      { id: 'larissa', name: 'Larissa', radius: 0.06, distance: 3.25, speed: 1.65, color: '#6d6e72' },
      { id: 'proteus', name: 'Proteus', radius: 0.10, distance: 3.70, speed: 1.35, color: '#7a7e85' },
      // Triton — retrograde + highly inclined (Neptune's iconic moon)
      { id: 'triton',  name: 'Triton',  radius: 0.18, distance: 5.40, speed: -1.00, color: '#cdd6e6', inclination: 0.45 },
      { id: 'nereid',  name: 'Nereid',  radius: 0.08, distance: 8.00, speed:  0.40, color: '#b9b6a8', inclination: 0.50 },
    ],
    facts: {
      diameter: '49,244 km',
      mass: '1.02 × 10²⁶ kg',
      gravity: '11.15 m/s²',
      day: '16h 6m',
      year: '165 Earth years',
      temperature: '-201 °C',
      moons: '14+',
      distanceFromSun: '30.05 AU',
      composition: 'Hydrogen · Helium · Methane',
      discovered: '1846 — Galle & d\'Arrest',
    },
    description:
      'The windiest planet in our system — supersonic winds tear across this deep blue ice giant. Discovered through mathematics before observation.',
    funFacts: [
      'Winds reach 2,100 km/h',
      'First planet discovered through prediction',
      'One orbit equals 165 Earth years',
    ],
  },
];

export const SUN = PLANETS[0];
export const ORBITING = PLANETS.slice(1);

export function getPlanet(id: string | null) {
  if (!id) return null;
  return PLANETS.find(p => p.id === id) ?? null;
}
