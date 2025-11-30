export class ResponseHelper {
    static success(res, data, message, statusCode = 200, pagination) {
        const response = {
            success: true,
            data,
            message,
            ...(pagination && { pagination })
        };
        return res.status(statusCode).json(response);
    }
    static error(res, errors, message = 'An error occurred', statusCode = 500) {
        const response = {
            success: false,
            errors,
            message
        };
        return res.status(statusCode).json(response);
    }
    static created(res, data, message) {
        return this.success(res, data, message, 201);
    }
    static noContent(res) {
        return res.status(204).send();
    }
    static badRequest(res, errors, message = 'Bad request') {
        return this.error(res, errors, message, 400);
    }
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, null, message, 401);
    }
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, null, message, 403);
    }
    static notFound(res, message = 'Resource not found') {
        return this.error(res, null, message, 404);
    }
    static conflict(res, message = 'Conflict') {
        return this.error(res, null, message, 409);
    }
    static internalError(res, error) {
        return this.error(res, error, 'Internal server error', 500);
    }
}
// Alias for convenience
export const ApiResponse = ResponseHelper;
//# sourceMappingURL=response.js.map