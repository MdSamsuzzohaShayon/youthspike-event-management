import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

class RouterService {
  private router: AppRouterInstance | null = null;

  setRouter(router: AppRouterInstance) {
    this.router = router;
  }

  push(path: string) {
    this.router?.push(path);
  }
}

export default new RouterService();