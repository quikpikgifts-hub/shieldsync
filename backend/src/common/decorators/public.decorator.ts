import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Opts a route out of the global JWT auth guard. Secure-by-default means every route
 * requires authentication unless it is explicitly marked @Public() — the reverse of
 * having to remember to protect each new route individually.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
