import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AUTH_SERVICE } from "../services/service-tokens";
export const memberGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AUTH_SERVICE),
    router = inject(Router);
  try {
    const session = await auth.getAccess();
    if (session && (!session.membership || session.membership === "active"))
      return true;
    return router.createUrlTree([session ? "/redeem" : "/login"], {
      queryParams: { returnUrl: state.url },
    });
  } catch {
    return router.createUrlTree(["/login"], {
      queryParams: { returnUrl: state.url, unavailable: "1" },
    });
  }
};
