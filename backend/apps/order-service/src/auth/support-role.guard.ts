import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { OrderRequest } from './order-user';
@Injectable()
export class SupportRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.switchToHttp().getRequest<OrderRequest>().user?.role !== 'SUPPORT') {
      throw new ForbiddenException();
    }
    return true;
    }
}