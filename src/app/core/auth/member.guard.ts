import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AUTH_SERVICE } from "../services/service-tokens";
export const memberGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AUTH_SERVICE),
    router = inject(Router);
  return (await firstValueFrom(auth.session$))
    ? true
    : router.createUrlTree(["/login"], {
        queryParams: { returnUrl: state.url },
      });
};
