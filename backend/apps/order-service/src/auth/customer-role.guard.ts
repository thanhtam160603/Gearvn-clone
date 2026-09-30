import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { OrderRequest } from './order-user';
@Injectable()
export class CustomerRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.switchToHttp().getRequest<OrderRequest>().user?.role !== 'CUSTOMER') {
      throw new ForbiddenException();
    }
    return true;
  }
}