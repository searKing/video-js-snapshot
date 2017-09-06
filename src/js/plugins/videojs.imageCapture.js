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
  var VjsComponent = videojs.getComponent('Component');
  /**
   * Audio-only engine for the lamejs library.
   *
   * @class
   * @augments videojs.RecordBase
   */
  videojs.ImageCaptureEngine = videojs.extend(VjsComponent,
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
      formatTag(tag) {
        if (!tag) {
          return;
        }
        tag = tag.trim();
        if (tag.length === 0) {
          return;
        }
        return tag;
      },
      getDomByIdAndTag: function (id, tag) {
        tag = this.formatTag(tag);
        var elem = $('#' + id);//jQuery
        var dom = elem[0];
        if (!tag || tag.trim().length === 0) {
          return;
        }
        if (dom.tagName.toUpperCase() === tag.toUpperCase()) {
          return dom;
        }
        return elem.find(tag)[0];
      },
      getScreenContainerDomByIdAndTag: function (id, tag) {
        tag = this.formatTag(tag);
        if (!!tag) {
          return this.getDomByIdAndTag(id, tag);
        }

        var dom = this.getDomByIdAndTag(id, 'object');
        if (!!dom) {
          return dom;
        }
        return this.getDomByIdAndTag(id, 'video');

      },

      drawCanvas: function (canvasDom, screenContainerDom) {
        canvasDom.width = screenContainerDom.videoWidth;
        canvasDom.height = screenContainerDom.videoHeight;
        canvasDom.getContext('2d').drawImage(
          screenContainerDom,
          0, 0,
          canvasDom.width, canvasDom.height);
      },

      imageCaptureByDom: function (screenContainerDom, canvasDom) {
        var snapshotImageData;
        if (!!screenContainerDom && screenContainerDom.tagName.toUpperCase() === "object".toUpperCase()) {//flash case
          snapshotImageData = screenContainerDom.vjs_snap();
        } else {
          this.drawCanvas(canvasDom, screenContainerDom);
          snapshotImageData = canvasDom.toDataURL('image/png');
        }
        return snapshotImageData;
      },

      imageCaptureById: function (playerId, canvaserId) {

        return this.imageCaptureByDom(
          this.getScreenContainerDomByIdAndTag(playerId),
          this.getDomByIdAndTag(canvaserId, 'canvas'))

      },
      imageCaptureByIdAndCanvasDom: function (playerId, canvaserDom) {

        return this.imageCaptureByDom(
          this.getScreenContainerDomByIdAndTag(playerId),
          canvaserDom)

      }
    });

}));

