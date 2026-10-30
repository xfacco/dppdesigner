import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Escluse: API, area admin (solo italiano), asset di Next e file statici
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
