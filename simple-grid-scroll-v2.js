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



            base.unbind(".sgScroll").bind("mousewheel.sgScroll", function(event, delta, deltaX, deltaY){
                if (self.enable() && !grid.displayNative()){
                    isWheel = true;
                    parentScroll.scrollTop(parentScroll.scrollTop() - (delta * 40));
                    isWheel = false;
                    event.preventDefault();//stop scrolling body
                }
            });

            function bindSc(el){
                var type = el.data("type");
                el.unbind(".sgScroll")
                    .bind("mouseenter.sgScroll", function(){
                        //showScroll($(this).data("type"));
                    }).bind("mouseleave.sgScroll", function(){
                        //hideScroll();
                    }).bind("scroll.sgScroll", function(ev){
                        if (isWheel != true){
                                var scFunc = (type == "left") ? "scrollTop" : "scrollLeft";

                                    //val = $(this)[scFunc]();
                                if (type == "bottom"){
                                    //parentHead[scFunc](val);
                                }
                                //parentBody[scFunc](val);
                            //ev.preventDefault();
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