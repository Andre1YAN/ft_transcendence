import { Type } from '@sinclair/typebox'

export const VerifyTwoFASchema = Type.Object({
    userId: Type.Number(),
    code: Type.String()
})

export type VerifyTwoFADto = typeof VerifyTwoFASchema.static