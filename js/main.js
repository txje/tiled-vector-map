/*
 Copyright (c) 2012 Jeremy Wang
 Licensed under the MIT License (LICENSE.txt)
*/

NODATA = 9999;

FAR = 0
MEDIUM = 16
CLOSE = 80

ALL = [{'datatype':'vector', 'style':{ fillStyle: '#99AA77' }}, // land
       {'datatype':'vector', 'style':{ strokeStyle: '#000000', lineWidth: 1.0 }}, // coastline
       {'datatype':'vector', 'style':{ strokeStyle: '#0000FF', lineWidth: 0.5 }}, // rivers
       {'datatype':'vector', 'style':{ fillStyle: '#0000FF', strokeStyle: '#AAAAFF', lineWidth: 0.5 }}, // lakes
       {'datatype':'vector', 'style':{ fillStyle: '#DDDDFF' }}, // glaciers
       {'datatype':'vector', 'style':{ strokeStyle: '#FFFFFF', lineWidth: 0.5 }}, // geography
       {'datatype':'vector', 'style':{ fillStyle: 'rgba(0,0,255,0.1)' }}, // bathymetry
       {'datatype':'vector', 'style':{ strokeStyle: '#FFFFFF', lineWidth: 2.0 }}, // countries
       {'datatype':'vector', 'style':{ strokeStyle: '#FFFFFF', lineWidth: 1.0 }}, // states
       {'datatype':'vector', 'style':{ strokeStyle: '#555555', lineWidth: '0.5' }}, // roads
       {'datatype':'vector', 'style':{ strokeStyle: '#222222', lineWidth: '1.0' }}, // railroads
       {'datatype':'point', 'style':{ strokeStyle: '#000000', fillStyle: '#FF0000', lineWidth: 0.5, textFill: '#000000' }} // populated
      ]

// list of [resolution, tile size, path]
RES = [[FAR, 90, 'data/tiles/90/[x]_[y].json'], [MEDIUM, 20, 'data/tiles/20/[x]_[y].json'], [CLOSE, 4, 'data/tiles/4/[x]_[y].json']];

DATA = {'land': {
            'datatype': 'vector',
            'style': { fillStyle: '#99AA77' },
            'resolutions': RES},
        'rivers': {
            'datatype': 'vector',
            'style': { strokeStyle: '#0000FF', lineWidth: 0.5 },
            'resolutions': RES},
        'lakes': {
            'datatype': 'vector',
            'style': { fillStyle: '#0000FF', strokeStyle: '#AAAAFF', lineWidth: 0.5 },
            'resolutions': RES},
        'glaciers': {
            'datatype': 'vector',
            'style': { fillStyle: '#DDDDFF' },
            'resolutions': RES},
        'geography': {
            'datatype': 'vector',
            'style': { strokeStyle: '#FFFFFF', lineWidth: '0.5' },
            'resolutions': RES},
        'bathymetry': {
            'datatype': 'vector',
            'style': { fillStyle: 'rgba(0,0,255,0.1)' },
            'resolutions': RES},
        'states': {
            'datatype': 'vector',
            'style': { strokeStyle: '#FFFFFF', lineWidth: '1.0' },
            'resolutions': RES},
        'roads': {
            'datatype': 'vector',
            'style': { strokeStyle: '#555555', lineWidth: '0.5' },
            'resolutions': RES},
        'railroads': {
            'datatype': 'vector',
            'style': { strokeStyle: '#222222', lineWidth: '1.0' },
            'resolutions': RES},
        'countries': {
            'datatype': 'vector',
            'style': { strokeStyle: '#FFFFFF', lineWidth: 2.0 },
            'resolutions': RES},
        'populated': {
            'datatype': 'point',
            'style': { strokeStyle: '#000000', fillStyle: '#FF0000', lineWidth: 0.5, textFill: '#000000' },
            'resolutions': RES}
};

function toggle_box(btn, id) {
    var a = $('#' + id);
    var $btn = $(btn);
    if(!a.is(':visible')) {
        a.show('slow');
        if($btn.text() == '< More')
            $btn.text('> Less');
    }
    else {
        a.hide('slow');
        if($btn.text() == '> Less')
            $btn.text('< More');
    }
}

// a not-so-elegant but critical piece of scoping and closure
function attacher() {
    var o = arguments[0];
    var f = arguments[1];
    var params = [];
    for(var i = 2; i < arguments.length; i++)
        params.push(arguments[i]);
    return function() {
        var newparams = [];
        for(var i in arguments)
            newparams.push(arguments[i]);
        return f.apply(o, params.concat(newparams));
    }
}

var map;

function init() {
    // start with 3 layers, zoom 4x (4 pixels per degree)
    map = new CanvasMap(document.getElementById('map'), 4); //(container, zoom) where zoom indicates pixels per degree
    map.addLayer('all', {'resolutions':RES, 'parts':ALL});
    map.show('all');
    /*
    for(var d in DATA) {
        map.addLayer(d, DATA[d]);
        map.show(d);
    }
    */
    map.update();
}

function zoom(z) {
    map.changeZoom(z);
}

function pan(x, y) {
    map.pan(x, y);
}
