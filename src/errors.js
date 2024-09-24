class BadRequestError extends Error {}
module.exports.BadRequestError = BadRequestError;

class LimitedUserError extends Error {}
module.exports.LimitedUserError = LimitedUserError;

class NotFoundError extends Error {}
module.exports.NotFoundError = NotFoundError;

class UnauthorizedError extends Error {}
module.exports.UnauthorizedError = UnauthorizedError;

// The global error handler.
// Express requires the 4 arguments to be present in order to identify this as
// an error handler.
// eslint-disable-next-line no-unused-vars
module.exports.globalErrorHandler = (err, req, res, next) => {
	if (err instanceof BadRequestError
		// Error type for SQL queries that introduce duplicate values on keys
		// that should be unique.
		|| err.code === 'ER_DUP_ENTRY') {
		return res.status(400).json({
			code: 'bad_request',
			message: 'Petición mal formada.',
		});
	}

	if (err instanceof LimitedUserError) {
		return res.status(403).json({
			code: 'limited_user',
			message: 'No tienes permisos para realizar esta acción.',
		});
	}

	if (err instanceof NotFoundError) {
		return res.status(404).json({
			code: 'not_found',
			message: 'Página no encontrada.',
		});
	}

	if (err instanceof UnauthorizedError) {
		return res.status(401).redirect('/login');
	}

	// Some other unknown error.
	res.status(500).json({
		code: 'internal_server_error',
		message: 'Error interno del servidor.',
	});
	return next(err); // Let it pass the middleware so Sentry can catch it.
};
