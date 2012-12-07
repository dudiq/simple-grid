(function(jqSimpleGrid) {

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

            this._scrollHelper = $("<div class='simple-grid-scroll-helper'/>");
            this._scrollBHelper = $("<div class='simple-grid-scroll-bottom-helper'/>");

            scrollP.append(this._scroll = $("<div/>"), this._scrollHelper);
            scrollPL.append(this._scrollBottom = $("<div/>"), this._scrollBHelper);
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
                isWheel = false,
                hideTimeout = 0;

            function hideScroll(){
                clearTimeout(touchStart.time);
                clearTimeout(touchStart.bottomTime);
                touchStart.time = setTimeout(function(){
                    touchStart.left = false;
                    scroll.hide();
                    parentScroll.removeClass("simple-grid-scroll-open");
                }, 1000);
                
                touchStart.bottomTime = setTimeout(function(){
                    touchStart.bottom = false;
                    bottomScroll.hide();
                    parentBottomScroll.removeClass("simple-grid-scroll-open-bottom");
                }, 1000);
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

            base.unbind(".sgScroll").bind("mousewheel.sgScroll", function(event, delta, deltaX, deltaY){
                if (self.enable() && !grid.displayNative()){
                    showScroll('left');
                    isWheel = true;
                    parentScroll.scrollTop(parentScroll.scrollTop() - (delta * 40));
                    isWheel = false;
                    hideScroll();
                    event.preventDefault();//stop scrolling body
                }
            });

            function bindSc(el){
                el.unbind(".sgScroll")
                    .bind("mouseenter.sgScroll", function(){
                        showScroll($(this).data("type"));
                    }).bind("mouseleave.sgScroll", function(){
                        hideScroll();
                    }).bind("scroll.sgScroll", function(ev){
                        if (isWheel != true){
                            var type = $(this).data("type");
                            if (touchStart[type]){
                                var scFunc = (type == "left") ? "scrollTop" : "scrollLeft",
                                    val = $(this)[scFunc]();
                                if (type == "bottom"){
                                    parentHead[scFunc](val);
                                }
                                parentBody[scFunc](val);
                            }
                        }
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

})(jqSimpleGrid);