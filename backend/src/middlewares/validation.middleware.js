function validateRequest(anySchema) {
    return ((req, res, next) => {
        // console.log("validating")

        let result = anySchema.safeParse(req.body)
        if (!result.success) {
            result.error.statusCode = 400
            next(result.error)
        } else {
            req.data = result.data
            next()
        }
    })
}

export { validateRequest }
