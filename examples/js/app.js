(function () {

    angular.module("cmpApp",
        [
            "ui.router",
            "oc.lazyLoad"
        ])
        .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise('/');
            $stateProvider
                .state('player', {
                    url: '/',
                    templateUrl: 'views/player/videoPlayer.html',
                    data: {
                        pageTitle: "player Template"
                    },
                    controller: 'playerCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load({
                                name: "cmpApp",
                                serie: true,
                                insertBefore: '#ng_load_plugins_before',
                                files: [
                                    "../node_modules/video.js/dist/video.js",
                                    "../src/js/videojs-snapshot.js",
                                    "../src/js/plugins/videojs.imageCapture.js",
                                    "../node_modules/videojs-flash/dist/videojs-flash.js",
                                    "views/player/player.js"
                                ]
                            })
                        }]
                    }
                })
        }])
})()