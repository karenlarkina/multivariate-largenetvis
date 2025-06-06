var horizontal = 2;
var vertical = 1;

class d3ColorBar {

    constructor(props = {}) {

    }


 /* https://github.com/ttdtrang/d3-colorbar */
    colorbar(orient, scale, width, height) {
        
        var self = this;

        var tickValues = scale.domain(),
            axisGroup = null;
        var linearScale = d3.scaleLinear()
            .domain(scale.domain())
            .range([0, orient === horizontal ? width : height]);
        var barThickness = orient === horizontal ? height : width;
        var barRange = orient === horizontal ? width : height;

        function colorbar(context) {
            // The finer, the more continuous it looks
            var dL = 2;
            var nBars = Math.floor(barRange / dL);
            var barData = [];
            var trueDL = barRange * 1. / nBars;
            for (var i = 0; i < nBars; i++) {
                barData.push(i * (trueDL));
            }

            var interScale = d3.scaleLinear()
                .domain([0, barRange])
                .range(scale.domain());

            var bars = context.selectAll("rect")
                .data(barData)
                .enter()
                .append("rect")
                .attr("x", translateX)
                .attr("y", translateY)
                .attr("width", orient === horizontal ? trueDL : barThickness)
                .attr("height", orient === horizontal ? barThickness : trueDL)
                .style("stroke-width", "0px")
                .style("fill", function (d, i) {
                    return scale(interScale(d))
                });

            var myAxis = (orient === horizontal) ? d3.axisBottom(linearScale) : d3.axisRight(linearScale);
            if (tickValues == null) tickValues = myAxis.tickValues();
            else myAxis.tickValues(tickValues);
            axisGroup = context.append("g")
                .attr("class", "colorbar axis")
                .attr("transform", "translate(" + self.translateAxis(orient, width, height) + ")").call(myAxis).selectAll(".tick").data(tickValues);
        }

        // set and return for chaining, or get
        colorbar.scale = function (_) {
            return arguments.length ? (scale = _, colorbar) : scale;
        };

        colorbar.tickValues = function (_) {
            return arguments.length ? (tickValues = _, colorbar) : tickValues;
        };

        function translateX(d, i) {
            if (orient === horizontal) return d;
            else return 0;
        }

        function translateY(d, i) {
            if (orient === horizontal) return 0;
            else return d;
        }

        return colorbar;
    }


    translateAxis(orient, width, height) {
        var tX = orient === horizontal ? 0 : width;
        var tY = orient === horizontal ? height : 0;
        return tX + "," + tY;
    }


    colorbarV(scale, width, height) {
        var vertical = 1;
        return this.colorbar(vertical, scale, width, height);
    }

    colorbarH(scale, width, height) {
        var horizontal = 2;
        return this.colorbar(horizontal, scale, width, height);
    }
}