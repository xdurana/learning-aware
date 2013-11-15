var async = require('async');
var util = require('util');

var config = require('../config');
var indicadors = require('./indicadors');
var activitats = require('./activitats');
var estudiants = require('./estudiants');
var consultors = require('./consultors');
var assignatures = require('./assignatures');

var rac = require('../ws/rac');
var dadesacademiques = require('../ws/dadesacademiques');
var infoacademica = require('../ws/infoacademica');
var aulaca = require('../ws/aulaca');
var lrs = require('../ws/lrs');

var all = function(anyAcademic, codAssignatura, domainId, idp, s, perfil, callback) {

    var struct = {
        s: s,
        idp: idp,
        anyAcademic: anyAcademic,
        codAssignatura: codAssignatura,
        domainId: domainId,
        dataLliurament: config.nc(),
        aules: [
        ]
    }

    aulaca.getAulesAssignatura(domainId, idp, s, function(err, aules) {
        if (err) { console.log(err); return callback(null, struct); }
        async.parallel([
            function (callback) {
                try {
                    async.each(aules, procesa.bind(null, anyAcademic, codAssignatura, idp, s, perfil), function(err) {
                        if (err) { console.log(err); }
                        return callback();
                    });
                } catch(e) {
                    console.log(e.message);
                    return callback();
                }
            },
            function (callback) {
                try {
                    rac.getActivitatsByAula(anyAcademic, codAssignatura, 1, function(err, result) {
                        if (err) { console.log(err); return callback(null, struct); }
                        if (result.out.ActivitatVO) {
                            result.out.ActivitatVO.forEach(function(activitat) {
                                if (struct.dataLliurament == config.nc() && new Date(activitat.dataLliurament) > new Date()) {
                                    struct.dataLliurament = indicadors.getDataLliurament(activitat.dataLliurament);
                                }
                            })
                        }
                        return callback();
                    });
                } catch(e) {
                    console.log(e.message);
                    return callback(null, struct);
                }
            },
            function (callback) {
                assignatures.resum(s, idp, anyAcademic, struct, codAssignatura, domainId, function(err, result) {
                    if (err) { console.log(err); }
                    return callback();
                });
            }
        ], function(err, result) {
            if (err) { console.log(err); return callback(); }
            struct.aules.sort(ordenaAules);
            return callback(null, struct);
        });
    }); 

    var procesa = function(anyAcademic, codAssignatura, idp, s, perfil, classroom, callback) {
        aulaca.isAulaca(classroom.domainCode, s, function(err, result) {
            if (err) { console.log(err); return callback(); }
            classroom.isAulaca = result;
            var codAula = classroom.domainCode.slice(-1);
            consultors.aula(anyAcademic, codAssignatura, codAula, idp, s, function(err, result) {
                if (err) { console.log(err); return callback(); }
                classroom.consultor = result;
                struct.aules.push(classroom);
                if (perfil == 'pra' || classroom.consultor.idp == idp) {
                    resum(s, idp, anyAcademic, codAssignatura, classroom, codAula, function(err, result) {
                        if (err) { console.log(err); return callback(); }
                        consultors.getResumEines(classroom, function(err, result) {
                            if (err) { console.log(err); return callback(); }
                            return callback();
                        });
                    });
                } else return callback();
            });
        });
    }

    var ordenaAules = function(a, b) {
        return a.codAula < b.codAula ? -1 : b.codAula < a.codAula ? 1 : 0;
    }
}

