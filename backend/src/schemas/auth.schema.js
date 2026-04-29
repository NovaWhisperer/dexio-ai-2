import { z } from "zod"

const registerSchema = z.object({
    fullName: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
    }),
    email: z.email(),
    password: z.string().min(8)
})

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8)
})

const forgotPasswordSchema = z.object({
    email: z.email()
});
const resetPasswordSchema = z.object({
    password: z.string().min(8)
});


export { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema }

