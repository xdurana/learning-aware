var config = require(__base + '/config');

/**
 * Plana aules d'un professot
 * @param req
 * @param res
 * @param next
 */
exports.pra = function (req, res, next) {
    var idp = '282246';
    res.redirect(config.util.format('/app/guaita/assignatures/?idp=%s&perfil=pra&s=%s', idp, req.query.s));
};

/**
 * Plana aules d'un consultor
 * @param req
 * @param res
 * @param next
 */
exports.consultor = function (req, res, next) {
    var idp = '449732';
    res.redirect(config.util.format('/app/guaita/assignatures/?idp=%s&perfil=consultor&s=%s', idp, req.query.s));
};

/**
 * Calendari d'un estudiant
 * @param req
 * @param res
 * @param next
 */
exports.estudiant = function (req, res, next) {
    var idp = '674277';
    res.redirect(config.util.format('/app/guaita/assignatures?idp=%s&perfil=estudiant&s=%s', idp, req.query.s));
};

/**
 * Widget d'una aula
 * @param req
 * @param res
 * @param next
 */
exports.widget = function (req, res, next) {
    var idp = '755089';
    res.redirect(config.util.format('/app/guaita/assignatures/20131/06.510/415940/aules/1/419029/131_06_510/widget?idp=%s&s=%s', idp, req.query.s));
};

/**
 * Detall d'una aula
 * @param req
 * @param res
 * @param next
 */
exports.aula = function (req, res, next) {
    var idp = '282246';    
    res.redirect(config.util.format('/app/guaita/assignatures/20131/06.510/415940/aules/1/419029/131_06_510_01?idp=%s&s=%s', idp, req.query.s));
};

/**
 * Materials d'una aula per estudiant
 * @param req
 * @param res
 * @param next
 */
exports.material = function(req, res, next) {
    var pid = 'PID_00205228';
    var idp = '70000813';
    var login = 'jmatamoros';
    var role = 'CONSULTOR';
    var subject = '382785';
    var classroom = '1000';
    res.redirect(config.util.format('/app/guaita/materials/%s?s=%s&idp=%s&login=%s&role=%s&subject=%s&classroom=%s&language=%s', pid, req.query.s, idp, login, role, subject, classroom, config.lng()));
};