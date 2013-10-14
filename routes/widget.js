var async = require('async');
var util = require('util');

var indicadors = require('./indicadors');
var activitats = require('./activitats');
var consultors = require('./consultors');
var eines = require('./eines');
var calendar = require('./calendar');
var config = require('../config');
var rac = require('../ws/rac');
var lrs = require('../ws/lrs');
var aulaca = require('../ws/aulaca');
var infoacademica = require('../ws/infoacademica');

/**
 * Widget d'una aula per idp
 * @param anyAcademic
 * @param codAssignatura
 * @param domainId
 * @param codAula
 * @param domainIdAula
 * @param idp
 * @param s
 */
exports.one = function(anyAcademic, codAssignatura, domainId, codAula, domainIdAula, domainCode, idp, s, callback) {

    var struct = {
        anyAcademic: anyAcademic,
        codAssignatura: codAssignatura,
        domainId: domainId,
        codAula: codAula,
        domainIdAula: domainIdAula,
        idp: idp,
        s: s
    };

    async.parallel([
        function (callback) {
            infoacademica.getAssignaturaByCodi(anyAcademic, codAssignatura, function(err, result) {
                if (err) { console.log(err); return callback(); }
                struct.nomAssignatura = result.out.descAssignatura;
                return callback();
            });
        },
        function (callback) {
            consultors.aula(anyAcademic, codAssignatura, codAula, idp, s, function(err, result) {
                if (err) { console.log(err); return callback(); }                
                struct.consultor = result;
                //TODO
                var userId = '380011';
                struct.consultor.urlConsultor = util.format(
                    '%s/webapps/cercaPersones/cercaContextualServlet?jsp=/jsp/cercaContextual/curriculum.jsp&l=a&idLang=a&s=%s&operacion=searchUser&USERID=%s',
                    config.cv(),
                    s,
                    userId
                    );
                return callback();
            });
        },
        function (callback) {
            eines.aulaidp(domainId, domainIdAula, idp, s, false, function(err, result) {
                if (err) { console.log(err); return callback(null, struct); }
                struct.eines = result.eines;
                return callback();
            });
        },
        function (callback) {
            activitats.actives(domainId, domainIdAula, s, function(err, result) {
                if (err) { console.log(err); return callback(null, struct); }
                struct.actives = result.activitats;
                if (struct.actives && struct.actives.length > 0) {
                    async.each(struct.actives, getEinesActivitat, function(err) {
                        if (err) { console.log(err); }
                        return callback(null, struct);
                    });
                } else {
                    return callback();
                }
            });
        },
        function (callback) {
            aulaca.getGroupServlet(domainCode, s, function(err, result) {
                if (err) { console.log(err); return callback(null, struct); }
                try {
                    struct.group = result;
                    struct.missatgesPendents = struct.group[0]['$']['numMsgPendents'];
                    struct.connectats = struct.group[0]['$']['conectats'];
                    struct.urlAula = struct.group[0]['$']['hrefEstudiantsConnectats'];
                    struct.eines = struct.group[0].recurs;
                } catch(e) {
                    console.log(e.message);
                }
                return callback();
            });
        },        
    ], function(err, results) {
        if (err) { console.log(err); }
        struct.urlAvaluacio = util.format('%s/tren/trenacc?s=%s&modul=PIOLIN.RAC/rac.rac&i_institucio=FC', config.cv(), s);
        callback(null, struct);
    });

    var getEinesActivitat = function(activitat, callback) {
        aulaca.getEinesPerActivitat(domainId, domainIdAula, activitat.eventId, s, function(err, result) {
            if (err) { console.log(err); return callback(); }
            activitat.eines = result;
            activitat.startDateStr = activitat.startDateStr.replace(/-/g, '/');
            activitat.deliveryDateStr = activitat.deliveryDateStr.replace(/-/g, '/');
            return callback();
        });
    }
}