import { Type } from '@sinclair/typebox'

export const RegisterUserSchema = Type.Object({
    email: Type.String({ format: 'email' }),
    displayName: Type.String({ minLength: 1, maxLength: 20 }),
    password: Type.String({ minLength: 6, maxLength: 100 }),
    avatarBase64: Type.Optional(Type.String({ contentEncoding: 'base64' })),
    is2FAEnabled: Type.Optional(Type.Boolean({ default: false }))
})

export const LoginUserSchema = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String()
})

export const UserIdSchema = Type.Object({
    userId: Type.Number(),
})

export const UpdateUserProfileSchema = Type.Object({
    displayName: Type.String(),
    avatarBase64: Type.Optional(Type.String({ contentEncoding: 'base64' })),
})

export type RegisterUserDto = typeof RegisterUserSchema.static
export type LoginUserDto = typeof LoginUserSchema.static
export type UserIdDto = typeof UserIdSchema.static
export type UpdateUserProfileDto = typeof UpdateUserProfileSchema.static