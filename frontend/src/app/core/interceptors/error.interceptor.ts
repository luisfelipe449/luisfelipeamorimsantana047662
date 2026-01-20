import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  private readonly errorMessages: Record<number, string> = {
    0: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    400: 'Requisição inválida. Verifique os dados enviados.',
    401: 'Sessão expirada. Faça login novamente.',
    403: 'Você não tem permissão para acessar este recurso.',
    404: 'Recurso não encontrado.',
    408: 'Tempo de requisição esgotado. Tente novamente.',
    409: 'Conflito de dados. O recurso já existe.',
    422: 'Dados inválidos. Verifique os campos preenchidos.',
    429: 'Muitas requisições. Aguarde um momento antes de tentar novamente.',
    500: 'Erro interno do servidor. Tente novamente mais tarde.',
    502: 'Servidor temporariamente indisponível.',
    503: 'Serviço indisponível. Tente novamente mais tarde.',
    504: 'Tempo de resposta do servidor esgotado.'
  };

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const friendlyMessage = this.getFriendlyMessage(error);

        // Create a new error with the friendly message
        const friendlyError = new HttpErrorResponse({
          error: {
            message: friendlyMessage,
            originalError: error.error
          },
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url || undefined
        });

        return throwError(() => friendlyError);
      })
    );
  }

  private getFriendlyMessage(error: HttpErrorResponse): string {
    // Check for network error
    if (error.status === 0) {
      return this.errorMessages[0];
    }

    // Check for known status codes
    if (this.errorMessages[error.status]) {
      return this.errorMessages[error.status];
    }

    // Check if backend provided a message
    if (error.error?.message && typeof error.error.message === 'string') {
      return error.error.message;
    }

    // Default message for unknown errors
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }
}
