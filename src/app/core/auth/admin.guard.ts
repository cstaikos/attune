import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { MODERATION_SERVICE } from "../services/service-tokens";
import { withTimeout } from "../utils/with-timeout";
export const adminGuard: CanActivateFn = async (_route, state) => {
  const service = inject(MODERATION_SERVICE),
    router = inject(Router);
  try {
    return (
      (await withTimeout(service.isAdmin())) ||
      router.createUrlTree(["/library"])
    );
  } catch {
    return router.createUrlTree(["/unavailable"], {
      queryParams: { returnUrl: state.url },
    });
  }
};
