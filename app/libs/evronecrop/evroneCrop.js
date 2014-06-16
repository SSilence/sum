(function() {
  var $, EvroneCrop, Rect;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $ = jQuery;
  $.fn.extend({
    evroneCrop: function(options) {
      var settings;
      settings = {
        preview: false,
        ratio: false,
        setSelect: false,
        size: false,
        log: false
      };
      settings = $.extend(settings, options);
      return this.each(function() {
        return new EvroneCrop(this, settings);
      });
    }
  });
  EvroneCrop = (function() {
    function EvroneCrop(element, settings) {
      var tmp_img;
      this.element = element;
      this.settings = settings;
      this.canvas = this.constructCanvas();
      this.ctx = this.setCanvas();
      this.storePlace = this.settings.store;
      tmp_img = new Image();
      tmp_img.src = $(this.element).attr('src');
      $(tmp_img).bind('load', __bind(function() {
        this.originalSize = tmp_img.width;
        this.darkenCanvas();
        if (this.settings.setSelect) {
          return this.setSelect();
        } else {
          return this.setSelectionTool();
        }
      }, this));
    }
    EvroneCrop.prototype.constructCanvas = function() {
      var c, canvas;
      canvas = document.createElement('canvas');
      c = $(canvas);
      c.css('position', 'absolute');
      c.addClass('evroneCropCanvas');
      return $(this.element).after(c).next();
    };
    EvroneCrop.prototype.setCanvas = function() {
      var c;
      this.canvas.offset($(this.element).offset());
      c = this.canvas[0];
      c.width = this.element.width;
      c.height = this.element.height;
      return c.getContext('2d');
    };
    EvroneCrop.prototype.darkenCanvas = function() {
      var c;
      c = this.canvas[0];
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      return this.ctx.fillRect(0, 0, c.width, c.height);
    };
    EvroneCrop.prototype.setSelect = function() {
      if (this.settings.ratio) {
        if (this.settings.setSelect === 'center') {
          if (this.canvas.width() > this.canvas.height()) {
            this.initY = Math.floor(this.canvas.height() / 4);
            this.moveH = Math.floor(this.canvas.height() / 2);
            this.moveW = this.moveH * this.settings.ratio;
            this.initX = Math.floor((this.canvas.width() - this.moveW) / 2);
          } else {
            this.initX = Math.floor(this.canvas.width() / 4);
            this.moveW = Math.floor(this.canvas.width() / 2);
            this.moveH = this.moveW * this.settings.ratio;
            this.initY = Math.floor((this.canvas.height() - this.moveH) / 2);
          }
        } else if (typeof this.settings.setSelect === 'object') {
          this.initX = this.settings.setSelect.x;
          this.initY = this.settings.setSelect.y;
          this.moveW = this.settings.setSelect.w;
          this.moveH = this.moveW / this.settings.ratio;
        }
      } else {
        if (this.settings.setSelect === 'center') {
          this.initX = Math.floor(this.canvas.width() / 4);
          this.initY = Math.floor(this.canvas.height() / 4);
          this.moveW = Math.floor(this.canvas.width() / 2);
          this.moveH = Math.floor(this.canvas.height() / 2);
        } else if (typeof this.settings.setSelect === 'object') {
          this.initX = this.settings.setSelect.x;
          this.initY = this.settings.setSelect.y;
          this.moveW = this.settings.setSelect.w;
          this.moveH = this.settings.setSelect.h;
        }
      }
      this.selection = new Rect(this.initX, this.initY, this.moveW, this.moveH, 3);
      this.updateCanvas(this.initX, this.initY, this.moveW, this.moveH, this.canvas, this.ctx);
      this.createCorners();
      this.store();
      return this.dragMouseDown();
    };
    EvroneCrop.prototype.setSelectionTool = function() {
      return this.canvas.mousedown(__bind(function(e) {
        var coords, dragMouseMove, dragMouseUp;
        coords = {
          x: e.pageX - this.canvas.offset().left,
          y: e.pageY - this.canvas.offset().top
        };
        this.initX = coords.x;
        this.initY = coords.y;
        this.canvas.mousemove(function(e) {
          return dragMouseMove(e);
        });
        this.canvas.mouseup(function(e) {
          return dragMouseUp(e);
        });
        dragMouseMove = __bind(function(e) {
          coords = {
            x: e.pageX - this.canvas.offset().left,
            y: e.pageY - this.canvas.offset().top
          };
          if (coords.x < 1 || coords.y < 1 || coords.x > this.canvas.width() - 1 || coords.y > this.canvas.height - 1) {
            return false;
          }
          this.moveW = coords.x - this.initX;
          if (this.settings.ratio) {
            this.moveH = this.moveW * this.settings.ratio;
          } else {
            this.moveH = coords.y - this.initY;
          }
          this.selection = new Rect(this.initX, this.initY, this.moveW, this.moveH, 3);
          return this.updateCanvas(this.initX, this.initY, this.moveW, this.moveH, this.canvas, this.ctx);
        }, this);
        return dragMouseUp = __bind(function(e) {
          this.canvas.unbind('mousemove');
          this.canvas.unbind('mouseup');
          this.canvas.unbind('mousedown');
          this.selection.drag(0, 0, this.canvas);
          this.selection.fix();
          this.updateInits();
          this.createCorners();
          this.store();
          return this.dragMouseDown();
        }, this);
      }, this));
    };
    EvroneCrop.prototype.updateCanvas = function(x, y, w, h, canvas, ctx) {
      var c;
      c = canvas[0];
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.clearRect(x, y, w, h);
      if (this.settings.preview) {
        $(this.settings.preview).attr('src', this.done());
      }
      return window[this.store] = this.done();
    };
    EvroneCrop.prototype.createCorners = function() {
      var c, ctx, point, r, _i, _len, _ref, _results;
      c = this.canvas[0];
      ctx = this.ctx;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
      this.corners = [];
      _ref = this.selection.summits;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        point = _ref[_i];
        r = new Rect(point.x - 3, point.y - 3, 8, 8);
        r.parent = point;
        this.corners.push(r);
        ctx.fillRect(point.x - 3, point.y - 3, 8, 8);
        _results.push(ctx.strokeRect(point.x - 3, point.y - 3, 8, 8));
      }
      return _results;
    };
    EvroneCrop.prototype.updateInits = function() {
      this.initX = this.selection.xywh.x;
      this.initY = this.selection.xywh.y;
      this.moveW = this.selection.xywh.w;
      return this.moveH = this.selection.xywh.h;
    };
    EvroneCrop.prototype.dragMouseDown = function() {
      return this.canvas.mousedown(__bind(function(e) {
        var coords, corner, dragMouseMove, dragMouseUp, i, resizeMouseMove, resizeMouseUp, summit, _i, _len, _ref, _results;
        coords = {
          x: e.pageX - this.canvas.offset().left,
          y: e.pageY - this.canvas.offset().top
        };
        if (this.selection.hasPoint(coords.x, coords.y)) {
          this.dragInitX = coords.x;
          this.dragInitY = coords.y;
          this.canvas.mousemove(function(e) {
            return dragMouseMove(e);
          });
          this.canvas.mouseup(function(e) {
            return dragMouseUp(e);
          });
          dragMouseMove = __bind(function(e) {
            var c;
            coords = {
              x: e.pageX - this.canvas.offset().left,
              y: e.pageY - this.canvas.offset().top
            };
            this.dragMoveW = coords.x - this.dragInitX;
            this.dragMoveH = coords.y - this.dragInitY;
            this.selection.drag(this.dragMoveW, this.dragMoveH, this.canvas);
            c = this.selection.xywh2();
            return this.updateCanvas(c.x, c.y, c.w, c.h, this.canvas, this.ctx);
          }, this);
          return dragMouseUp = __bind(function(e) {
            var c;
            this.canvas.unbind('mousemove');
            this.canvas.unbind('mouseup');
            this.initX += this.dragMoveW;
            this.initY += this.dragMoveH;
            this.selection.fix();
            this.updateInits();
            c = this.selection.xywh2();
            this.updateCanvas(c.x, c.y, c.w, c.h, this.canvas, this.ctx);
            this.store();
            return this.createCorners();
          }, this);
        } else {
          _ref = this.corners;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            corner = _ref[_i];
            _results.push((function() {
              var _j, _len2, _ref2, _results2;
              if (corner.hasPoint(coords.x, coords.y)) {
                _ref2 = this.selection.summits;
                _results2 = [];
                for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                  summit = _ref2[_j];
                  _results2.push(summit.x === corner.parent.x && summit.y === corner.parent.y ? (i = $.inArray(summit, this.selection.summits), this.resizeInitX = summit.x, this.resizeInitY = summit.y, this.canvas.mousemove(function(e) {
                    return resizeMouseMove(e);
                  }), this.canvas.mouseup(function(e) {
                    return resizeMouseUp(e);
                  }), resizeMouseMove = __bind(function(e) {
                    var a, b, c;
                    coords = {
                      x: e.pageX - this.canvas.offset().left,
                      y: e.pageY - this.canvas.offset().top
                    };
                    if (coords.x < 1 || coords.y < 1 || coords.x > this.canvas.width() - 1 || coords.y > this.canvas.height - 1) {
                      return false;
                    }
                    a = coords.x - this.resizeInitX;
                    if (this.settings.ratio) {
                      switch (i) {
                        case 0:
                          b = a;
                          break;
                        case 2:
                          b = a;
                          break;
                        case 1:
                          b = -1 * a;
                          break;
                        case 3:
                          b = -1 * a;
                      }
                    } else {
                      b = coords.y - this.resizeInitY;
                    }
                    this.selection.translate(i, this.resizeInitX + a, this.resizeInitY + b);
                    c = this.selection.xywh();
                    return this.updateCanvas(c.x, c.y, c.w, c.h, this.canvas, this.ctx);
                  }, this), resizeMouseUp = __bind(function(e) {
                    this.canvas.unbind('mousemove');
                    this.canvas.unbind('mouseup');
                    this.updateInits();
                    this.store();
                    return this.createCorners();
                  }, this)) : void 0);
                }
                return _results2;
              }
            }).call(this));
          }
          return _results;
        }
      }, this));
    };
    EvroneCrop.prototype.done = function() {
      var ctx, image, imageCSSW, m, tmp_canvas, xywh;
      tmp_canvas = document.createElement('canvas');
      image = this.element;
      imageCSSW = $(image).width();
      m = this.originalSize / imageCSSW;
      this.log("imageCSSW: " + imageCSSW);
      this.log("originalSize: " + this.originalSize);
      this.log("m: " + m);
      ctx = tmp_canvas.getContext('2d');
      xywh = this.selection.xywh();
      if (typeof (m !== 'undefined')) {
        xywh.x *= m;
        xywh.y *= m;
        xywh.w *= m;
        xywh.h *= m;
      }
      tmp_canvas.width = this.settings.size.w || xywh.w;
      tmp_canvas.height = this.settings.size.h || xywh.h;
      this.log(xywh);
      ctx.drawImage(image, xywh.x, xywh.y, xywh.w, xywh.h, 0, 0, tmp_canvas.width, tmp_canvas.height);
      return tmp_canvas.toDataURL();
    };
    EvroneCrop.prototype.store = function() {
      return $.data(this.element, 'evroneCrop', this.done());
    };
    EvroneCrop.prototype.log = function(msg) {
      if (this.settings.log) {
        return console.log(msg);
      }
    };
    return EvroneCrop;
  })();
  Rect = (function() {
    function Rect(x, y, w, h, padding) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.padding = padding;
      this.summits = [
        {
          x: this.x,
          y: this.y
        }, {
          x: this.x + this.w,
          y: this.y
        }, {
          x: this.x + this.w,
          y: this.y + this.h
        }, {
          x: this.x,
          y: this.y + this.h
        }
      ];
      this.newSummits = [];
    }
    Rect.prototype.hasPoint = function(x, y) {
      var max_x, max_y, min_x, min_y, padding, point1, point2;
      padding = this.padding || 0;
      point1 = this.summits[0];
      point2 = this.summits[2];
      if (point1.x < point2.x) {
        min_x = point1.x;
        max_x = point2.x;
      } else {
        min_x = point2.x;
        max_x = point1.x;
      }
      if (point1.y < point2.y) {
        min_y = point1.y;
        max_y = point2.y;
      } else {
        min_y = point2.y;
        max_y = point1.y;
      }
      if (x > (min_x + padding) && x < (max_x - padding) && y > (min_y + padding) && y < (max_y - padding)) {
        return true;
      } else {
        return false;
      }
    };
    Rect.prototype.translate = function(i, x, y) {
      var oldSummits;
      oldSummits = this.summits;
      switch (i) {
        case 0:
          this.summits[0] = {
            x: x,
            y: y
          };
          this.summits[1] = {
            x: oldSummits[1].x,
            y: y
          };
          this.summits[3] = {
            x: x,
            y: oldSummits[3].y
          };
          break;
        case 1:
          this.summits[0] = {
            x: oldSummits[0].x,
            y: y
          };
          this.summits[1] = {
            x: x,
            y: y
          };
          this.summits[2] = {
            x: x,
            y: oldSummits[2].y
          };
          break;
        case 2:
          this.summits[1] = {
            x: x,
            y: oldSummits[1].y
          };
          this.summits[2] = {
            x: x,
            y: y
          };
          this.summits[3] = {
            x: oldSummits[3].x,
            y: y
          };
          break;
        case 3:
          this.summits[0] = {
            x: x,
            y: oldSummits[0].y
          };
          this.summits[2] = {
            x: oldSummits[2].x,
            y: y
          };
          this.summits[3] = {
            x: x,
            y: y
          };
      }
      this.x = this.summits[0].x;
      this.y = this.summits[0].y;
      this.w = this.summits[2].x - this.summits[0].x;
      this.h = this.summits[2].y - this.summits[0].y;
      return this.summits;
    };
    Rect.prototype.xywh = function() {
      return {
        x: this.x,
        y: this.y,
        w: this.w,
        h: this.h
      };
    };
    Rect.prototype.xywh2 = function() {
      return {
        x: this.newx,
        y: this.newy,
        w: this.w,
        h: this.h
      };
    };
    Rect.prototype.drag = function(x, y, canvas) {
      this.newx = this.x + x;
      this.newy = this.y + y;
      if (this.newx < 1) {
        this.newx = 0;
      }
      if (this.newy < 1) {
        this.newy = 0;
      }
      if (this.newx > canvas.width() - this.w) {
        this.newx = canvas.width() - this.w;
      }
      if (this.newy > canvas.height() - this.h) {
        return this.newy = canvas.height() - this.h;
      }
    };
    Rect.prototype.fix = function() {
      return this.renewSummits();
    };
    Rect.prototype.renewSummits = function() {
      this.x = this.newx;
      this.y = this.newy;
      return this.summits = [
        {
          x: this.x,
          y: this.y
        }, {
          x: this.x + this.w,
          y: this.y
        }, {
          x: this.x + this.w,
          y: this.y + this.h
        }, {
          x: this.x,
          y: this.y + this.h
        }
      ];
    };
    return Rect;
  })();
}).call(this);
