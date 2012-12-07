jqSimpleGrid.plugins["scroll_jqSimpleGrid"] = function (grid, opt){
    var scroll = {
        _grid: null,
        _opt: null,
        _scroll: null,
        _scrollBottom: null,
        init: function(grid, opt){
            this._grid = grid;
            this._opt = (opt) ? opt : {};
            var scrollPL = $("<div class='simple-grid-scroll-bottom' data-type='bottom'/>"),
                scrollP = $("<div class='simple-grid-scroll' data-type='left'/>");

            scrollP.append(this._scroll = $("<div/>"));
            scrollPL.append(this._scrollBottom = $("<div/>"));
            grid.base().append(scrollP, scrollPL);
            this.createScroll();
        },
        reDraw: function(){
            this.createScroll();
        },
        enable: function(val){
            if (val != undefined){
                this._opt['enable'] = val;
            }
            return (this._opt['enable'] !== false)
        },
        getTouchEvent: function(ev){
            var e;
            if (ev.originalEvent.touches && ev.originalEvent.touches.length) {
                e = ev.originalEvent.touches[0];
            } else if (ev.originalEvent.changedTouches && ev.originalEvent.changedTouches.length) {
                e = ev.originalEvent.changedTouches[0];
            } else {
                e = ev;
            }
            return e;
        },
        createScroll: function(){
            var grid = this._grid,
                self = this,
                base = grid.base(),
                tbody = grid._tbody,
                thead = grid._thead,
                parentBody = tbody.parent(),
                parentHead = thead.parent(),
                scroll = this._scroll,
                parentScroll = scroll.parent(),
                bottomScroll = this._scrollBottom,
                parentBottomScroll = bottomScroll.parent(),
                touchStart = {can: false, moved: false, pageY:0, scrollY:0, scrollX:0, dy:0, dx: 0, left: false, bottom: false, bottomTime: 0, time: 0},
                hideTimeout = 0;

            function getTouchEv(ev){
                return self.getTouchEvent(ev);
            }

            function hideScroll(){
                clearTimeout(touchStart.time);
                clearTimeout(touchStart.bottomTime);
                touchStart.time = setTimeout(function(){
                    touchStart.left = false;
                    scroll.hide();
                    parentScroll.removeClass("simple-grid-scroll-open");
                }, 1500);
                
                touchStart.bottomTime = setTimeout(function(){
                    touchStart.bottom = false;
                    bottomScroll.hide();
                    parentBottomScroll.removeClass("simple-grid-scroll-open-bottom");
                }, 1500);
            }

            function showScroll(type){
                if (self.enable()){
                    type = (type == undefined) ? "all" : type;
                    updateHeight(type);
                    switch (type){
                        case "left":
                            clearTimeout(touchStart.time);
                            break;
                        case "bottom":
                            clearTimeout(touchStart.bottomTime);
                            break;
                        default:
                            clearTimeout(touchStart.time);
                            clearTimeout(touchStart.bottomTime);
                            break;
                    }
                    if (type == "all"){
                        showScType('left');
                        showScType('bottom');
                    } else{
                        showScType(type);
                    }
                }
            }

            function showScType(type){
                var func = (type == "left") ? "scrollTop" : "scrollLeft",
                    ret = parentBody[func]();
                if (type == "left" && scroll.height() > parentScroll.height()){
                    scroll.show();
                    parentScroll.addClass("simple-grid-scroll-open");
                    parentScroll[func](ret);
                }
                if (type == "bottom" && bottomScroll.width() > parentBottomScroll.width()){
                    bottomScroll.show();
                    parentBottomScroll.addClass("simple-grid-scroll-open-bottom");
                    parentBottomScroll[func](ret);
                }

                touchStart[type] = true;
            }

            function updateHeight(type){
                if (type == "all" || type == "left"){
                    if (tbody && scroll){
                        scroll.height(tbody.height());
                    }
                }
                if (type == "all" || type == "bottom"){
                    if (tbody && bottomScroll){
                        bottomScroll.width(tbody.width());
                    }
                }
            }

            function moveTouchScroll(ev){
                touchStart.dy = (touchStart.pageY - ev.pageY);
                parentScroll.scrollTop(touchStart.scrollY + touchStart.dy);
            }


            function stopScroll(){
                if (self.enable()){
                    if (touchStart.can && touchStart.moved){
                        hideScroll();
                        grid._objectEnv['canClick'] = false;
                    }
                    touchStart.can = false;
                    base.addClass("simple-grid-noscroll");
                } else {
                    grid._objectEnv['canClick'] = true;
                }
            }

            base.unbind(".sgScroll").bind("mousedown.sgScroll touchstart.sgScroll MozTouchDown.sgScroll", function(ev){
                if (grid.touchScroll() && self.enable()){
                    //:todo need to implement touch events
                    var e = getTouchEv(ev),
                        el = $(e.target);
                    if (el.closest(".simple-grid-body-container").length > 0 && !el.hasClass("simple-grid-split")){
                        touchStart.can = true;
                        touchStart.moved = false;
                        touchStart.pageY = e.pageY;
                        touchStart.scrollY = parentScroll.scrollTop();
                        base.removeClass("simple-grid-noscroll");
                    }
                }
            }).bind("mousewheel.sgScroll", function(event, delta, deltaX, deltaY){
                if (self.enable()){
                    showScroll('left');
                    parentScroll.scrollTop(parentScroll.scrollTop() - (delta * 20));
                    hideScroll();
                    event.preventDefault();//stop scrolling body
                }
            }).bind("touchend.sgScroll mouseup.sgScroll", function(ev){
                stopScroll();
            }).bind("touchmove.sgScroll mousemove.sgScroll", function(ev){
                if (self.enable()){
                    if (touchStart.can){
                        touchStart.moved = true;
                        showScroll();
                        ev.preventDefault();
                        moveTouchScroll(getTouchEv(ev), touchStart);
                    }
                }
            }).bind("mouseleave.sgScroll", function(){
                stopScroll();
            });

            function bindSc(el){
                el.unbind(".sgScroll")
                    .bind("mouseenter.sgScroll", function(){
                        showScroll($(this).data("type"));
                    }).bind("mouseleave.sgScroll", function(){
                        hideScroll();
                    }).bind("scroll.sgScroll", function(ev){

                        var type = $(this).data("type");
                        if (touchStart[type]){
                            var scFunc = (type == "left") ? "scrollTop" : "scrollLeft",
                                val = $(this)[scFunc]();
                            if (type == "bottom"){
                                parentHead[scFunc](val);
                            }
                            parentBody[scFunc](val);
                        }

                    }).bind("mousedown.sgScroll touchstart.sgScroll MozTouchDown.sgScroll", function(ev){
                        return false;
                    });
            }

            bindSc(parentScroll);
            bindSc(parentBottomScroll);
        },

        destroy: function(){
            this._grid = undefined;
            this._opt = undefined;
        }
    };
    scroll.init(grid, opt);
    return scroll;
};
jqSimpleGrid.plugins["scroll_jqSimpleGrid"].pluginName = "scroll";