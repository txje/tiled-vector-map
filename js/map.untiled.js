/*
 Copyright (c) 2012 Jeremy Wang
 Licensed under the MIT License (LICENSE.txt)
 
 Version 0.1.0
*/

// Euclidean distance
function eucldist(p1, p2) {
    return Math.sqrt(Math.pow((p1[0]-p2[0]), 2) + Math.pow((p1[1]-p2[1]), 2));
}

var BOUNDS = [-90, -180, 90, 180]; // (s, w, n, e)

// Returns a boolean - if the bounding box falls completely outside the current viewing window on the map
function outOfBounds(bbox, map) {
    // bbox = [w, s, e, n]
    return (bbox[0] > map.e || bbox[1] > map.n || bbox[2] < map.w || bbox[3] < map.s)
}

// Makes and handles a JSON request
// - this outsources the actual AJAX call but is necessary to properly close the layer callback
function loadData(src, layer, index, res, subid) {
    var handle = {
        'callback': attacher(this, function(data) {
            layer.load(data, index, res, subid);
        }),
        'error': function(msg) {
            console.log(msg);
        }
    };
    JSON(src, handle, {});
}

function CanvasMap(container, zoom) {
    this.zoom = zoom;
    this.layers = [];
    var layer_map = {};
    this.drawCoords = false;
    this.points = [];
    
    // Add a control layer to handle mouse interaction including:
    // 1. Detecting the cursor position
    // 2. Dragging to pan
    // 3. Scrolling to zoom
    // Data layers will be stuck in under this layer
    this.control_layer = new ControlLayer(this, container);
    this.control_layer.$canvas.mousedown(attacher(this, function(e) {
        this.drag_x = e.pageX;
        this.drag_y = e.pageY;
        this.drag_s = this.s;
        this.drag_w = this.w;
        this.drag_n = this.n;
        this.drag_e = this.e;
        this.dragging = true;
    }));
    this.control_layer.$canvas.mousemove(attacher(this, function(e) {
        var lon_offset = (e.pageX - this.drag_x) / this.zoom;
        var lat_offset = (e.pageY - this.drag_y) / this.zoom;
        if(this.dragging) {
            this.update(this.zoom, this.drag_s+lat_offset, this.drag_w-lon_offset, this.drag_n+lat_offset, this.drag_e-lon_offset);
        }
    }));
    this.control_layer.$canvas.mouseup(attacher(this, function(e) {
        this.dragging = false;
    }));
    this.control_layer.$canvas.mousewheel(attacher(this, function(e, delta, deltaX, deltaY) {
        var mouse_coord = [this.n-e.pageY/this.zoom, e.pageX/this.zoom+this.w]; // [s,w] of the mouse
        this.zoom *= Math.pow(1.1, delta); // zoom in
        var new_center = [mouse_coord[0] + (e.pageY - $(window).height()/2) / this.zoom, mouse_coord[1] + ($(window).width()/2 - e.pageX) / this.zoom];
        this.resize(null, new_center); // on the mouse position
    }));
    this.control_layer.$canvas.click(attacher(this, function(e) {
        // manually propogate click events down through layers
        for(l in this.layers) {
            this.layers[l].click(e);
        }
    }));
    
    // pan and changeZoom are updater functions triggered globally by buttons to
    // adjust the viewing window
    this.pan = function(x, y) {
        var degreesWide = this.width / this.zoom;
        var degreesHigh = this.height / this.zoom;
        var xchange = x * degreesWide;
        var ychange = y * degreesHigh;
        /*
        // fix horizontal overrun
        if(this.e + xchange > BOUNDS[3])
            xchange = BOUNDS[3] - this.e;
        else if(this.w + xchange < BOUNDS[1])
            xchange = BOUNDS[1] - this.w;
            
        // fix vertical overrun
        if(this.n + ychange > BOUNDS[2])
            ychange = BOUNDS[2] - this.n;
        else if(this.s + ychange < BOUNDS[0])
            ychange = BOUNDS[0] - this.s;
        */
        var s = this.s + ychange;
        var w = this.w + xchange;
        var n = this.n + ychange;
        var e = this.e + xchange;
     
        this.update(null, s, w, n, e);
    }
    
    this.changeZoom = function(mult) {
        this.zoom *= mult;
        this.resize();
    }

    this.update = function(z, s, w, n, e) {
        if(z != null)
            this.zoom = z;
        if(s != null)
            this.s = s;
        if(w != null)
            this.w = w;
        if(n != null)
            this.n = n;
        if(e != null)
            this.e = e;
        for(var l in this.layers) {
            this.redoLayer(l);
        }
        if(this.drawCoords)
            this.drawDegrees(10, this.layers.length-1); // uppermost layer
        for(var p in this.points) {
            this.point(this.points[p], this.layers.length-1); // uppermost layer
        }
    }
    
    this.redoLayer = function(l) {
        this.layers[l].render();
    }
    
    this.hide = function(id) {
        if(id in layer_map) {
            var l = layer_map[id];
            this.layers[l].hide();
            this.redoLayer(l);
            return true;
        }
        return false;
    }
    
    this.show = function(id) {
        if(id in layer_map) {
            var l = layer_map[id];
            this.layers[l].show();
            this.redoLayer(l);
            return true;
        }
        return false;
    }
    
    this.coord = function(x, y) {
        var x = (x - this.w) * this.zoom;
        var y = (y - this.s) * this.zoom;
        return [x,y];
    }
    
    this.clear = function() {
        for(l in this.layers) {
            this.layers[l].clear();
        }
    }
    
    this.addLayer = function(id, info, callback) {
        this.layers.push(new Layer(this, container));
        var i = this.layers.length - 1;
        layer_map[id] = i;
        this.layers[i].id = id;
        for(a in info) { // for each data set (only bathymetry has more than one)
            var multi = (info[a][0] == 'timeseries');
            var type = info[a][1];
            var resolutions = info[a][2];
            var style = info[a][3];
            this.layers[i].addData(multi, type, resolutions, style);
            if(multi) {
                for(var firstkey in resolutions[0][1]) break; // get the first key
                this.layers[i].change(firstkey); // set the default subid to the first in the list
            }
        }
        this.layers[i].onclick(function(lon, lat, objs){
            if(objs.length > 0) {
                for(var o in objs) {
                    if(objs[o] != null) {
                        console.log(this.id + ': ' + lon.toFixed(0) + ',' + lat.toFixed(0) + ' [' + objs + ']');
                        if(callback)
                            callback.apply(this, objs); // make a callback with the list of objects, usually indices into a list of features
                        break;
                    }
                }
            }
        });
    }
    
    this.changeLayer = function(id, subid) {
        var layer = this.layers[layer_map[id]];
        return layer.change(subid);
    }
    
    this.resize = function(event, center) {
        this.width = $(window).width();
        this.height = $(window).height();
        
        this.control_layer.$canvas.attr('width', this.width);
        this.control_layer.$canvas.attr('height', this.height);

        for(var l in this.layers) {
            this.layers[l].$canvas.attr('width', this.width);
            this.layers[l].$canvas.attr('height', this.height);
        }
        var degreesWide = this.width / this.zoom;
        var degreesHigh = this.height / this.zoom;
        if(center == null)
            center = [this.s + (this.n - this.s)/2, this.w + (this.e - this.w)/2];
        var s = center[0] - degreesHigh / 2;
        var n = center[0] + degreesHigh / 2;
        var w = center[1] - degreesWide / 2;
        var e = center[1] + degreesWide / 2;
        this.update(null, s, w, n, e);
    }
    
    // all we have to do here is make sure the center is at (0,0) and it will adjust the window based on the size and zoom
    this.s = BOUNDS[0];
    this.w = BOUNDS[1];
    this.n = BOUNDS[2];
    this.e = BOUNDS[3];
    this.resize(); // adjust for window size at startup
 
    $(window).resize(attacher(this, this.resize));
    
    // load 8k grid data
    // make this more elegant... later
    var handle = {
        'callback': attacher(this, function(data) {
            this.grid = [];
            for(var d in data) {
                // coords come in the form [s, n, w, e]
                this.grid.push([data[d][0]/10, data[d][2]/10, data[d][1]/10, data[d][3]/10]);
                // convert to [s, w, n, e]
            }
        }),
        'error': function(msg) {
            console.log(msg);
        }
    };
}


