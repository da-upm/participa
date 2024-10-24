class BadRequestError extends Error { }
module.exports.BadRequestError = BadRequestError;

class LimitedUserError extends Error { }
module.exports.LimitedUserError = LimitedUserError;

class NotFoundError extends Error { }
module.exports.NotFoundError = NotFoundError;

class UnauthorizedError extends Error { }
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
		console.warn(`El usuario ${req.session.user.id} ha intentado realizar una acción no autorizada.`)
		req.toastr.error("No tienes permisos para realizar esta acción.", '', {
			"closeButton": true,
			"progressBar": true,
			"positionClass": "toast-bottom-right",
			"showDuration": "300",
			"hideDuration": "1000",
			"timeOut": "5000",
			"extendedTimeOut": "1000",
			"showEasing": "swing",
			"hideEasing": "linear",
			"showMethod": "fadeIn",
			"hideMethod": "fadeOut"
		});
		res.setHeader(
			'Hx-Redirect',
			`/`
		);
		return res.status(403).redirect('/');
	}

	if (err instanceof NotFoundError) {
		return res.status(404).json({
			code: 'not_found',
			message: 'Página no encontrada.',
		});
	}

	if (err instanceof UnauthorizedError) {
		req.toastr.warning("Necesitas estar autenticado para realizar esta acción.", '', {
			"closeButton": true,
			"progressBar": true,
			"positionClass": "toast-bottom-right",
			"showDuration": "300",
			"hideDuration": "1000",
			"timeOut": "5000",
			"extendedTimeOut": "1000",
			"showEasing": "swing",
			"hideEasing": "linear",
			"showMethod": "fadeIn",
			"hideMethod": "fadeOut"
		});
		res.setHeader(
			'Hx-Redirect',
			`/login`
		);
		if (req.xhr) return res.status(401).json({
			code: 'limited_user',
			message: 'No tienes permisos para realizar esta acción.',
		})

		req.session.referer = req.path;
		return res.status(401).redirect('/login');
	}

	// Some other unknown error.
	res.status(500).json({
		code: 'internal_server_error',
		message: 'Error interno del servidor.',
	});
	return next(err); // Let it pass the middleware so Sentry can catch it.
};
