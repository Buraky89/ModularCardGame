export interface LoginResponse {
  token: string;
}

export interface JoinResponse {
  message: string;
  uuid: string;
}

export interface ErrorResponse {
  message: string;
}