function ControlLayer(map, container) {
    this.$canvas = $('<canvas>');
    this.$canvas.addClass('layer');
    $(container).append(this.$canvas);
    this.$canvas.attr('width', this.$canvas.width());
    this.$canvas.attr('height', this.$canvas.height());
    this.ctx = this.$canvas.get(0).getContext('2d');
    
    this.map = map;
    
    // attach the mouse listener to the topmost layer
    this.$canvas.mousemove(attacher(this, function(e) {
        var x = e.pageX - $(e.currentTarget).offset().left;
        var y = e.pageY - $(e.currentTarget).offset().top;
        var lon = x/this.map.width * (this.map.e-this.map.w) + this.map.w;
        var lat = (1 - y/this.map.height) * (this.map.n-this.map.s) + this.map.s;
        if(lon < 0)
            lon = (lon * -1).toFixed(2) + ' W';
        else
            lon = lon.toFixed(2) + ' E';
        if(lat < 0)
            lat = (lat * -1).toFixed(2) + ' S';
        else
            lat = lat.toFixed(2) + ' N';
        this.ctx.clearRect(0,0,100,20);
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.ctx.fillRect(0,0,100,20);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(lon + ', ' + lat, 5, 10);
    }));
}


function Layer(map, container) {
    this.$canvas = $('<canvas>');
    this.$canvas.addClass('layer');
    this.$canvas.insertBefore(map.control_layer.$canvas);
    this.$canvas.attr('width', this.$canvas.width());
    this.$canvas.attr('height', this.$canvas.height());
    this.ctx = this.$canvas.get(0).getContext('2d');
    
    this.map = map;
    this.id = null;
    this.sets = []; // list of separately rendering data sets, in the order they should be rendered [[resolutions, meta], [resolutions, meta], ...]
    this.data = []; // [this will be a sparse array with only indices with known resolutions filled (probably 0, 8, and 40)] for each vector set
    this.loading = []; // list of boolean values indicating if each data set has an outstanding request pending
    var multi = false;
    var subid = null; // id of the subset of the timeseries to display
    
    var hidden = true;
    this.hide = function() {
        hidden = true;
        this.clear();
    }
    this.show = function() {
        hidden = false;
    }
    this.visible = function() {
        return !hidden;
    }
    
    this.addData = function(m, type, resolutions, style) {
        multi = m;
        // sort available resolutions from highest to lowest
        resolutions.sort(function(a,b){return b[0]-a[0]});
        
        this.sets.push([type, resolutions, style]);
        this.data.push([]); // not loaded yet
        this.loading.push(false);
    }
    
    this.change = function(sid) {
        if(!multi)
            return false;
        subid = sid;
        this.render();
        return true;
    }
    
    this.clear = function() {
        this.ctx.clearRect(0, 0, this.$canvas.width(), this.$canvas.height());
    }
    
    this.load = function(data, index, res, subid) {
        var datatype = this.sets[index][0];
        var style = this.sets[index][2];
        if(subid) {
            // initialize empty set
            if(this.data[index][res] == null)
                this.data[index][res] = {};
            if(datatype == 'vector')
                this.data[index][res][subid] = new VectorData(res, data, style);
        }
        else {
            if(datatype == 'vector')
                this.data[index][res] = new VectorData(res, data, style);
            else if(datatype == 'point')
                this.data[index][res] = new PointData(res, data, style);
        }
        this.loading[index] = false;
        this.render();
    }
    
    this.render = function() {
        if(hidden) {
            return;
        }
        this.clear();
        for(var i in this.sets) {
            // search from most to least detailed, drawing the highest resolution available
            var datatype = this.sets[i][0]
            for(var r in this.sets[i][1]) { // resolutions are sorted highest to lowest
                var res = this.sets[i][1][r][0];
                if(multi) {
                    var filepath = this.sets[i][1][r][1][subid];
                    if(res <= this.map.zoom) {
                        if(this.data[i][res] && this.data[i][res][subid]) { //loaded
                            this.data[i][res][subid].render(this.map, this.ctx);
                            break;
                        }
                        else if(!this.loading[i]) {
                            loadData(filepath, this, i, res, subid)
                            this.loading[i] = true;
                            // notice that we don't break here, so it will keep going while we fetch data and render the next best resolution
                        }
                    }
                }
                else {
                    var filepath = this.sets[i][1][r][1];
                    if(res <= this.map.zoom) {
                        if(this.data[i][res]) { //loaded
                            this.data[i][res].render(this.map, this.ctx);
                            break;
                        }
                        else if(!this.loading[i]) {
                            loadData(filepath, this, i, res)
                            this.loading[i] = true;
                            // notice that we don't break here, so it will keep going while we fetch data and render the next best resolution
                        }
                    }
                }
            }
        }
    }
    
    // pseudo-event registration
    this.onclick = function(callback) {
        this.click = (function() {
            return function(event) {
                var lon = this.map.w + (event.clientX / this.map.zoom);
                var lat = this.map.n - (event.clientY / this.map.zoom);

                // collect a list of objects at this position on this layer
                var objs = [];
                if(!hidden) {
                    for(var i in this.sets) {
                        for(var r in this.sets[i][1]) {
                            var res = this.sets[i][1][r][0];
                            if(res <= this.map.zoom && this.data[i][res]) {
                                if(multi && this.data[i][res][subid]) {
                                    objs.push(this.data[i][res][subid].atCoord(event.clientX, event.clientY, lon, lat));
                                }
                                else {
                                    objs.push(this.data[i][res].atCoord(event.clientX, event.clientY, lon, lat));
                                }
                            }
                        }
                    }
                }
                    
                callback.apply(this, [lon, lat, objs]);
            };
        })();
    }
}


