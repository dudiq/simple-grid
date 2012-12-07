(function(jqSimpleGrid) {
var plug = jqSimpleGrid.plugins["scroll_jqSimpleGrid"] = function (grid, opt){
    var scroll = {
        _grid: null,
        _opt: null,
            init: function(grid, opt){
            this._grid = grid;
            this._opt = opt;
            this.initScroll();
        },
        reDraw: function(){
            this.initScroll();
        },
        enable: function(val){
            if (val != undefined){
                this._opt['enable'] = val;
            }
            return (this._opt['enable'] !== false)
        },
        refresh: function(){
            //it's a cap
        },
        initScroll: function(){
            var self = this,
                grid = this._grid,
                base = grid.base(),
                tbody = grid._tbody,
                thead = grid._thead,
                canScroll = true,
                parentBody = tbody.parent(),
                parentHead = grid._thead.parent();

            function updateWidth(){
                var height = tbody.height() - parentBody.height();

                if (height > 0){
                    thead.css("padding-right", plug._defaultScrollWidth);
                } else {
                    thead.css("padding-right", "");
                }
            }

            this.refresh = function(){
                updateWidth();
            };

            parentBody
                .css("overflow", "auto")
                .unbind("scroll.scrollPlug").bind("scroll.scrollPlug", function(){
                    parentHead.scrollLeft(parentBody.scrollLeft());
                });
            $(grid).bind(jqSimpleGrid.onGridChanged, function(){
                updateWidth();
            });
        },
        destroy: function(){
            this._grid = undefined;
            this._opt = undefined;
        }
    };
    scroll.init(grid, opt);
    return scroll;
};
plug.pluginName = "scroll";
plug._defaultScrollWidth = 0;

    $(function(){
        var helper = $("<div style='width: 100px; height: 100px; overflow: auto; position: absolute; z-index: 1000; left:-200px; top:-200px;'><div style='height: 200px; width: 100%;'></div></div>");
        $(document.body).append(helper);
        plug._defaultScrollWidth = 100 - helper.children().eq(0).width();
        helper.remove();
    });

})(jqSimpleGrid);