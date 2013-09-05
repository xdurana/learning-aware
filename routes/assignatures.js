var async = require('async');
var request = require('request');
var util = require('util');

var config = require('../config');
var indicadors = require('./indicadors');

var rac = require('../ws/rac');
var dadesacademiques = require('../ws/dadesacademiques');
var infoacademica = require('../ws/infoacademica');
var aulaca = require('../ws/aulaca');
var lrs = require('../ws/lrs');

var byidp = function(s, idp, anyAcademic, callback) {

    var struct = {
        s: s,
        idp: idp,
        anyAcademic: anyAcademic,
        assignatures: [
        ]
    };

    aulaca.getAssignaturesPerIdp(s, idp, anyAcademic, function(err, result) {
        if (err) { console.log(err); callback(); return; }
        try {
            struct.assignatures = result;
            async.each(struct.assignatures, getResum.bind('null', s, idp, anyAcademic), function(err) {
                if (err) { console.log(err); }
                struct.assignatures.sort(ordenaAssignatures);
                callback(null, struct);
            });
        } catch(e) {
            callback(util.format("No s'han pogut obtenir les assignatures del idp [%s]", idp));
        }
    });

    var getResum = function(s, idp, anyAcademic, subject, callback) {
        resum(s, idp, anyAcademic, subject, subject.codi, subject.domainId, function(err, result) {
            if (err) { console.log(err); }
            callback();
        });
    }

    var ordenaAssignatures = function(a, b) {
        return a.codi < b.codi ? -1 : b.codi < a.codi ? 1 : 0;
    }  
}

var resum = function(s, idp, anyAcademic, subject, codi, domainId, callback) {

    subject.resum = {
        aules: {
            total: config.nc()
        },
        estudiants: {
            total: config.nc(),
            repetidors: config.nc()
        },
        comunicacio: {
            clicsAcumulats: config.nc(),
            lecturesPendentsAcumulades: config.nc(),
            lecturesPendents: config.nc(),
            participacions: config.nc()
        },
        avaluacio: {
            seguiment: config.nc(),
            superacio: config.nc(),
            dataLliurament: config.nc()
        }
    };

    async.parallel([
        function (callback) {
            rac.calcularIndicadorsAssignatura('RAC_PRA_2', anyAcademic, codi, '0', '0', function(err, result) {
                if (err) { console.log(err); callback(); return; }
                subject.resum.estudiants.total = indicadors.getTotalEstudiantsTotal(result.out.ValorIndicadorVO);
                subject.resum.estudiants.repetidors = indicadors.getTotalEstudiantsRepetidors(result.out.ValorIndicadorVO);
                callback();
            });
        },
        function (callback) {
            rac.calcularIndicadorsAssignatura('RAC_CONSULTOR_AC', anyAcademic, codi, '0', '0', function(err, result) {
                if (err) { console.log(err); callback(); return; }
                subject.resum.avaluacio.seguiment = indicadors.getSeguimentACAula(result.out.ValorIndicadorVO);
                subject.resum.avaluacio.superacio = indicadors.getSuperacioACAula(result.out.ValorIndicadorVO);
                callback();
            });
        },
        function (callback) {
            aulaca.getAulesAssignatura(domainId, idp, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                subject.resum.aules.total = result ? result.length : config.nc();
                callback();
            });
        },
        function (callback) {
            callback(); return;
            lrs.getClicksBySubject(domainId, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                subject.resum.comunicacio.clicsAcumulats = result ? result : config.nc();
                callback();
            });
        },
        function (callback) {
            callback(); return;
            aulaca.getLecturesPendentsAcumuladesAssignatura(domainId, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                subject.resum.comunicacio.lecturesPendentsAcumulades = result ? result : config.nc();
                callback();
            });
        },
        function (callback) {
            callback(); return;
            aulaca.getParticipacionsAssignatura(domainId, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                subject.resum.comunicacio.participacions = result ? result : config.nc();
                callback();
            });
        },
        function (callback) {
            callback(); return;
            aulaca.getLecturesPendentsIdpAssignatura(domainId, idp, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                subject.resum.comunicacio.lecturesPendents = result ? result : config.nc();
                callback();
            });
        }
    ], function(err, result) {
        if (err) { console.log(err); callback(); return; }
        callback();
    });
}

exports.byidp = byidp;
exports.resum = resum;