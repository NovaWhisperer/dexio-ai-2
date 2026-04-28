import zod from "zod"

const registerSchema = zod.object({
    fullName: zod.object({
        firstName: zod.string().min(1),
        lastName: zod.string().min(1),
    }),
    email: zod.string().email(),
    password: zod.string().min(8)
})

export { registerSchema }

