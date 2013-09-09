var async = require('async');

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
        aules: [
        ]
    }

    aulaca.getAulesAssignatura(domainId, idp, s, function(err, aules) {
        if (err) { console.log(err); callback(err); return; }
        async.parallel([
            function (callback) {
                if (aules) {
                    async.each(aules, procesa.bind('null', anyAcademic, codAssignatura, idp, s, perfil), function(err) {
                        if (err) { console.log(err); callback(err); return; }
                        callback();
                    });
                } else {
                    callback();
                }
            },
            function (callback) {
                assignatures.resum(s, idp, anyAcademic, struct, codAssignatura, domainId, function(err, result) {
                    if (err) { console.log(err); callback(err); return; }
                    callback();
                });
            }
        ], function(err, result) {
            if (err) { console.log(err); callback(err); return; }
            struct.aules.sort(ordenaAules);
            callback(null, struct);
        });
    }); 

    var procesa = function(anyAcademic, codAssignatura, idp, s, perfil, classroom, callback) {
        var codAula = classroom.domainCode.slice(-1);
        consultors.aula(anyAcademic, codAssignatura, codAula, function(err, result) {
            if (err) { console.log(err); callback(err); return; }
            classroom.consultor = result;
            struct.aules.push(classroom);
            if (perfil == 'pra' || classroom.consultor.idp == idp) {
                resum(s, idp, anyAcademic, codAssignatura, classroom, codAula, function(err, result) {
                    if (err) { console.log(err); callback(err); return; }
                    consultors.getResumEines(classroom, function(err, result) {
                        if (err) { console.log(err); callback(err); return; }
                        return callback();
                    });
                });                
            } else {
                return callback();
            }
        });        
    }

    var ordenaAules = function(a, b) {
        return a.codAula < b.codAula ? -1 : b.codAula < a.codAula ? 1 : 0;
    }
}

var resum = function(s, idp, anyAcademic, codAssignatura, classroom, codAula, callback) {

    classroom.codAula = codAula;
    classroom.codAssignatura = classroom.codi;
    classroom.domainIdAula = classroom.domainId;
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
                if (err) { console.log(err); callback(); return; }
                classroom.resum.estudiants.total = indicadors.getTotalEstudiantsTotal(result.out.ValorIndicadorVO);
                classroom.resum.estudiants.repetidors = indicadors.getTotalEstudiantsRepetidors(result.out.ValorIndicadorVO);
                callback();
            });
        },
        function (callback) {
            rac.calcularIndicadorsAula('RAC_CONSULTOR_AC', codAssignatura, anyAcademic, codAula, codAula, '0', '0', function(err, result) {
                if (err) { console.log(err); callback(); return; }
                classroom.resum.avaluacio.seguiment = indicadors.getSeguimentACAula(result.out.ValorIndicadorVO);
                classroom.resum.avaluacio.superacio = indicadors.getSuperacioACAula(result.out.ValorIndicadorVO);
                callback();
            });
        },
        function (callback) {
            lrs.byclassroom(classroom.domainId, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                classroom.resum.comunicacio.clicsAcumulats = result ? result.value : config.nc();
                callback();
            });
        },
        function (callback) {
            aulaca.getLecturesPendentsAcumuladesAula(classroom.domainId, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                classroom.resum.comunicacio.lecturesPendentsAcumulades = result ? result : config.nc();
                callback();
            });
        },
        function (callback) {
            aulaca.getParticipacionsAula(classroom.domainId, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                classroom.resum.comunicacio.participacions = result ? result : config.nc();
                callback();
            });
        },
        function (callback) {
            aulaca.getLecturesPendentsIdpAula(classroom.domainId, idp, s, function(err, result) {
                if (err) { console.log(err); callback(); return; }
                classroom.resum.comunicacio.lecturesPendents = result ? result : config.nc();
                callback();
            });
        }
    ], function(err, result) {
        if (err) { console.log(err); }
        callback();
    });
}

var one = function(anyAcademic, codAssignatura, codAula, s, domainId, domainIdAula, callback) {

	var struct = {
		s: s,
		anyAcademic: anyAcademic,
		codAssignatura: codAssignatura,
		codAula: codAula,
		domainId: domainId,
		domainIdAula: domainIdAula,
		consultor: {
		},
		estudiants: [
		]
	}

	async.parallel([
        function (callback) {
            infoacademica.getAssignaturaByCodi(anyAcademic, codAssignatura, function(err, result) {
                if (err) { console.log(err); callback(err); return; }
                struct.nomAssignatura = result.out.descAssignatura;
                callback(null, struct);
            });
        },
		function (callback) {
			estudiants.all(anyAcademic, codAssignatura, codAula, s, function(err, result) {
				if (err) { console.log(err); callback(err); return; }
				struct.estudiants = result;
				callback(null, struct);
			});
		},
		function (callback) {
			consultors.aula(anyAcademic, codAssignatura, codAula, function(err, result) {
				if (err) { console.log(err); callback(err); return; }
				struct.consultor = result;
				callback(null, struct);
			});
		},
	], function(err, results) {
		if (err) { console.log(err); callback(err); return; }
		callback(null, struct);
	});
}


