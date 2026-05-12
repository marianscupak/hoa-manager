export interface GoogleCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export class HandleGoogleCallbackCommand {
  constructor(public readonly query: GoogleCallbackQuery) {}
}
