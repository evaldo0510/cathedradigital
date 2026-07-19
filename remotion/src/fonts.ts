import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadKarla } from "@remotion/google-fonts/Karla";

export const cormorant = loadCormorant("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
}).fontFamily;

export const karla = loadKarla("normal", {
  weights: ["300", "400", "500", "700"],
  subsets: ["latin"],
}).fontFamily;
