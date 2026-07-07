/**
 * Honeycomb background textures — large pointy-top hexagons, thin stroke +
 * a faint per-cell gradient. Kept deliberately subtle so it backs the
 * content without competing. Apply via the *_STYLE objects.
 */
export const HONEYCOMB_BG =
  'url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2258.89%22%20height%3D%22102%22%20viewBox%3D%220%200%2058.89%20102%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%220.025%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M0%20-34L29.44%20-17L29.44%2017L0%2034L-29.44%2017L-29.44%20-17Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23f4a724%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.06%22%2F%3E%3Cpath%20d%3D%22M58.89%20-34L88.33%20-17L88.33%2017L58.89%2034L29.44%2017L29.44%20-17Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23f4a724%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.06%22%2F%3E%3Cpath%20d%3D%22M0%2068L29.44%2085L29.44%20119L0%20136L-29.44%20119L-29.44%2085Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23f4a724%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.06%22%2F%3E%3Cpath%20d%3D%22M58.89%2068L88.33%2085L88.33%20119L58.89%20136L29.44%20119L29.44%2085Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23f4a724%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.06%22%2F%3E%3Cpath%20d%3D%22M29.44%2017L58.89%2034L58.89%2068L29.44%2085L0%2068L0%2034Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23f4a724%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.06%22%2F%3E%3C%2Fsvg%3E")';

export const HONEYCOMB_STYLE = {
  backgroundImage: HONEYCOMB_BG,
  backgroundSize: '58.89px 102px',
} as const;

export const HONEYCOMB_LIGHT_BG =
  'url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2258.89%22%20height%3D%22102%22%20viewBox%3D%220%200%2058.89%20102%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23221c13%22%20stop-opacity%3D%220.016%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23221c13%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M0%20-34L29.44%20-17L29.44%2017L0%2034L-29.44%2017L-29.44%20-17Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23221c13%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.035%22%2F%3E%3Cpath%20d%3D%22M58.89%20-34L88.33%20-17L88.33%2017L58.89%2034L29.44%2017L29.44%20-17Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23221c13%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.035%22%2F%3E%3Cpath%20d%3D%22M0%2068L29.44%2085L29.44%20119L0%20136L-29.44%20119L-29.44%2085Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23221c13%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.035%22%2F%3E%3Cpath%20d%3D%22M58.89%2068L88.33%2085L88.33%20119L58.89%20136L29.44%20119L29.44%2085Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23221c13%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.035%22%2F%3E%3Cpath%20d%3D%22M29.44%2017L58.89%2034L58.89%2068L29.44%2085L0%2068L0%2034Z%22%20fill%3D%22url(%23g)%22%20stroke%3D%22%23221c13%22%20stroke-width%3D%221%22%20stroke-opacity%3D%220.035%22%2F%3E%3C%2Fsvg%3E")';

export const HONEYCOMB_LIGHT_STYLE = {
  backgroundImage: HONEYCOMB_LIGHT_BG,
  backgroundSize: '58.89px 102px',
} as const;
