var eines = require('../routes/eines');
var activitats = require('../routes/activitats');
var aules = require('../routes/aules');
var widget = require('../routes/widget');

/**
 * [getToolsByIdp description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
var getToolsByIdp = function(req, res, next) {
    return eines.aulaidp(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        req.params.idp,
        req.query.s,
        true,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació de les eines de l'aula");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            res.render(req.params.perfil == 'consultor' ? 'eines-aula-estudiant.html' : 'eines-aula-consultor.html', { aula: result });
        }
    });
}

/**
 * [getToolsByConsultant description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getToolsByConsultant = exports.getToolsByConsultant = function (req, res, next) {
    req.params.perfil = 'consultor';
    return getToolsByIdp(req, res, function (err, result) {
        return next();
    });
}

/**
 * [getToolsByStudent description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getToolsByStudent = exports.getToolsByStudent = function (req, res, next) {
    req.params.perfil = 'estudiant';
    return getToolsByIdp(req, res, function (err, result) {
        return next();
    });
}

/**
 * [getActivitatsByIdp description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
var getActivitatsByIdp = function(req, res, next) {
    return activitats.idp(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        req.params.idp,
        req.query.s,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació de les activitats de l'aula");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            res.render(req.params.perfil == 'consultor' ? 'activitats-consultors.html' : 'activitats-aula.html', { aula: result });
        }
    });    
}

/**
 * [getActivitiesByConsultant description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getActivitiesByConsultant = exports.getActivitiesByConsultant = function (req, res, next) {
    req.params.perfil = 'consultor';
    return getActivitatsByIdp(req, res, function (err, result) {
        return next();
    });
}

/**
 * [getActivitiesByStudent description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getActivitiesByStudent = exports.getActivitiesByStudent = function (req, res, next) {
    req.params.perfil = 'estudiant';
    return getActivitatsByIdp(req, res, function (err, result) {
        return next();
    });
}

/**
 * [getActivityToolsByStudent description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getActivityToolsByStudent = exports.getActivityToolsByStudent = function (req, res, next) {
    return eines.activitatEstudiant(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        req.params.eventId,
        req.params.idp,
        req.query.s,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació de les eines de l'activitat");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            res.render('eines-activitat-estudiant.html', { activitat: result });
        }
    });
}


/**
 * [getAssessment description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getAssessment = exports.getAssessment = function (req, res, next) {
    return activitats.avaluacio(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        req.query.s,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació de l'avaluació dels estudiants de l'aula");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            res.render('avaluacio-estudiants.html', { aula: result });
        }
    });
}

/**
 * [getTools description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getTools = exports.getTools = function (req, res, next) {
    return eines.aula(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        req.query.idp,
        req.query.s,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació de les eines de l'aula");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            res.render('eines-estudiants.html', { aula: result });
        }
    });
}

/**
 * [getActivityTools description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getActivityTools = exports.getActivityTools = function (req, res, next) {
    return eines.activitat(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        req.params.eventId,
        req.query.idp,
        req.query.s,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació de les activitats de l'aula");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            res.render('eines-activitats-estudiants.html', { activitat: result });
        }
    });
}

/**
 * [getActivities description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getActivities = exports.getActivities = function (req, res, next) {
    return activitats.aula(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        req.query.s,
        true,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació de les activitats de l'aula");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            res.render('activitats-estudiants.html', { aula: result });
        }
    });
}

/**
 * [get description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var get = exports.get = function (req, res, next) {
    return aules.one(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        req.query.idp,
        req.query.s,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació de l'aula");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            res.render('aula.html', { aula: result });
        }
    });
}

/**
 * [getWidget description]
 * @param  {[type]}   req
 * @param  {[type]}   res
 * @param  {Function} next
 * @return {[type]}
 */
var getWidget = exports.getWidget = function (req, res, next) {
    return widget.one(
        req.params.anyAcademic,
        req.params.codAssignatura,
        req.params.domainId,
        req.params.codAula,
        req.params.domainIdAula,
        req.params.domainCode,
        idp,
        req.query.s,
        function (err, result) {
        if (err) {
            return next("No s'ha pogut obtenir la informació del widget");
        }
        if (req.query.format) {
            res.json(result);
        } else {
            result.s = req.query.s;
            result.lang = config.i18next.lng();
            res.render('widget-aula.html', { widget: result });
        }
    });
}