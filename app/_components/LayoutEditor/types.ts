export type FixtureTypeId =
  | "wall_shelf"
  | "gondola_double"
  | "endcap"
  | "produce_shelf"
  | "cooler_upright"
  | "food_cooler"
  | "pepsi_cooler"
  | "fresh_counter"
  | "bakery_shelf"
  | "promo_island"
  | "checkout"
  | "checkout_impulse"
  | "obstacle"
  | "entry_exit"
  | "annotation";

export type TemperatureZone = "ambient" | "chilled" | "frozen";

export interface FixtureTypeDef {
  id: FixtureTypeId;
  labelVi: string;
  defaultWidth: number;  // mm
  defaultDepth: number;  // mm
  defaultHeight: number; // mm
  defaultShelfCount: number;
  temperatureZone: TemperatureZone;
  sellable: boolean;
  promoCapable: boolean;
  color: string;         // canvas fill
  borderColor: string;
}

export interface FixtureGeometry {
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotationDeg: number;
}

export interface FixtureBusiness {
  fixtureType: FixtureTypeId;
  temperatureZone: TemperatureZone;
  shelfCount: number;
  promo: boolean;
  categoryZone: string;
  priorityScore: number;
  sellable: boolean;
}

export interface FixtureInstance {
  id: string;
  name: string;
  geometry: FixtureGeometry;
  business: FixtureBusiness;
  // Annotation fields (only used when fixtureType === "annotation")
  note?: string;
  noteImageUrl?: string;
}

export interface CanvasConfig {
  width: number;
  height: number;
  gridStep: number;
}

export interface WallLine {
  id: string;
  x1: number; y1: number; // mm
  x2: number; y2: number; // mm
  thickness: number;       // mm, default 200
}

export type ToolMode = "select" | "draw-wall";

export interface LayoutDocument {
  version: string;
  store: {
    storeId: string;
    name: string;
    formatCode: string;
    unit: "mm";
  };
  canvas: CanvasConfig;
  fixtures: FixtureInstance[];
  walls: WallLine[];
}
