class ApiError extends Error {
    constructor(
        statusCode,
        msg = "Something went wrong",
        errors = [],
        stack = "",
        message,
    ) {
        super(message)
        this.statusCode = statusCode
        this.msg = msg
        this.data = null
        this.success = false
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError }