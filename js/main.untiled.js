/*
 Copyright (c) 2012 Jeremy Wang
 Licensed under the MIT License (LICENSE.txt)
 
 Version 0.1.0
*/

NODATA = 9999;

// this is the order the layers will be shown, from bottom to top
LAYERS = ['land', 'coastline', 'rivers', 'lakes', 'glaciers', 'geography', 'bathymetry', 'countries', 'states', 'roads', 'railroads', 'populated'];

FAR = 0
MEDIUM = 16
CLOSE = 80

DATA = { // id: [[[resolution, filepath], [resolution, filepath], ...], fillcolor, outlinecolor, outlineonly, dontclose] - ...false, false is a normal filled polygon
    'land':     [
                    [
                        'single',
                        'vector',
                        [
                            [FAR, 'data/land.110.json'],
                            [MEDIUM, 'data/land.50.json'],
                            [CLOSE, 'data/land.10.json']
                        ],
                        { fillStyle: '#99AA77' }
                    ]
                ], // #202020 light greenish
    'rivers':   [
                    [
                        'single',
                        'vector',
                        [
                            [FAR, 'data/rivers.110.json'],
                            [MEDIUM, 'data/rivers.50.json'],
                            [CLOSE, 'data/rivers.10.json']
                        ],
                        { strokeStyle: '#0000FF', lineWidth: 0.5 }
                    ]
                ], // #9DC3E0 blue
    'lakes':    [
                    [
                        'single',
                        'vector',
                        [
                            [FAR, 'data/lakes.110.json'],
                            [MEDIUM, 'data/lakes.50.json'],
                            [CLOSE, 'data/lakes.10.json']
                        ],
                        { fillStyle: '#0000FF', strokeStyle: '#AAAAFF', lineWidth: 0.5 }
                    ]
                ], // #9DC3E0 blue
    'glaciers': [
                    [
                        'single',
                        'vector',
                        [
                            [FAR, 'data/glaciers.110.json'],
                            [MEDIUM, 'data/glaciers.50.json'],
                            [CLOSE, 'data/glaciers.10.json']
                        ],
                        { fillStyle: '#DDDDFF' }
                    ]
                ],
    'geography': [
                    [
                        'single',
                        'vector',
                        [
                            [FAR, 'data/geography.110.json'],
                            [MEDIUM, 'data/geography.50.json'],
                            [CLOSE, 'data/geography.10.json']
                        ],
                        { strokeStyle: '#FFFFFF', lineWidth: '0.5' }
                    ]
                 ],
    'bathymetry': [
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.200.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.1000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.2000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.3000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.4000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.5000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.6000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.7000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.8000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.9000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ],
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/bathymetry.10000.10.json']
                        ],
                        { fillStyle: 'rgba(0,0,255,0.1)' }
                    ]
                  ],
    'states': [
                    [
                        'single',
                        'vector',
                        [
                            [MEDIUM, 'data/states.50.json'],
                            [CLOSE, 'data/states.10.json']
                        ],
                        { strokeStyle: '#FFFFFF', lineWidth: '1.0' }
                    ]
              ],
    'roads': [
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/roads.10.json']
                        ],
                        { strokeStyle: '#555555', lineWidth: '0.5' }
                    ]
             ],
    'railroads': [
                    [
                        'single',
                        'vector',
                        [
                            [CLOSE, 'data/railroads.10.json']
                        ],
                        { strokeStyle: '#222222', lineWidth: '1.0' }
                    ]
                 ],
    'countries':[
                    [
                        'single',
                        'vector',
                        [
                            [FAR, 'data/countries.110.json'],
                            [MEDIUM, 'data/countries.50.json'],
                            [CLOSE, 'data/countries.10.json']
                        ],
                        { strokeStyle: '#FFFFFF', lineWidth: 2.0 }
                    ]
                ],
    
    'populated':  [
                    [
                        'single',
                        'point',
                        [
                            [FAR, 'data/populated.110.json'],
                            [MEDIUM, 'data/populated.50.json'],
                            [CLOSE, 'data/populated.10.json'],
                        ],
                        { strokeStyle: '#000000', fillStyle: '#FF0000', lineWidth: 0.5, textFill: '#000000' }
                    ]
                ],
}

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
    map = new CanvasMap(document.getElementById('map'), 4); //(container, numLayers, zoom) where zoom indicates pixels per degree
    for(var i in LAYERS) {
        var l = LAYERS[i];
        map.addLayer(l, DATA[l]);
    }
    for(var i in LAYERS) {
        var l = LAYERS[i];
        map.show(l);
    }
    map.update();
}

function zoom(z) {
    map.changeZoom(z);
}

function pan(x, y) {
    map.pan(x, y);
}
