"use strict";

MetronicApp.controller('EmployeesController', ['$scope', '$rootScope', '$http', '$filter', 'Employees', function($scope, $rootScope, $http, $filter, Employees) {

    var grid = new Datatable();
    var employees = $rootScope.login;

    $scope.editable = false;

    $scope.employees = {
        entity: $rootScope.login.entity,
        datec: new Date()
    };

    $scope.dict = {};
    $scope.employees = [];
    $scope.status_id = null;
    $scope.validLogin = false;
    $scope.validEmail = true;
    // Init
    $scope.$on('$viewContentLoaded', function() {
        // initialize core components
        Metronic.initAjax();

        // set default layout mode
        $rootScope.settings.layout.pageSidebarClosed = true;
        $rootScope.settings.layout.pageBodySolid = false;

        var dict = ["fk_employees_status", "fk_rh_categorie", "fk_job", "fk_country", "fk_departements", "fk_rh_niveauEtude", "fk_rh_contrat", "fk_rh_situationFamiliale", "fk_rh_tempsTravail"];

        $http({
            method: 'GET',
            url: '/erp/api/dict',
            params: {
                dictName: dict
            }
        }).success(function(data, status) {
            $scope.dict = data;
            //console.log(data);
        });



        if ($rootScope.$stateParams.Status) {
            $scope.status_id = $rootScope.$stateParams.Status;
            initDatatable({ status_id: $scope.status_id });
        } else
            initDatatable();

    });

    // Init ng-include
    $scope.$on('$includeContentLoaded', function() {
        // initialize core components
        Metronic.initAjax();

        // set default layout mode
        $rootScope.settings.layout.pageSidebarClosed = false;
        $rootScope.settings.layout.pageBodySolid = false;

        var dict = ["fk_employees_status"];

        $http({
            method: 'GET',
            url: '/erp/api/dict',
            params: {
                dictName: dict
            }
        }).success(function(data, status) {
            $scope.dict = data;
            //console.log(data);
        });

    });



    $scope.ngIncludeInit = function(params, length) {
        $scope.params = params;
        initDatatable(params, length);
    };

    $scope.create = function() {
        var employees = new Employees.employees(this.employees);
        console.log(employees);
        employees.$save(function(response) {
            $rootScope.$state.go("employees.show", { id: response._id });
        });
    };

    $scope.showStatus = function(val, dict) {
        if (!($scope.dict[dict] && $scope.employees[val]))
            return;
        var selected = $filter('filter')($scope.dict[dict].values, { id: $scope.employees[val] });

        return ($scope.employees[val] && selected && selected.length) ? selected[0].label : 'Non défini';
    };

    $scope.remove = function(employees) {
        if (!employees && grid) {
            return $http({
                method: 'DELETE',
                url: '/erp/api/employees',
                params: {
                    id: grid.getSelectedRows()
                }
            }).success(function(data, status) {
                if (status === 200)
                    $scope.find();
            });
        }

        employees.$remove(function() {
            $rootScope.$state.go("employees.list");
        });
    };

    $scope.update = function(options, callback) { //example options : {status: Status}
        var employees = $scope.employees;

        employees.$update(options, function(response) {

            $scope.employees = response;

            if (callback)
                callback(null, response);
        });
    };

    $scope.findOne = function() {
        Employees.employees.get({
            Id: $rootScope.$stateParams.id
        }, function(employees) {
            //console.log(employees);
            $scope.employees = employees;
            $scope.editable = true; // TODO ajouter controle d'acces

            $http({
                method: 'GET',
                url: 'api/ticket',
                params: {
                    find: { "linked.id": employees._id },
                    fields: "name ref updatedAt percentage Status task"
                }
            }).success(function(data, status) {
                if (status == 200)
                    $scope.tickets = data;

                $scope.countTicket = $scope.tickets.length;
            });
        }, function(err) {
            if (err.status == 401)
                $location.path("401.html");
        });
    };

    function getUrl(params) {

        if (!params)
            params = {};

        // if (!params.entity)
        //     params.entity = $rootScope.entity;

        var url = $rootScope.buildUrl('/erp/api/employees/dt', params); // Build URL with json parameter
        //console.log(url);
        return url;
    }

    function initDatatable(params, length) {

        grid.init({
            src: $("#employeesList"),
            onSuccess: function(grid) {
                // execute some code after table records loaded
            },
            onError: function(grid) {
                // execute some code on network or other general error 
            },
            loadingMessage: 'Loading...',
            dataTable: { // here you can define a typical datatable settings from http://datatables.net/usage/options 

                // Uncomment below line("dom" parameter) to fix the dropdown overflow issue in the datatable cells. The default datatable layout
                // setup uses scrollable div(table-scrollable) with overflow:auto to enable vertical scroll(see: assets/global/scripts/datatable.js). 
                // So when dropdowns used the scrollable div should be removed. 
                //"dom": "<'row'<'col-md-8 col-sm-12'pli><'col-md-4 col-sm-12'<'table-group-actions pull-right'>>r>t<'row'<'col-md-8 col-sm-12'pli><'col-md-4 col-sm-12'>>",

                "bStateSave": (params ? false : true), // save datatable state(pagination, sort, etc) in cookie.

                "pageLength": length || 25, // default record count per page
                "ajax": {
                    "url": getUrl(params) // ajax source
                },
                "order": [
                    [1, "asc"]
                ], // set first column as a default sort by asc
                "columns": [{
                    data: 'bool'
                }, {
                    data: "name.first",
                    defaultContent: ""
                }, {
                    data: "name.last",
                    defaultContent: ""
                }, {
                    data: "phones.mobile",
                    defaultContent: ""
                }, {
                    data: "emails.work",
                    defaultContent: ""
                }, {
                    data: "skype",
                    defaultContent: ""
                }, {
                    data: "department",
                    defaultContent: ""
                }, {
                    data: "jobPosition",
                    defaultContent: "",
                }, {
                    data: "manager",
                    defaultContent: "",
                    visible: employees.multiEntities
                }, {
                    data: "editedBy",
                    defaultContent: ""
                }, {
                    data: "createdBy",
                    defaultContent: ""
                }, {
                    data: 'action'
                }]
            }
        });

        // handle group actionsubmit button click
        grid.getTableWrapper().on('click', '.table-group-action-submit', function(e) {
            e.preventDefault();
            var action = $(".table-group-action-input", grid.getTableWrapper());
            if (action.val() != "" && grid.getSelectedRowsCount() > 0) {
                grid.setAjaxParam("customActionType", "group_action");
                grid.setAjaxParam("customActionName", action.val());
                grid.setAjaxParam("id", grid.getSelectedRows());
                grid.getDataTable().ajax.reload();
                grid.clearAjaxParams();
            } else if (action.val() == "") {
                Metronic.alert({
                    type: 'danger',
                    icon: 'warning',
                    message: 'Please select an action',
                    container: grid.getTableWrapper(),
                    place: 'prepend'
                });
            } else if (grid.getSelectedRowsCount() === 0) {
                Metronic.alert({
                    type: 'danger',
                    icon: 'warning',
                    message: 'No record selected',
                    container: grid.getTableWrapper(),
                    place: 'prepend'
                });
            }
        });
    }

    $scope.find = function() {
        var url;
        //console.log(this.status_id);

        if ($scope.params) { // For ng-include in societe fiche
            $scope.params.status_id = this.status_id;
            url = getUrl($scope.params);
        } else
            url = getUrl({ status_id: this.status_id });

        grid.resetFilter(url);
    };


    /*
     * NG-GRID for ticket list
     */

    $scope.filterOptionsTicket = {
        filterText: "",
        useExternalFilter: false
    };

    $scope.gridOptionsTicket = {
        data: 'tickets',
        enableRowSelection: false,
        sortInfo: { fields: ["updatedAt"], directions: ["desc"] },
        filterOptions: $scope.filterOptionsTicket,
        i18n: 'fr',
        enableColumnResize: true,
        columnDefs: [
            { field: 'name', displayName: 'Titre', cellTemplate: '<div class="ngCellText"><a class="with-tooltip" ng-href="#!/ticket/{{row.getProperty(\'_id\')}}" data-tooltip-options=\'{"position":"right"}\' title=\'{{row.getProperty("task")}}\'><span class="icon-ticket"></span> {{row.getProperty(col.field)}}</a>' },
            { field: 'ref', displayName: 'Id' },
            { field: 'percentage', displayName: 'Etat', cellTemplate: '<div class="ngCellText"><progressbar class="progress-striped thin" value="row.getProperty(col.field)" type="success"></progressbar></div>' },
            { field: 'updatedAt', displayName: 'Dernière MAJ', cellFilter: "date:'dd-MM-yyyy HH:mm:ss'" }
        ]
    };

    $scope.changeStatus = function(Status) {
        $scope.employees.Status = Status;
        $scope.update({ Status: Status });
    };

    $scope.checkemployeesExist = function(data) {
        if (!data || data.length < 6) {
            $scope.validLogin = false;
            return "Nom utilisateur trop court";
        }

        return $http.get('/erp/api/employees/' + data).then(function(employees) {
            if (!employees.data)
                return true;

            if ($scope.employees && employees.data._id && $scope.employees._id == employees.data._id) {
                $scope.validLogin = true;
                return true;
            }

            if (employees.data._id) {
                $scope.validLogin = false;
                return 'Erreur de employeesname';
            }


            $scope.validLogin = true;
            return true;
        });

    };
    $scope.checkEmailExist = function(data) {

        return $http.get('/erp/api/employees/email/?email=' + data).then(function(employees) {
            if (!employees.data)
                return true;

            // if edit mode
            if ($scope.employees && employees.data._id && $scope.employees._id == employees.data._id) {
                $scope.validEmail = true;
                return true;
            }

            if (employees.data._id) {
                $scope.validEmail = false;
                return 'Erreur adresse email';
            }

            $scope.validEmail = true;
            return true;
        });

    };


}]);