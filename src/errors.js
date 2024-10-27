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
	res.setHeader(
		'Hx-Retarget',
		`#toastr-container`
	)

	if (err instanceof BadRequestError) {
		req.toastr.error(err.message, '', {
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
		if (!req.xhr) return res.status(400).json({
			code: 'bad_request',
			message: err.message,
		})
		return res.status(400).render('fragments/toastr', { layout: false, req: req });
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
		req.toastr.error(err.message, '', {
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
		if (!req.xhr) return res.status(404).json({
			code: 'not_found',
			message: err.message,
		})
		return res.status(404).render('fragments/toastr', { layout: false, req: req });
	}

	// Some other unknown error.
	req.toastr.error(err.message, '', {
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
	if (!req.xhr) return res.status(500).json({
		code: 'internal_server_error',
		message: err.message,
	})
	return res.status(500).render('fragments/toastr', { layout: false, req: req });
};
