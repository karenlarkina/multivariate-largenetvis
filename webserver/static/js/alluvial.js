
class Alluvial {
    constructor(props = {}) {
        this.elementId = props.elementId || 'id';
        this.height = props.height || 800;
        this.width = props.width || 800;
        this.data = props.data;
        this.margin = props.margin || {
            top: 30,
            right: 30,
            bottom: 30,
            left: 30
        };
        this.rx = props.rx || 0;
        this.ry = props.ry || 0;
        this.colorScaleRangeExplicitCitation = props.colorScaleRangeExplicitCitation || d3.interpolateBlues;
        this.onClick = props.onClick || function () {};
        //this.evolutionPossibilities = ['', 'birth', 'death', 'grow', 'contract', 'split', 'merge']
    }


    resetAll() {
        d3.select(`#${this.elementId}`).selectAll('svg').remove();
    }





    // http://bl.ocks.org/ChrisManess/ebaacb5fd976657edad2
    drawAluvial()
    {

        var self = this;

        var units = "Nodes";
        var margin = {top: 10, right: 10, bottom: 10, left: 10},
            width = $(".flot-chart-content").width() - margin.left - margin.right,
            height = 800 - margin.top - margin.bottom;
         
        var formatNumber = d3.format(",.0f"),    // zero decimal places
            format = function(d) { return formatNumber(d) + " " + units; },
            color = d3.scaleOrdinal(d3.schemeCategory10);


        var chart = document.createElement('div');
            chart.setAttribute('class', 'aluvialClass');
            chart.setAttribute('id', 'aluvialId');
            chart.setAttribute('style', `width: 1400px; float:left; `);

        $(`#${this.elementId}`).append(chart);
    
        

        var communities = [];
        var timeslicesWithCommunities = Object.keys(this.data.communitiesPerTimeslice); //if there are no edges (night period, for example), there are no communities in the timeslice
        for(var i = 1; i <= timeslicesWithCommunities[timeslicesWithCommunities.length -1]; i++)
        {
            if(this.data.communitiesPerTimeslice[i] == undefined)
                continue;
            for(var j = 0; j < this.data.communitiesPerTimeslice[i].length; j++)
            {
                communities.push({"name":"Comm. " + this.data.communitiesPerTimeslice[i][j], "id":this.data.communitiesPerTimeslice[i][j], "time":i});
            }
        }


        var links = [];
        var communitiesThatEvolveToOthers = [];
        var communitiesKey = Object.keys(this.data.communitiesEvolution); //if there are no edges (night period, for example), there are no communities in the timeslice
        
        for(var i = 1; i <= communitiesKey[communitiesKey.length -1]; i++)
        {
            if(this.data.communitiesEvolution[i] == undefined)
                continue;
            for(var j = 0; j < this.data.communitiesEvolution[i].length; j++)
            {
                /* Inside a this.data.communitiesEvolution[i][j], we have:
                [0] = Community from
                [1] = Community to
                [2] = what happened ('vanish, contract, etc.)
                [3] = when it happened (end, start, from, etc.)
                [4] = initial length
                [5] = end length
                */

                //events of type different than 'end' should only be considered in the last timeslice, and only begins.
                if(this.data.communitiesEvolution[i][j][3] != 'end')
                {
                    if (i != communitiesKey[communitiesKey.length -1]) //if any timeslice but the last, ignore events that are not 'end' events.
                        continue;
                    else if(this.data.communitiesEvolution[i][j][2] != 'Begin' && this.data.communitiesEvolution[i][j][2] != 'Regenerate')
                        continue;
                }
                

                if(this.data.communitiesEvolution[i][j][5] != -1) 
                {
                    var source = this.data.communitiesEvolution[i][j][0];
                    var target = this.data.communitiesEvolution[i][j][1];

                    var timeSource = communities.filter(d => d.id == source)[0].time;
                    var timeTarget = communities.filter(d => d.id == target)[0].time;


                    if(timeSource == timeTarget + 1 || timeSource == timeTarget -1) //only create links between adjacent timeslices (this aims to ignore night periods, for example)
                    {
                        links.push({"source":this.data.communitiesEvolution[i][j][0],"target":this.data.communitiesEvolution[i][j][1],"value":this.data.communitiesEvolution[i][j][4], "endValue": this.data.communitiesEvolution[i][j][5]});
                        communitiesThatEvolveToOthers.push(source);
                        communitiesThatEvolveToOthers.push(target);
                    }
                    else 
                        if(!communitiesThatEvolveToOthers.includes(this.data.communitiesEvolution[i][j][0]))
                            //create birth and death at the same time (source and target are the same, initial value and end value are the same)
                            links.push({"source":this.data.communitiesEvolution[i][j][0],"target":this.data.communitiesEvolution[i][j][0],"value":this.data.communitiesEvolution[i][j][4], "endValue": this.data.communitiesEvolution[i][j][4]});

                }
                
                else
                {
                    if(!communitiesThatEvolveToOthers.includes(this.data.communitiesEvolution[i][j][0]))
                        //create birth and death at the same time (source and target are the same, initial value and end value are the same)
                        links.push({"source":this.data.communitiesEvolution[i][j][0],"target":this.data.communitiesEvolution[i][j][0],"value":this.data.communitiesEvolution[i][j][4], "endValue": this.data.communitiesEvolution[i][j][4]});

                    //if(!communitiesThatEvolveToOthers.includes(this.data.communitiesEvolution[i][j][1]))
                        //create birth and death at the same time (source and target are the same, initial value and end value are the same)
                     //   links.push({"source":this.data.communitiesEvolution[i][j][1],"target":this.data.communitiesEvolution[i][j][1],"value":this.data.communitiesEvolution[i][j][4], "endValue": this.data.communitiesEvolution[i][j][4]});
                
                }
                   
            } 
        }

        //var data = {"nodes": communities, "links": links};
        console.log(data);
        
        var data = {"nodes":[
            {"name":"Node 0", "id":0, "time":0, "sub":[{"name":"star", "id":1000, "time":-1}, {"name":"circular", "id":1001, "time":-1}] },
            {"name":"Node 3", "id":3, "time":1, "sub":[{"name":"star", "id":1002, "time":-1}, {"name":"circular", "id":1003, "time":-1}] },
            {"name":"Node 1", "id":1, "time":2, "sub":[{"name":"clique", "id":1004, "time":-1}, {"name":"tree", "id":1005, "time":-1}] },
            
            {"name":"Node 4", "id":4, "time":2},
            {"name":"Node 2", "id":2, "time":3},
            {"name":"Node 5", "id":5, "time":3},
            {"name":"Node 6", "id":6, "time":4},
            {"name":"Node 7", "id":7, "time":5}
            
            ],"links":[
            {"source":0,"target":3,"value":2, "endValue": 2, "sub": [{"source":1000,"target":1002,"value":1, "endValue": 1}, {"source":1001,"target":1003,"value":1, "endValue": 1}, {"source":1000,"target":1003,"value":2, "endValue": 1}]},
            {"source":3,"target":1,"value":1, "endValue": 2, "sub": [{"source":1002,"target":1004,"value":1, "endValue": 1}, {"source":1003,"target":1004,"value":1, "endValue": 1}, {"source":1003,"target":1005,"value":2, "endValue": 1}]},
            {"source":3,"target":4,"value":1, "endValue": 3},
            {"source":4,"target":2,"value":1, "endValue": 3},
            {"source":2,"target":6,"value":4, "endValue": 2},

            {"source":6,"target":7,"value":2, "endValue": 2},
            {"source":5,"target":6,"value":2, "endValue": 4}
            //{"source":5,"target":5,"value":0.001, "endValue": 0.001}
            ]};
            


            // append the svg canvas to the page
            var svg = d3.select('#aluvialId').append("svg")
                .attr("width", width)
                .attr("height", height)
                //.attr("viewBox", "0 0 200 200")
                .call(d3.zoom().on("zoom", function () {
                    svg.attr("transform", d3.event.transform)
                }))
                .append("g")
                    .attr("transform", 
                    "translate(" + margin.left + "," + margin.top + ")");

            

            var alluvialGrowth = d3.alluvialGrowth()
                .numberTimes(6)
                .nodeWidth(15)
                .nodePadding(30)
                .size([width, height]);

            renderAlluvial(data, svg, alluvialGrowth, true);

            function renderAlluvial(data, svg, alluvialGrowth, firstLayer)
            {

                var path;

                var link = svg.append("g");
                var nodes = svg.append("g");

                var tool_tip ;
                if(firstLayer)
                {
                    tool_tip = d3.tip()
                    .attr("class", "d3-tip")
                    .offset([20, 120]);
                    svg.call(tool_tip);
                    
                }

                var nodeMap = {};
                data.nodes.forEach(function(x) { nodeMap[x.id] = x; });
                data.links = data.links.map(function(x) {console.log(x);
                return {
                    source: nodeMap[x.source],
                    target: nodeMap[x.target],
                    value: x.value,
                    endValue: x.endValue,
                    sub: x.sub
                };
                });

                path = alluvialGrowth.link();
                

                 alluvialGrowth
                    .nodes(data.nodes)
                    .links(data.links)
                    .layout(32);

                alluvialGrowth.relayout();
        
                link.selectAll(".link")
                    .data(data.links)
                    .enter().append("path")
                    .attr("class", "link")
                    .attr("d", path)
                    .attr("id", function(d,i){
                    d.id = i;
                    return "link-"+i;
                    })
                    .style("fill", function(d) { return "steelblue";})
                    .style("stroke-width", 1.5)
                    .sort(function(a, b) { return b.dy - a.dy; })
                    .on("click", function(d){expand2(d, data)})
                    .on('mouseover', function(d) {
                        if(firstLayer)
                        {
                            //  tool_tip.html("<p>Evolution from Com. " + d.source.id + " to Com. " + d.target.id + ":</p><div id='tipDiv'><div class='close'><button>&times</button></div></div>");
                            tool_tip.html("<div><p>Evolution from Com. " + d.source.id + " to Com. " + d.target.id + ":</p><button id='close2ndLayer' type='button'>&times</button><div id='tipDiv'></div>");
                            tool_tip.show();

                            $('#close2ndLayer').click(function()
                            {
                                tool_tip.hide();
                            });
                            d3.select('body').on('click', function(d) {if(tool_tip !== undefined) tool_tip.hide()});

                            var tipSVG = d3.select("#tipDiv")
                                .append("svg")
                                .attr("width", 250)
                                .attr("height", 200);

                            expand(d, data, tipSVG);
                        }
                        
                    })
                   .on('mouseout', function(d) {if(!firstLayer) tool_tip.hide()});
                
                  
                
                    var node = nodes.selectAll(".node")
                        .data(data.nodes)
                        .enter().append("g")
                        .attr("class", "node")
                        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                        .call(d3.drag()
                        .subject(function(d) { return d; })
                        .on("start", function() { 
                            this.parentNode.appendChild(this); })
                        .on("drag", dragmove));
                
                    node.append("rect")
                        .attr("height", function(d) { return d.dy; })
                        //.attr("transform", function(d) { return "translate(" + 0 + "," + (d.y/2) + ")"; })
                        .attr("width", alluvialGrowth.nodeWidth())
                        .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
                        .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
                        .append("title")
                        .text(function(d) { return "Timeslice " + d.time + "\n\n" + d.name + "\n" + format(d.value); });
                   
                    node.append("text")
                        .attr("x", -6)
                        .attr("y", function(d) { return d.dy / 2; })
                        .attr("dy", ".35em")
                        .attr("text-anchor", "end")
                        .attr("transform", null)
                        .text(function(d) {return d.name; })
                        .filter(function(d) { return d.x < width / 2; })
                        .attr("x", 6 + alluvialGrowth.nodeWidth())
                        .attr("text-anchor", "start");

                    node.transition().duration(750);

            }
        
            function dragmove(d) {
                d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
                alluvialGrowth.relayout();
                link.attr("d", path);
            }

            function expand(d,data, svg)
            {
                var nodesThisLayer = [];
                var linksThisLayer = [];
                data.nodes.forEach(function(x) {
                    
                    if(x.id == d.source.id)
                    {
                        for(var i = 0; i < x.sub.length; i++)
                        {
                            x.sub[i].time = 0; //Since this 2nd layer's alluvial has only two timeslices, source is 0 and target is 1.
                            nodesThisLayer.push(x.sub[i]);
                        }

                    }
                    else if(x.id == d.target.id)
                    {
                        for(var i = 0; i < x.sub.length; i++)
                        {
                            x.sub[i].time = 1; //Since this 2nd layer's alluvial has only two timeslices, source is 0 and target is 1.
                            nodesThisLayer.push(x.sub[i]);
                        }
                    }
                });


                data = {"nodes": nodesThisLayer, "links": d.sub};

                var alluvialGrowth = d3.alluvialGrowth()
                    .numberTimes(2)
                    .nodeWidth(15)
                    .nodePadding(30)
                    .size([200, 200]);

                renderAlluvial(data, svg, alluvialGrowth, false);
            }
    }
}