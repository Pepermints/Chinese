export const theme = {
  paper: "#F6F1E7",
  card: "#FFFCF6",
  ink: "#2A241C",
  inkSoft: "#7A6D59",
  line: "#E3D8C2",
  seal: "#B33B2E",
  sealSoft: "#F1DAD5",
  jade: "#3F6D5A",
  jadeSoft: "#DCEAE3",
  ochre: "#B3821F",
  ochreSoft: "#F3E4C4",
  navy: "#35465F",
  // If you bundle a CJK serif (e.g. Noto Serif SC) via expo-font, point this
  // at its registered family name. Left as `undefined` it falls back to the
  // OS system font, which already renders Chinese correctly on both
  // platforms — just without the serif look from the web mockup.
  hanziFont: undefined as string | undefined,
  toneColor(tone: number) {
    switch (tone) {
      case 1:
        return this.seal;
      case 2:
        return this.jade;
      case 3:
        return this.ochre;
      case 4:
        return this.navy;
      default:
        return this.inkSoft;
    }
  },
};

export const NAME_COLORS = [
  { bg: "#DCEAE3", fg: "#2F5245" }, // jade
  { bg: "#F3E4C4", fg: "#7A5A17" }, // ochre
  { bg: "#EBDDE7", fg: "#623F57" }, // plum
  { bg: "#DCE6EF", fg: "#33506E" }, // blue
];
