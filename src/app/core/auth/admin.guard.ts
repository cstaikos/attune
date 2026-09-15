import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { MODERATION_SERVICE } from "../services/service-tokens";
export const adminGuard: CanActivateFn = async () => {
  const service = inject(MODERATION_SERVICE),
    router = inject(Router);
  try {
    return (await service.isAdmin()) || router.createUrlTree(["/library"]);
  } catch {
    return router.createUrlTree(["/login"]);
  }
};
