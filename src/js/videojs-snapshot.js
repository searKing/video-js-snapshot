// import videojs from 'video.js';
// import {version as VERSION} from '../package.json';
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['video.js'], factory);
  }
  else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('video.js'));
  }
  else {
    // Browser globals (root is window)
    root.returnExports = factory(root.videojs);
  }
}(this, function (videojs) {
  'use strict';
  console.log('video-js-snapshot');
// Default options for the plugin.
  const defaultOptions = {};
// Cross-compatibility for Video.js 5 and 6.
  const registerPlugin = videojs.registerPlugin || videojs.plugin;

// const dom = videojs.dom || videojs;
  var VjsComponent = videojs.getComponent('Component');
  var VjsButton = videojs.getComponent('Button');

  /**
   * Base class for recorder backends.
   * @class
   * @augments videojs.Component
   * @private
   */
  videojs.SnapshoterBaseComponent = videojs.extend(VjsComponent,
    {
      /**
       * The constructor function for the class.
       *
       * @private
       * @param {(videojs.Player|Object)} player - Video.js player instance.
       * @param {Object} options - Player options.
       */
      constructor: function (player, options) {
        VjsComponent.call(this, player, options);
      },

      /**
       * Remove any temporary data and references to streams.
       * @private
       */
      dispose: function () {
      },

    })

  /**
   * Take a snapshotof audio/video/images using the Video.js player.
   *
   * @class
   * @augments videojs.RecordBase
   */
  videojs.SnapshoterComponent = videojs.extend(videojs.SnapshoterBaseComponent,
    {
      /**
       * The constructor function for the class.
       *
       * @param {(videojs.Player|Object)} player
       * @param {Object} options - Player options.
       */
      constructor: function (player, options) {
        // run base component initializing with new options.
        VjsComponent.call(this, player, options);

        // setup plugin options
        this.loadOptions();

        // (re)set recorder state
        this.resetState();

        // wait until player ui is ready
        this.player().one('ready', this.setupUI.bind(this));
        var EngineClass = videojs.ImageCaptureEngine;
        try {
          // connect stream to recording engine
          this.engine = new EngineClass(this.player());
        }
        catch (err) {
          throw new Error('Could not load ' + videojs.ImageCaptureEngine +
            ' plugin');
        }
      },

      /**
       * Setup plugin options.
       */
      loadOptions: function () {
        // record settings
      },

      /**
       * Player UI is ready.
       * @private
       */
      setupUI: function () {
        // insert custom controls on left-side of controlbar
        this.player().controlBar.addChild(this.player().cameraButton);
        this.player().controlBar.el().insertBefore(
          this.player().cameraButton.el(),
          this.player().controlBar.el().firstChild);

        // customize controls
        // XXX: below are customizations copied from videojs.wavesurfer that
        //      tweak the video.js UI...
        this.player().bigPlayButton.hide();

        if (this.player().options_.controls) {
          // videojs automatically hides the controls when no valid 'source'
          // element is included in the 'audio' tag. Don't. Ever again.
          this.player().controlBar.show();
          this.player().controlBar.el().style.display = 'flex';
        }

      },

      /**
       * Indicates whether the plugin is currently recording or not.
       *
       * @return {boolean} Plugin currently recording or not.
       */
      isSnapshoting: function () {
        return this._snapshoting;
      },

      /**
       * Indicates whether the plugin is currently processing recorded data
       * or not.
       *
       * @return {boolean} Plugin processing or not.
       */
      isProcessing: function () {
        return this._processing;
      },

      /**
       * Indicates whether the plugin is destroyed or not.
       *
       * @return {boolean} Plugin destroyed or not.
       */
      isDestroyed: function () {
        return this.player() && (this.player().children() === null);
      },


      /**
       * Start recording.
       */
      start: function () {
        if (!this.isProcessing()) {
          this._snapshoting = true;
          this._processing = true;

          // hide play control
          this.player().controlBar.playToggle.hide();

          // create snapshot
          this.createSnapshot();
        }
      },

      /**
       * Stop recording.
       */
      stop: function () {
        if (this.isProcessing()) {
          this._snapshoting = false;
          this._processing = false;
        }
        // show play control
        this.player().controlBar.playToggle.show();
      },

      /**
       * Destroy plugin and players and cleanup resources.
       */
      destroy: function () {
        // stop recording and device
        this.stop();
        // dispose player
        this.player().dispose();

        this.resetState();
      },

      /**
       * Reset the plugin.
       */
      reset: function () {

        // stop recording and device
        this.stop();

        // reset options
        this.loadOptions();

        // reset recorder state
        this.resetState();
        // reset player
        this.player().reset();

        // reset UI
        this.player().snapshotCanvas.hide();
        this.player().cameraButton.hide();
      },

      /**
       * Reset the plugin recorder state.
       * @private
       */
      resetState: function () {
        this._snapshoting = false;
        this._processing = false;
      },

      /**
       * Create and display snapshot image.
       * @private
       */
      createSnapshot: function () {
        var thiz = this;
        this.captureFrame().then(function (snapshotImageData) {

          thiz.player().trigger('snap', snapshotImageData);

          // stop recording
          thiz.stop();
        });
      },

      /**
       * Reset UI for retrying a snapshot image.
       * @private
       */
      retrySnapshot: function () {
        this._processing = false;

        // retry: hide the snapshot
        this.player().snapshotCanvas.hide();
      },

      /**
       * Capture frame from camera and copy data to canvas.
       * @private
       */
      captureFrame: function () {
        var thiz = this;
        var snapshotCanvas = this.player().snapshotCanvas.el().firstChild;

        // set the canvas size to the dimensions of the camera,
        // which also wipes the content of the canvas
        snapshotCanvas.width = this.player().videoWidth();
        snapshotCanvas.height = this.player().videoHeight();
        // var tech = thiz.player().tech().name();
        return new Promise(function (resolve, reject) {
          var snapshotImageData = thiz.engine.imageCaptureByIdAndCanvasDom(thiz.player().id(), snapshotCanvas);
          // notify others
          return resolve(snapshotImageData);
        });

      },

    });
  var CameraButton, SnapshotCanvasComponent;

  /**
   * Canvas for displaying snapshot image.
   * @private
   * @class
   * @augments videojs.Component
   */
  SnapshotCanvasComponent = videojs.extend(VjsComponent);
  /**
   * Button to toggle between create and retry snapshot image.
   * @private
   * @class
   * @augments videojs.Button
   */
  CameraButton = videojs.extend(VjsButton,
    {
      /** @constructor */
      constructor: function (player, options) {
        VjsButton.call(this, player, options);

        this.on('click', this.onClick);
        this.on('tap', this.onClick);
      }
    });
  CameraButton.prototype.onClick = function (e) {
    // stop this event before it bubbles up
    e.stopImmediatePropagation();

    var snapshoter = this.player().snapshoter;

    if (!snapshoter.isProcessing()) {
      // create snapshot
      snapshoter.start();
    }
    else {
      // retry
      snapshoter.retrySnapshot();

      // reset camera button
      this.onStop();
    }
  };
  CameraButton.prototype.onStart = function () {
    // replace element class so it can change appearance
    this.removeClass('vjs-icon-photo-camera');
    this.addClass('vjs-icon-photo-retry');

    // update label
    this.el().firstChild.firstChild.innerHTML = this.localize('Retry');
  };
  CameraButton.prototype.onStop = function () {
    // replace element class so it can change appearance
    this.removeClass('vjs-icon-photo-retry');
    this.addClass('vjs-icon-photo-camera');

    // update label
    this.el().firstChild.firstChild.innerHTML = this.localize('Image');
  };

  /**
   * Create a custom button.
   * @private
   * @param {string} className - Class name for the new button.
   * @param {string} label - Label for the new button.
   * @param {string} iconName - Icon for the new button.
   */
  var createButton = function (className, label, iconName) {
    var props = {
      className: 'vjs-' + className + '-button vjs-control vjs-icon-' + iconName,
      innerHTML: '<div class="vjs-control-content"><span class="vjs-control-text">' +
      label + '</span></div>',
    };
    var attrs = {
      role: 'button',
      'aria-live': 'polite', // let the screen reader user know that the text of the button may change
      tabIndex: 0
    };
    return VjsComponent.prototype.createEl('div', props, attrs);
  };

  /**
   * Create a custom button.
   * @private
   * @param {string} className - Class name for the new button.
   * @param {string} label - Label for the new button.
   * @param {string} iconName - Icon for the new button.
   */
  var createCanvas = function (className) {
    var props = {
      className: 'vjs-' + className + '-canvas',
      innerHTML: '<canvas></canvas>'
    };
    return VjsComponent.prototype.createEl('div', props);
  };

  /**
   * Function to invoke when the player is ready.
   *
   * This is a great place for your plugin to initialize itself. When this
   * function is called, the player will have its DOM and child components
   * in place.
   *
   * @function onPlayerReady
   * @param    {Player} player
   *           A Video.js player object.
   *
   * @param    {Object} [options={}]
   *           A plain object containing options for the plugin.
   */
  const onPlayerReady = (player, options) => {
    player.addClass('vjs-snapshot');
  };

  /**
   * A video.js plugin.
   *
   * In the plugin function, the value of `this` is a video.js `Player`
   * instance. You cannot rely on the player being in a "ready" state here,
   * depending on how the plugin is invoked. This may or may not be important
   * to you; if not, remove the wait for "ready"!
   *
   * @function snapshot
   * @param    {Object} [options={}]
   *           An object of options left to the plugin author to define.
   */
  const snapshot = function (options) {
    var settings = videojs.mergeOptions(defaultOptions, options);
    var player = this;
    player.ready(() => {
      onPlayerReady(this, videojs.mergeOptions(defaultOptions, options));
    });
    player.on('play', function () {
      $('video').attr('crossorigin', 'anonymous');
    })

    // create snapshoter
    player.snapshoter = new videojs.SnapshoterComponent(this,
      {
        'options': settings
      });
    player.addChild(player.snapshoter);


    // add canvas for recording and displaying image
    player.snapshotCanvas = new SnapshotCanvasComponent(player,
      {
        'el': createCanvas('snapshot')
      });
    player.snapshotCanvas.hide();
    player.snapshoter.addChild(player.snapshotCanvas);


    // add camera button
    player.cameraButton = new CameraButton(player,
      {
        'el': createButton('camera', player.localize('Image'),
          'photo-camera')
      });
    // player.cameraButton.hide();
    player.cameraButton.show();


  };

// Register the plugin with video.js.
  registerPlugin('snapshot', snapshot);

// Include the version number.
//   snapshot.VERSION = VERSION;

  // export default snapshot;
  // return a function to define the module export
  return snapshot;
}));