/*
    Draws point data with labels, being careful not to overlap labels
    - derived almost entirely from layer rendering code in github.com/RandomEtc/shapefile-js, under some open source license
*/
function PointData(res, data, style) {
    // data = [[[x, y], text],
    //         [[x, y], text],
    //         ...
    //        ]
    var RADIUS = 3;
    var DIAMETER = RADIUS*2
    
    // get the index of the point at the given pixel coordinates (x,y)
    this.atCoord = function(x, y) {
        for(var d in data) {
            coords = map.coord(data[d][0][0]/100, data[d][0][1]/100);
            if(eucldist(coords, [x, map.height-y]) < RADIUS+1) {
                return d;
            }
        }
        return null;
    }
    
    this.render = function(map, ctx) {
        if (style.fillStyle) ctx.fillStyle = style.fillStyle;
        if (style.strokeStyle) ctx.strokeStyle = style.strokeStyle;
        if (style.lineWidth) ctx.lineWidth = style.lineWidth;

        for (var d in data) {
            
            // set classMap styles, if available
            var subStyle = {};
            if (style.classMap && style.classMap[data[d][2]]) { // third value in the data is the class (for stations, C, B, or A, urban, suburb, or rural, respectively)
                for(var s in style.classMap[data[d][2]]) {
                    ctx[s] = style.classMap[data[d][2]][s];
                    subStyle[s] = ctx[s];
                }
            }
            
            var coords = map.coord(data[d][0][0]/100, data[d][0][1]/100);
            if (style.fillStyle || subStyle.fillStyle) {
                /* draw a circle
                ctx.beginPath();
                ctx.arc(coords[0], map.height - coords[1], RADIUS, 0, Math.PI*2, true); // (x, y, radius, start_radian, end_radian, connect?)
                ctx.closePath();
                ctx.fill();
                */
                // draw rectangle
                ctx.fillRect(coords[0] - RADIUS, map.height - coords[1] - RADIUS, DIAMETER, DIAMETER);
            }
            if (style.strokeStyle || subStyle.strokeStyle) {
                /* draw a circle
                ctx.beginPath();
                ctx.arc(coords[0], map.height - coords[1], RADIUS, 0, Math.PI*2, true); // (x, y, radius, start_radian, end_radian, connect?)
                ctx.closePath();
                ctx.stroke();
                */
                // draw rectangle
                ctx.strokeRect(coords[0] - RADIUS, map.height - coords[1] - RADIUS, DIAMETER, DIAMETER);
            }
        }
        
        if (style.textFill || style.textStroke) {
            if (!style.helper) {
                style.helper = document.createElement('canvas');
                //$('#map').append($(style.helper)); // show it --------------- for debug
                //$(style.helper).addClass('layer');
            }
            
            // do this every time in case the window was resized
            style.helper.width = map.width;
            style.helper.height = map.height;

            var helper = style.helper.getContext('2d');
            helper.clearRect(0,0,style.helper.width,style.helper.height);
            helper.fillStyle = 'black';
            
            if (style.font) ctx.font = style.font;
            if (style.textFill) ctx.fillStyle = style.textFill;
            if (style.textStroke) {
                ctx.strokeStyle = style.textStroke;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                ctx.lineWidth = style.textHalo || 1;
            }
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            
            for (var d in data) {
                var coords = map.coord(data[d][0][0]/100, data[d][0][1]/100);
                var text = data[d][1];
                var tx = Math.round(3 + coords[0]);
                var ty = Math.round(map.height - coords[1]);
                var tw = Math.round(ctx.measureText(text).width);
                var th = 12;

                if (tx < 0 || tx+tw >= map.width || ty-th/2 < 0 || ty+th/2 >= map.height) continue;
                
                // these check for overlap with previously drawn text
                var img = helper.getImageData(tx+tw/2,ty,1,1);
                if (img.data[3]) continue;
                var img = helper.getImageData(tx,ty-th/2,1,1);
                if (img.data[3]) continue;
                img = helper.getImageData(tx+tw,ty-th/2,1,1);
                if (img.data[3]) continue;
                img = helper.getImageData(tx+tw,ty+th/2,1,1);
                if (img.data[3]) continue;
                img = helper.getImageData(tx,ty+th/2,1,1);
                if (img.data[3]) continue;
                
                helper.fillRect(tx, ty-th/2, tw, th);
                if (style.textStroke) ctx.strokeText(text, tx, ty);
                if (style.textFill) ctx.fillText(text, tx, ty);
            }
        }
    }
}


