export default {
  commands: ["/next", "/opendoor"],
  events: ["message", "reaction_added"],
  // actions: ["confirm-team-name-1", "confirm-team-name-2"],
  actions: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30,
  ].map((i) => `confirm-team-name-${i}`),
  admin: ["UEJL2RADT", "U013B6CPV62"],
};
