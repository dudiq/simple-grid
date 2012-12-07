(function(obj) {
    //base type
    obj.baseType = function(cell){
        var pCell, pGrid;
        this.rowId = null;
        this.colPos = null;
        this.grid = function(grid){
            return (grid) ? pGrid = grid : pGrid;
        };
        this.cell = function(cell){
            return (cell) ? pCell = cell : pCell;
        };
        this.cell(cell);
        this.sValue = undefined;
        this.canEdit = true;
        this.__spaceReplace = new RegExp(" ",'g');
        this.params = function(){
            return this['__params'];
        };
        this.setCValue = function(val){
            this.cell().text((val && val.replace) ? val.replace(this.__spaceReplace, "\u00A0") : val);
        };
        this.setHTMLValue = function(val){
            this.cell().html(val);
        };
        this._setValue = function(val, rowId, colPos){
            this.rowId = rowId;
            this.colPos = colPos;
            this.setValue(val);
        };
        this.setValue = function(val){
            this.sValue = val;
            this.setCValue((val == undefined) ? "" : val);
        };
        this.getValue = function(){
            return this.sValue;
        };
        this.edit = function(){
            //it's a cap
        };
        this.getNewValue = function(){
            //detach was

            //called after edit
            //return changed or not value
            return this.getValue();
        };
        this.editStop = function(newValue, oldValue){
            //it's a cap
            //sets to grid
        }
    };
    obj.ro = function(cell){
        this.cell(cell);
        this.canEdit = false;
    };
    obj.ro.prototype = new obj.baseType;
    //edit type
    obj.text = obj.ed = obj.edit = function(cell){
        this.cell(cell);
        this.getEditElement = function(){
            var self = this,
                input = $("<input class='simple-grid-input'>").bind("change blur", function(){
                self.editStop();
            }).keypress(function(ev){
                if (ev.keyCode == 13){
                    self.editStop();
                }
            });
            return input;
        };
        this.edit = function(){
            var self = this;
            this._input = this.getEditElement();
            this._input.val(this.getValue());
            this.cell().empty().append(this._input);
            this._input.focus().select();
        };
        this.getNewValue = function(){
            var ret = this.getValue();
            if (this._input){
                ret = this._input.val();
                this._input.remove();
                this._input = null;
            }
            return ret;
        };
    };
    obj.edit.prototype = new obj.baseType;


    obj.txt = obj['textarea'] = function(cell){
        this.cell(cell);
        this.getEditElement = function(){
            var self = this,
                input = $("<textarea class='simple-grid-input'/>").bind("change blur", function(){
                self.editStop();
            }).keypress(function(ev){
                //stop editing when enter and ctrl key is pressed
                if (ev.keyCode == 13 && (ev.ctrlKey || ev.metaKey)){
                    self.editStop();
                }
            });
            return input;
        }
    };
    obj['textarea'].prototype = new obj.edit;

    obj.html = function(cell){
        this.cell(cell);
        this.setCValue = function(val){
            this.cell().html(val);
        };
    };

    //html types
    obj.html.prototype = new obj.baseType;
    obj.htmlRo = function(cell){
        this.cell(cell);
        this.canEdit = false;
    };
    obj.htmlRo.prototype = new obj.html;

    //link type
    obj.link = function(cell){
        this.cell(cell);
        this.canEdit = false;
        this.setValue=function(val){
            //show for user
            var viewVal = "";
            if (val != undefined) {
                var href = (val['href']) ? val['href'] : (val) + "",
                    text = (val['text']) ? val['text'] : (val) + "",
                    target = (val['target']) ? val['target'] : "_blank";
                if (text != "" && href != ""){
                    viewVal = $("<a>").attr({"href": href, target: target}).text(text);
                }
            }
            this.cell().empty().append(viewVal);
            this.sValue = val;
            //save for return
        }
    };
    obj.link.prototype = new obj.baseType;

    obj.ch = function(cell){
        this.cell(cell);
        this._input = null;
        this.canEdit = false;
        this.setValue=function(val){
            //show for user
            //fix for old data
            var self = this,
                input,
                title = "";
            if (val !== undefined && val['value'] !== undefined){
                title = val['title'] || title;
                val = val.value;
            }
            val = (val === 1) ? true : val;
            val = (val === 0) ? false : val;
            this.sValue = val;

            input = $("<input class='simple-grid-checkbox' type='checkbox'>");
            input.change(function(){
                    var el = $(this);
                    self.cell(el.closest(".simple-grid-cell"));
                    var newVal = el.is(":checked");
                    el.remove();
                    self.grid().customEditStop(self, newVal);
                }).attr("checked", val);
            var label = $("<label class='simple-grid-ch-label'>"+title+"</label>");
            label.prepend(input);
            this.cell().empty().append(label);
            //save for return
        };
    };
    obj.ch.prototype = new obj.baseType;
    obj.checkbox = obj.ch;

    obj['boolean'] = function(cell){
        this.cell(cell);
        this._select = null;
        this.setValue = function(val){
            (val == "true" || val === true) && (val = true);
            (val == "false" || val === false) && (val = false);
            //val = (typeof val) ? val : (val == "true") ? true : false;
            this.cell().text((val) ? "True" : "False");
            this.sValue = val;
        };
        this.edit = function(){
            var val = this.getValue(),
                self = this,
                selOpt = (val) ? "true" : "false",
                sel = this._select = $("<select class='simple-grid-combo'><option value='true' >True</option><option value='false'>False</option></select>");
            sel.find("option[value='" + selOpt +"']").attr("selected", true);
            sel.bind("change", function(){
                $(this).data("changed", true);
                self.editStop();
            }).bind("focusout", function(){
                self._removeSel();
                self.editStop();
            });

            this.cell().empty().append(sel);
            sel.focus().select();
        };
        this._removeSel = function(){
            this._select.remove();
            this._select = undefined;
        };
        this.getNewValue = function(){
            var ret = this.getValue();
            if (this._select){
                (this._select.data("changed")) ? (ret = (this._select.val() == "true") ? true : false) : null;
                this._removeSel();
            }
            return ret;
        }
    };
    obj['boolean'].prototype = new obj.baseType;

    obj.nextItemGroup = function(cell){
        this.cell(cell);
        this.canEdit = false;
        this.setValue = function(val){
            var el = $("<span class='simple-grid-next-item-group'/>");
            el.click(function(){
                var td = $(this).closest(".simple-grid-item");
                td.prev().find(".simple-grid-cell-group").click();
            });
            this.cell().empty().html(val);
            this.cell().prepend(el);
        }
    };
    obj.nextItemGroup.prototype = new obj.baseType;

    obj.mathRow = function(cell){
        this.cell(cell);
        this.canEdit = false;
        this.setValue = function(val){
            var grid = this.grid(),
                self = this;

            if (!$.isArray(val)) {
                //if val is not defined, get val from model, 'mathRow' must have 'value' property
                var colMod = grid.model()[this.colPos];
                val = (colMod && colMod['value']) ? colMod['value'] : val;
            }

            if (this.rowId && $.isArray(val)){
                var func = (function(rowId, val, sGrid, sCell, sColPos){
                    return function(rowCheck, forceCell){
                        //callback for setting right value when changed some item in row
                        if (rowCheck == rowId){
                            var row = sGrid.getRow(rowId),
                                getVal = sGrid._getItemValue,
                                viewVal = "",
                                iVal, item;
                            viewVal = 0;
                            for (var i = 0, l = val.length; i < l; i++){
                                item = row[val[i]];
                                iVal = getVal.call(sGrid, item);
                                if (!isNaN(parseFloat(iVal))){
                                    viewVal += parseFloat(iVal);
                                }
                            }
                            viewVal = parseInt(viewVal);
                            var setCell = (forceCell) ? sGrid.getCell(rowId, sColPos) : sCell;
                            setCell.setCValue(viewVal);
                        }
                    }
                })(this.rowId, val, grid, this, this.colPos);
                var map = grid._getRowsMap(this.rowId);
                if (map){
                    $(map).bind(jqSimpleGrid.onCellChanged, function(ev, rowId){
                        //this bind for system only use
                        func(rowId, true);
                    });
                }
                func(this.rowId, false);
            } else {
                this.setCValue("");
            }
            this.sValue = val;
        }
    };
    obj.mathRow.prototype = new obj.baseType;

    obj['int'] = function(cell) {
        this.cell(cell);

        this._params = {min:-1000000};
        this._prefix = undefined;
        this._suff = undefined;
        this._canEmpty = false;
        this._useHtmlValue = false;

        this.getViewVal = function(value){
            return value;
        };

        this._parseValue = function(val){
            var value = 0;
            if (typeof val === ("integer") || typeof val === ("number")) {
                value = val;
            } else {
                value = parseFloat(val);
                if (isNaN(value)) {
                    val = "";
                    value = "";
                }
            }
            return value;
        };

        this.setValue = function(val) {
            var value = this._parseValue(val),
                viewVal = value;

            (this._prefix != undefined) && (viewVal += this._prefix);
            (this._suff != undefined) && (viewVal = this._suff + viewVal);

            (this._useHtmlValue) ? this.setHTMLValue(viewVal) : this.setCValue(viewVal);
            this.sValue = value;
        };

        this.edit = function() {
            var val = this.getValue(),
                    self = this;
            this.oldVal = val;
            var input = this.input = $("<input type='text' class='simple-grid-input'>");
            input.val(val);
            input.numericParse(this.params());
            $(input).bind("change focusout", function() {
                self.editStop();
            }).keypress(function(ev){
                if (ev.keyCode == 13){
                    self.editStop();
                }
            });
            this.cell().empty().append(input);
            input.focus().select();
        };

        this.beforeDetach = function(ret) {
            //it's a cap;
        };

        this.getNewValue = function() {
            var ret = this.getValue();
            if (this.input) {
                var value = this.input.val(),
                    newVal = (isNaN(parseFloat(value))) ? ret : value,
                    params = this.params();
                this.input.remove();
                this.input = null;
                newVal = (value == "") ? 0 : newVal;
                newVal = newVal - 0;// convert from string to number
                newVal = (this._canEmpty === true && value == "") ? value : newVal;
                newVal = (params && params.min && params.min > newVal) ? params.min : newVal;
                newVal = (params && params.max && params.max < newVal) ? params.max : newVal;
                ret = newVal;
                this.beforeDetach(ret);
            }
            return ret;
        }
    };
    obj['int'].prototype = new obj.baseType;

    obj['price'] = function (cell) {
        this.cell(cell);
        this._params = {isFloat:true};
        this._suff = "$ ";
    };
    obj['price'].prototype = new obj['int'];

    obj['dyn'] = obj['dynamic'] = function (cell) {
        this.cell(cell);
        this._useHtmlValue = true;
        this.setValue = function(value) {
            var val = this._parseValue(value),
                viewVal = val, viewClass = "",
                span;

            (val > 0) && (viewVal = "&#9650; " + val) && (viewClass = "simple-grid-dynamic-green");
            (val < 0) && (viewVal = "&#9660; " + val) && (viewClass = "simple-grid-dynamic-red");

            span = '<span class="' + viewClass + '">' + viewVal + '</span>';

            this.cell().empty().append(span);
            this.sValue = val;
        };
    };
    obj['dynamic'].prototype = new obj['int'];

    obj['float'] = function (cell) {
        this.cell(cell);
        this._params = {isFloat:true};
    };
    obj['float'].prototype = new obj['int'];

    obj['number'] = function(cell) {
        this.cell(cell);
        this._canEmpty = true;
        this._params = {min : 0};
    };
    obj['number'].prototype = new obj['int'];

    obj.dialogType = function(cell){
        this.cell(cell);
        this._tmpValue = null;
        this._tmpDialog = null;

        //first moment
        //this._tmpValue must be sets in edit method
        //
        //second
        //this._tmpDialog must be sets in edit method

        this.closeDialog = function(ret){
            this._tmpValue = (ret == undefined) ? this.getValue() : ret;
            if (this._tmpDialog){
                this._tmpDialog.dialog('close');
            }
        };
        this.onClose = function(){
            this._tmpDialog.dialog('destroy').remove();
            this._tmpDialog = undefined;
            this.editStop();
        };
        this.getNewValue = function(){
            return this._tmpValue;
        }
    };
    obj.dialogType.prototype = new obj.baseType;

    /**
     * password grid type
     */
    obj.password = function (cell) {
        this.cell(cell);
        this.setValue = function(val) {
            this.setCValue(val.replace(new RegExp(".", 'g'), "*"));
            this.sValue = val;
        };
        this.getEditElement = function(){
            var self = this,
                input = $("<input type='password' class='simple-grid-input'>").bind("change blur", function(){
                    self.editStop();
                }).keypress(function(ev){
                    if (ev.keyCode == 13){
                        self.editStop();
                    }
                });
            return input;
        };
    };
    obj.password.prototype = new obj.edit;

    obj.passwordro = function(cell) {
        this.cell(cell);
        this.canEdit = false;
        this.setValue = function(val) {
            var value = val.replace(new RegExp(".", 'g'), "*");
            this.setCValue(value);
            this.sValue = val;
        }
    };
    obj.passwordro.prototype = new obj.baseType;

})(jqSimpleGrid.types = {});


