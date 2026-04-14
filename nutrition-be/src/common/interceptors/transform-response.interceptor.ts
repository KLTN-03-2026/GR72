import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Envelope already produced by a controller — do not wrap again */
type StandardResponseEnvelope = {
  success: boolean;
  message?: string;
  data?: unknown;
};

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponseEnvelope | T>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponseEnvelope | T> {
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

  private isStandardResponse(data: unknown): data is StandardResponseEnvelope {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const o = data as Record<string, unknown>;
    if (typeof o.success !== 'boolean') {
      return false;
    }

    // Controllers often return { success, data } without message (lists),
    // or { success, message } without data (e.g. delete). Require at least one payload field.
    return 'data' in o || 'message' in o;
  }
}
