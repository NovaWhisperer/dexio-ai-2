function validateRequest(anySchema) {
    return ((req, res, next) => {

        let result = anySchema.safeParse(req.body)
        if (!result.success) {
            next(result.error)
        } else {
            req.data = result.data
            next()
        }
    })
}

export { validateRequest }
