angular.module("cmpApp").controller(
    'playerCtrl', function ($scope, playerPlayService, playerInitService) {
        console.log('playerCtrl');
        var thiz = $scope;

        class ApplyArray extends Array {
            constructor() {
                super();
            }

            push(item) {
                super.push(item);
                thiz.$apply();
            }
        }

        $scope.snapshoter = {
            snapshots: new ApplyArray()
        }
        $scope.inputer = {
            sourceUrl: "rtmp://live.hkstv.hk.lxdns.com/live/hks",
            onChangeUrl: function () {
                playerPlayService.changePlayerUrl("my-player", thiz.inputer.sourceUrl)
            },
            onClearSnapshots: function () {
                thiz.snapshoter.snapshots.length = 0;
            }
        }

        $scope.player = {
            onInit: function () {
                playerInitService.playerInit("my-player", thiz.snapshoter.snapshots);
            }
        }
    }
)

angular.module("cmpApp").service(
    'playerFactoryService', function () {
        var createPlayer = function (playerId) {
            console.log("createPlayer");
            var player = videojs(playerId, {
                poster: "//vjs.zencdn.net/v/oceans.png",
                controls: true,
                preload: "auto",
                autoplay: true,
                plugins: {
                    snapshot: {}
                }
            });
            player.addClass("video-js");
            player.addClass("vjs-default-skin");
            return player;

        }
        var getPlayer = function (playerId) {
            var player = videojs.getPlayers()[playerId];
            return player;
        }

        return {
            createPlayer: function (playerId) {
                return createPlayer(playerId);
            },
            getPlayer: function (playerId) {
                return getPlayer(playerId);
            }
        }
    }
)


angular.module("cmpApp").service(
    'playerInitService', function (playerFactoryService) {
        var imageIndex = 0;
        var playerInit = function (player, snapshots) {
            player.on('play', function () {
                console.log('play');
            });
            player.on('pause', function () {
                console.log('pause');
            });
            player.on('ended', function () {
                console.log('ended');
            });
            player.on('snap', function (event, snapshotImageData) {
                console.log('snap');
                var imageItem = {};
                imageItem.imageIndex = imageIndex++;
                imageItem.imageData = snapshotImageData;
                snapshots.push(imageItem);
            });
        };

        return {
            playerInit: function (playerId, snapshots) {
                return playerInit(playerFactoryService.createPlayer(playerId), snapshots);
            }
        }
    }
)

angular.module("cmpApp").service(
    'playerPlayService', function (playerFactoryService) {
        console.log('playerPlayService');
        var resetIfNecessary = function (player) {
            if (!player) {
                return;
            }

            var isPlaying = player.currentTime > 0 && !player.paused && !player.ended
                && player.readyState > 2;
            if (isPlaying) {
                player.reset();
            }
        }
        var changPlayerUrl = function (player, url) {
            var src = {
                src: url,
                label: '直播'
            };
            if (videojs.parseUrl(url).protocol == "rtmp:") {
                src.type = 'rtmp/flv';
            }
            // player.pause();
            resetIfNecessary(player)
            player.src(src);
            // player.load();
            // player.play();
        }

        return {
            changePlayerUrl: function (playerId, url) {
                return changPlayerUrl(playerFactoryService.getPlayer(playerId), url);
            }
        }
    }
)
