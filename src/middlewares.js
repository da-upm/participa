const { UnauthorizedError, LimitedUserError } = require('./errors');
const User = require('./models/user');

function checkLogin(req, res, next) {
    if (!req.session.user?.id) return next(new UnauthorizedError());
    User.findOne({ username: req.session.userInfo.preferred_username })
        .then((user) => {
            if (!user) throw new Error('El objeto usuario está vacío.');
            req.session.user = user;
            return next();
        })
        .catch((err) => {
            console.log(err);
            return res.status(500).json({ message: 'Ha ocurrido un error recuperando el usuario.' });
        });

}

function checkLoginMock(req, res, next) {
    console.log('[WARNING] Using the mocked login controller!');

    req.session.userInfo = {
        upmClassifCode: ['CentroPerfil:90:A'],
        name: 'PERICO PEREZ PEREZ',
        preferred_username: 'p.perez',
        given_name: 'PERICO',
        family_name: 'PEREZ PEREZ',
        email: 'p.perez@alumnos.upm.es'
    }

    return checkLogin(req, res, next);
}

// Load the mocked login comprobation iff this is a development instance.
module.exports.checkLogin = (
    (process.env.NODE_ENV === 'development') ? checkLoginMock
        : checkLogin);


// Rejects queries that aren't from administrators.
module.exports.restrictAdmins = (req, res, next) => {
    if (!req.session.user.admin) return next(new LimitedUserError());
    return next();
};
