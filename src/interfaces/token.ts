export interface Token {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: 'Bearer';
}
