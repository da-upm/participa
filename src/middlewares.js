const { UnauthorizedError, LimitedUserError, InternalServerError } = require('./errors');
const User = require('./models/user');
const Candidates = require('./models/candidate');

function checkLogin(req, res, next) {
    if (!req.session.user?._id) return next(new UnauthorizedError());
    console.log(req.session.user)
    User.findOne({ username: req.session.userInfo.preferred_username })
        .then((user) => {
            if (!user) throw new InternalServerError('El objeto usuario está vacío.');
            req.session.user = user;
            return next();
        })
        .catch((err) => {
            console.error(err);
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
    if (!req.session.user.isAdmin) return next(new LimitedUserError());
    return next();
};

// Checks if the user is a candidate by checking their username against the usernames in list of candidates or their surrogateUsers array.
module.exports.checkCandidate = (req, res, next) => {
    Candidates.findOne({ $or: [{ username: req.session.userInfo.preferred_username }, { surrogateUsers: req.session.userInfo.preferred_username }] })
        .then((candidate) => {
            if (!candidate) return next(new LimitedUserError());
            req.session.candidate = candidate;
            return next();
        })
        .catch((err) => {
            console.error(err);
            return next(new InternalServerError('Ha ocurrido un error recuperando el candidato.'));
        });
};
