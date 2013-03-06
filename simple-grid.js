/**
* jQuery Simple Grid
* https://github.com/dudiq/simple-grid
*
* @version: 0.2 - 2011.10.21
* @author: dudiq
* @licence: MIT http://www.opensource.org/licenses/mit-license.php
**/
(function(window, console) {
function jqSimpleGrid(div, data, opt) {
    var rGrid = {
        _data: null,
        _model: null,
        _div: null, //render container
        _tbody: null,
        _opt: null,
        _thead: null,
        _cells: null,
        _rowsMap: null, // map of nodes by ID of node
        _plugins: null,
        _colGroup: "",
        _splitWidth: 4,
        _colEnv: null,
        _objectEnv: null, //enviropment , (selected node id for example, etc...)
        _id: null,
        _init: function(div, data, opt) {
            var self = this;
            opt = (opt == undefined) ? {} : opt;
            (!opt.plugins) ? opt.plugins = {} : null;
            (!opt.plugins.scroll) ? opt.plugins.scroll = {} : null;
            data = (data == undefined) ? [] : data;
            this._objectEnv = {};
            this.initOpts();
            this._id = this._generateUniqueId();
            this._div = $("<div class='simple-grid simple-grid-enable' id='"+ this._id +"' >");
            var header = this._headDiv = $("<div class='simple-grid-header-div'>"),
                body = this._bodyDiv = $("<div class='simple-grid-body-div'>");
            header.append(this._thead = $("<table class='simple-grid-header-container' />"));
            body.append(this._tbody = $("<table class='simple-grid-body-container' tabIndex='0'/>"));
            this._div.append(header, body);
            this._colEnv = {};
            this._cells = {};
            this._plugins = {};
            this._opt = opt;
            this._dropData();
            this._initPlugins();
            this.model(opt['model']);
            this.width(opt['width']);
            this.height(opt['height']);
            this.enable((opt['enable'] == undefined) ? true : opt['enable']);
            this.showHeader(opt['showHeader']);
            div.append(this._div);
            this.setData(data, opt);
            this._bindEvents();
            if (this._plugins.scroll){
                this._plugins.scroll.refresh();
            }
        },
        initOpts: function(){
            // default false
            this.multiSelect = this._defaultProp('multiSelect');
            this.readOnly = this._defaultProp('readOnly');
            this.touchScroll = this._defaultProp('touchScroll');
            this.twoClickEdit = this._defaultProp('twoClickEdit');
        },
        plugins: function(){
            return this._plugins;
        },
        _initPlugins: function(){
            var plugins = (this._opt['plugins']) ? this._opt['plugins'] : {},
                gPlugins = jqSimpleGrid.plugins;
            for (var i in gPlugins){
                var tPlug = gPlugins[i];
                if (plugins[tPlug.pluginName]){
                    this._plugins[tPlug.pluginName] = new tPlug(this, plugins[tPlug.pluginName]);
                }
            }
        },
        destroyPlugins: function(){
            for (var i in this._plugins){
                this._plugins[i].destroy();
                delete this._plugins[i];
            }
        },
        evId: function(){return ".simpleGrid_" + this._id;},
        id: function(){return this._id;},
        reDraw: function(){
            this.setData(this.getDataLink());
            var plugs = this._plugins;
            for (var i in plugs){
                if (typeof plugs[i]['reDraw'] == "function")
                    plugs[i].reDraw();
            }
            this._bindEvents();
            if (this._plugins.scroll){
                this._plugins.scroll.refresh();
            }
        },
        base: function(){
            return this._div;
        },
        setData: function(data, opt){
            if (data != undefined) {
                data = this._cloneObj(data);
                if (opt != undefined){
                    if (opt['model']){
                        this.model(opt['model']);
                    }
                    if (opt['sortBy'] != undefined){
                        data = this._sortBy(opt['sortBy'], data);
                    }
                    if (opt['groupBy'] != undefined){
                        data = this._groupBy(opt['groupBy'], data);
                    }
                }
                this._setData(data);
            }
        },
        _setData: function(data) {
            this.clear();
            this.addRows(data, undefined, false);
        },
        _onGridChanged: function(){
            this._updateAltBgColor();
            $(this).trigger(jqSimpleGrid.onGridChanged);
        },
        _cloneObj: function(val){
            return (jQuery.extend(true, {}, {val: val})).val;
        },
        getData: function(){
            return (this._cloneObj( this.getDataLink() ));
        },
        getDataLink: function(){
            this.editStop();
            return this._data;
        },
        getDataGrid: function(onlyValues){
            var data = this.getData(),
                model = this.model(),
                mLen = model.length,
                item, ret = [], row;
            for (var i = 0, l = data.length; i < l; i ++){
                item = [];
                row = data[i];
                for (var j = 0; j < mLen; j++){
                    item.push((onlyValues) ? this.getCellValue(row.id, j) : row[j]);
                }
                ret.push(item);
            }
            return ret;
        },
        getDataValues: function(){
            return this.getDataGrid(true);
        },
        clear: function(){
            this.clearSelection();
            this.editStop();
            this._tbody.empty().append($(this._colGroup));
            this._dropData();
            this._data = [];
            this._onGridChanged();
        },
        width: function(val){
            if (val != undefined){
                this._div.width(val);
            }
            return this._div.width();
        },
        height: function(val){
            if (val != undefined){
                this._div.height(val);
                if (this._plugins.scroll){
                    this._plugins.scroll.refresh();
                }
            }
            return this._div.height();
        },
        _log: function(msg){
            if (console)
                console.log(msg);
        },
        _error: function(msg){
            if (console)
                console.error(msg);
        },
        _dropData: function(){
            var env = this._objectEnv;
            for (var prop in env) {
                if (env.hasOwnProperty(prop)) {
                    delete env[prop];
                }
            }
            this._rowsMap = {}; this._data = {};
        },
        _generateUniqueId: function(map){
            function getGuid(){
                var quidStr = "abcdefghijklmnopqrstuvwxyz0123456789-", quid = "w", pos, i, l;
                for (i = 0, l = quidStr.length; i < l; i++) {
                    pos = parseInt(l * Math.random());
                    quid += quidStr.charAt(pos);
                }
                return quid;
            }
            var uid;
            while ((map && map[uid]) || !uid) {
                uid = getGuid();
            }
            return uid;
        },
        _getRowsMap: function(id){
            return this._rowsMap[id];
        },
        addRow: function(data, pos){
            var rows = this.addRows([data], pos);
            return rows[(pos == undefined) ? rows.length - 1 : pos];
        },
        addRows: function(data, pos, clone){
            (clone) ? data = this._cloneObj(data) : null;
            var row, mId,
                env = this._objectEnv,
                colEnv = this._colEnv,
                opt = this._opt,
                tmp = $("<div/>"),
                td, tr, cellSpan,
                item,
                model = this._model, iModel,
                tdCount = model.length,
                cellType, cssGroupCell, cell, cssItemGroup, isItemGroup,
                splitTd,
                colClass,
                cellModel,
                font,
                color,
                bgColor,
                rowBgColor,
                rowFont,
                rowId,
                tdVis,
                align,
                vAlign,
                customCellStyle = "",
                ind = (pos == undefined) ? 0 : pos,
                rowIsGrouped,
                groupByData = colEnv['groupByData'] || {},
                colFonts = colEnv['columnFont'] || {},
                colColor = colEnv['columnColor'] || {},
                colAlign = colEnv['columnAlign'] || {},
                colVAlign = colEnv['columnVAlign'] || {},

                title,
                canAdd = true,
                rowsMap = this._rowsMap;
            for (var i = 0, l = data.length; i < l; i++){
                row = data[i];
                rowId = (row.id == undefined) ? row.id = this._generateUniqueId(): row.id;
                (row.userData == undefined) ? row.userData = {}: null;
                if (rowsMap[rowId]){
                    //error
                    this._error("Error :: Detects duplicate ID in data");
                    canAdd = false;
                    break;
                } else {
                    rowIsGrouped = (groupByData[rowId] != undefined);
                    rowBgColor = (row.bgColor) ? row.bgColor : undefined;
                    rowFont = (row.font) ? row.font : undefined;
                    tr = $("<tr class='simple-grid-row " + " " + (row.cssClass ? row.cssClass : "") + " " + ((rowIsGrouped) ? "simple-grid-row-group" : "") +"' style='background-color : "+ rowBgColor +"; font: "+ rowFont +";' data-id='"+ rowId +"'>");
                    (row.visible === false || row.filtered === true) ? tr.hide() : null;
                    rowsMap[rowId] = {row: row, tr: tr};

                    for (var j = 0; j < tdCount; j++){
                        item = (row[j] != undefined) ? row[j] : "";
                        iModel = model[j];
                        mId = iModel.id;
                        cellType = (item && item['type']) ? item['type'] : row['type'] ? row.type: iModel.type;
                        isItemGroup = (rowIsGrouped && groupByData[rowId][j] != undefined);
                        cssGroupCell = (isItemGroup) ? " simple-grid-cell-group " : "";
                        cssItemGroup = (isItemGroup) ? " simple-grid-item-group " : "";
                        colClass = " simple-grid-col-" + (j) + " ";

                        tdVis = (iModel.visible !== false) ? "" : " display:none; ";
                        font = " font:" + ((colFonts[mId] != undefined && !rowFont) ? colFonts[mId] : rowFont) + ";" ;
                        color = (colColor[mId] != undefined) ? " color: " + colColor[mId] + ";" : "";
                        vAlign = (colVAlign[mId] != undefined) ? " vertical-align: " + colVAlign[mId] + ";" : "";
                        align = (iModel.align == undefined) ? "" : " text-align:" + ((colAlign[mId] != undefined) ? colAlign[mId] : iModel.align) + "; ";
                        customCellStyle = item.style || "";
                        splitTd = (iModel.split) ? "<td class='simple-grid-split'></td>" : undefined;

                        td = $("<td class='simple-grid-item "+ colClass + cssItemGroup + "' style='"+ tdVis + font + color + customCellStyle + align + vAlign + "; ' data-pos='"+ j +"'>"+
                               "<span class='" + cssGroupCell + "'></span></td>");
                        cellSpan = $("<span class='simple-grid-cell'></span>");
                        td.append(cellSpan);
                        cell = this._getCellObject(cellType, cellSpan);

                        this._setCellValue(cell, item, rowId, j);
                        tr.append(td, splitTd);
                    }

                    tmp.append(tr);
                    $(this).trigger(jqSimpleGrid.onRowCreated, [rowId, i + ind, row]); //id, index, row
                }
            }
            if (canAdd){
                if (pos != undefined){
                    pos = (pos > this._data.length - 1) ? this._data.length - 1 : pos;
                    pos = (pos < 0) ? 0 : pos;
                    if (this._data[pos] != undefined){
                        var currTr = rowsMap[this._data[pos].id].tr,
                            callMethod = (pos == this._data.length - 1) ? "after" : "before";

                        data.splice(0, 0, pos, 0); // add splice(pos, 0, newData);
                        this._data.splice.apply(this._data, data);
                        currTr[callMethod](tmp.children());
                    } else {
                        this._data.push.apply(this._data, data);
                        this._tbody.append(tmp.children());
                    }
                } else {
                    this._data.push.apply(this._data, data);
                    this._tbody.append(tmp.children());
                }
                this._onGridChanged();
            }
            return this._data;
        },
        _removeSubRows: function(row){
            var env = this._colEnv,
                items, i, j, l, removeItems,
                groupData;
            if (env['groupByData'] && env['groupByData'][row.id]){
                groupData = env['groupByData'][row.id];
                for (i in groupData){
                    removeItems = [];
                    items = this.getSubItems(row.id, i);
                    for (j = 0, l = items.length; j < l; j++){
                        removeItems.push(items[j].id);
                    }
                    this.removeRow(removeItems);
                }
            }
        },
        removeRow: function(ids){
            this.editStop();
            ids = ($.isArray(ids)) ? ids : [ids];
            var data = this._data,
                env = this._colEnv,
                sysStruct, id,
                self = this, ret = true;
            for (var i = data.length - 1, l = 0; i >= l; i--){
                id = data[i].id;
                if ($.inArray(id, ids) != -1){
                    sysStruct = this._getRowsMap(id);
                    if (!sysStruct){
                        this._error('Error :: There are no row by ID = ' + id);
                        ret = false;
                        continue;
                    }
                    if (env['groupByData'] && env['groupByData'][id]){
                        this._removeSubRows(sysStruct.row);
                    }

                    this.clearRowSelection(id);
                    sysStruct.tr.remove();
                    delete this._rowsMap[id];
                    data.splice(i, 1);
                    if (ids.length == 1){
                        break;
                    }
                }
            }
            if (ret == true){
                this._onGridChanged();
            }
        },
        removeRowByPos: function(pos){
            if (this._data[pos]) {
                this.removeRow(this._data[pos].id);
            }
        },
        model: function(val){
            if ($.isArray(val)){
                this.editStop();
                var newModel = this._model = this._cloneObj(val);
                this._thead.empty();
                var tr = "<tr>",
                    colGroup = "<colgroup>",
                    tdHelper = "",
                    item,
                    align,
                    alt,
                    visible,
                    wType = (this._opt['widthType'] != undefined) ? this._opt['widthType'] : "px",
                    itemWidth,
                    defTdWidth = 100 / newModel.length + "%",
                    tdModel,
                    tdModelStart,
                    tdModelEnd;

                for (var i = 0, l = newModel.length; i < l; i++){
                    item = newModel[i];
                    item.type = (item.type == undefined) ? "ro" : item.type;
                    //item.id = (item.id == undefined) ? this._generateUniqueId() : item.id;
                    item.id = (item.id == undefined) ? this._generateUniqueId() : item.id;
                    item.width = (item.width == undefined) ? defTdWidth : (!isNaN(item.width)) ? item.width + wType : item.width ;
                    visible = (item.visible !== false) ? "" : " display: none; ";
                    align = (item.align == undefined) ? "" : " text-align:" + item.align + "; ";
                    alt = (item.alt) ? " title='" + item.alt + "' " : "";
                    tdModelStart = "<td class='simple-grid-header simple-grid-col-header-"+i+"' style='"+ visible + align +"' "+ alt +"' data-pos='"+ i +"'>";
                    tdModelEnd = "</td>"+ ((item.split) ? "<td class='simple-grid-split'></td>" : "");


                    tdModel = tdModelStart + item.title + tdModelEnd;

                    if (item.visible !== false){
                        colGroup += this._collectColGroup(item, i);
                    }

                    tr += tdModel;
                }

                tr += "</tr>";
                colGroup += "</colgroup>";
                this._colGroup = colGroup;
                this._updateColGroup();
                this._thead.append($(tr));
            }
            return this._model;
        },
        _collectColGroup: function(item, pos, opt){
            var width = item.width;
            if (opt) {
                width = (opt.width != undefined) ? opt.width : width;
            }
            if (item.split){
                // must used only for "pixels"
                var newW = parseInt(width);
                width = (!isNaN(newW)) ? (newW - this._splitWidth) + "px" : width;
            }
            return "<col data-pos='"+ pos +"' width='" + width + "' style='width:" + width + ";' />" + ((item.split) ? "<col width='4px' style='width:4px;' />" : "");
        },
        _updateColGroup: function(){
            this._div.find("colgroup").remove();
            var text = this._colGroup;
            this._thead.prepend($(text));
            this._tbody.prepend($(text));
        },
        _getEventElem: function(ev){
            return $((ev.originalEvent && (ev.originalEvent.target || ev.originalEvent.srcElement)) || ev.target);
        },
        _getRowElem: function(el){
            return el.closest(".simple-grid-row");
        },
        _getTdElement: function(el){
            return el.closest(".simple-grid-item");
        },
        _bindEvents: function(){
            var self = this,
                evId = this.evId(),
                env = this._objectEnv,
                div = this._div;

            $(document).bind("mousemove" + evId, function(ev){
                if (env['split']) {
                    self._splitColumns(ev);
                }
            }).bind("mouseup" + evId, function(ev){
                if (env['split']) {
                    self._splitColumns(ev, true);
                }
                env['split'] = false;
            });
            //bind events to root div. we don't need to bind events to every child
            div.unbind(".simpleGrid")
                .bind("touchstart.simpleGrid mousedown.simpleGrid", function(ev){
                    env['split'] = false;
                    if (env['canClick'] !== false && self.enable()){
                        var el = self._getEventElem(ev);
                        if (el.hasClass("simple-grid-split")){
                            var pos = el.prev().data("pos"),
                                model = self.model(),
                                iMod = model[pos],
                                nextModel = model[pos + 1],
                                width = parseInt(iMod.width),
                                max = (nextModel) ? parseInt(model[pos + 1].width) + width : 10000,
                                cols = self._div.find("col").filter("[data-pos='"+ pos +"']"),
                                nextCols = self._div.find("col").filter("[data-pos='"+ (pos + 1) +"']");

                            width = (iMod.split) ? width - self._splitWidth : width;

                            env['split'] = {
                                startX: ev.pageX,
                                pos: pos, width: width, newWidth: width,
                                cols: cols, nextCols: nextCols,
                                model: iMod, nextModel: nextModel,
                                max: max
                            };
                        }
                    }
                    if (!self.isCellEditing()){
                        ev.preventDefault(); // fix for stop native dragging elements. sometimes it broke scrolling.
                    }
                })
                .bind("touchend.simpleGrid click.simpleGrid", function(ev){
                    if (env['canClick'] !== false && self.enable()){
                        var el = self._getEventElem(ev),
                            td = self._getTdElement(el),
                            parentEl = self._getRowElem(el),
                            rowId = parentEl.data("id"),
                            colPos = td.data("pos");
                        if (parentEl.length != 0 && !el.hasClass("simple-grid-split")){
                            if (el.hasClass("simple-grid-cell-group")){
                                //for group
                                self._openCloseGroup(el, rowId, colPos);
                            } else {
                                var ctrlIsPressed = self._isCtrlPressed(ev);
                                self._onSelect(parentEl, td, true, ctrlIsPressed, ev.shiftKey);
                                if (!self.twoClickEdit() && !ctrlIsPressed){
                                    self.editCell(rowId, colPos);
                                }
                                $(self).trigger(jqSimpleGrid.onClick, [rowId, colPos]);

                            }
                        }
                    }
                    env['canClick'] = true;
                }).bind("dblclick.simpleGrid", function(ev){
                    if (self.enable()){
                        var el = self._getEventElem(ev),
                            td = self._getTdElement(el),
                            parentEl = self._getRowElem(el),
                            rowId = parentEl.data("id"),
                            colPos = td.data("pos");
                            if (parentEl.length != 0){
                                if (!el.hasClass("simple-grid-cell-group")){
                                    if (self.twoClickEdit()){
                                        self.editCell(rowId, colPos);
                                    }
                                    $(self).trigger(jqSimpleGrid.onDblClick, [rowId, colPos]);
                                }
                            }
                    }
                });

            var evId = "keydown.simpleGrid",
                tBody = this._tbody;
            tBody.unbind(evId).bind(evId, function(ev){
                if (self.enable()){
                    self.onKeyPress(ev);
                    if (ev.keyCode == 9){
                        self.onTab(ev);
                    }
                }
            });

            this._bodyDiv.unbind("scroll.simpleGrid").bind("scroll.simpleGrid", function(ev){
                if (self.enable()){
                    var el = $(this);
                    $(self).trigger(jqSimpleGrid.onScroll, [el.scrollTop(), el.scrollLeft()]);
                }
            });
        },
        _splitColumns: function(ev, stop){
            var split = this._objectEnv['split'],
                max = split.max,
                w = split.width;

            var dx = ev.pageX - split.startX,
                newWLeft = ((w + dx) < 0) ? 0 : ((w + dx) > split.max) ? split.max : w + dx;

            split.cols.css("width", newWLeft);
            if (split.model.fixedSplit) {
                split.nextCols.css("width", max - newWLeft - this._splitWidth * 2)
            }
            if (stop){
                newWLeft += 4;
                split.model.width = newWLeft;
                if (split.model.fixedSplit) {
                    (split.nextModel) ? split.nextModel.width = max - newWLeft: 0;
                }
            }

        },
        onTab: function(oEv){
            var rowPos = this.getRowPos(this.getSelectedRowId());
            if (rowPos){
                var self = this,
                    way = (!oEv.shiftKey) ? 1 : -1,
                    data = this._data,
                    l = data.length,
                    colPos,
                    stCol = colPos = this.getSelectedColPos(),
                    colLen = this._model.length,
                    stop = false,
                    row, col, type;

                (colPos == undefined) ? colPos = 0 : null;

                //walk at data and get second or previous editable cell for set focus and edit
                for (var i = (rowPos); (way == 1) ? i < l : i >= 0; (way == 1) ? i++ : i--){
                    for (var j = (colPos); (way == 1) ? j < colLen : j >=0; (way ==1) ? j++: j--){
                        type = this.getCellType(data[i].id, j);
                        //getting cell from cache for checking canEdit prop
                        if (this._cells[type].canEdit !== false && !(rowPos == i && stCol == colPos)){
                            this.editStop(function(){
                                self.editCell(data[i].id, j);
                                self.selectCell(data[i].id, j, false);
                            });
                            stop = true;
                            oEv.preventDefault();//need stop event for don't lose focus
                            break;
                        }
                    }
                    if(stop) break;
                    (way == 1) ? colPos = 0 : colPos = colLen - 1;
                }
            }
            $(this).trigger(jqSimpleGrid.onTab, [oEv]);
        },
        onKeyPress: function(oEv){
            $(this).trigger(jqSimpleGrid.onKeyPress, [oEv]);
        },
        _onSelect: function(el, td, callEvent, ctrlKey, shiftKey){
            var env = this._objectEnv,
                oldSelRow = env["selectedRowId"],
                oldSelCol = env["selectedTdPos"];

            //single select
            var selRow = el.data("id"),
                selCol = ((td) ? td.data("pos") : undefined);

            //multy select
            if (env["selectedMulti"] == undefined){
                env["selectedMulti"] = {rows:{}, cols: {}};
            }

            if (ctrlKey && this.multiSelect()){
                //if ctrl is pressed
                if (el.hasClass("simple-grid-row-selected")){
                    el.removeClass("simple-grid-row-selected");
                    delete env["selectedMulti"]['rows'][selRow];
                } else {
                    env["selectedMulti"]['rows'][selRow] = true;
                    el.addClass("simple-grid-row-selected");
                }

                if (td != undefined) {
                    //for cell selection
                    if (td.hasClass("simple-grid-item-selected")){
                        td.removeClass("simple-grid-item-selected");
                        delete env["selectedMulti"]['cols'][selCol];
                    } else {
                        td.addClass("simple-grid-item-selected");
                        env["selectedMulti"]['cols'][selCol] = true;
                    }
                }
            } else {
                //if ctrl is NOT pressed
                this.clearSelection();
                env["selectedMulti"]['rows'][selRow] = true;
                env["selectedMulti"]['cols'][selCol] = true;
                el.addClass("simple-grid-row-selected");
                (td) ? td.addClass("simple-grid-item-selected") : null;
            }

            env["selectedRowId"] = selRow;
            env["selectedTdPos"] = selCol;

            if (callEvent !== false){
                if (selRow != oldSelRow){
                    $(this).trigger(jqSimpleGrid.onRowSelect, [selRow, oldSelRow]);
                }
                if (selRow != oldSelRow || selCol != oldSelCol){
                    $(this).trigger(jqSimpleGrid.onCellSelect, [selRow, selCol, oldSelRow, oldSelCol]);
                }
            }
        },
        _isCtrlPressed: function(ev){
            return (ev) ? ev.ctrlKey || ev.metaKey: false;
        },
        clearSelection: function(){
            this.clearRowSelection();
            this.clearCellSelection();
        },
        clearRowSelection: function(id){
            var env = this._objectEnv,
                selClass = "simple-grid-row-selected";
            if (id == undefined){
                //clear all selected rows
                this._tbody.find("."+selClass).removeClass(selClass);
                (env["selectedMulti"]) ? env["selectedMulti"]['rows'] = {} : env["selectedMulti"] = {rows: {}, cols: {}};
                env['selectedRowId'] = undefined;
            } else {
                var map = this._getRowsMap(id);
                if (map) {
                    map['tr'].removeClass(selClass);
                    (env['selectedRowId'] == id) ? env['selectedRowId'] = undefined : null;
                    (env["selectedMulti"] && env["selectedMulti"]['rows'] && env["selectedMulti"]['rows'][id]) ? delete env["selectedMulti"]['rows'][id]: null;
                }
            }
        },
        clearCellSelection: function(){
            var env = this._objectEnv;
            //clear all selected cells
            this._tbody.find(".simple-grid-item-selected").removeClass("simple-grid-item-selected");
            (env["selectedMulti"]) ? env["selectedMulti"]['cols'] = {} : env["selectedMulti"] = {rows: {}, cols: {}};
            env['selectedTdPos'] = undefined;
        },
        selectRow: function(id, callEvent){
            this.selectCell(id, undefined, callEvent);
        },
        selectCell: function(id, cellPos, callEvent){
            var map = this._getRowsMap(id);
            if (map) {
                var td = (cellPos != undefined) ? map['tr'].children().eq(cellPos) : cellPos;
                this._onSelect(map['tr'], td, callEvent, false);
            }
        },
        _setCellValue: function(cell, item, rowId, colPos){
            var setVal = (this._isItemSimple(item)) ? item : item['value'];
            cell._setValue(setVal, rowId, colPos);
        },
        _stopUserSelect: function(cell, val){
            val = (val == true) ? "" : "text";
            cell.css({"-moz-user-select":val, "-khtml-user-select":val, "-webkit-user-select":val, "user-select": val});
        },
        _isItemSimple: function(item){
            //if item == undefined - > simple
            //if ret == string, number, boolean - >simple
            //if ret == object -> false
            var ret = (item == undefined) ? true : (typeof item == "object" && item['type'] != undefined) ? false : true;
            return ret;
        },
        isCellEditing: function(){
            return (this._objectEnv["isCellEditing"] === true);
        },
        editCell: function(rowId, cellPos){
            var map = this._getRowsMap(rowId),
                env = this._objectEnv;
            if (map && rowId != undefined &&  cellPos != undefined){
                if (env['editRowId'] != rowId || env['editColPos'] != cellPos){
                    this.editStop();
                    env['editRowId'] = rowId;
                    env['editColPos'] = cellPos;
                    var td = map.tr.children().eq(cellPos),
                        cellSpan = td.children(".simple-grid-cell"),
                        type = this.getCellType(rowId, cellPos),
                        self = this,
                        item = map.row[cellPos],
                        cell = this._getCellObject(type, cellSpan);
                    if (cell.canEdit && !this.readOnly() && ((item && item.canEdit !== false) || !item)){
                        this._objectEnv["isCellEditing"] = true;
                        this._setCellValue(cell, item, rowId, cellPos);
                        this._stopUserSelect(cellSpan, false);
                        cell.cell().addClass('simple-grid-cell-edit');
                        cell.__params = this._cloneObj((item && item['params']) ? item['params'] : cell._params);
                        cell.editStop = function(){
                            self.editStop();
                        };
                        if (cell.edit() === false){
                            env['editRowId'] = null;
                            env['editColPos'] = null;
                            env['editCell'] = null;
                        } else {
                            env['editCell'] = cell;
                            var gData = this._colEnv['groupByData'];
                            if (gData && gData[rowId] && gData[rowId][cellPos]){
                                //fix for grouped cell
                                td.children(".simple-grid-cell-group").height(cellSpan.height());
                            }

                            $(this).trigger(jqSimpleGrid.onEditCell, [rowId, cellPos, cell]);
                        }
                    }
                }
            }
        },
        getEditingCell: function(){
            return this._objectEnv['editCell'];
        },
        editStop: function(callback){
            var env = this._objectEnv;
            env["isCellEditing"] = false;
            if (env['editRowId'] != undefined && env['editColPos'] != undefined){
                var rowId = env['editRowId'],
                    callEvent = false,
                    cell = env['editCell'], newVal, map, oldVal,
                    colPos = env['editColPos'];
                if (cell != undefined && cell.preEditStop && callback){
                    cell.preEditStop(callback);
                    return false;
                }
                if (cell != undefined){
                    cell = env['editCell'];
                    cell.cell().unbind(".simpleGrid").removeClass('simple-grid-cell-edit');
                    this._stopUserSelect(cell.cell(), true);
                    newVal = cell.getNewValue();
                    map = this._getRowsMap(rowId);
                    if (map){
                        var col = map.row[colPos];
                        oldVal = this._cloneObj(this._getItemValue(map.row[colPos]));
                        cell._setValue(newVal, rowId, colPos);
                        this._setItemValue(map.row, colPos, newVal);
                        map.tr.children().eq(colPos).children('.simple-grid-cell-group').height(""); // fix for stop edit group cell
                        callEvent = true;
                    }
                    env['editCell'] = null;
                }
                env['editRowId'] = null;
                env['editColPos'] = null;
                if (callEvent){
                    $(this).trigger(jqSimpleGrid.onEditStop, [rowId, colPos, newVal, oldVal]);
                    this._onCellChanged(rowId, colPos, newVal, oldVal, map.row, cell);
                }
            }
            if (typeof callback == "function"){
                callback();
            }
        },
        customEditStop: function(cell, newVal){
            var span = cell.cell(),
                colPos = span.closest(".simple-grid-item").data("pos"),
                rowId = span.closest(".simple-grid-row").data("id");
            var map = this._getRowsMap(rowId);
            if (map){
                var col = map.row[colPos],
                    oldVal = this._cloneObj(this._getItemValue(map.row[colPos]));
                cell._setValue(newVal, rowId, colPos);
                this._setItemValue(map.row, colPos, newVal);
                this._onCellChanged(rowId, colPos, newVal, oldVal, map.row, cell);
            }
        },
        _onCellChanged: function(rowId, colPos, newVal, oldVal, row, cell){
            var isChanged = !this.equalVars(newVal, oldVal);
            if (isChanged){
                var triggerEvent = new jQuery.Event(jqSimpleGrid.onCellChanged),
                    params = [rowId, colPos, newVal, oldVal, row];
                $(this).trigger(triggerEvent, params);
                if (triggerEvent.isPropagationStopped() && cell !== undefined){
                    //if returned false, drop set new value, set old value
                    cell._setValue(oldVal, rowId, colPos);
                    this._setItemValue(row, colPos, oldVal);
                } else {
                    //for system only use!!!
                    $(this._getRowsMap(rowId)).trigger(triggerEvent, params);
                }
            }
        },
        getCell: function(id, pos){
            var map = this._getRowsMap(id);
            if (map){
                var td = map['tr'].children().eq(pos),
                    cellSpan = td.children(".simple-grid-cell"),
                    type = this.getCellType(id, pos),
                    cell = this._getCellObject(type, cellSpan, false);
                    this._setCellValue(cell, map.row[pos], id, pos);
            }
            return cell;
        },
        _getCellObject: function(type, span, useCache){
            var cell, cells = this._cells;
            if (useCache !== false && cells[type] != undefined) {
                // == undefined || true, default value
                cell = cells[type];
                cell.cell(span);
            } else {
                if (!jqSimpleGrid.types[type]){
                    this._error("simple-grid does not support '" + type + "' type");
                } else {
                    cell = new jqSimpleGrid.types[type](span);
                    cells[type] = cell;
                }
            }
            cell.grid(this);
            return cell;
        },
        _getItemValue: function(item){
            var ret = (this._isItemSimple(item)) ? item : item['value'];
            return ret;
        },
        _setItemValue: function(row, col, val){
            var item = row[col];
            (this._isItemSimple(item)) ? row[col] = val : item['value'] = val;
        },
        getCellValue: function(rowId, colPos){
            var map = this._getRowsMap(rowId), ret;
            if (map){
                ret = this._getItemValue(map.row[colPos]);
            }
            return ret;
        },
        setCellValue: function(rowId, colPos, value, callEvent){
            var map = this._getRowsMap(rowId);
            if (map){
                var td = map.tr.children().eq(colPos),
                    cellSpan = td.children(".simple-grid-cell"),
                    oldVal = this._cloneObj(this._getItemValue(map.row[colPos])),
                    type = this.getCellType(rowId, colPos),
                    cell = this._getCellObject(type, cellSpan, false);
                this._setItemValue(map.row, colPos, value);
                this._setCellValue(cell, map.row[colPos], rowId, colPos);
                if (callEvent !== false){
                    this._onCellChanged(rowId, colPos, value, oldVal, map.row, cell);
                }
            }
        },
        getCellText: function(rowId, colPos){
            var map = this._getRowsMap(rowId),
                text;
            if (map){
                var td = map.tr.children().eq(colPos);
                text = td.text();
            }
            return text;
        },
        setCellStyle: function(rowId, colPos, value){
            var map = this._getRowsMap(rowId),
                text;
            if (map && map.row[colPos]){
                var td = map.tr.children().eq(colPos);
                map.row[colPos].style = value;
                value = td.attr("style") + value;
                td.attr("style", value);
            }
        },
        setCellType: function(rowId, cellPos, type){
            var map = this._getRowsMap(rowId);
            if (map && jqSimpleGrid.types[type]){
                var item = map['row'][cellPos];
                (this._isItemSimple(item)) ? map['row'][cellPos] = {value: item, type: type} : item['type'] = type;
                var td = map.tr.children().eq(cellPos),
                    cellSpan = td.children(".simple-grid-cell"),
                    cell = this._getCellObject(type, cellSpan, false);

                this._setCellValue(cell, item, rowId, cellPos);
            }
        },
        getCellType: function(rowId, cellPos){
            var map = this._getRowsMap(rowId),
                ret;
            if (map && map.row[cellPos] && map.row[cellPos]['type']){
                ret = map.row[cellPos]['type'];
            } else if (map && map.row['type']){
                ret = map.row['type'];
            } else if (this._model[cellPos]) {
                ret = this._model[cellPos]['type'];
            }
            return ret;
        },
        openCloseGroup: function(rowId, colPos, isClosed){
            var map = this._getRowsMap(rowId);
            if (map){
                var el = map.tr.children().eq(colPos).find(".simple-grid-cell-group");
                if (el.length > 0){
                    this._openCloseGroup(el, rowId, colPos, isClosed);
                }
            }
        },
        _openCloseGroup: function(el, rowId, colPos, isClosed){
            var map = this._getRowsMap(rowId),
                closedCss = "simple-grid-cell-group-closed",
                closedRowCss = "simple-grid-row-group-closed",
                rowPos = this.getRowPos(rowId) - 0 + 1,
                groupByData = this._colEnv['groupByData'],
                trs,
                node,
                row,
                data = this._data;
            if (isClosed === undefined){
                isClosed = el.hasClass(closedCss);
            }


            if (map && groupByData[rowId] && groupByData[rowId][colPos] != undefined){
                (isClosed) ? el.removeClass(closedCss) : el.addClass(closedCss);
                (isClosed) ? map.tr.removeClass(closedRowCss) : map.tr.addClass(closedRowCss);
                trs = groupByData[rowId][colPos] - 0;
                for (var i = rowPos, l = Math.min(rowPos + trs, data.length); i < l; i++){
                    row = data[i];
                    node = this._getRowsMap(row.id);
                    if (node){
                        (!isClosed) ? node.tr.hide() : (row.visible !== false) ? node.tr.show() : null;
                    }
                }
                var trig = (!isClosed) ? jqSimpleGrid.onRowClosed : jqSimpleGrid.onRowOpen;
                $(this).trigger(trig, [rowId, colPos]);
            }
        },
        getSubItems: function(rowId, colPos){
            var map = this._getRowsMap(rowId),
                res = [],
                gData = this._colEnv['groupByData'], data = this._data;
            if (gData && gData[rowId] && gData[rowId][colPos]){
                var rowPos = this.getRowPos(rowId) - 0 + 1,
                    len = gData[rowId][colPos], row;
                for (var i = rowPos, l = Math.min(rowPos + len, data.length); i < l; i++){
                    res.push(data[i]);
                }
            }
            return res;
        },
        getParentRow: function(rowId){
            var map = this._getRowsMap(rowId),
                gData = this._colEnv['groupByData'], data = this._data,
                ret;
            if (map){
                var pos = this.getRowPos(rowId);
                for (var i = pos; i >= 0; i--){
                    //go up to closest parent
                    if (gData[data[i].id]){
                        ret = data[i];
                        break;
                    }
                }
            }
            return ret;
        },
        groupBy: function(colPos){
            if (colPos != undefined){
                var data = this._groupBy(colPos);
                this._setData(data);
            }
            return this._colEnv['groupBy'];
        },
        _groupBy: function(colPos, data){
            //need to sort array by colPos and their values
            data = (data == undefined) ? this.getDataLink() : data;
            colPos = (colPos == undefined) ? this._colEnv['groupBy'] : colPos;
            var newData;
            if (colPos != undefined){
                //set grouping
                colPos = ($.isArray(colPos)) ? colPos : [colPos];
                this._colEnv['groupBy'] = colPos;
                this._colEnv['groupByData'] = {};
                newData = this._getNewDataByGroup(data, colPos);
            } else if (colPos == ""){
                //drop grouping
                this._colEnv['groupBy'] = [];
                this._colEnv['groupByData'] = {};
                newData = data;
            }
            this._colEnv['groupBy'] = colPos;
            return newData;
        },
        _getNewDataByGroup: function(data, colPos){
            var item, groupVal, newGroup, pos, nColPos,
                groupData = this._colEnv['groupByData'],
                row,
                newData = [];

            if (colPos.length != 0){
                pos = colPos[0];
                while (data.length > 0){
                    item = data[0];
                    groupVal = this._getItemValue(item[pos]);
                    newGroup = this._collectItemsByValForGroup(data, 0, pos, groupVal);
                    nColPos = colPos.slice(1);
                    newGroup = this._getNewDataByGroup(newGroup, nColPos);
                    //need get second group pos
                    row = newGroup[0];
                    (row.id == undefined) ? row.id = this._generateUniqueId(): null;
                    (!groupData[row.id]) ? groupData[row.id] = {} : null;
                    groupData[row.id][pos] = newGroup.length - 1;
                    newData.push.apply(newData, newGroup);
                }
            } else {
                newData = data;
            }
            return newData;
        },
        _collectItemsByValForGroup: function(arr, rowI, colI, gVal){
            var ret = [];
            while (arr.length > rowI){
                if (this._getItemValue(arr[rowI][colI]) == gVal){
                    ret.push.apply(ret, arr.splice(rowI, 1));
                    rowI--;
                }
                rowI++;
            }
            return ret;
        },
        sortBy: function(colPos){
            if (colPos != undefined){
                var data = this._sortBy(colPos);
                this._setData(data);
            }
            return this._colEnv['sortBy'];
        },
        _sortBy: function(colPos, data){
            //need to sort array by colPos and their values
            colPos = (colPos == undefined) ? this._colEnv['sortBy'] : colPos;
            data = (data == undefined) ? this.getDataLink() : data;
            if (colPos != undefined){
                colPos = ($.isArray(colPos)) ? colPos : [colPos];
                this._colEnv['sortBy'] = colPos;

                //sortArray
                var self = this,
                    pos,
                    val1, val2,
                    isEqual;
                    function sortFunc(rowA, rowB){
                        val1 = self._getItemValue(rowA[pos]);
                        val2 = self._getItemValue(rowB[pos]);
                        isEqual = self.equalVars(val1, val2);
                        return (isEqual == true) ? 0 : (val1 > val2) ? 1 : -1;
                    }
                for (var i = colPos.length - 1, l = 0; i >= l; i--){
                    pos = colPos[i];
                    data.sort(sortFunc);
                }
                this._colEnv['sortBy'] = colPos;
            } else if (colPos == ""){
                //drop sort
                this._colEnv['sortBy'] = [];
            }

            return data;
        },
        equalVars: function(var1, var2){
            var ret = false;
            if (var1 === undefined && var2 === undefined){
                ret = true
            } else if ((var1 === undefined && var2 !== undefined) || (var1 !== undefined && var2 === undefined)){
                ret = false;
            } else {
                ret = (JSON.stringify(var1) == JSON.stringify(var2));
            }
            return ret;
        },
        getRow: function(id){
            var map = this._getRowsMap(id);
            return (map) ? map['row'] : undefined;
        },
        getRowPos: function(id){
            var row = this.getRow(id),
                data = this._data,
                ret;
            if (row){
                for (var i = 0, l = data.length; i < l; i ++){
                    if (data[i].id == id){
                        ret = i;
                        break;
                    }
                }
            }
            return ret;
        },
        getRowByIndex: function(index){
            var data = this._data,
                ret;
            if (data[index]){
                ret = data[index];
            }
            return ret;
        },
        getRowByUserDataKey: function(key, value){
            var data = this._data, ret;
            for (var i = 0, l = data.length; i < l; i++){
                if (data[i].userData[key] == value){
                    ret = data[i];
                    break;
                }
            }
            return ret;
        },
        _getSelectedRows: function(type){
            var multi = this._objectEnv["selectedMulti"],
                ret = [];
            if (multi){
                for (var rowId in multi['rows']){
                    var row = this.getRow(rowId);
                    if (row){
                        ret.push(((type == "with") ? row : row.id));
                    } else {
                        ret = [];
                        break;
                    }
                }
            }
            return ret;
        },
        getSelectedRows: function(){
            return this._getSelectedRows("with");
        },
        getSelectedRowsId: function(){
            return this._getSelectedRows();
        },
        getSelectedRow: function(){
            return this.getRow(this._objectEnv["selectedRowId"]);
        },
        getSelectedRowId: function(){
            var selRow = this.getSelectedRow();
            return (selRow == undefined) ? undefined : selRow.id;
        },
        getSelectedColPos: function(){
            return this._objectEnv["selectedTdPos"];
        },
        showHeader: function(val){
            var base = this.base();
            if (val == false) {
                this._headDiv.hide();
                base.children("div").css("top", "0px");
            } else {
                this._headDiv.show();
                base.children("div").css("top", "");
            }
        },
        showRow: function(id, val){
            this.editStop();
            var map = this._getRowsMap(id);
            if (map){
                map['row'].visible = val;
                (val === true) ? map['tr'].show() : map['tr'].hide();
            }
        },
        addColumn: function(colPos, modelItem, defValue){
            modelItem = this._cloneObj(modelItem);
            var model = this.model(),
                tmp, row, pos,
                data = this.getDataLink();
            colPos = (colPos == undefined) ? model.length : colPos;
            pos = colPos;
            model.splice(colPos, 0, modelItem);
            this.model(model);
            for (var i = 0, l = data.length; i < l; i++){
                row = data[i];
                row[pos] = row[pos]; // fix for undefined col rows
                row.splice(pos, 0, defValue);
            }
            this.setData(data, {groupBy: this.groupBy()});
            return modelItem;
        },
        showColumn: function(id, val){
            this._showColumn(id, false, val, true);
        },
        showColumnByPos: function(id, val){
            this._showColumn(id, true, val, true);
        },
        _colIdInArray: function(id, ids, i, byPos){
            return (byPos == false && $.inArray(id, ids) != -1) || (byPos == true && $.inArray(i, ids) != -1 );
        },
        _showColumn: function(ids, byPos, val, updatedCells){
            if (val != undefined){
                this.editStop();
                //byPos == true, id - is position, else id is UID
                ids = ($.isArray(ids)) ? ids : [ids];
                var model = this._model,
                    group = "<colgroup>",
                    hideCols = "",
                    showCols = "",
                    env = this._colEnv,
                    showColumn = env['showColumn'] = {},
                    sCol,
                    hCol,
                    item;
                for (var i = 0, l = model.length; i < l; i++){
                    item = model[i];
                    if (this._colIdInArray(item.id, ids, i, byPos)){
                        item.visible = val;
                    }
                    if (item.visible !== false){
                        showColumn[item.id] = true;
                        group += this._collectColGroup(item, i);
                        sCol = "td.simple-grid-col-" + i + ",td.simple-grid-col-header-" + i;
                        showCols += ((showCols == "") ? sCol : " ," + sCol);
                    } else {
                        hCol = "td.simple-grid-col-" + i + ",td.simple-grid-col-header-" + i;
                        hideCols += ((hideCols == "") ? hCol : " ," + hCol);
                    }
                }

                group += "</colgroup>";
                this._colGroup = group;
                this._updateColGroup();
                if (updatedCells){
                    this._div.find(hideCols).hide();//hide unvisible cols
                    this._div.find(showCols).show();//show visible
                }
            }
        },
        _updateColHeight: function(vals){
            var buff = $("<span></span>"),
                fsize = 0,
                forseSize = 0,
                height = 0;
            for (var i = 0, l = vals.length; i < l; i++){
                buff.css("font", vals[i]);
                fsize = parseFloat(buff.css("font-size"));
                fsize = (isNaN(fsize)) ? 0 : fsize;
                forseSize = parseFloat(vals[i]);
                forseSize = (isNaN(forseSize)) ? 0 : forseSize;
                height = Math.max(fsize, height, forseSize);
            }

            height = height + 5 * 1.2;

            height = (height > 24) ? height : "";

            this._headDiv.height(height);
            this._thead.height(height);
            this._bodyDiv.css("top", height);
        },
        _columnStyle: function(ids, envName, name, inBody){
            if (ids != undefined){
                //inBody - for detect, where styles will be sets. in the head or in the body
                inBody = (inBody == undefined) ? true : inBody;
                this._opt[envName] = ids;
                var env = this._colEnv;
                var colType = env[envName] = {};
                ids = (($.isArray(ids)) ? ids : [ids]);
                var model = this._model,
                    cols = (inBody) ? "td.simple-grid-col-" : "td.simple-grid-col-header-",
                    val,
                    div = this._div,
                    item;
                for (var i = 0, l = model.length; i < l; i++){
                    item = model[i];
                    val = ids[i];
                    colType[item.id] = val;
                    div.find(cols + i).css(name, val);
                }
            }
            return this._opt[envName];
        },
        headColumnFont: function(values){
            var ret = this._columnStyle(values, "headColumnFont", "font", false);
            this._updateColHeight(values);
            return ret;
        },
        headColumnColor: function(values){
            return this._columnStyle(values, "headColumnColor", "color", false);
        },
        columnFont: function(values){
            return this._columnStyle(values, "columnFont", "font");
        },
        columnColor: function(colIds){
            return this._columnStyle(colIds, "columnColor", "color");
        },
        columnBgColor: function(colIds, pos){
            if (pos != undefined && !$.isArray(colIds)){
                var val = colIds;
                colIds = this.columnBgColor() || [];
                colIds[pos] = val;
            }
            return this._columnStyle(colIds, "columnBgColor", "background-color");
        },
        _columnAligns: function(values, envName, cssName, inBody){
            if (values != undefined){
                inBody = (inBody == undefined) ? true : inBody;
                var model = this._model,
                    env = this._colEnv,
                    colType = env[envName] = {},
                    val, item,
                    cols = (inBody) ? "td.simple-grid-col-" : "td.simple-grid-col-header-";
                for (var i = 0, l = model.length; i < l; i ++){
                    item = model[i];
                    val = values[i] || item.align;
                    colType[item.id] = val;
                    this._div.find(cols + i).css(cssName, val);
                }
                this._showColumn([], true, true);//update columns
            }
        },
        headerColumnAlign: function(ids){
            this._columnAligns(ids, "headerColumnAlign", 'text-align', false);
        },
        columnAlign: function(ids){
            this._columnAligns(ids, "columnAlign", 'text-align');
        },
        columnVAlign: function(ids){
            this._columnAligns(ids, "columnVAlign", 'vertical-align');
        },
        columnTitle: function(ids){
            var model = this._model,
                title,
                tds = this._thead.find("td");
            for (var i = 0, l = model.length; i < l; i++){
                if (ids[i]){
                    title = model[i].title = ids[i];
                    $(tds[i]).text(title);
                }
            }
        },
        getColPosById: function(id){
            var model = this._model, item, ret;
            for (var i = 0, l = model.length; i < l; i++){
                item = model[i];
                if (item.id == id){
                    ret = i;
                    break;
                }
            }
            return ret;
        },
        filterBy: function(col, val, reverse){
            this.editStop();
            var data = this._data,
                item, tr,
                map = this._rowsMap;
            reverse = (reverse == undefined) ? false : reverse;
            for (var i = 0, l = data.length; i < l; i++){
                item = data[i];
                item.filtered = (val == undefined) ? reverse : !reverse;
                tr = map[item.id].tr;
                if (val != undefined){
                    var itemVal = this._getItemValue(item[col]),
                    isEqual = this.equalVars(itemVal, val);
                    if (isEqual){
                        item.filtered = reverse;
                    }
                }
                (item.visible === false || item.filtered === true) ? tr.hide() : tr.show();
            }
        },
        moveRow: function(rowId, way){
            this.editStop();
            //way == 1 -> down row
            //way == -1 -> up row
            var map = this._getRowsMap(rowId);
            if (map){
                var el = (way == 1) ? map.tr.prev() : map.tr.next();
                if (el.length > 0){
                    (way == 1) ? el.before(map.tr) : el.after(map.tr);
                    var rowPos = this.getRowPos(rowId), newPos = rowPos - way,
                        data = this._data;
                    data.splice(rowPos, 1);
                    data.splice(newPos, 0, map.row);
                }
            }
        },
        moveRowUp: function(rowId){
            this.moveRow(rowId, 1);
        },
        moveRowDown: function(rowId){
            this.moveRow(rowId, -1);
        },
        _defaultProp: function(name){
            return function(val){
                if (val != undefined){
                    this._opt[name] = val;
                }
                return (this._opt[name] === true);
            }
        },
        matrixToRows: function(data, model) {
            var newData = [], obj = {rows: newData}, row, subRow, ret;
            for (var i = 0, l = data.length; i < l; i++){
                row = data[i];
                subRow = {id: row.id, data: row, ind: i};
                newData.push(subRow);
            }
            ret = this._cloneObj(obj);
            return ret;
        },
        rowsToMatrix: function(obj, opt) {
            var data = obj.rows, subRow, row, newData = [];
            for (var i = 0, l = data.length; i < l; i++){
                subRow = data[i];
                row = subRow.data;
                row.id = subRow.id;
                newData.push(row);
            }
            if (opt != undefined){
                var nData = this._data;
                if (opt['groupBy']){
                    nData.push.apply(nData, newData);
                }
                this.setData(nData, opt);
            } else {
                this.addRows(newData, undefined, true);
            }

            return newData;
        },
        setUserData: function(id, key, value){
            var map = this._getRowsMap(id);
            (map) ? map["row"]["userData"][key] = value : null;
        },
        getUserData: function(id, key){
            var map = this._getRowsMap(id);
            return (map) ? map["row"]["userData"][key] : undefined;
        },
        getRowClass: function(id){
            var map = this._getRowsMap(id);
            if (map){
                return map.row.cssClass;
            }
        },
        setRowClass: function(id, val){
            var map = this._getRowsMap(id), ret;
            if (map){
                map.row.cssClass && map.tr.removeClass(map.row.cssClass);
                map.row.cssClass = val;
                map.tr.addClass(val);
            }
        },
        //colors
        rowBgColor: function(id, val){
            var map = this._getRowsMap(id), ret;
            if (map){
                if (val != undefined) {
                    map.tr.css("background-color", val);
                    map.row.bgColor = val;
                }
                ret = map.row.bgColor;
            }
            return ret;
        },
        rowFont: function(id, val){
            var map = this._getRowsMap(id), ret;
            if (map){
                if (val != undefined) {
                    map.tr.css("font", val);
                    map.row.font = val;
                }
                ret = map.row.font;
            }
            return ret;
        },
        _headProps: function(name, cssName, val){
            if (val != undefined){
                this._headDiv.css(cssName, this._opt[name] = val);
            }
            return this._opt[name];
        },
        headerFont: function(val){
            return this._headProps("headerFont", "font", val);
        },
        headerColor: function(val){
            return this._headProps("headerColor", "color", val);
        },
        headerBgColor: function(val){
            return this._headProps("headerBgColor", "background-color", val);
        },
        _tBodyProps: function(name, cssName, val){
            if (val != undefined){
                this._bodyDiv.css(cssName, this._opt[name] = val);
            }
            return this._opt[name];
        },
        font: function(){
            return this._tBodyProps("font", "font");
        },
        bgColor: function(){
            return this._tBodyProps("bgColor", "background-color");
        },
        _updateAltBgColor: function(){
            var hbody = this._tbody.children("tbody"),
                altBgColor = this.altBgColor(),
                color;

            //clear bg color
            hbody.children(":odd")
                .removeClass("simple-grid-even")
                .addClass("simple-grid-odd").children().css("background-color", "");

            //set bg color of column
            this.columnBgColor(this.columnBgColor());

            //set bg color of altRow
            hbody.children(":even")
                .removeClass("simple-grid-odd")
                .addClass("simple-grid-even").children().css("background-color", altBgColor);
        },
        altBgColor: function(val){
            if (val != undefined){
                val = (val == "") ? undefined : val; //for drop alt Bg Value
                this._opt['altBgColor'] = val;
                this._updateAltBgColor();
            }
            return this._opt['altBgColor'];
        },
        color: function(){
            return this._tBodyProps("сolor", "color");
        },
        enable: function(val){
            if (val != undefined){
                this.editStop();
                this._opt['enable'] = val;
                if (val !== false) {
                    this._div.removeClass('simple-grid-disable').addClass("simple-grid-enable");
                } else {
                    this._div.addClass('simple-grid-disable').removeClass("simple-grid-enable");
                }
            }
            for (var i in this._plugins){
                var plug = this._plugins[i];
                if (typeof plug['enable'] == "function"){
                    plug.enable(val);
                }
            }
            return (this._opt['enable'] !== false);
        },
        widthType: function(val){
            if (val != undefined){
                this._opt['widthType'] = val;
            }
            return this._opt['widthType'];
        },
        destroy: function(){
            this.editStop();
            this.destroyPlugins();
            if (this._div){
                this._div.empty().remove();
            }
            var evId = this.evId();
            $(document).unbind("mousemove" + evId + " mouseup" + evId);
            this._tbody = undefined;
            this._thead = undefined;
            this._opt = undefined;
            this._rowsMap = undefined;
            this._data = undefined;
            this._cells = undefined;
            this._colEnv = undefined;
            this._objectEnv = undefined;
            this._div = undefined;
            this._plugins = undefined;
            this._model = undefined;
            $(this).unbind();
        }
    };
    rGrid._init(div, data, opt);
    return rGrid;
}
jqSimpleGrid.onCellSelect = "E#jqSimpleGrid#onCellSelect";
jqSimpleGrid.onCellChanged = "E#jqSimpleGrid#onCellChanged";
jqSimpleGrid.onEditCell = "E#jqSimpleGrid#onEditCell";
jqSimpleGrid.onEditStop = "E#jqSimpleGrid#onEditStop";
jqSimpleGrid.onRowSelect = "E#jqSimpleGrid#onRowSelect";
jqSimpleGrid.onRowCreated = "E#jqSimpleGrid#onRowCreated";
jqSimpleGrid.onRowClosed = "E#jqSimpleGrid#onRowClosed";
jqSimpleGrid.onRowOpen = "E#jqSimpleGrid#onRowOpen";
jqSimpleGrid.onGridChanged = "E#jqSimpleGrid#onGridChanged";
jqSimpleGrid.onClick = "E#jqSimpleGrid#onClick";
jqSimpleGrid.onDblClick = "E#jqSimpleGrid#onDblClick";
jqSimpleGrid.onScroll = "E#jqSimpleGrid#onScroll";
jqSimpleGrid.onTab = "E#jqSimpleGrid#onTab";
jqSimpleGrid.onKeyPress = "E#jqSimpleGrid#onKeyPress";
jqSimpleGrid.plugins = {};

window['jqSimpleGrid'] = jqSimpleGrid;

})(window, window['console']);