import z from 'zod'

export const preInterviewBody = z.object({
    gitHub: z.string()
})