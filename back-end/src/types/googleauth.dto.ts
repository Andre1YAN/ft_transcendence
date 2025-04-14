import { Type } from '@sinclair/typebox'

export const IdTokenSchema = Type.Object({
    idToken: Type.String(),
})

export type IdTokenDto = typeof IdTokenSchema.static