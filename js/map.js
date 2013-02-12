/*
 Copyright (c) 2012 Jeremy Wang
 Licensed under the MIT License (LICENSE.txt)
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
            if(this.layers[l].click)
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
        this.layers.push(new TiledLayer(this, container, id, info));
        var i = this.layers.length - 1;
        layer_map[id] = i;
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

// For just the Natural Earth Data, all of it is actually in only one layer
function TiledLayer(map, container, id, info) {
    
    this.$canvas = $('<canvas>');
    this.$canvas.addClass('layer');
    this.$canvas.insertBefore(map.control_layer.$canvas);
    this.$canvas.attr('width', this.$canvas.width());
    this.$canvas.attr('height', this.$canvas.height());
    this.ctx = this.$canvas.get(0).getContext('2d');
    
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
    
    this.clear = function() {
        this.ctx.clearRect(0, 0, this.$canvas.width(), this.$canvas.height());
    }
    
    this.render = function() {
        if(hidden) {
            return;
        }
        this.clear();
        for(var i in resolutions) {
            var r = resolutions[i][0]
            var tilesize = resolutions[i][1];
            var filepath = resolutions[i][2];
            if(r <= this.map.zoom) {
                var lastrow = Math.min(180/tilesize-1, parseInt((180 - this.map.s) / tilesize));
                var lastcol = Math.min(360/tilesize-1, parseInt((180 + this.map.e) / tilesize));
                for(var row = Math.max(0, parseInt((90 - this.map.n) / tilesize)); row <= lastrow; row++) {
                    for(var col = Math.max(0, parseInt((180 + this.map.w) / tilesize)); col <= lastcol; col++) {
                        if(tiles[r][row][col] && tiles[r][row][col].loaded) {
                            tiles[r][row][col].render(this.map, this.ctx)
                        }
                        else {
                            if (!tiles[r][row][col]) {
                                console.log('loading tile ' + row + ', ' + col);
                                tiles[r][row][col] = new VectorTile(tilesize, filepath.replace('[x]', col).replace('[y]', row), parts,
                                    attacher(this, function(t){t.render(this.map, this.ctx);}));
                            }
                        }
                    }
                }
                break; // determining when and how to show lower resolutions while loading, etc, is much more complicated with layers, so right now we'll just never show old resolutions
            }
        }
    }

    this.map = map;
    this.id = id;

    var parts = info['parts'];
    
    // sort resolutions from highest to lowest
    var resolutions = info['resolutions'];
    resolutions.sort(function(a,b){return b[0]-a[0]});

    // this will be a sparse array with only indices with known resolutions filled (probably 0, 8, and 40)
    // each resolution will have an array of (row x col) tiles
    var tiles = [];
    for(var i in resolutions) {
        var res = resolutions[i][0];
        var rows = 180 / resolutions[i][1];
        //var cols = 360 / resolutions[i][1];
        tiles[res] = [];
        for(var y = 0; y < rows; y++) {
            tiles[res][y] = [];
        }
                
    }
}

function VectorTile(tilesize, filepath, parts, loadback) {
    // lat, lon coordinate are correct in the tile files
    lat = 0;
    lon = 0;
    
    var data = [];
    this.loaded = false;
    
    var style = [];
    var datatype = [];
    for(var p = 0; p < parts.length; p++) {
        style[p] = parts[p]['style'];
        datatype[p] = parts[p]['datatype'];
    }

    // get the index of the polygon at the given pixel coordinates (x,y)
    this.atCoord = function(x, y) {
        return null;
    }
    
    this.load = function(read_data) {
        for(var d = 0; d < read_data.length; d++) {
            if(!data[read_data[d][0]])
                data[read_data[d][0]] = [];
            data[read_data[d][0]].push(read_data[d][1]);
        }
        this.loaded = true;
        loadback(this);
    }
    
    this.render = function(map, ctx) {
        var m = 0;
        var colors = ['#FF0000', '#FF7700', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'];
        for(var type = 0; type < data.length; type++) {
            if(!data[type] || datatype[type] != 'vector') // skip missing parts and points (non-vectors)
                continue;
            ctx.save();
            for(var s in style[type]) {
                ctx[s] = style[type][s];
            }
            for(var d = 0; d < data[type].length; d++) { // polygons
                var polygon = data[type][d];
                ctx.beginPath();
                for(var p = 0; p < polygon.length; p++) { // parts of the polygon
                    var shape = polygon[p];
                    var coords = map.coord(shape[0][0]/100 + lon, shape[0][1]/100 + lat);
                    ctx.moveTo(coords[0], map.height - coords[1]);
                    for(var pt = 1; pt < shape.length; pt++) {
                        coords = map.coord(shape[pt][0]/100 + lon, shape[pt][1]/100 + lat);
                        ctx.lineTo(coords[0], map.height - coords[1]);
                    }
                }
                if(style[type].fillStyle) {
                    ctx.fill();
                }
                if(style[type].strokeStyle) {
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    }
    
    // fetch the JSON data
    var handle = {
        'callback': attacher(this, function(data) {
            this.load(data);
        }),
        'error': function(msg) {
            console.log(msg);
        }
    };
    JSON(filepath, handle, {});
}
