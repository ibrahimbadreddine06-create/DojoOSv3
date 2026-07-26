import { bodyMetricUmbrellas } from "./body-metric-umbrellas";
import {
  bodyWidgetCollections,
  stepsUmbrellaWidget,
} from "./hub-style-widgets";

/**
 * Permanent source-level archive of the Body design-language work.
 *
 * These collections reference the real widget definitions. They are not
 * screenshots, preview copies, or reconstructed approximations, so every
 * variant, supported footprint, interaction, and responsive composition stays
 * available exactly as implemented.
 */
export const currentBodyWidgetArchive = [
  stepsUmbrellaWidget,
  ...bodyMetricUmbrellas,
];

/**
 * The earlier approved E exploration remains intact as a historical layer.
 * It includes the Hydration composition that is no longer part of the current
 * metric-umbrella collection.
 */
export const bodyDesignLanguageArchive =
  bodyWidgetCollections.approvedBodySetV1;

export const bodyWidgetArchive = {
  current: currentBodyWidgetArchive,
  designLanguage: bodyDesignLanguageArchive,
} as const;