/*
exports.one = function(codAssignatura, anyAcademic, codAula, callback) {

	//http://localhost:3333/assignatures/05.002/20122/aules/1

	var struct = {
		codAssignatura: codAssignatura,
		anyAcademic: anyAcademic,
		codAula: codAula,		
		aula: {
		},
		activitat: {
		},
		avaluacio: {
		},
		estudiants: {
		}
	}

	rac.getAula(codAssignatura, anyAcademic, codAula, function(err, result) {

		if(err) { console.log(err); callback(err); return; }
		struct.aula = result.out;

		rac.getUltimaActivitatAmbNotaByAula(anyAcademic, codAssignatura, codAula, function(err, result) {

			if(err) { console.log(err); callback(err); return; }
			struct.aula.ordre = result.out.ordre;

			async.parallel([
				
				function (callback) {
			    	rac.getActivitat(codAssignatura, anyAcademic, codAula, struct.aula.ordre, function(err, result) {
			    		if(err) { console.log(err); callback(err); return; }
						struct.activitat.campusId = result.out.campusId;
						struct.activitat.dataLliurament = result.out.dataLliurament;
						struct.activitat.dataPublicacio = result.out.dataPublicacio;
						callback();
					});
				},
				function (callback) {

					var tipusIndicador = 'RAC_PRA_2';
					var comptarEquivalents = '0';
					var comptarRelacions = '0';

			    	rac.calcularIndicadorsAula(tipusIndicador, struct.codAssignatura, struct.anyAcademic, struct.codAula, struct.aula.ordre, comptarEquivalents, comptarRelacions, function(err, result) {
			    		if(err) { console.log(err); callback(err); return; }
						struct.estudiants.total = indicadors.getTotalEstudiantsTotal(result.out.ValorIndicadorVO);
						struct.estudiants.repetidors = indicadors.getTotalEstudiantsRepetidors(result.out.ValorIndicadorVO);
						struct.estudiants.primera_matricula = indicadors.getTotalEstudiantsPrimeraMatricula(result.out.ValorIndicadorVO);
						callback();
					});
				},
				function (callback) {

					var tipusIndicador = 'RAC_CONSULTOR_AC';
					var comptarEquivalents = '0';
					var comptarRelacions = '0';

			    	rac.calcularIndicadorsAula(tipusIndicador, struct.codAssignatura, struct.anyAcademic, struct.codAula, struct.aula.ordre, comptarEquivalents, comptarRelacions, function(err, result) {
			    		if(err) { console.log(err); callback(err); return; }
						struct.avaluacio.seguiment = indicadors.getSeguimentACAula(result.out.ValorIndicadorVO);
						struct.avaluacio.superacio = indicadors.getSuperacioACAula(result.out.ValorIndicadorVO);
						callback();
					});
				}
			], function(err, results) {
				if(err) { console.log(err); callback(err); return; }
				callback(null, struct);
			});
		});
	});

	/*
	var getIndicadorsActivitat = function(item, callback) {
		async.parallel([
			function(callback) {
	    	getNumEstudiantsQualificatsByActivitat(item, function(err, result) {
	    		if(err) { console.log(err); callback(err); return; }
					item.qualificats = result.out;
	    	});
			},
			function(callback) {

				var tipusIndicador = 'RAC_CONSULTOR_AC';
				var comptarEquivalents = '0';
				var comptarRelacions = '0';

	    	rac.calcularIndicadorsAula(tipusIndicador, struct.codAssignatura, struct.anyAcademic, struct.codAula, item.ordre, comptarEquivalents, comptarRelacions, function(err, result) {
	    		if(err) { console.log(err); callback(err); return; }
	    		item.indicadors = {};
				item.indicadors.seguimentac = indicadors.getSeguimentACAula(result.out.ValorIndicadorVO);
				item.indicadors.superacioac = indicadors.getSuperacioACAula(result.out.ValorIndicadorVO);
				});

			}
		], function(err, results) {
			if(err) { console.log(err); callback(err); return; }
			callback();
		});
	}
	*
}
*/

exports.all = all;
exports.one = one;
exports.resum = resum;