function VectorData(res, data, style) {
    var resolutions = res;
    
    // fix bounding box coordinates
    for(var d in data) {
        for(var b in data[d][0]) {
            data[d][0][b] /= 100;
        }
    }
    
    // get the index of the polygon at the given pixel coordinates (x,y)
    this.atCoord = function(x, y) {
        return null;
    }
    
    this.render = function(map, ctx) {
        //var m = 0;
        //var colors = ['#FF0000', '#FF7700', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'];
        for(var s in style) {
            ctx[s] = style[s];
        }
        for(var d in data) {
            var bbox = data[d][0];
            if(outOfBounds(bbox, map)) {
                continue
            }
            ctx.beginPath();
            for(var p in data[d][1]) { // parts of the polygon
                var polygon = data[d][1][p];
                var coords = map.coord(polygon[0][0]/100, polygon[0][1]/100);
                ctx.moveTo(coords[0], map.height - coords[1]);
                for(var p = 1; p < polygon.length; p++) {
                    coords = map.coord(polygon[p][0]/100, polygon[p][1]/100);
                    ctx.lineTo(coords[0], map.height - coords[1]);
                }
            }
            if(style.fillStyle) {
                ctx.fill();
            }
            if(style.strokeStyle) {
                ctx.stroke();
            }
        }
    }
}
