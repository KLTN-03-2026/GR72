import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type StandardResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T> | T>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T> | T> {
    return next.handle().pipe(
      map((data) => {
        if (this.isStandardResponse(data)) {
          return data;
        }

        return {
          success: true,
          message: 'Request successful',
          data,
        };
      }),
    );
  }

  private isStandardResponse(data: unknown): data is StandardResponse<T> {
    if (!data || typeof data !== 'object') {
      return false;
    }

    return (
      'success' in data &&
      'message' in data &&
      'data' in data &&
      typeof (data as { success?: unknown }).success === 'boolean'
    );
  }
}
