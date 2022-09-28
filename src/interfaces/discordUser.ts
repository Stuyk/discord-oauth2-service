export interface DiscordUser {
    id: string;
    username: string;
    avatar: string;
    avatar_decoration: null;
    discriminator: string;
    public_flags: number;
    flags: number;
    banner: string;
    banner_color: string;
    accent_color: number;
    locale: string;
    mfa_enabled: boolean;
    premium_type: number;
    email: string;
    verified: boolean;
}