var resum = function(s, idp, anyAcademic, codAssignatura, classroom, codAula, callback) {

    classroom.color = 'FF2600';
    classroom.codAula = codAula;
    classroom.codAssignatura = classroom.codi;
    classroom.domainIdAula = classroom.domainId;
    classroom.link = indicadors.getLinkAula(s, classroom.isAulaca, classroom.domainIdAula, classroom.domainCode),
    classroom.linkdetall = util.format(
        '/app/guaita/assignatures/%s/%s/%s/aules/%s/%s/%s?s=%s&idp=%s',
        anyAcademic,
        classroom.codAssignatura,
        classroom.domainFatherId,
        classroom.codAula,
        classroom.domainIdAula,
        classroom.domainCode,
        s,
        idp
    );

    classroom.resum = {
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
            callback();
        },
        function (callback) {
            rac.calcularIndicadorsAula('RAC_PRA_2', codAssignatura, anyAcademic, codAula, codAula, '0', '0', function(err, result) {
                if (err) { console.log(err); return callback(); }
                classroom.resum.estudiants.total = indicadors.getTotalEstudiantsTotal(result.out.ValorIndicadorVO);
                classroom.resum.estudiants.repetidors = indicadors.getTotalEstudiantsRepetidors(result.out.ValorIndicadorVO);
                return callback();
            });
        },
        function (callback) {
            rac.calcularIndicadorsAula('RAC_CONSULTOR_AC', codAssignatura, anyAcademic, codAula, codAula, '0', '0', function(err, result) {
                if (err) { console.log(err); return callback(); }
                classroom.resum.avaluacio.seguiment = indicadors.getSeguimentACAula(result.out.ValorIndicadorVO);
                classroom.resum.avaluacio.superacio = indicadors.getSuperacioACAula(result.out.ValorIndicadorVO);
                return callback();
            });
        },
        function (callback) {
            lrs.byclassroom(classroom.domainId, s, function(err, result) {
                if (err) { console.log(err); return callback(); }
                classroom.resum.comunicacio.clicsAcumulats = result ? result.value : config.nc();
                return callback();
            });
        },
        function (callback) {
            aulaca.getGroupServlet(classroom.domainCode, s, function(err, result) {
                if (err) { console.log(err); return callback(err); }
                try {
                    classroom.resum.comunicacio.lecturesPendents = result[0]['$']['numMsgPendents'];
                    classroom.color = result[0].color[0];
                } catch(e) {
                    console.log(e.message);
                }
                return callback();
            });
        },
        function (callback) {
            aulaca.getLecturesPendentsAcumuladesAula(classroom.domainId, s, function(err, result) {
                if (err) { console.log(err); return callback(); }
                classroom.resum.comunicacio.lecturesPendentsAcumulades = result ? result : config.nc();
                return callback();
            });
        },
        function (callback) {
            aulaca.getParticipacionsAula(classroom.domainId, s, function(err, result) {
                if (err) { console.log(err); return callback(); }
                classroom.resum.comunicacio.participacions = result ? result : config.nc();
                return callback();
            });
        },
        function (callback) {
            aulaca.getLecturesPendentsIdpAula(classroom.domainId, idp, s, function(err, result) {
                if (err) { console.log(err); return callback(); }
                //classroom.resum.comunicacio.lecturesPendents = result ? result : config.nc();
                return callback();
            });
        }
    ], function(err, result) {
        if (err) { console.log(err); }
        return callback();
    });
}

var one = function(anyAcademic, codAssignatura, domainId, codAula, domainIdAula, domainCode, idp, s, callback) {

	var struct = {
		s: s,
		anyAcademic: anyAcademic,
		codAssignatura: codAssignatura,
        domainId: domainId,
		codAula: codAula,
		domainIdAula: domainIdAula,
        domainCode: domainCode,
        totalEstudiants: 0,
        link: '#',
        linkedicioaula: '#',
		consultor: {
		},
		estudiants: [
		]
	}

	async.parallel([
        function (callback) {
            aulaca.isAulaca(domainCode, s, function(err, result) {
                if (err) { console.log(err); return callback(); }
                struct.isAulaca = result;
                struct.link = indicadors.getLinkAula(s, struct.isAulaca, domainIdAula, domainCode);
                struct.linkedicioaula = indicadors.getLinkDissenyAula(s, struct.isAulaca, domainIdAula);
                return callback();
            });
        },
        function (callback) {
            infoacademica.getAssignaturaByCodi(anyAcademic, codAssignatura, function(err, result) {
                if (err) { console.log(err); return callback(); }
                struct.nomAssignatura = result.out.descAssignatura;
                return callback();
            });
        },
		function (callback) {
			estudiants.all(anyAcademic, codAssignatura, codAula, domainIdAula, idp, s, function(err, result) {
				if (err) { console.log(err); return callback(); }
                struct.estudiants = result;
                if (struct.estudiants) {
                    struct.totalEstudiants = struct.estudiants.length;
                    struct.estudiants.forEach(function(estudiant) {
                        estudiant.idp = indicadors.getValor(indicadors.getValor(estudiant.tercer).idp);
                    });
                }
				return callback();
			});
		},
		function (callback) {
			consultors.aula(anyAcademic, codAssignatura, codAula, idp, s, function(err, result) {
				if (err) { console.log(err); return callback(); }
				struct.consultor = result;
				return callback();
			});
		},
	], function(err, results) {
		if (err) { console.log(err); }
		callback(null, struct);
	});
}

module.exports = {
    all: all,
    one: one,
    resum: resum
}