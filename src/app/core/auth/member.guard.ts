import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AUTH_SERVICE } from "../services/service-tokens";
import { withTimeout } from "../utils/with-timeout";
export const memberGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AUTH_SERVICE),
    router = inject(Router);
  try {
    const session = await withTimeout(auth.getAccess());
    if (session && (!session.membership || session.membership === "active"))
      return true;
    return router.createUrlTree([session ? "/redeem" : "/login"], {
      queryParams: { returnUrl: state.url },
    });
  } catch {
    return router.createUrlTree(["/unavailable"], {
      queryParams: { returnUrl: state.url },
    });
  }
};
