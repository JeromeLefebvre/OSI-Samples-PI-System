/*
Warning:

* The symbol does not work if the multistate is not defined by the attribute limits
* The symbol only works if the data are floats or ints, not string data or digital sets, nor does it handle shutdowns/no data type of values
* If the values are above the latest Max the values shows up as pink, if they are below the current min, the show up as black
* if no data is shown, moving back and forth on the timeline can help things.
*/

(function (PV) {
	'use strict';

	function symbolVis() { }
    PV.deriveVisualizationFromBase(symbolVis);

    var definition = {
        typeName: 'thresholdtrend',
        visObjectType: symbolVis,
        datasourceBehavior: PV.Extensibility.Enums.DatasourceBehaviors.Multiple,
        supportsCollections: true,
        //iconUrl: 'scripts/app/editor/symbols/ext/icons/sym-thresholdtrend.png', // TODO: Find a logo
        getDefaultConfig: function () {
            return {
                // Changing these values in code will cause addtional undo levels to be created
                // They should only be updated by config.html using Angular ng-model
                DataShape: 'Trend',
                Height: 80,
                Width: 80,
                ShowLabel: false,
                ShowValue: true,
                ShowTimestamp: false,
                LabelColor: 'grey',
                ValueColor: 'white',
                LabelType: 'Full'
            };
        },
        StateVariables: ['MultistateColor'],
        configOptions: function () {
            return [{
                title: 'Threshold trend',
                mode: 'formatWindArrow'
            }];
        }
    };

    symbolVis.prototype.init = function (scope, elem) {
        scope.showText = true;
        scope.Width;
        scope.Height;
        scope.Label = '';
        // TODO get colors from multi state
        scope.colors = ["green"];
        scope.thresholds = [100];
        // runtimeData is passed to config.html and can be changed in code without causing additional undo levels
        // The labelOptions are used to populate the label dropdown listbox on the config.html display
        scope.runtimeData.labelOptions = '';
        // use elem to grab the appropriate canvas
        // TODO: Remove white border
        scope.canvas = elem.find(".thresholdtrend")[0];
        scope.canvas2 = document.getElementById("myCanvas");

        scope.ctx = scope.canvas.getContext("2d");
        // TODO work on fixing the width and heigh
        scope.ctx.canvas.width = 200;//elem.innerWidth;
        scope.ctx.canvas.height = 200; //elem.innerHeight;
        scope.ctx.translate(0, scope.canvas.height);
        var scale = 1;
        scope.ctx.scale(scale, -1 * scale);

        this.onDataUpdate = onDataUpdate;
        this.onResize = onResize;
        this.onConfigChange = onConfigChange;

        function intersection(source, target, threshold) {
            // return -1 if below, 1 if above, {x,y} if intersect
            if (source.y <= threshold && target.y <= threshold) {
                return -1
            }
            if (source.y >= threshold && target.y >= threshold) {
                return 1
            }
            var m = (target.y - source.y) / (target.x - source.x);
            //console.log("m: ", m);
            var i = (threshold - source.y) / m + source.x;
            return ({
                x: i,
                y: threshold
            });
        }

        function drawLineSegment(origin, end, color = "black", lineDash = [], lineWidth = 0.3) {
            // draws a line
            scope.ctx.beginPath();
            scope.ctx.setLineDash(lineDash);
            scope.ctx.strokeStyle = color;
            scope.ctx.lineWidth = lineWidth;
            scope.ctx.moveTo(origin.x, origin.y);
            scope.ctx.lineTo(end.x, end.y);
            scope.ctx.stroke();
        }

        function drawCurve(rawstr) {
            var points = PIVisionToPoints(rawstr);

            var k = 0;
            for (var i = 0; i < points.length - 1; i++) {
                //console.log(i, points[i], points[i+1]);
                for (var j = 0; j < scope.thresholds.length; j++) {
                    var threshold = scope.thresholds[j];
                    var origin = points[i];
                    var inter = intersection(points[i], points[i + 1], threshold);
                    if (inter > 0) {
                        //it will loop over this point again    
                    } else if (inter < 0) {
                        drawLineSegment(points[i], points[i + 1], scope.colors[j-1]);
                        break;
                    } else {
                        points.splice(i, 1, origin, inter);
                        i--;
                        break;
                    }
                }
                // to avoid going in an infinite loop
                k++
                if (k > 10000) {
                    break;
                }
            }
        }

        
        function PIVisionToPoints(rawstr) {
            /// converts data from a PI Vison plot to an array
            var rawdata = rawstr.split(" ");
            var points = [];
            rawdata.forEach(function(item, index) {
                points.push({
                    x: parseFloat(item.split(',')[0]),
                    y: parseFloat(item.split(',')[1])
                });
            });
            return points;
          }


          // TODO verify performance over tens of trends
        // Update symbol with new data
        function onDataUpdate(newData) {
            if (!newData) {
                return;
            }
            //Cear the shadow of past equations
            scope.ctx.clearRect(0, 0, scope.canvas.width, scope.canvas.height);
            
            if (newData.Traces.length > 0) {
                scope.thresholds = [];
                for (var index = 1; index < newData.Traces.length; index++) {
                    var limitsPoints = PIVisionToPoints(newData.Traces[index].LineSegments[0]);
                    scope.thresholds.push(limitsPoints[limitsPoints.length -1].y);
                    if (scope.config.ShowLimits) {
                       drawLineSegment({x:0, y:limitsPoints[limitsPoints.length -1].y}, {x:100, y:limitsPoints[limitsPoints.length -1].y}, "purple", [5,10]);
                    }
                }
                if (scope.thresholds[scope.thresholds.length -1] != 100) {
                    scope.thresholds.push(100);
                }
            }

            scope.thresholds.sort(function(a,b) { return a - b;});

            // Update the threshold
            // TODO: Figure out the threshold 

            drawCurve(newData.Traces[0].LineSegments[0]);
            //console.log(newData);
            // Set labels if provided in update data
            // Metadata fields are returned on the first request and only periodically afterward
            if (newData.Label !== undefined) {

            }

            // TODO: Update the threshold base on traces other than 0.
            if (newData.ValueScalePositions) {
                // Loop over each limits and assigns
                //Display|Month|[@Trait=Lo]
                // TODO update the threshold base the updated limit values
                // TODO draw the new thresholds if needed
                //scope.thresholds = newData.ValueScalePositions;
                //console.log(newData.ValueScalePositions);
            }
        }

       // Process configuration changes 
       function onConfigChange(newConfig) {
            // TODO: Automatically add trends that are part of multistate
            // https://pisquare.osisoft.com/community/developers-club/blog/2017/07/11/creating-pi-vision-symbols-that-interact-with-each-other
            
            if (scope.symbol.Configuration.Multistates) {
                scope.colors = [];
                scope.symbol.Configuration.Multistates[0].States.forEach(state => scope.colors.push(state.StateValues[0]));
                // Need to deal if a color is above the largest threshold
                if (scope.colors.length < scope.thresholds.length) {
                    scope.colors.push("pink");
                }
            }   
            //scope.symbol.Configuration.Multistates[0].States[0].StateValues[0]
        }

        // Process symbol resize
        function onResize(width, height) {

            scope.ctx.canvas.width = width;
            scope.ctx.canvas.height = height;

            scope.ctx.translate(0, scope.canvas.height);
            var scale = 2;
            scope.ctx.scale(width*0.01, -1 * height*0.01);
    
            //var canvas = $('#myCanvas');
            //canvas.height = height;
            //canvas.width = width;
            /*
            var canvas = $('#canvas');
            canvas.css("width", width);
            canvas.css("height", height);
            scope.ctx.canvas.width = width;
            scope.ctx.canvas.height = height; //elem.innerHeight;
            */
        }
    };

	PV.symbolCatalog.register(definition); 
})(window.PIVisualization); 
