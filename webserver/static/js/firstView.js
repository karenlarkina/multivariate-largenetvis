var nodeLinkWithoutEdgeBundling = true;
var self;
var minCommunitySize = 999999;
var maxCommunitySize = -1;
var maxNumberCommunitiesHeatmap = 15;


var nodeLinkSvg;
var tamSvg;
var globalViewSvg;
var original_node_data;


var informationClickedCommunity_globalview;

var matrixX, matrixY;

var metro;

var currentPageHeatmap = 0;

var prod_price_bool = false;

var nodeLinkAttributeSelection;

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


class FirstView {
    constructor(props = {}) {
        this.elementId = props.elementId || 'id';
        this.height = props.height || 800;
        this.width = props.width || 800;
        this.data = props.data;
        this.generatedTimeslices = this.data[0].generatedTimeslices; //get timeslices ranges

        this.data.shift();//remove timeslices information from the result obtained through /getTaxonomies

        this.graphEdgeLabels = props.graphEdgeLabels;

        this.nodeMetadata = props.nodeMetadata;

        this.tooltipNodeMetada = props.tooltipMetadata;

        this.nodeInfo = props.nodeInfo;

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
        this.numberLines = props.numberLines || 5,
        this.numberColumns = props.numberColumns || 4,
        this.structuralPossibilities = ['', 'tree', 'star', 'circular', 'low_connectivity', 'complete'],
        //this.temporalPossibilities = ['', 'sporadic dispersed', 'sporadic grouped', 'continuous dispersed', 'continuous grouped', 'no_temporal no_temporal']
        this.temporalPossibilities = ['', 'sporadic dispersed', 'sporadic grouped', 'continuous dispersed', 'continuous grouped']
        this.evolutionPossibilities = ['', 'birth', 'death', 'grow', 'contract', 'split', 'merge']

        // This is the place where I create the random colors for the categories
        // Creating an array with the colors
        this.colors = d3.schemeCategory10
        this.selectedAttribute = "NL";
    }


    resetAll() {
        d3.select(`#${this.elementId}`).selectAll('svg').remove();
        $(".matrix_taxonomies_svg").remove();
        document.getElementById(`static-global-labels`).style.display = 'none';
    }



    resetNodeLinks() {
        $("#nodelink_diagram_div svg").remove();
        
    }

    resetTaxonomyMatrix() {
        d3.select(".matrix_taxonomies_svg").remove();
    }

    resetLineChart() {
        $("#linechart_div svg").remove();
    }

    resetTemporalActivityMap() {
        $("#temporal_activity_map_div svg").remove();
    }

    resetHeatmap() {
        $("#heatmap_community_timeslicing svg").remove();
        $("#nextCommunitiesContainer").remove();
        $("#previousCommunitiesContainer").remove();
        $("#checkCommunitiesContainer").remove()
    }

    resetAllButInitialMatrix(){
        this.resetNodeLinks();
        this.resetLineChart();
        this.resetHeatmap();
    }

    // TODO The ordering is calculated here and goes to the data variable (line 404).
    drawOverview(comunitiesEvolutionData, colorNodeCriterion)
    {   
        var distanceBetweenTimeslices = 30; //in pixels
        var distanceBetweenCommunities = 30; //in pixels

        /* Get the backend's output and creates a structure such as the following

            [{"source":"c1","target":"c2","value":1, "endValue": 3},
            {"source":"c1","target":"c3","value":1, "endValue": 3},
            {"source":"c2","target":"c4","value":1, "endValue": 3},
            {"source":"c3","target":"c4","value":1, "endValue": 3},
            {"source":"c4","target":"c5","value":1, "endValue": 3}];

        */
            var linesUsingCommunitiesIds = [];
            var communitiesThatEvolveToOthers = [];
            var communitiesKey = Object.keys(comunitiesEvolutionData.communitiesEvolution); //if there are no edges (night period, for example), there are no communities in the timeslice


            for (var i = 1; i <= communitiesKey[communitiesKey.length -1]; i++)
            {
                if (comunitiesEvolutionData.communitiesEvolution[i] == undefined)
                    continue;
                for (var j = 0; j < comunitiesEvolutionData.communitiesEvolution[i].length; j++)
                {
                    /* Inside a this.data.communitiesEvolution[i][j], we have:
                    [0] = Community from
                    [1] = Community to
                    [2] = what happened ('vanish, contract, etc.)
                    [3] = when it happened (end, start, from, etc.)
                    [4] = initial length
                    [5] = end length
                    */

                    /* if(comunitiesEvolutionData.communitiesEvolution[i][j][2] == 'Merge' || comunitiesEvolutionData.communitiesEvolution[i][j][2] == 'M')
                        debugger;

                    if(comunitiesEvolutionData.communitiesEvolution[i][j][2] == 'Split' || comunitiesEvolutionData.communitiesEvolution[i][j][2] == 'S')
                        debugger;
                */


                    // events of type different than 'end' should only be considered in the last timeslice, and only begins.
                    if(comunitiesEvolutionData.communitiesEvolution[i][j][3] != 'end')
                    {
                        if (i != communitiesKey[communitiesKey.length -1]) //if any timeslice but the last, ignore events that are not 'end' events.
                            continue;
                        else if(comunitiesEvolutionData.communitiesEvolution[i][j][2] != 'Begin' && comunitiesEvolutionData.communitiesEvolution[i][j][2] != 'Regenerate')
                            continue;
                    }

                    var communitySize = comunitiesEvolutionData.communitiesEvolution[i][j][4];
                    if (minCommunitySize > communitySize)
                        minCommunitySize = communitySize;
                    if (maxCommunitySize < communitySize)
                        maxCommunitySize = communitySize;


                    if (comunitiesEvolutionData.communitiesEvolution[i][j][5] != -1)
                    {
                        linesUsingCommunitiesIds.push({"source":comunitiesEvolutionData.communitiesEvolution[i][j][0],"target":comunitiesEvolutionData.communitiesEvolution[i][j][1], "event": comunitiesEvolutionData.communitiesEvolution[i][j][2], "value":comunitiesEvolutionData.communitiesEvolution[i][j][4], "endValue": comunitiesEvolutionData.communitiesEvolution[i][j][5]});
                        communitiesThatEvolveToOthers.push(comunitiesEvolutionData.communitiesEvolution[i][j][0]);
                        communitiesThatEvolveToOthers.push(comunitiesEvolutionData.communitiesEvolution[i][j][1]);
                    }

                    else
                    {
                        if(!communitiesThatEvolveToOthers.includes(comunitiesEvolutionData.communitiesEvolution[i][j][0]))
                            // create birth and death at the same time (source and target are the same, initial value and end value are the same)
                            linesUsingCommunitiesIds.push({"source":comunitiesEvolutionData.communitiesEvolution[i][j][0],"target":comunitiesEvolutionData.communitiesEvolution[i][j][0], "event": comunitiesEvolutionData.communitiesEvolution[i][j][2], "value":comunitiesEvolutionData.communitiesEvolution[i][j][4], "endValue": comunitiesEvolutionData.communitiesEvolution[i][j][4]});
                    }

                }
            }



        // x = timeslice
        // y = Id community mapped such that the first community of a timeslice has id 0
        /*
        This structure:
            {"name":"Node 0", "id":0, "time":0},
            {"name":"Node 1", "id":1, "time":1},
            {"name":"Node 2", "id":2, "time":1},
            {"name":"Node 3", "id":3, "time":2},
            {"name":"Node 4", "id":4, "time":3}

        would be this one:
            {"name":"Node 0", "id":0, "time":0},
            {"name":"Node 1", "id":0, "time":1},
            {"name":"Node 2", "id":1, "time":1},
            {"name":"Node 3", "id":0, "time":2},
            {"name":"Node 4", "id":0, "time":3}

        Then, the information of time and id in the above structure are mapped to the below format (used by the d3 library)

                var communities = [ //x = timeslice, y = id community starting in zero for each timeslice
                {"id": 'c1', "name": '金运路', "type": 1, "x": 0*distanceBetweenTimeslices, "y": 0*distanceBetweenCommunities, "status": 'normal', "rotation": 0},
                {"id": 'c2', "name": '金运路', "type": 1, "x": 1*distanceBetweenTimeslices, "y": 0*distanceBetweenCommunities, "status": 'normal', "rotation": 0},
                {"id": 'c3', "name": '金运路', "type": 1, "x": 1*distanceBetweenTimeslices, "y": 1*distanceBetweenCommunities, "status": 'normal', "rotation": 0},
                {"id": 'c4', "name": '金运路', "type": 1, "x": 2*distanceBetweenTimeslices, "y": 0*distanceBetweenCommunities, "status": 'normal', "rotation": 0},
                {"id": 'c5', "name": '金运路', "type": 1, "x": 3*distanceBetweenTimeslices, "y": 0*distanceBetweenCommunities, "status": 'normal', "rotation": 0}
                ];

        */

        var communities = [];
        var totalNumberCommunities = 0;
        var timeslicesWithCommunities = Object.keys(comunitiesEvolutionData.communitiesPerTimeslice); //if there are no edges (night period, for example), there are no communities in the timeslice
        for(var i = 1; i <= timeslicesWithCommunities[timeslicesWithCommunities.length -1]; i++)
        {
            if (comunitiesEvolutionData.communitiesPerTimeslice[i] == undefined)
                continue;

            for (var j = 0; j < comunitiesEvolutionData.communitiesPerTimeslice[i].length; j++)
            {
                communities.push({"id": comunitiesEvolutionData.communitiesPerTimeslice[i][j], "name": "Comm. " + comunitiesEvolutionData.communitiesPerTimeslice[i][j], "time": i});
                totalNumberCommunities++;

            }
        }
        $("#value_metric4").text(totalNumberCommunities).toLocaleString('en-US', { minimumFractionDigits: 0 });


        /* ------------------------------------------------------------------------------
        The created structure is now converted to the format accepted by the d3 library
        ------------------------------------------------------------------------------*/


        var maxNumberCommunitiesPerTimeslice = -1;
        for (var m = 1; m <= timeslicesWithCommunities[timeslicesWithCommunities.length -1]; m++)
        {
            if (comunitiesEvolutionData.communitiesPerTimeslice[m] == undefined)
                continue;

            if(maxNumberCommunitiesPerTimeslice < comunitiesEvolutionData.communitiesPerTimeslice[m].length)
                maxNumberCommunitiesPerTimeslice = comunitiesEvolutionData.communitiesPerTimeslice[m].length;
        }


        var possibleYPositionsPerTimeslice = {};
        for (var m = 1; m <= timeslicesWithCommunities[timeslicesWithCommunities.length -1]; m++)
        {
            if (comunitiesEvolutionData.communitiesPerTimeslice[m] == undefined)
                continue;

            possibleYPositionsPerTimeslice[m] = [];
            for (var j = 1; j <= maxNumberCommunitiesPerTimeslice; j++)
                possibleYPositionsPerTimeslice[m].push(j*distanceBetweenCommunities);
        }

        // Build color scale
        var minValueCriterion, maxValueCriterion;
        if (colorNodeCriterion == "numberNodes")
        {
            minValueCriterion = minCommunitySize;
            maxValueCriterion = maxCommunitySize;
        }
        else
        {
            minValueCriterion = 0;
            maxValueCriterion = 100;
        }


        var myColor = d3.scaleLinear()
        .range(["#DEEDCF", "#0A2F51"])
        .domain([minValueCriterion,maxValueCriterion])

        var mySize = d3.scaleLinear()
        .range([3,10])
        .domain([minValueCriterion,maxValueCriterion])


        var linesUsingXY = [];
        var communitiesUsingXY = []

        
        for (var i = 0; i < linesUsingCommunitiesIds.length; i++)
        {


            var fromCommunity = communities.filter(a => a.id == linesUsingCommunitiesIds[i].source)[0];
            var toCommunity = communities.filter(a => a.id == linesUsingCommunitiesIds[i].target)[0];

            if(fromCommunity != undefined && toCommunity != undefined)
            {

               /* if(toCommunity.id == 859)
                debugger;*/

                var alreadyExistentFromCommunity = communitiesUsingXY.filter(a => a.id == fromCommunity.id)[0];
                var alreadyExistentToCommunity = communitiesUsingXY.filter(a => a.id == toCommunity.id)[0];


                var sourceY;
                if(alreadyExistentFromCommunity)
                    sourceY = alreadyExistentFromCommunity.y;
                else //new community
                {
                    sourceY = (fromCommunity.id - comunitiesEvolutionData.communitiesPerTimeslice[fromCommunity.time][0]) * distanceBetweenCommunities;
                    if(!possibleYPositionsPerTimeslice[fromCommunity.time].includes(sourceY)) //if this position is not available, take the closest one
                    {
                        sourceY = possibleYPositionsPerTimeslice[fromCommunity.time].reduce((a, b) => {
                            let aDiff = Math.abs(a - sourceY);
                            let bDiff = Math.abs(b - sourceY);

                            if (aDiff == bDiff) {
                                // Choose largest vs smallest (> vs <)
                                return a > b ? a : b;
                            } else {
                                return bDiff < aDiff ? b : a;
                            }
                        });
                    }
                }

                var fromCommunityInformation = self.data.filter(a => a.id_community == fromCommunity.id)[0];

                /*var ST_icon = this.decideHeader("ST", self.structuralPossibilities.indexOf(fromCommunityInformation.structural_taxonomy)+1);
                var TT_icon = this.decideHeader("TT", self.structuralPossibilities.indexOf(fromCommunityInformation.temporal_taxonomy1 + " " + fromCommunityInformation.temporal_taxonomy2)+1);
                var ET_icon = this.decideHeader("ET", self.structuralPossibilities.indexOf(fromCommunityInformation.evolution_taxonomy)+1);
                */

                var ST_icon = d3.selectAll("pattern").nodes().filter(a => a.id == fromCommunityInformation.structural_taxonomy)[0].firstChild.href.baseVal;
                var TT_icon = d3.selectAll("pattern").nodes().filter(a => a.id == fromCommunityInformation.temporal_taxonomy1 + "_" + fromCommunityInformation.temporal_taxonomy2)[0].firstChild.href.baseVal;
                var ET_icon = d3.selectAll("pattern").nodes().filter(a => a.id == fromCommunityInformation.evolution_taxonomy)[0].firstChild.href.baseVal;


                //Do not create self-links
                if(toCommunity.id == fromCommunity.id)
                {
                    communitiesUsingXY.push({"id": fromCommunity.id, "name": "Comm. " + fromCommunity.id, "type":1, "x": fromCommunity.time * distanceBetweenTimeslices, "y": sourceY, "numberNodes": linesUsingCommunitiesIds[i].endValue, "timeslice": fromCommunity.time, "status": 'normal', "rotation": 0, "color": myColor(linesUsingCommunitiesIds[i].endValue), "size": mySize(linesUsingCommunitiesIds[i].endValue), "structural": ST_icon, "temporal": TT_icon, "evolution": ET_icon, "firstView":this}); //we could use .value instead of endvalue as well.
                    possibleYPositionsPerTimeslice[fromCommunity.time] = possibleYPositionsPerTimeslice[fromCommunity.time].filter(a => a != sourceY);

                    continue;
                }

                // TODO: implement a new method here to find the best order of the communities

                var bestTargetY;

                if(alreadyExistentToCommunity)
                    bestTargetY = alreadyExistentToCommunity.y;
                else
                {
                    var distanceBestTargetY = 999999;
                    var targetX = toCommunity.time * distanceBetweenTimeslices;
                    var sourceX = fromCommunity.time * distanceBetweenTimeslices;
                    for(var k = 0; k < possibleYPositionsPerTimeslice[toCommunity.time].length; k++)
                    {
                        var actualDistance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(possibleYPositionsPerTimeslice[toCommunity.time][k] - sourceY, 2));
                        if(actualDistance < distanceBestTargetY)
                        {
                            distanceBestTargetY = actualDistance;
                            bestTargetY = possibleYPositionsPerTimeslice[toCommunity.time][k];
                        }
                    }
                }

                possibleYPositionsPerTimeslice[toCommunity.time] = possibleYPositionsPerTimeslice[toCommunity.time].filter(a => a != bestTargetY); //bestTargetY is no longer available.
                possibleYPositionsPerTimeslice[fromCommunity.time] = possibleYPositionsPerTimeslice[fromCommunity.time].filter(a => a != sourceY); //neither does sourceY.


                linesUsingXY.push({"id": 'line' + (i+1), "fromCommunityId": fromCommunity.id, "toCommunityId": toCommunity.id   , "name": "Comm. " + fromCommunity.id + " 	&#8594; Comm. " + toCommunity.id, "event": linesUsingCommunitiesIds[i].event + " (" + linesUsingCommunitiesIds[i].value + " nodes 	&#8594; " + linesUsingCommunitiesIds[i].endValue + " nodes)", "involvedTimeslices": " Timeslice " + fromCommunity.time + " 	&#8594; " + toCommunity.time, "color": '#666', "widthFrom": linesUsingCommunitiesIds[i].value, "widthTo" : linesUsingCommunitiesIds[i].endValue, "running": false,
                "points": [
                [{
                    "x":  sourceX,
                    "y": sourceY,
                    "communitySize" : mySize(linesUsingCommunitiesIds[i].value)
                }, {
                    "x": targetX,
                    "y": bestTargetY,
                    "communitySize" : mySize(linesUsingCommunitiesIds[i].endValue)
                }]]});

            }


            // TODO: check the conditions and add your own to determine a better place on MSV
            if(alreadyExistentFromCommunity === undefined) //New community
                communitiesUsingXY.push({"id": fromCommunity.id, "name": "Comm. " + fromCommunity.id, "type":1, "x": fromCommunity.time * distanceBetweenTimeslices, "y": sourceY, "numberNodes": linesUsingCommunitiesIds[i].value, "timeslice": fromCommunity.time, "status": 'normal', "rotation": 0, "color": myColor(linesUsingCommunitiesIds[i].value), "size": mySize(linesUsingCommunitiesIds[i].value), "structural": ST_icon, "temporal": TT_icon, "evolution": ET_icon, "firstView":this});
            if(alreadyExistentToCommunity === undefined && toCommunity.id != fromCommunity.id) //New community
            {
                var toCommunityInformation = self.data.filter(a => a.id_community == toCommunity.id)[0];

                var ST_icon = d3.selectAll("pattern").nodes().filter(a => a.id == toCommunityInformation.structural_taxonomy)[0].firstChild.href.baseVal;
                var TT_icon = d3.selectAll("pattern").nodes().filter(a => a.id == toCommunityInformation.temporal_taxonomy1 + "_" + toCommunityInformation.temporal_taxonomy2)[0].firstChild.href.baseVal;
                var ET_icon = d3.selectAll("pattern").nodes().filter(a => a.id == toCommunityInformation.evolution_taxonomy)[0].firstChild.href.baseVal;

                communitiesUsingXY.push({"id": toCommunity.id, "name": "Comm. " + toCommunity.id, "type":1, "x": toCommunity.time * distanceBetweenTimeslices, "y": bestTargetY, "numberNodes": linesUsingCommunitiesIds[i].endValue, "timeslice": toCommunity.time, "status": 'normal', "rotation": 0, "color": myColor(linesUsingCommunitiesIds[i].endValue), "size": mySize(linesUsingCommunitiesIds[i].endValue), "structural": ST_icon, "temporal": TT_icon, "evolution": ET_icon, "firstView":this});

            }
        }

        
        // TODO The global view was not designed to have other orders, so there is nothing like "if (Ordering criteria){...}", as happens with TAM.
        var data = {"lines": linesUsingXY, "stations": communitiesUsingXY};
        
        metro = new Metro({
            id: '#svg_global_view',
            divContainer: "#global_view",
            origin: {
                width: $("#global_view").width(),
                height:  $("#global_view").height()
            },
            data: data,
            numberColumns: this.generatedTimeslices.length,
            numberRows: maxNumberCommunitiesPerTimeslice,
            distanceBetweenTimeslices: distanceBetweenTimeslices,
            distanceBetweenCommunities: distanceBetweenCommunities,
            colorScale: myColor,
            colorScaleDomain: [minValueCriterion,maxValueCriterion],
            sizeScale: mySize,
            });

            globalViewSvg = d3.select("#svg_global_view");
            
            $('#container-circuit').css('visibility', 'visible');
            this.changeGlobalViewAttribute("NL");
            this.drawNodeLabels(null,"#colorbar_labels",null);

    }

    changeGlobalViewAttribute(attribute){

        metro.render(attribute);

        switch (attribute) {
            case "EL":
                self.selectedAttribute = "EL";
                self.drawEdgeLabels(null,"#colorbar_labels", null);
                self.drawEdgeLabels(null, "nodelink_diagram_div", null);
                break;
        
            default:
                self.selectedAttribute = "NL";
                self.drawNodeLabels(null,"#colorbar_labels", null);
                self.drawNodeLabels(null, "nodelink_diagram_div", null);
                break;
        }


    }

    fillCommunityDetailTable(communityInformation, numberofTimesWithEdges, totalNumberofTimes)
    {
        $("#name_detailDiv").text("Community detail");

        $("#label_metric1").text("Number of nodes");
        $("#value_metric1").text(communityInformation.graph.nodes.length);

        $("#label_metric2").text("Number of intra-comm. edges");
        $("#value_metric2").text(communityInformation.graph.links.length);

        $("#label_metric3").text("Number of timestamps");
        $("#value_metric3").text(totalNumberofTimes);

        $("#label_metric4").text("Number of timestamps with edges");
        $("#value_metric4").text(numberofTimesWithEdges);

        $("#label_metric5").text("");
        $("#value_metric5").text("");
        //$("#statistics_table tr").last().remove() //remove last row as we don't have any information to put in there.
    }

    /** Method to find all the communities containing the selected node. */
    findCommunitiesContainingNode(nodeId) {

        // checking all the communities and their nodes for the selected nodeId
        return self.data.filter(community =>
            // if nodeId is in the community's nodes, returns a filtered array of these communities
            community.graph.nodes.some(node => node.id === nodeId)
        );
    }

    /** Method to highlight the given supernode in (Super) Node-link Diagram. WORK IN PROGRESS */
    highlightSelectedNodeCommunityInSuperNodeLink(communityId) {
        //
        const superNodes = d3.select("#svgNodeLink_SuperNode").selectAll(".superNode");

        superNodes.forEach(superNode => {
            superNode.classList.remove("selectedSuperNode"); // unselecting all supernodes
            // if node is in supernode
                // superNode.classList.add("selectedSuperNode"); // select that supernode
        });
    }

    /** Method to highlight/show the given communities in global view. */
    highlightSelectedCommunitiesInGlobalView(communities) {
        // gets the IDs of all the communities
        const communityIds = communities.map(community => community.id_community);

        const circles = d3.select("#svg_global_view").selectAll("circle");
        const donut = d3.select(".groupCommunities").selectAll("path");

        circles.style("opacity", 0.1); // unselects the previously selected node's communities
        donut.style("opacity", 0.1); // --//--

        communityIds.forEach(id => { // changing visibility of these community elements in global view
            d3.selectAll(`circle[communityId='${id}']`).style("opacity", 1);
            d3.selectAll(`path[communityId='${id}']`).style("opacity", 1);
        });
    }

    drawNodeLinkFromGlobalView(communityId)
    {
        $("#nextCommunitiesContainer").remove();
        $("#previousCommunitiesContainer").remove();
        //$("#checkCommunitiesContainer").remove()

        self.resetNodeLinks();
        self.resetLineChart();

        informationClickedCommunity_globalview = self.data.filter(a => a.id_community == communityId)[0];

        // check the handleSelectChange(event) value, for node or edge, draw the corresponding labels only
        switch (self.selectedAttribute) {
            case "NL":
                self.drawNodeLabels(informationClickedCommunity_globalview, "nodelink_diagram_div", "force");
                break;
            case "EL":
                self.drawEdgeLabels(informationClickedCommunity_globalview, "nodelink_diagram_div", "force");
                break;
            default:
                self.drawNodeLabels(informationClickedCommunity_globalview, "nodelink_diagram_div", "force");
                self.drawEdgeLabels(informationClickedCommunity_globalview, "nodelink_diagram_div", "force");
                break;
        }
        // self.drawNodeLabels(informationClickedCommunity_globalview, "nodelink_diagram_div", "force");
        // self.drawEdgeLabels(informationClickedCommunity_globalview, "nodelink_diagram_div", "force");
        

        /* ---------------------- Container for 'view supernode diagram' button -----------------------*/
        this.previousCommunitiesContainer = document.createElement('div');
        this.previousCommunitiesContainer.setAttribute('class', 'previousCommunitiesContainer');
        this.previousCommunitiesContainer.setAttribute('id', 'previousCommunitiesContainer');
        this.previousCommunitiesContainer.setAttribute('style', `width: 5%`);

        
        /* ---------------------- Container for 'view nodelink diagram' button -----------------------*/
        this.nextCommunitiesContainer = document.createElement('div');
        this.nextCommunitiesContainer.setAttribute('class', 'nextCommunitiesContainer');
        this.nextCommunitiesContainer.setAttribute('id', 'nextCommunitiesContainer');
        this.nextCommunitiesContainer.setAttribute('style', `width: 5%`);

        /* ---------------------- Container for 'enable edge bundle nodelink diagram' button -----------------------*/
        
        if (!document.getElementById('edgeBundlingButton')) {
            this.edgeBundlingButton = document.createElement('span');
            this.edgeBundlingButton.setAttribute('class', 'edgeBundlingButton'); 
            this.edgeBundlingButton.setAttribute('id', 'edgeBundlingButton');
            this.edgeBundlingButton.append(document.createTextNode('Edge Bundling'));

        }

        // Simple checkbox for edge bundling option
        if (!document.getElementById('checkCommunitiesContainer')) {
            this.checkCommunitiesContainer = document.createElement('input');
            this.checkCommunitiesContainer.setAttribute("type", "checkbox");
            //this.checkCommunitiesContainer.setAttribute("checked", "checked");
            this.checkCommunitiesContainer.setAttribute('id', 'checkCommunitiesContainer');
            this.checkCommunitiesContainer.setAttribute('class', 'checkBoxEdgeBundlingOption1');


            //this.checkCommunitiesContainer.setAttribute("disabled", "true"); //Descomentar para habilitar edge bundling

        }


        //checkbox with CSS for edge bundling
        /*this.checkCommunitiesContainer = document.createElement('div');
        if (nodeLinkWithoutEdgeBundling) {
            this.checkCommunitiesContainer.setAttribute('class', 'notCheckedCommunitiesContainer');
            this.checkCommunitiesContainer.setAttribute('id', 'checkCommunitiesContainer');
            this.checkCommunitiesContainer.setAttribute('style', `width: 5%`);
            this.checkCommunitiesContainer.setAttribute('title', 'Click to enable edge bundle');
        } else {
            this.checkCommunitiesContainer.setAttribute('class', 'checkedCommunitiesContainer');
            this.checkCommunitiesContainer.setAttribute('id', 'checkCommunitiesContainer');
            this.checkCommunitiesContainer.setAttribute('style', `width: 5%`);
            this.checkCommunitiesContainer.setAttribute('title', 'Click to disable edge bundle');
        }
        */

        

        $(`#nodelink_diagram_div`).append(this.previousCommunitiesContainer);
        $(`#nodelink_diagram_div`).append(this.nextCommunitiesContainer);
        // $(`#nodelink_diagram_div`).append(this.checkCommunitiesContainer);
        // $(`#nodelink_diagram_div`).append(this.edgeBundlingButton);
        $('#nodelink_diagram_div').css('visibility', 'visible');
        
        
        
        

        const communityInformationCopy_forNodeLevel = JSON.parse(JSON.stringify(informationClickedCommunity_globalview));
        const communityInformationCopy_forSuperNodeLevel = JSON.parse(JSON.stringify(informationClickedCommunity_globalview));

        if(informationClickedCommunity_globalview.graph.nodes.length <= parseInt(document.getElementById("rs-rangeSampling-line_minimumSizeForSuperNode").value)) //community not big enough to compute multilevel supernode 
        {
            original_node_data = null;
            $("#idLabelNodeLink").text("Node-link Diagram");
            $("#nextCommunitiesContainer").addClass("disabledDiv");
            $("#previousCommunitiesContainer").addClass("disabledDiv");
            if(nodeLinkWithoutEdgeBundling)
                self.drawNodeLink(communityInformationCopy_forNodeLevel, "nodelink_diagram_div", "force");
            else
                self.drawNodeLinkWithEdgeBundle(communityInformationCopy_forNodeLevel, "nodelink_diagram_div", "force");
        }
        else
        {
            $("#idLabelNodeLink").text("(Super) Node-link Diagram");
            $("#nextCommunitiesContainer").attr('title', 'Go to node-level diagram');
            $("#previousCommunitiesContainer").addClass("disabledDiv");
            $("#previousCommunitiesContainer").attr('title', 'You are already with the supernode-level diagram');
            if (nodeLinkWithoutEdgeBundling)
                self.drawNodeLinkSuperNode(communityInformationCopy_forSuperNodeLevel, "nodelink_diagram_div", "force");
            else
                self.drawNodeLinkSuperNodeWithEdgeBundle(communityInformationCopy_forSuperNodeLevel, "nodelink_diagram_div", "force");
        }

        var height_svgNodeLink_SuperNode = $("#svgNodeLink_SuperNode").height();
        var height_svgNodeLink = $("#svgNodeLink").height();

        $('#checkCommunitiesContainer').click(function(){
            // Changing to the inverse state of the boolean
            nodeLinkWithoutEdgeBundling = !nodeLinkWithoutEdgeBundling

            self.drawNodeLinkFromGlobalView(communityId)
        });

        //Go to the node-link-level diagram
        $('#nextCommunitiesContainer').click(function(){

            if(height_svgNodeLink == undefined)
            {
                if(nodeLinkWithoutEdgeBundling)
                    self.drawNodeLink(communityInformationCopy_forNodeLevel, "nodelink_diagram_div", "force");
                else
                    self.drawNodeLinkWithEdgeBundle(communityInformationCopy_forNodeLevel, "nodelink_diagram_div", "force");
                
                height_svgNodeLink = $("#svgNodeLink").height();
            }

            $("#idLabelNodeLink").text("Node-link Diagram");
            d3.select("#svgNodeLink_SuperNode").attr("visibility","hidden").attr("height","1px");
            d3.select("#svgNodeLink").attr("visibility","visible").attr("height", height_svgNodeLink + "px");
            
            $("#nextCommunitiesContainer").addClass("disabledDiv");
            $("#nextCommunitiesContainer").attr('title', 'You are already with the node-level diagram');
            $("#previousCommunitiesContainer").removeClass("disabledDiv");
            $("#previousCommunitiesContainer").attr('title', 'Go to supernode-level diagram');


            //If there is a supernode selected, select all node members.
            if($('#svgNodeLink_SuperNode .selectedSuperNode').length > 0)
            {
                var selectedCommunityId = $('#svgNodeLink_SuperNode .selectedSuperNode').attr("community")
                // [0].attributes[1].value;
                $('#svgNodeLink circle').css('opacity', '0.1');

                original_node_data.filter(d => d.community == selectedCommunityId).forEach(function(d){
                    $('#svgNodeLink').find('circle[nodeId = ' + d.key + ']').css('opacity', '1'); //d.key is the node id
                })
                $('#svgNodeLink line').css('opacity', '0.1');
            }
            else
            {
                //if there is no selected supernode, reset eventual selection made on TAM.
                $('#tam_svg_g').find('rect').css('opacity', '1');
            }


        });

        //Go to the supernode-link-level diagram
        $('#previousCommunitiesContainer').click(function(){


            $("#idLabelNodeLink").text("(Super) Node-link diagram");
            if(height_svgNodeLink_SuperNode == undefined)
            {
                
                if (nodeLinkWithoutEdgeBundling)
                    self.drawNodeLinkSuperNode(communityInformationCopy_forSuperNodeLevel, "nodelink_diagram_div", "force");
                else
                    self.drawNodeLinkSuperNodeWithEdgeBundle(communityInformationCopy_forSuperNodeLevel, "nodelink_diagram_div", "force");
                
                height_svgNodeLink_SuperNode = $("#svgNodeLink_SuperNode").height();
            }

            d3.select("#svgNodeLink").attr("visibility","hidden").attr("height","1px");
            d3.select("#svgNodeLink_SuperNode").attr("visibility","visible").attr("height", height_svgNodeLink_SuperNode + "px");


            $("#previousCommunitiesContainer").addClass("disabledDiv");
            $("#previousCommunitiesContainer").attr('title', 'You are already with the supernode-level diagram');
            $("#nextCommunitiesContainer").removeClass("disabledDiv");
            $("#nextCommunitiesContainer").attr('title', 'Go to node-level diagram');
        });

        


        var lineChartData = d3.nest()
            .key(d => d.t)
            .rollup(function(v){ return v.length})
            .entries(informationClickedCommunity_globalview.graph.links, lineChartData);


        //include timestamps with no edges
        var minMaxTimestamp = informationClickedCommunity_globalview.timeslice.split(' ');

        var minTimestamp = parseInt(minMaxTimestamp[0], 10);
        var maxTimestamp = parseInt(minMaxTimestamp[1], 10);

        self.fillCommunityDetailTable(informationClickedCommunity_globalview, lineChartData.length, maxTimestamp - minTimestamp + 1);

        for(var i = minTimestamp; i <= maxTimestamp; i++)
        {
            if(!lineChartData.some(elemento => elemento.key === i.toString() )) //if timestamp has no edge, it does not exist yet. Create it with zero edges.
                lineChartData.push({"key": i.toString(), "value": 0});
        }

        // self.drawNodeLabels(informationClickedCommunity_globalview, "nodelink_diagram_div", "force");
        // self.drawEdgeLabels(informationClickedCommunity_globalview, "nodelink_diagram_div", "force");

    }

    highlightCorrespondingCellTaxonomyMatrix()
    {

        d3.select(".communityClicked_TaxonomyMatrix").classed("communityClicked_TaxonomyMatrix", false);
        var structuralCategory = informationClickedCommunity_globalview.structural_taxonomy;
        var temporalCategory = informationClickedCommunity_globalview.temporal_taxonomy1 + " " + informationClickedCommunity_globalview.temporal_taxonomy2;
        var evolutionCategory = informationClickedCommunity_globalview.evolution_taxonomy;
        //d3.select("#matrix_taxonomies svg").selectAll(".square").nodes().filter(a => a.__data__.category == 'low_connectivity continuous dispersed ')
        var a = d3.select("#matrix_taxonomies svg").selectAll(".square").nodes().filter(function(a)
        {

            var categories = a.__data__.category.split(";");

            if(matrixX === 'ST' || matrixY === 'ST')
                if(categories[0] != structuralCategory)
                    return false;
            if(matrixX === 'TT' || matrixY === 'TT')
                if(categories[1] != temporalCategory)
                    return false;
            if(matrixX === 'ET' || matrixY === 'ET')
                if(categories[2] != evolutionCategory)
                    return false;

            return  true;
        });
        d3.select(a[0]).classed("communityClicked_TaxonomyMatrix", true);
        d3.select(a[0]).dispatch('click'); //highlight communities in globalview from this new matrix highlighted group

    }
    
    highlightSelectedCommunityInGlobalView(communityId) {

        const circles = d3.select(".circles").selectAll("circle");
       
        const pathsTaxonomy = d3.select(".groupCommunities").selectAll("path");
        
        circles.style("opacity", 0.1);
        pathsTaxonomy.style("opacity", 0.1);
    
        d3.select(".communityClicked_globalView").style("opacity",1)
        d3.selectAll(`path[communityId='${communityId}']`).style("opacity", 1);;

    }

    drawTemporalActivityMapFromGlobalView()
    {
        //self = this;
        var divId = "temporal_activity_map_div";
        var orderingCriterion = "nodeMetadata";


        self.resetTemporalActivityMap();

        //let zoom = d3.zoom()
        //    .scaleExtent([0.25, 10])
        //    .on('zoom', handleZoom);

        var margin = {top: 30, right: 30, bottom: 50, left: 50};
        var width = $("#" + divId).width();
        var height = $("#" + divId).height();


        // Adds the svg canvas
        var svgContainer = d3.select("#" + divId)
        .append("svg")
        .attr("id","tamSVG")
            .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("position","relative")
            .style("width","95%");
          //  .attr("width", width + margin.left + margin.right)
           // .attr("height", height + margin.top + margin.bottom)
        var svg = svgContainer.append("g")
        .attr("id", "tam_svg_g")
        .attr("transform",
                "translate(" + margin.left + ",0)")
            //    "translate(" + margin.left + ",50\%)");
        .style("position","absolute");
        //.style("top", "50%")
        //.style("right", "50%")




            //.attr("transform",
            //    //"translate(" + margin.left + ",0)");
            //    "translate(" + margin.left + ",50\%)");

        //svg.call(zoom);
       // svg.on("dblclick.zoom", restartXScale);

       svgContainer.on("contextmenu", function(d,i) //right click on mouse reset selection and zoom
        {
        
            $('#svgNodeLink circle').css('opacity', '1');
            $('#svgNodeLink line').css('opacity', '1');
            $('#tam_svg_g').find('rect').css('opacity', '1');
            
            //reset supernode selection, the line below works even when there is no supernode diagram created.
            $('#svgNodeLink_SuperNode circle').removeClass("selectedSuperNode").css('opacity', '1');
            $('#svgNodeLink_SuperNode line').css('opacity', '1');


            d3.event.preventDefault();

            /*self.container.transition()
                        .duration(750)
                        .call(self.zoom.transform, d3.zoomIdentity);*/
        });



          //include timestamps with no edges
        var minMaxTimestamp = informationClickedCommunity_globalview.timeslice.split(' ');

        var minTime = parseInt(minMaxTimestamp[0], 10);
        var maxTime = parseInt(minMaxTimestamp[1], 10);

        function* range(start, end, step) {
            while (start <= end) {
                yield start;
                start += step;
            }
        }

        // Build X scales and axis:
        var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(Array.from(range(minTime,maxTime,1)))
        .padding(0.01);


        var nodesIds = informationClickedCommunity_globalview.graph.nodes.map(function(d){return parseInt(d.id) });

        var nodesInRightPosition = nodesIds; //by default, the ordering is given by the order of ids given in the graph construction (probably this means appearance node ordering)

        if(orderingCriterion === "nodeMetadata")
        {
            var pos = []
            var nodesPerCategory = d3.nest()
                .key(function(d) { return d.category;})
                .entries(self.nodeMetadata);

            nodesPerCategory = nodesPerCategory.sort((a,b) => (a.key > b.key) ? 1 : ((b.key > a.key) ? -1 : 0));

            var categories = nodesPerCategory.map(function(d){return d.key })
            categories.forEach(function (category) {
                var nodesThisCategory = nodesPerCategory.filter(a=> a.key == category)[0];
                for(var i = 0; i < nodesThisCategory.values.length; i++)
                {
                    if(nodesIds.includes(nodesThisCategory.values[i].nodeId))
                        pos.push(nodesThisCategory.values[i].nodeId);
                }
            });

            nodesInRightPosition = pos;


        }

        var maxSquareSide = 7;
        var requiredSpace = nodesIds.length * maxSquareSide;
        var verticalTranslation = 0.25;

        //if(height > requiredSpace + 50 + requiredSpace * verticalTranslation) //50 because of the empty space followed by x-axis
        //    $('#tam_svg_g').css("transform", "translate(2.5\%," + (verticalTranslation * 100) + "\%)");




        // Build Y scales and axis:
        var y = d3.scaleBand()
        .range([ 0, height > requiredSpace ? requiredSpace : height])
        .domain(nodesInRightPosition)
        .padding(0.01);


        // Add Y label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - ((height > requiredSpace ? requiredSpace : height) / 2))
            .attr("dy", "1.3em")
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Nodes");   


        //svg.append("g")
        //.call(d3.axisLeft(y));

        //Use a scaleLinear only for the x-axis. This is needed in order to both linechart and temporal activity map have equal ticks.
       /* var xForAxis = d3.scaleLinear()
        .domain([minTime,maxTime])
        .range([ 0, width ]);

        svg.append("g")
        .attr("transform", "translate(0," + (height > requiredSpace + 30 ? requiredSpace + 30 : height) + ")")
        .call(d3.axisBottom(xForAxis));
        */

        // Build color scale
        var myColor = d3.scaleLinear()
        .range(["white", "#69b3a2"])
        .domain([0,1])


        // create a tooltip
        var tooltip = d3.select("#" + divId)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function(_d) {
            tooltip.style("opacity", 1)
        }
        var mousemove = function(d) {

            var tooltipMetadata = self.tooltipNodeMetada.filter(function (a) {
                return  a.nodeId == d.nodeId;
            });

            var tooltipMetadataInformation = "";

                    if(tooltipMetadata.length > 0)
                    {
                        for (const [key, value] of Object.entries(tooltipMetadata[0])) 
                        {
                            if (key == 'nodeId') continue;
                            tooltipMetadataInformation += "<br>" + key + ": " + value;
                        }
                    }

            tooltip
            .html("Node id: " + d.nodeId + "<br>Time: " + d.time + "<br>Category: " + d.category + "<br>" + tooltipMetadataInformation)
            //.style("left", (d3.mouse(this)[0]+400) + "px")
            //.style("top", (d3.mouse(this)[1] + 200) + "px")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY) + "px")
        }
        var mouseleave = function(_d) {
            tooltip
                .html('')
                .style("opacity", 0);
        }

        var nodesPerTime = [];
        for(var i = 0; i < informationClickedCommunity_globalview.graph.links.length; i++)
        {
            var s, t;
            if(informationClickedCommunity_globalview.graph.links[i].source.id === undefined) //the information is in .source and .target, not in their id attribute.
            {
                var sourceCommunity = original_node_data == null ? '' : original_node_data.filter(a => a.key == informationClickedCommunity_globalview.graph.links[i].source)[0].community;
                var targetCommunity = original_node_data == null ? '' : original_node_data.filter(a => a.key == informationClickedCommunity_globalview.graph.links[i].target)[0].community;
                var s = {'id': informationClickedCommunity_globalview.graph.links[i].t + "," + informationClickedCommunity_globalview.graph.links[i].source, 'time': informationClickedCommunity_globalview.graph.links[i].t, 'nodeId': informationClickedCommunity_globalview.graph.links[i].source, 'category': self.nodeMetadata.filter(a => a.nodeId == informationClickedCommunity_globalview.graph.links[i].source)[0].category, 'superNodeCommunity': sourceCommunity, 'value': 1};
                var t = {'id': informationClickedCommunity_globalview.graph.links[i].t + "," + informationClickedCommunity_globalview.graph.links[i].target, 'time': informationClickedCommunity_globalview.graph.links[i].t, 'nodeId': informationClickedCommunity_globalview.graph.links[i].target, 'category': self.nodeMetadata.filter(a => a.nodeId == informationClickedCommunity_globalview.graph.links[i].target)[0].category, 'superNodeCommunity': targetCommunity, 'value': 1};
                
            }
            else
            {
                var sourceCommunity = original_node_data == null ? '' : original_node_data.filter(a => a.key == informationClickedCommunity_globalview.graph.links[i].source.id)[0].community;
                var targetCommunity = original_node_data == null ? '' : original_node_data.filter(a => a.key == informationClickedCommunity_globalview.graph.links[i].target.id)[0].community;
                var s = {'id': informationClickedCommunity_globalview.graph.links[i].t + "," + informationClickedCommunity_globalview.graph.links[i].source.id, 'time': informationClickedCommunity_globalview.graph.links[i].t, 'nodeId': informationClickedCommunity_globalview.graph.links[i].source.id, 'category': self.nodeMetadata.filter(a => a.nodeId == informationClickedCommunity_globalview.graph.links[i].source.id)[0].category, 'superNodeCommunity': sourceCommunity, 'value': 1};
                var t = {'id': informationClickedCommunity_globalview.graph.links[i].t + "," + informationClickedCommunity_globalview.graph.links[i].target.id, 'time': informationClickedCommunity_globalview.graph.links[i].t, 'nodeId': informationClickedCommunity_globalview.graph.links[i].target.id, 'category': self.nodeMetadata.filter(a => a.nodeId == informationClickedCommunity_globalview.graph.links[i].target.id)[0].category, 'superNodeCommunity': targetCommunity, 'value': 1};
                
            }
            if (!nodesPerTime.some(function(value) {return value.id === s.id}))
                nodesPerTime.push(s);
            if (!nodesPerTime.some(function(value) {return value.id === t.id}))
                nodesPerTime.push(t);
        }


        // add the squares

        svg.selectAll()
            .data(nodesPerTime, function(d) {return d.time+':'+d.nodeId+':'+ d.category + ':'+d.value;})
            .enter()
            .append("rect")
            .attr("x", function(d) { return x(d.time) })
            .attr("y", function(d) { return y(d.nodeId) })
            .attr("nodeCategory", function(d) { return d.category;})
            .attr("community", function(d) { return d.superNodeCommunity;})
            .attr("nodeId", function(d) { return d.nodeId;})
            .attr("width", x.bandwidth() > maxSquareSide ? maxSquareSide : x.bandwidth)
            .attr("height", y.bandwidth() > maxSquareSide ? maxSquareSide : y.bandwidth )
            .style("fill", function(d) { return self.nodeColorScale(d.category)} )
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .on("click", function(d,i) //right click on mouse reset selection and zoom
            {
            
                $('#tam_svg_g').find('rect').css('opacity', '1');
                    $('#tam_svg_g').find('rect[nodeId != ' + d.nodeId + ']').css('opacity', '0.1');

                    $('#svgNodeLink circle').css('opacity', '1');
                    $('#svgNodeLink').find('circle[nodeId != ' + d.nodeId + ']').css('opacity', '0.1');
                    $('#svgNodeLink line').css('opacity', '0.1');

                /*self.container.transition()
                            .duration(750)
                            .call(self.zoom.transform, d3.zoomIdentity);*/
            });



        var lineChartData = d3.nest()
            .key(d => d.t)
            .rollup(function(v){ return v.length})
            .entries(informationClickedCommunity_globalview.graph.links);

        for(var i = minTime; i <= maxTime; i++)
            {
                if(!lineChartData.some(elemento => elemento.key === i.toString() )) //if timestamp has no edge, it does not exist yet. Create it with zero edges.
                    lineChartData.push({"key": i.toString(), "value": 0});
            }

        self.drawLineChart(informationClickedCommunity_globalview.graph, lineChartData, svgContainer, margin, width);

        function handleZoom(_e) {
            svg
                .attr("transform", d3.event.transform)
        }

        function restartXScale() {

            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }

        tamSvg = svgContainer;
       
    


    }

    /*

    drawNodeLinkCircular(graph, divId)
    {


        var widthNodeLink = $("#" + divId ).width();
        var heightNodeLink = $("#" + divId ).height();

        var nodes = graph.nodes;
        var links = graph.links;

        // evenly spaces nodes along arc
        var circleCoord = function(node, index, num_nodes){
            var circumference = circle.node().getTotalLength();
            var pointAtLength = function(l){return circle.node().getPointAtLength(l)};
            var sectionLength = (circumference)/num_nodes;
            var position = sectionLength*index+sectionLength/2;
            return pointAtLength(circumference-position)
        }

        // fades out lines that aren't connected to node d
        var is_connected = function(d, opacity) {
            lines.transition().style("stroke-opacity", function(o) {
                return o.source === d || o.target === d ? 1 : opacity;
            });
        }

        const svg = d3.select("#" + divId ).append("svg").attr("viewBox", [0, 0,widthNodeLink, heightNodeLink])
        .attr("preserveAspectRatio", "xMidYMid meet");


        // invisible circle for placing nodes
        // it's actually two arcs so we can use the getPointAtLength() and getTotalLength() methods
        var dim = heightNodeLink*0.9;
        var circle = svg.append("path")
            //.attr("d", "M 40, "+(dim/2+40)+" a "+dim/2+","+dim/2+" 0 1,0 "+dim+",0 a "+dim/2+","+dim/2+" 0 1,0 "+dim*-1+",0")
            .attr("d", "M 150, "+(dim/2+30)+" a "+dim/2+","+dim/2+" 0 1,0 "+dim+",0 a "+dim/2+","+dim/2+" 0 1,0 "+dim*-1+",0")
            .style("fill", "none")


        var force = d3.forceSimulation(graph.nodes)
            .force("link", d3.forceLink().id((d, i) => d.id));

        force.force("link").links(graph.links);

        // set coordinates for container nodes
        nodes.forEach(function(n, i) {
            var coord = circleCoord(n, i, nodes.length)
            n.x = coord.x
            n.y = coord.y
        });

        // use this one for straight line links...
         var lines = svg.selectAll("line")
           .data(links).enter().append("line")
             .attr("class", "link")
             .attr("stroke", "black")
            .attr("stroke-width", 4)
            .attr("edgeInfo", function(d){
                return "(o" + d.source + ",d" + d.target + ",t" + d.t + ")";
            })
           .attr("x1", function(d) { return d.source.x; })
           .attr("y1", function(d) { return d.source.y; })
           .attr("x2", function(d) { return d.target.x; })
           .attr("y2", function(d) { return d.target.y; });



        var gnodes = svg.selectAll('g.gnode')
            .data(nodes).enter().append('g')
            .attr("transform", function(d) {
                return "translate("+d.x+","+d.y+")"
            })
            .classed('gnode', true);

        var node = gnodes.append("circle")
            .attr("r", 10)
            .attr("fill", function(d){
                var categoryNode = self.nodeMetadata.filter(function (a) {
                    return  a.nodeId == d.id;
                });

                return categoryNode[0] !== undefined ? self.nodeColorScale(categoryNode[0].category) : "#055000";
            })
            .attr("nodeId", function(d){
                return d.id;
            })
            .attr("class", "node")
            .on("mouseenter", function(d) {
                is_connected(d, 0)
            //    node.transition().duration(100).attr("r", 25)
            //    d3.select(this).transition().duration(100).attr("r", 30)
            })
            .on("mouseleave", function(d) {
            //    node.transition().duration(100).attr("r", 25);
                is_connected(d, 1);
            });

        //var labels = gnodes.append("text")
        //    .attr("dy", 4)
        //    .text(function(d){return d.id})
    }

    */
   

    
    // TODO here's (super) node-link diagram
    drawNodeLinkSuperNode(informationClickedCommunity_globalview, divId, nodePositioning)
    {
        var node_data = informationClickedCommunity_globalview.graph.nodes.map(d => d.id).sort();
        var edge_data = [];
        var alreadyAdded = [];

        informationClickedCommunity_globalview.graph.links.forEach(function(element){
            if(!alreadyAdded.includes(element.source + ';' + element.target))
            {
                edge_data.push({
                "source": element.source,
                "target": element.target,
                "weight": 1,
                "label": element.label
                });
                alreadyAdded.push(element.source + ';' + element.target);
            }
            else
            {
                edge_data.forEach(function(obj) {
                    if (obj.source == element.source && obj.target == element.target) {
                        obj.weight += 1;
                        //break;
                    }
                });
            }
        });

        var community = jLouvain().nodes(node_data).edges(edge_data);
        original_node_data = d3.entries(node_data);
        original_node_data.forEach(function(d){
            d.key = d.value;
        });

        var widthNodeLink = $("#" + divId ).width();
        var heightNodeLink = $("#" + divId ).height();

        const svg = d3.select("#" + divId ).append("svg").attr("id", "svgNodeLink_SuperNode").attr("viewBox", [0, 20, widthNodeLink, heightNodeLink - 30]);

        var community_assignment_result = community();
        var node_ids = Object.keys(community_assignment_result);
    
        svg.on("contextmenu", function(d,i) //right click on mouse reset selection
                {
                
                    $('#svgNodeLink_SuperNode circle').removeClass("selectedSuperNode").css('opacity', '1');
                    $('g.donut').css('opacity', '1');
                    $('#svgNodeLink_SuperNode line').css('opacity', '1');
                    $('#svgNodeLink circle').css('opacity', '1');
                    $('#svgNodeLink_SuperNode g.edges').css('opacity', '1');
                    $('#tam_svg_g').find('rect').css('opacity', '1');

                    d3.event.preventDefault();

                    /*self.container.transition()
                                .duration(750)
                                .call(self.zoom.transform, d3.zoomIdentity);*/
        });
   
        var max_community_number = 0;
        var numberNodesPerCommunity = {};

        // TODO find the place where to store node metadata with each supernodes
        node_ids.forEach(function (d) {
            original_node_data[node_data.indexOf(parseInt(d))].community = community_assignment_result[d];

            var nodeMetadata = self.nodeMetadata.filter(function (a) {
                return  a.nodeId == d;
            });
            var nodeColor = nodeMetadata[0] !== undefined ? self.nodeColorScale(nodeMetadata[0].category) : "#055000";
            var nodeLabel = nodeMetadata[0] !== undefined ? nodeMetadata[0].category : "";

            original_node_data[node_data.indexOf(parseInt(d))].label = nodeLabel;
            original_node_data[node_data.indexOf(parseInt(d))].color = nodeColor;

            max_community_number = max_community_number < community_assignment_result[d] ?
            community_assignment_result[d] : max_community_number;
    
            if(numberNodesPerCommunity[community_assignment_result[d]] == undefined)
              numberNodesPerCommunity[community_assignment_result[d]] = 1;
            else
              numberNodesPerCommunity[community_assignment_result[d]] += 1;
               
        });
    
        var color = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range([0, max_community_number]));
        var numberNodesPerCommunity_objs = Object.values(numberNodesPerCommunity);

        var size = d3.scaleLinear().range([3,10]).domain([d3.min(numberNodesPerCommunity_objs), d3.max(numberNodesPerCommunity_objs)]);

        var newNodeIds = Array.from(new Set(Object.values(community_assignment_result)));
        var newNodeData = d3.entries(newNodeIds);
        newNodeData.forEach(d => d.id = parseInt(d.key));

        var dict = {};
        for(var i = 0; i <= max_community_number; i++)
            dict[i] = [];

        //Get predominant label and average label color for each community
        var communityNested = d3.nest()
            .key(function (d) {
                return d.community;
            })
            .entries(original_node_data);
            
        var communityInformation = [];
        communityNested.forEach(function(comm){

            var labels = d3.nest()
                .key(function (d) {
                    return d.label;
                }).rollup(d => d.length)
                .entries(comm.values);

            var predominantLabel = "";
            var predominantLabelColor = "";
            var maxOccurrencesLabel = 0;

            labels.forEach(function(d){
                if(d.value > maxOccurrencesLabel)
                {
                    predominantLabel = d.key;
                    maxOccurrencesLabel = d.value;
                }
            });


            var avg_rgb_r = 0,  avg_rgb_g = 0,  avg_rgb_b = 0; 
            comm.values.forEach(function(d) {
                var colorNode = hexToRgb(d.color);
                avg_rgb_r += colorNode.r;
                avg_rgb_g += colorNode.g;
                avg_rgb_b += colorNode.b;

            })

            avg_rgb_r = Math.floor(avg_rgb_r/comm.values.length);
            avg_rgb_g = Math.floor(avg_rgb_g/comm.values.length);
            avg_rgb_b = Math.floor(avg_rgb_b/comm.values.length);

            communityInformation.push({
                "communityId": comm.key,
                "numberNodes": comm.values.length,
                "predominantLabel": predominantLabel,
                "predominantLabelColor": self.nodeColorScale(predominantLabel),
                "avgLabelColor": rgbToHex(avg_rgb_r, avg_rgb_g, avg_rgb_b)
            })
        })

        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
          
        function rgbToHex(r, g, b) {
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }

        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null;
        }

        var newEdgeData = [];
        alreadyAdded = [];

        informationClickedCommunity_globalview.graph.links.forEach(function(element){
            var s = original_node_data[node_data.indexOf(element.source)];
            var t = original_node_data[node_data.indexOf(element.target)];

            if(s == undefined)
                s = original_node_data[node_data.indexOf(element.source.id)];

            if(t == undefined)
                t = original_node_data[node_data.indexOf(element.source.id)];

            if(s.community != t.community)
            {
                if(!alreadyAdded.includes(s.community + ';' + t.community) && !alreadyAdded.includes(t.community + ';' + s.community))
                {
                    newEdgeData.push({
                        "source": s.community,
                        "target": t.community,
                        "weight": 1,
                        "edgeLabels": [element.label] 
                        });
                    alreadyAdded.push(s.community + ';' + t.community);
                }

                else
                {
                    newEdgeData.forEach(function(obj) {
                        if (obj.source == s.community && obj.target == t.community || obj.source == t.community && obj.target == s.community) {
                            obj.weight += 1;
                            obj.edgeLabels.push(element.label)
                            

                            //break;
                        }
                    });
                }
            }            
        });
        
        let utils = new Utils();
        
        // process the array and append  edge label percentages
        newEdgeData.forEach(element => {
            const percentages = utils.calculateEdgeLabelPercentages(element.edgeLabels);
            element.edgeLabelsPercentages = percentages;
        });
        
        var max_weight = d3.max(newEdgeData, function (d) {
        return d.weight
        });

        var weight_scale = d3.scaleLinear().domain([1, max_weight]).range([1, 5]);

        if(nodePositioning == "force")
        {

            // create a tooltip
            //if($("#nodelink_diagram_div .tooltip").length == 0)
                var tooltip = d3.select("#nodelink_diagram_div")
                    .append("div")
                    .style("opacity", 0)
                    .attr("class", "tooltip")
                    .style("background-color", "white")
                    .style("border", "solid")
                    .style("border-width", "2px")
                    .style("border-radius", "5px")
                    .style("padding", "3px");


            // Three function that change the tooltip when user hover / move / leave a cell
            var mouseover = function(_d) {
                tooltip.style("opacity", 1)
               /*  d3.select(this)
                     .style("stroke", "black")
                     .style("opacity", 1)*/
            }
 
            var mousemove = function(d) {
            var commInfo = communityInformation.filter(function (a) {
                return  a.communityId == d.key;
            });

                tooltip
                    // .html("#Nodes: " + commInfo[0].numberNodes + "<br>Predominant label: " + commInfo[0].predominantLabel)
                    .html("Community ID: "  + commInfo[0].communityId + "<br>Nodes: " + commInfo[0].numberNodes) 
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY) + "px")
            }

            var mouseleave = function(_d) {
                tooltip
                    .html('')
                    .style("opacity", 0)
                    .style("left", "-100px")
                    .style("top", "-100px");

            }

            let simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id((d, _i) => d.id).distance(150))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(widthNodeLink / 2, heightNodeLink / 2));

            const newCommunityNested = [];
    
            communityNested.forEach(communityNested => {
                const nodes =  utils.renameKeys(communityNested.values);
                newCommunityNested.push({nodes,community:communityNested.key});               
            });

            newCommunityNested.forEach((newCommunityNested) => {
                const { labelsPercentages } = utils.getLabelsPercentages(newCommunityNested.nodes);
                newCommunityNested.labelsPercentages = [];
                newCommunityNested.labelsPercentages.push(...labelsPercentages);
            });
            
            const colorScale = utils.colorScale(this.nodeMetadataCategories);
            
            newCommunityNested.forEach(element => {
                
                element.labelsPercentages.forEach(function(item) {
                    
                    item.color = colorScale(item.label);
                });
            });

            newCommunityNested.forEach((element) => {
                element.key = String(element.community);
                element.id = element.community;
            });

            newCommunityNested.forEach(section => {
                section.size = size(section.nodes.length);
            });

            // Create a group for nodes, links, and donuts
            var graph = svg.append("g").attr("class","graph")

            newEdgeData.forEach( edge => {
                // Iterate over the keys of the original object
                var transformedArray = [];
                Object.keys(edge.edgeLabelsPercentages).forEach(function(key) {
                    // Create a new object with the key and value
                    var newObj = {
                        label: key,
                        percentage: edge.edgeLabelsPercentages[key]
                        };
                        // Push the new object into the array
                        transformedArray.push(newObj);
                    });
                edge.transformedEdgeLabels = transformedArray

            });

            const resultArray = utils.getEdgeLabels();
        
            newEdgeData.forEach(edge => {
                edge.transformedEdgeLabels.forEach((item) => {
                    const match = resultArray.find(colorItem => colorItem.text == item.label);
                    if (match) 
                            item.color = match.rgb;
                });
            });

            // // Create links
            // const links = graph.selectAll(".link")
            // .data(newEdgeData)
            // .enter().append("line")
            // .attr("class", "link")
            // .attr("stroke", "#ccc")
            // .attr("stroke-opacity", 1)
            // .attr("stroke-width", function(d){return weight_scale(d.weight)})
            // .style("cursor", "pointer")
            // .on("mouseover", (d)=> {})
            // .on("mousemove", function (d) {

            //         let objString = null;

            //         // objString = `<strong>weight:</strong> ${d.weight} <br>`
            //         // console.log('objString',objString)
            //         // objString = Object.entries(d.edgeLabelsPercentages).map(([key, value]) => `<strong>${key}:</strong> ${value}`).join("<br>")
            //         objString = Object.entries(d).map(([key, value]) => `<strong>${key}:</strong> ${value}`).join("<br>");
                
            //         tooltip.style("opacity", 1)
            //         tooltip
            //         .html(objString)
            //         .style("left", (d3.event.pageX) + "px")
            //         .style("top", (d3.event.pageY) + "px")
            // }).on("mouseleave", mouseleave)

            // Create nodes
            var nodes = graph.selectAll(".node")
            .data(newCommunityNested)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged));

            // Append circle to nodes
            nodes.append("circle")
            .classed("superNode", true)
            .attr("r", function(d){ return d.size;})
            .attr("fill", "#e5e6e7")
            .style("stroke","none")
            .attr("community", function(d){
                return d.key;
            })
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .on("click", click)
            
            // Append donut to nodes
            const donut = nodes.append("g")
            .attr("class", "donut")
            .attr("stroke","none")
            .attr("community", function(d){
                return d.key;
            });

            const donutHoverScale = 1.1;

            // variable to store the type of coloring scheme on super node donuts depending on selected attribute
            let colorNodes = label => label.data.color;
            // if edge label is selected as attribute then make the donuts grey
            if (self.selectedAttribute === "EL") {
                colorNodes = "grey";
            }

            // Append arcs to donut
            donut.each(function(d) {

                const arcs = d3.pie().value(function(d) { return d.percentage; })(d.labelsPercentages);
                
                const arc = d3.arc()
                .innerRadius(d.size)
                .outerRadius(d.size + 3);
                

                d3.select(this).selectAll("path")
                .data(arcs)
                .enter().append("path")
                .attr("d", arc)
                .attr("fill", colorNodes)
                
                .style("cursor", "pointer")
                .on("mouseover", (d)=> {})
                .on("mousemove", function (d) {
                    tooltip.style("opacity", 1)
                    tooltip
                    .html("Label: " + d.data.label + "<br/>" + 
                            "Nodes: " + d.data.nodesCount + " (" + d.data.percentage * 100 + "%)")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY) + "px")
                    d3.select(this).transition().duration(200).attr("transform", "scale(" + donutHoverScale + ")");
                    
                })
                .on("mouseleave", function (d) {
                    tooltip
                        .html('')
                        .style("opacity", 0);
                    d3.select(this).transition().duration(200).attr("transform", "scale(1)");
                
                });
            });

            // Zoom function
            var zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .translateExtent([[0, 0], [widthNodeLink, heightNodeLink]])
            .on("zoom", handleZoom);

            svg.call(zoom);

            svg.on("dblclick.zoom", restartXScale);
            
            var edgeGroup = svg.append("g").attr("class", "edges");

            simulation
            .nodes(newCommunityNested)
            .on("tick", () => {
            
                // Remove old edges
                svg.selectAll(".edge").remove();


                // Draw edges with sections
                newEdgeData.forEach(edge => {
                    
                    const sourceNode = newCommunityNested.find(node => node.id == edge.source.id);

                    const targetNode = newCommunityNested.find(node => node.id == edge.target.id);

                    // Calculate intersection points with offset (start and end of each edge in node border)
                    const dx = targetNode.x - sourceNode.x;
                    const dy = targetNode.y - sourceNode.y;
                    const length = Math.hypot(dx, dy);
                    const nx = dx / length;
                    const ny = dy / length;

                    const sourceX = sourceNode.x + nx * (sourceNode.size + 3);
                    const sourceY = sourceNode.y + ny * (sourceNode.size + 3);
                    const targetX = targetNode.x - nx * (targetNode.size + 3);
                    const targetY = targetNode.y - ny * (targetNode.size + 3);

                    const edgeLength = Math.hypot(targetX - sourceX, targetY - sourceY);
                    let currentLength = 0;

                    // create edge with correspondent sections
                    edge.transformedEdgeLabels.forEach(section => {
                        const sectionLength = edgeLength * (parseFloat(section.percentage) / 100);
                        // variable to store the type of cooloring scheme on edges depending on selected attribute
                        let colorEdges = section.color;
                        // if node label is selected as attribute then make the edges grey
                        if (self.selectedAttribute === "NL") {
                            colorEdges = "grey";
                        }
                        edgeGroup.append("line")
                            .attr("class", "edge")
                            .attr("x1", sourceX + (currentLength / edgeLength) * (targetX - sourceX))
                            .attr("y1", sourceY + (currentLength / edgeLength) * (targetY - sourceY))
                            .attr("x2", sourceX + ((currentLength + sectionLength) / edgeLength) * (targetX - sourceX))
                            .attr("y2", sourceY + ((currentLength + sectionLength) / edgeLength) * (targetY - sourceY))
                            .attr("stroke-opacity", 1)
                            .attr("stroke-width", function(d){return weight_scale(edge.weight)})
                            .style("cursor", "pointer")
                            .attr("stroke", colorEdges) // section.color
                            .on("mouseover", (d)=> {})
                            .on("mousemove", function () {

                                     let objString = null;

                                    // objString = `<strong>weight:</strong> ${d.weight} <br>`
                                    objString = `<strong> ${section.label}:</strong> ${section.percentage}<br>`
                                    // objString = Object.entries(d.edgeLabelsPercentages).map(([key, value]) => `<strong>${key}:</strong> ${value}`).join("<br>")
                                    // objString = Object.entries(edge).map(([key, value]) => `<strong>${key}:</strong> ${value}`).join("<br>");
                                    
                                    // const filteredAttributes = section.filter(attr => attr.label || attr.)
                                    tooltip.style("opacity", 1)
                                    tooltip
                                    .html(objString)
                                    .style("left", (d3.event.pageX) + "px")
                                    .style("top", (d3.event.pageY) + "px")
                                    
                            }).on("mouseleave", mouseleave)

                        currentLength += sectionLength;
                    });
            });

            nodes.attr("transform", d => `translate(${d.x},${d.y})`);
             
        });          
            simulation.force("link")
            .links(newEdgeData);
                     
        function ticked() {
            
            nodes.attr("transform", d => `translate(${d.x},${d.y})`);
            
            links
            .attr("x1", function(d) {           return d.source.x;        })
            .attr("y1", function(d) {           return d.source.y;        })
            .attr("x2", function(d) {           return d.target.x;        })
            .attr("y2", function(d) {           return d.target.y;        })
            // node
            // .attr("cx", function(d) {           return d.x;               })
            // .attr("cy", function(d) {           return d.y;               });
        }

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d3.select(this).classed("fixed", true);
            d.fx = d.x;
            d.fy = d.y;
        }

        function clamp(x, lo, hi) {
            return x < lo ? lo : x > hi ? hi : x;
          }

        function dragged(d) {
            d.fx = clamp(d3.event.x, 0, widthNodeLink);
            d.fy = clamp(d3.event.y, 0, heightNodeLink);
            simulation.alpha(1).restart();
        }

    }
         // Function that fits the zoom of a nodelink diagram
         function fitNodeLinkZoom(_d){
            var paddingPercent = 1
            var transitionDuration = 500

            var bounds = svg.node().getBBox();
            var containerWidth = $("#nodelink_diagram_div").width();
            var containerHeight = $("#nodelink_diagram_div").height();
            var width = bounds.width;
            var height = bounds.height;
            var midX = bounds.x + width / 2;
            var midY = bounds.y + height / 2;

            // Nothing to fit
            if (width == 0 || height == 0)
                return;
            
            var scale = (paddingPercent || 0.75) / Math.max(width / containerWidth, height / containerHeight);
            scale = scale/2
            if(scale > 3)
                scale = 3 //does not increase the nodelink size more than 3x its original size.


            var translateX = -midX*(scale-1)
            var translateY = -midY*(scale-1)

            // Setting a new transform object to the fitting
            var zoomId = d3.zoomIdentity
                .translate(translateX, translateY)
                .scale(scale);

            // Fitting the zoom
            svg.transition()
                .duration(transitionDuration || 0)
                .call(zoom.transform, zoomId);
        }

        function click(event, _d) {

            delete event.fx;
            delete event.fy;
            d3.select(this).classed("fixed", false);

            $('#tam_svg_g').find('rect').css('opacity', '1');
            $('#tam_svg_g').find('rect[community != ' + event.id + ']').css('opacity', '0.1');

            $('#svgNodeLink_SuperNode circle').removeClass("selectedSuperNode").css('opacity', '0.1');
            $('g.donut').css('opacity', '0.1');
            $('#svgNodeLink_SuperNode').find('circle[community = ' + event.id + ']').addClass("selectedSuperNode").css('opacity', '1');
            $('g.donut[community=' + event.id + ']').css('opacity', '1');
            $('#svgNodeLink_SuperNode g.edges').css('opacity', '0.1');
        }


        function handleZoom(_e) {
            graph.attr("transform", d3.event.transform);
            edgeGroup.attr("transform", d3.event.transform);

        }

        function restartXScale() {

            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }
        
        // This makes the nodelink_diagram be fitted when initiated
        setTimeout(() => {svg.call(fitNodeLinkZoom) }, 1000); //descomentar
    }

    drawNodeLinkSuperNodeWithEdgeBundle(informationClickedCommunity_globalview, divId, nodePositioning)
    {
        
        var node_data = informationClickedCommunity_globalview.graph.nodes.map(d => d.id).sort();


        var edge_data = []
        var alreadyAdded = []
        informationClickedCommunity_globalview.graph.links.forEach(function(element){
            if(!alreadyAdded.includes(element.source + ';' + element.target))
            {
                edge_data.push({
                "source": element.source,
                "target": element.target,
                "weight": 1
                });
                alreadyAdded.push(element.source + ';' + element.target);
            }
            else
            {
                edge_data.forEach(function(obj) {
                    if (obj.source == element.source && obj.target == element.target) {
                        obj.weight += 1;
                        //break;
                    }
                });
            }
        });

       

        var community = jLouvain().nodes(node_data).edges(edge_data);
        original_node_data = d3.entries(node_data);
        original_node_data.forEach(function(d){
            d.key = d.value;
        });

        var widthNodeLink = $("#" + divId ).width();
        var heightNodeLink = $("#" + divId ).height();

        const svg = d3.select("#" + divId ).append("svg").attr("id", "svgNodeLink_SuperNode").attr("viewBox", [0, 20, widthNodeLink, heightNodeLink - 30]);
        //.attr("height", '100%');//

        let zoom = d3.zoom()
            .scaleExtent([0.25, 10])
            .on('zoom', handleZoom);

        svg.call(zoom);
        svg.on("dblclick.zoom", restartXScale);

        var node, links, gnodes;

        var community_assignment_result = community();
        var node_ids = Object.keys(community_assignment_result);
    
        //console.log('Resulting Community Data', community_assignment_result);

        svg.on("contextmenu", function(d,i) //right click on mouse reset selection
                {
                
                    $('#svgNodeLink_SuperNode circle').removeClass("selectedSuperNode").css('opacity', '1');
                    $('#svgNodeLink_SuperNode line').css('opacity', '1');
                    $('#svgNodeLink circle').css('opacity', '1');
                    $('#svgNodeLink line').css('opacity', '1');
                    
                    $('#tam_svg_g').find('rect').css('opacity', '1');

                    d3.event.preventDefault();

                    /*self.container.transition()
                                .duration(750)
                                .call(self.zoom.transform, d3.zoomIdentity);*/
                });
   
       
    
        var max_community_number = 0;
        var numberNodesPerCommunity = {};
        node_ids.forEach(function (d) {
            original_node_data[node_data.indexOf(parseInt(d))].community = community_assignment_result[d];

            var nodeMetadata = self.nodeMetadata.filter(function (a) {
                return  a.nodeId == d;
            });
            var nodeColor = nodeMetadata[0] !== undefined ? self.nodeColorScale(nodeMetadata[0].category) : "#055000";
            var nodeLabel = nodeMetadata[0] !== undefined ? nodeMetadata[0].category : "";

            original_node_data[node_data.indexOf(parseInt(d))].label = nodeLabel;
            original_node_data[node_data.indexOf(parseInt(d))].color = nodeColor;

            max_community_number = max_community_number < community_assignment_result[d] ?
            community_assignment_result[d] : max_community_number;
    
            if(numberNodesPerCommunity[community_assignment_result[d]] == undefined)
              numberNodesPerCommunity[community_assignment_result[d]] = 1;
            else
              numberNodesPerCommunity[community_assignment_result[d]] += 1;
               
        });
    
        var color = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range([0, max_community_number]));
        var numberNodesPerCommunity_objs = Object.values(numberNodesPerCommunity);
        var size = d3.scaleLinear().range([3,10]).domain([d3.min(numberNodesPerCommunity_objs), d3.max(numberNodesPerCommunity_objs)]);

        var newNodeIds = Array.from(new Set(Object.values(community_assignment_result)));
        var newNodeData = d3.entries(newNodeIds);
        newNodeData.forEach(d => d.id = parseInt(d.key));


        var dict = {};
        for(var i = 0; i <= max_community_number; i++)
            dict[i] = [];


        //Get predominant label and average label color for each community
        var communityNested = d3.nest()
            .key(function (d) {
                return d.community;
            })
            .entries(original_node_data);
            
        
        var communityInformation = [];
        communityNested.forEach(function(comm){

            var labels = d3.nest()
                .key(function (d) {
                    return d.label;
                }).rollup(d => d.length)
                .entries(comm.values);

            var predominantLabel = "";
            var predominantLabelColor = "";
            var maxOccurrencesLabel = 0;

            labels.forEach(function(d){
                if(d.value > maxOccurrencesLabel)
                {
                    predominantLabel = d.key;
                    maxOccurrencesLabel = d.value;
                }
            });


            var avg_rgb_r = 0,  avg_rgb_g = 0,  avg_rgb_b = 0; 
            comm.values.forEach(function(d) {
                var colorNode = hexToRgb(d.color);
                avg_rgb_r += colorNode.r;
                avg_rgb_g += colorNode.g;
                avg_rgb_b += colorNode.b;

            })

            avg_rgb_r = Math.floor(avg_rgb_r/comm.values.length);
            avg_rgb_g = Math.floor(avg_rgb_g/comm.values.length);
            avg_rgb_b = Math.floor(avg_rgb_b/comm.values.length);

            communityInformation.push({
                "communityId": comm.key,
                "numberNodes": comm.values.length,
                "predominantLabel": predominantLabel,
                "predominantLabelColor": self.nodeColorScale(predominantLabel),
                "avgLabelColor": rgbToHex(avg_rgb_r, avg_rgb_g, avg_rgb_b)
            })
        })


        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
          }
          
          function rgbToHex(r, g, b) {
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
          }

        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null;
          }



        var newEdgeData = [];
        alreadyAdded = [];
        informationClickedCommunity_globalview.graph.links.forEach(function(element){
            var s = original_node_data[node_data.indexOf(element.source)];
            var t = original_node_data[node_data.indexOf(element.target)];

            if(s == undefined)
                s = original_node_data[node_data.indexOf(element.source.id)];

            if(t == undefined)
                t = original_node_data[node_data.indexOf(element.source.id)];

            if(s.community != t.community)
            {
                if(!alreadyAdded.includes(s.community + ';' + t.community) && !alreadyAdded.includes(t.community + ';' + s.community))
                {
                    newEdgeData.push({
                        "source": s.community,
                        "target": t.community,
                        "weight": 1
                        });
                    alreadyAdded.push(s.community + ';' + t.community);
                }

                else
                {
                    newEdgeData.forEach(function(obj) {
                        if (obj.source == s.community && obj.target == t.community || obj.source == t.community && obj.target == s.community) {
                            obj.weight += 1;
                            //break;
                        }
                    });
                }


            }            
            

    });

    var max_weight = d3.max(newEdgeData, function (d) {
        return d.weight
      });
      var weight_scale = d3.scaleLinear().domain([1, max_weight]).range([1, 5]);

      

        if(nodePositioning == "force")
        {

            // create a tooltip
            //if($("#nodelink_diagram_div .tooltip").length == 0)
                var tooltip = d3.select("#nodelink_diagram_div")
                    .append("div")
                    .style("opacity", 0)
                    .attr("class", "tooltip")
                    .style("background-color", "white")
                    .style("border", "solid")
                    .style("border-width", "2px")
                    .style("border-radius", "5px")
                    .style("padding", "5px");


            // Three function that change the tooltip when user hover / move / leave a cell
            var mouseover = function(_d) {
                tooltip.style("opacity", 1)
               /*  d3.select(this)
                     .style("stroke", "black")
                     .style("opacity", 1)*/
                 }
 
                 var mousemove = function(d) {
                    var commInfo = communityInformation.filter(function (a) {
                        return  a.communityId == d.key;
                    });
 
                     tooltip
                         .html("#Nodes: " + commInfo[0].numberNodes + "<br>Predominant label: " + commInfo[0].predominantLabel)
                         .style("left", (d3.event.pageX) + "px")
                         .style("top", (d3.event.pageY) + "px")
                 }
 
                 var mouseleave = function(_d) {
                     tooltip
                         .html('')
                         .style("opacity", 0)
                         .style("left", "-100px")
                         .style("top", "-100px");
 
                 }

            let simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id((d, _i) => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(widthNodeLink / 2, heightNodeLink / 2));

            // link = svg.append("g")
            //     .attr("class", "links")
            //     .selectAll("line")
            //     .data(newEdgeData)
            //     .enter().append("line")
            //     .attr("stroke", "#ccc")
            //     .attr("stroke-opacity", 1)
            //     .attr("fill", "none")
            //     .attr("stroke-width", function(d){return weight_scale(d.weight)})
            //     .attr("edgeInfo", function(d){
            //         return "(o" + d.source + ",d" + d.target + ",t" + d.t + ")";
            //     })
            //     .classed("link", true);

            links = svg.append("g")
            .attr("class", "nodes")

            node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(newNodeData)
                .enter().append("circle")
                .classed("superNode", true)
                .attr("community", function(d){
                    return d.key;
                })
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .on("click", click)
                .attr("r", function(d){ return size(numberNodesPerCommunity[d.key]);})
                .attr("fill", function(d){
                    //return color(d.key);
                    var commInfo = communityInformation.filter(function (a) {
                        return  a.communityId == d.key;
                    });
                    //return commInfo[0].avgLabelColor;
                    return commInfo[0].predominantLabelColor;
                })
                
            var d3line = d3.line()
                .x(function(d){return d.x;})
                .y(function(d){return d.y;});



            simulation
                .nodes(newNodeData)
                .on("tick", ticked)

            simulation.force("link")
                .links(newEdgeData);

                function ticked() {
                    // link
                    // .attr("x1", function(d) {           return d.source.x;        })
                    // .attr("y1", function(d) {           return d.source.y;        })
                    // .attr("x2", function(d) {           return d.target.x;        })
                    // .attr("y2", function(d) {           return d.target.y;        });

                    node
                    .attr("cx", function(d) {           return d.x;               })
                    .attr("cy", function(d) {           return d.y;               });

                    // Run FDEB on all the links
                    var fbundling = d3.ForceEdgeBundling()
                    .nodes(simulation.nodes())
                    .edges(simulation.force('link').links().map(function(edge) {
                        return {
                            source: simulation.nodes().indexOf(edge.source),
                            target: simulation.nodes().indexOf(edge.target)
                        }
                    }));

                    var link = links.selectAll('path')
                        .data(fbundling());

                    link.exit().remove();
                    link.merge(
                        link.enter().append('path')
                                    .attr("stroke", "#ccc")
                                    .attr("stroke-width", 2)
                                    .attr("stroke-opacity", 0.3)
                                    .attr("fill", "none")
                                    .attr("edgeInfo", function(d){
                                        return "(o" + d.source + ",d" + d.target + ",t" + d.t + ")";
                                    })
                                    .classed("link", true)
                    )
                        .attr('d', d3line);
                }

            ////////////////////////////
        

        }


         // Function that fits the zoom of a nodelink diagram
         function fitNodeLinkZoom(_d){
            var paddingPercent = 1
            var transitionDuration = 500

            var bounds = svg.node().getBBox();
            var containerWidth = $("#nodelink_diagram_div").width();
            var containerHeight = $("#nodelink_diagram_div").height();
            var width = bounds.width;
            var height = bounds.height;
            var midX = bounds.x + width / 2; 
            var midY = bounds.y + height / 2;

            // Nothing to fit
            if (width == 0 || height == 0)
                return;


            var scale = (paddingPercent || 0.75) / Math.max(width / containerWidth, height / containerHeight);
            scale = scale/2
            if(scale > 3)
                scale = 3 //does not increase the nodelink size more than 3x its original size.


            var translateX = -midX*(scale-1)
            var translateY = -midY*(scale-1)

            // Setting a new transform object to the fitting
            var zoomId = d3.zoomIdentity
                .translate(translateX, translateY)
                .scale(scale);

            // Fitting the zoom
            svg.transition()
                .duration(transitionDuration || 0)
                .call(zoom.transform, zoomId);
        }

        function click(event, _d) {
            delete event.fx;
            delete event.fy;
            d3.select(this).classed("fixed", false);
            //simulation.alpha(1).restart();


            $('#tam_svg_g').find('rect').css('opacity', '1');
            $('#tam_svg_g').find('rect[community != ' + event.id + ']').css('opacity', '0.1');

            $('#svgNodeLink_SuperNode circle').removeClass("selectedSuperNode").css('opacity', '0.1');
            $('#svgNodeLink_SuperNode').find('circle[community = ' + event.id + ']').addClass("selectedSuperNode").css('opacity', '1');
            $('#svgNodeLink_SuperNode line').css('opacity', '0.1');

        }


        function handleZoom(_e) {
            links.attr("transform", d3.event.transform);
            node.attr("transform", d3.event.transform);


        }

        function restartXScale() {

            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }
        
        // This makes the nodelink_diagram be fitted when initiated
        setTimeout(() => { svg.call(fitNodeLinkZoom) }, 3000);
    }

    drawNodeLink(informationClickedCommunity_globalview, divId, nodePositioning)
    {
        
        let zoom = d3.zoom()
            .scaleExtent([0.25, 10])
            .on('zoom', handleZoom);

         // create a tooltip
        var tooltip = d3.select("#nodelink_diagram_div")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");



        var widthNodeLink = $("#" + divId ).width();
        var heightNodeLink = $("#" + divId ).height();

        const svg = d3.select("#" + divId ).append("svg").attr("id", "svgNodeLink").attr("viewBox", [0, 20, widthNodeLink, heightNodeLink - 30]);
        //.attr("height", '100%');//

        svg.call(zoom);
        svg.on("dblclick.zoom", restartXScale);

        var node, link, gnodes;

        if(nodePositioning == "force")
        {


            // Three function that change the tooltip when user hover / move / leave a cell
            var mouseover = function(_d) {
               tooltip.style("opacity", 1)
              /*  d3.select(this)
                    .style("stroke", "black")
                    .style("opacity", 1)*/
                }

                var mousemove = function(d) {
                    var categoryNode = self.nodeMetadata.filter(function (a) {
                        return  a.nodeId == d.id;
                    });

                    var tooltipMetadata = self.tooltipNodeMetada.filter(function (a) {
                        return  a.nodeId == d.id;
                    });

                
                    var tooltipMetadataInformation = "";

                    if(tooltipMetadata.length > 0)
                    {
                        for (const [key, value] of Object.entries(tooltipMetadata[0])) 
                        {
                            if(key == 'nodeId') continue;
                            tooltipMetadataInformation += "<br>" + key + ": " + value;
                        }
                    }

                    tooltip
                        .html("Node id: " + d.id + "<br>"
                                + "Category: " + categoryNode[0].category + "<br>" + tooltipMetadataInformation)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY) + "px")
                }

                var mouseleave = function(_d) {
                    tooltip
                        .html('')
                        .style("opacity", 0)
                        .style("left", "-100px")
                        .style("top", "-100px");
                }

            // let simulation = d3.forceSimulation()
            // .force("link", d3.forceLink().id((d, _i) => d.id))
            // .force("charge", d3.forceManyBody())
            // .force("center", d3.forceCenter(widthNodeLink / 2, heightNodeLink / 2));

            // TODO fix the labels bug
            const allNodeLinkLabels = informationClickedCommunity_globalview.graph.nodes.map(d => d.label);

            // Create a color scale (for each edge label)
            const color = d3.scaleOrdinal(d3.schemeCategory10).domain(allNodeLinkLabels);

            // variable to store the type of coloring scheme on edges depending on selected attribute
            let colorEdges = d => color(d.label);

            // if node label is selected as attribute then make the edges grey
            if (self.selectedAttribute === "NL") {
                colorEdges = "grey";
            }

            let simulation = d3.forceSimulation(informationClickedCommunity_globalview.graph.nodes)
                .force("link", d3.forceLink(informationClickedCommunity_globalview.graph.links).id(d => d.id))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(widthNodeLink / 2, heightNodeLink / 2));


            link = svg.append("g")
                //.attr("class", "links")
                .selectAll("line")
                .data(informationClickedCommunity_globalview.graph.links)
                .enter().append("line")
                .attr("stroke",  colorEdges)
                .attr("stroke-width", d => Math.sqrt(d.value))
                .attr("stroke-opacity", 0.3)
                .style("cursor", "pointer")
                .on("mouseover", (d)=> {})
                .on("mousemove", function (d) {
                  
                    // Exclude specified properties
                    const filteredAttributes = (({ t, key, index, source, target, ...rest }) => rest)(d);
                    let objString = null;

                    Object.keys(filteredAttributes).length === 0 ? 
                            objString = `<strong> Source: </strong> ${d.source.id} <br> <strong>Target:</strong> ${d.target.id} <br>`
                                                                 :
                            objString = Object.entries(filteredAttributes).map(([key, value]) => `<strong>${key}:</strong> ${value}`).join("<br>")

                    tooltip.style("opacity", 1)
                    tooltip
                    .html(objString)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY) + "px")
                }).on("mouseleave", mouseleave)
                //.classed("link", true);

            node = svg.append("g")
                .selectAll("circle")
                .data(informationClickedCommunity_globalview.graph.nodes)
                .enter().append("circle")
                .style("cursor", "pointer")
                .attr("r", 10)
                .attr("fill", function(d){
                    // when the selected attribute is "NL", color nodes grey
                    if (self.selectedAttribute === "EL") {
                        return "grey";
                    }

                    var categoryNode = self.nodeMetadata.filter(a => a.nodeId == d.id);

                    return categoryNode[0] !== undefined
                        ? self.nodeColorScale(categoryNode[0].category)
                        : "#055000";
                })
                .attr("nodeId", function(d){
                    return d.id;
                })
                .classed("node", true)
                .classed("fixed", d => d.fx !== undefined)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                //.on("end", dragended)
                ).on("click", click);

            svg.on("contextmenu", function(d,i) //right click on mouse reset selection
            {
            
                $('#svgNodeLink circle').css('opacity', '1');
                $('#svgNodeLink line').css('opacity', '1');
                $('#tam_svg_g').find('rect').css('opacity', '1');

                //reset supernode selection, the line below works even when there is no supernode diagram created.
                $('#svgNodeLink_SuperNode circle').removeClass("selectedSuperNode").css('opacity', '1');
                $('#svgNodeLink_SuperNode line').css('opacity', '1');

                d3.event.preventDefault();

                /*self.container.transition()
                            .duration(750)
                            .call(self.zoom.transform, d3.zoomIdentity);*/
            });

            simulation
                .nodes(informationClickedCommunity_globalview.graph.nodes)
                .on("tick", ticked)

            simulation.force("link")
                .links(informationClickedCommunity_globalview.graph.links);

                function ticked() {
                    link
                    .attr("x1", function(d) {           return d.source.x;        })
                    .attr("y1", function(d) {           return d.source.y;        })
                    .attr("x2", function(d) {           return d.target.x;        })
                    .attr("y2", function(d) {           return d.target.y;        });

                    node
                    .attr("cx", function(d) {           return d.x;               })
                    .attr("cy", function(d) {           return d.y;               });
                }

                function click(event, _d) {
                    delete event.fx;
                    delete event.fy;
                    d3.select(this).classed("fixed", false);
                    //simulation.alpha(1).restart();

                    //select node in TAM (requested by a reviewer - VIS 2022) and select the corresponding node in the node-link diagram

                    $('#tam_svg_g').find('rect').css('opacity', '1');
                    $('#tam_svg_g').find('rect[nodeId != ' + event.id + ']').css('opacity', '0.1');

                    $('#svgNodeLink circle').css('opacity', '1');
                    $('#svgNodeLink').find('circle[nodeId != ' + event.id + ']').css('opacity', '0.1');
                    $('#svgNodeLink line').css('opacity', '0.1');

                    
                    
                    
                    //update detail_div with selected node information

                    $("#name_detailDiv").text("Node detail");

                    $("#label_metric1").text("Node id");
                    $("#value_metric1").text(event.id);

                    $("#label_metric2").text("Node category");
                    var categoryNode = self.nodeMetadata.filter(function (a) {
                        return  a.nodeId == event.id;
                    });
                    $("#value_metric2").text(categoryNode == null || categoryNode == undefined ? '' : categoryNode[0].category);


                    $("#label_metric3").text('');
                    $("#value_metric3").text('');
                    if(self.nodeInfo.normalizedDegreeCentrality != undefined)
                    {
                        var nodeDegreeCent = self.nodeInfo.normalizedDegreeCentrality[informationClickedCommunity_globalview.timeslice][event.id + ''];
                        $("#value_metric3").text(nodeDegreeCent == undefined || nodeDegreeCent == -1 ? '' : nodeDegreeCent);
                        $("#label_metric3").text(nodeDegreeCent == undefined || nodeDegreeCent == -1 ? '' : "Norm. degree centrality");
                    }

                    $("#label_metric4").text('');
                    $("#value_metric4").text('');
                    if(self.nodeInfo.nodeBetweennessNormalized != undefined)
                    {
                        var nodeBetCent = self.nodeInfo.nodeBetweennessNormalized[informationClickedCommunity_globalview.timeslice][event.id + ''];
                        $("#value_metric4").text(nodeBetCent == undefined  || nodeBetCent == -1 ? '' : nodeBetCent);
                        $("#label_metric4").text(nodeBetCent == undefined  || nodeBetCent == -1 ? '' : "Approx. Norm. betweenness centrality");
                    }


                    $("#label_metric5").text('');
                    $("#value_metric5").text('');
                    if(self.nodeInfo.nodeClosenessNormalized != undefined)
                    {
                        var nodeClosCent = self.nodeInfo.nodeClosenessNormalized[informationClickedCommunity_globalview.timeslice][event.id + ''];
                        $("#value_metric5").text(nodeClosCent == undefined  || nodeClosCent == -1 ? '' : nodeClosCent);
                        $("#label_metric5").text(nodeClosCent == undefined  || nodeClosCent == -1 ? '' : "Closeness centrality");
                    }

                    // Highlight the selected node in the global view
                    const nodeId = event.id;
                    console.log("Selected node ID:", nodeId); // checking if an actual individual node gets selected

                    const communitiesContainingNode = self.findCommunitiesContainingNode(nodeId); // finding all communities containing the selected node

                    self.highlightSelectedCommunitiesInGlobalView(communitiesContainingNode); // highlight these communities in the global view
                }


                function dragstarted(d) {
                    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                    d3.select(this).classed("fixed", true);
                    d.fx = d.x;
                    d.fy = d.y;
                }

                function clamp(x, lo, hi) {
                    return x < lo ? lo : x > hi ? hi : x;
                  }

                function dragged(d) {
                    d.fx = clamp(d3.event.x, 0, widthNodeLink);
                    d.fy = clamp(d3.event.y, 0, heightNodeLink);
                    simulation.alpha(1).restart();
                }
        }



        // Function that fits the zoom of a nodelink diagram
        function fitNodeLinkZoom(_d){
            var paddingPercent = 0.85
            var transitionDuration = 500

            var bounds = svg.node().getBBox();
            var containerWidth = $("#nodelink_diagram_div").width();
            var containerHeight = $("#nodelink_diagram_div").height();
            var width = bounds.width;
            var height = bounds.height;
            var midX = bounds.x + width / 2;
            var midY = bounds.y + height / 2;

            // Nothing to fit
            if (width == 0 || height == 0)
                return;

            
            if($("#svgNodeLink g")[1].getBoundingClientRect().height < $("#svgNodeLink").height()
                    && $("#svgNodeLink g")[1].getBoundingClientRect().width < $("#svgNodeLink").width())
                    return; // Nothing to fit (i.e., the diagram already fits in the div)
            

            var scale = (paddingPercent || 0.75) / Math.max(width / containerWidth, height / containerHeight);
            
            var translate = [containerWidth / 2 - scale * midX, containerHeight / 2 - scale * midY];

            // Setting a new transform object to the fitting
            var zoomId = d3.zoomIdentity
                .translate(translate[0], translate[1])
                .scale(scale);

            // Fitting the zoom
            svg.transition()
                .duration(transitionDuration || 0)
                .call(zoom.transform, zoomId);
        }

        

        

        function handleZoom(_e) {
            link.attr("transform", d3.event.transform);
            node.attr("transform", d3.event.transform);


        }


        function restartXScale() {

            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }
        
        // This makes the nodelink_diagram be fitted when initiated
        setTimeout(() => { svg.call(fitNodeLinkZoom) }, 3000); //descomentar

        nodeLinkSvg = svg;

    }


    drawNodeLinkWithEdgeBundle(informationClickedCommunity_globalview, divId, nodePositioning)
    {

        let zoom = d3.zoom()
            .scaleExtent([0.25, 10])
            .on('zoom', handleZoom);

         // create a tooltip
        var tooltip = d3.select("#nodelink_diagram_div")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");



        var widthNodeLink = $("#" + divId ).width();
        var heightNodeLink = $("#" + divId ).height();

        const svg = d3.select("#" + divId ).append("svg").attr("id", "svgNodeLink").attr("viewBox", [0, 20, widthNodeLink, heightNodeLink - 30]);
        //.attr("height", '100%');//

        svg.call(zoom);
        svg.on("dblclick.zoom", restartXScale);

        var node, links, gnodes;

        if(nodePositioning == "force")
        {


            // Three function that change the tooltip when user hover / move / leave a cell
            var mouseover = function(_d) {
               tooltip.style("opacity", 1)
              /*  d3.select(this)
                    .style("stroke", "black")
                    .style("opacity", 1)*/
                }

                var mousemove = function(d) {
                    var categoryNode = self.nodeMetadata.filter(function (a) {
                        return  a.nodeId == d.id;
                    });

                    tooltip
                        .html("Node id: " + d.id + "<br>Category: " + categoryNode[0].category)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY) + "px")
                }

                var mouseleave = function(_d) {
                    tooltip
                        .html('')
                        .style("opacity", 0)
                        .style("left", "-100px")
                        .style("top", "-100px");

                }

            let simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id((d, _i) => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(widthNodeLink / 2, heightNodeLink / 2));

            /*links = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(informationClickedCommunity_globalview.graph.links)
                .enter().append("line")
                .attr("stroke", "#ccc")
                .attr("stroke-width", 4)
                .attr("edgeInfo", function(d){
                    return "(o" + d.source + ",d" + d.target + ",t" + d.t + ")";
                })
                .classed("link", true);
                */
                links = svg.append("g")
                .attr("class", "links")


            node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(informationClickedCommunity_globalview.graph.nodes)
                .enter().append("circle")
                .attr("r", 10)
                .attr("fill", function(d){
                    var categoryNode = self.nodeMetadata.filter(function (a) {
                        return  a.nodeId == d.id;
                    });

                    return categoryNode[0] !== undefined ? self.nodeColorScale(categoryNode[0].category) : "#055000";
                })
                .attr("nodeId", function(d){
                    return d.id;
                })
                .classed("node", true)
                .classed("fixed", d => d.fx !== undefined)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
                ).on("click", click);

                svg.on("contextmenu", function(d,i) //right click on mouse reset selection
                {
                
                    $('#svgNodeLink circle').css('opacity', '1');
                    $('#svgNodeLink line').css('opacity', '1');
                    $('#tam_svg_g').find('rect').css('opacity', '1');

                    //reset supernode selection, the line below works even when there is no supernode diagram created.
                    $('#svgNodeLink_SuperNode circle').removeClass("selectedSuperNode").css('opacity', '1');
                    $('#svgNodeLink_SuperNode line').css('opacity', '1');

                    d3.event.preventDefault();

                    /*self.container.transition()
                                .duration(750)
                                .call(self.zoom.transform, d3.zoomIdentity);*/
                });
                
            var d3line = d3.line()
                .x(function(d){return d.x;})
                .y(function(d){return d.y;});



            simulation
                .nodes(informationClickedCommunity_globalview.graph.nodes)
                .on("tick", ticked)

                var filteredLinks = informationClickedCommunity_globalview.graph.links.filter((v,i,a)=>a.findIndex(v2=>['source','target'].every(k=>v2[k] ===v[k]))===i);

            simulation.force("link")
                //.links(informationClickedCommunity_globalview.graph.links);
                .links(filteredLinks)

                function ticked() {
                   /* link
                    .attr("x1", function(d) {           return d.source.x;        })
                    .attr("y1", function(d) {           return d.source.y;        })
                    .attr("x2", function(d) {           return d.target.x;        })
                    .attr("y2", function(d) {           return d.target.y;        });*/

                    node
                    .attr("cx", function(d) {           return d.x;               })
                    .attr("cy", function(d) {           return d.y;               });


                    //Run FDEB on all the links
                    var fbundling = d3.ForceEdgeBundling()
                    .nodes(simulation.nodes())
                    .edges(simulation.force('link').links().map(function(edge) {
                        return {
                            source: simulation.nodes().indexOf(edge.source),
                            target: simulation.nodes().indexOf(edge.target)
                        }
                    }));

                    var link = links.selectAll('path')
                        .data(fbundling());

                    link.exit().remove();
                    link.merge(
                        link.enter().append('path')
                                    .attr("stroke", "#ccc")
                                    .attr("stroke-width", 2)
                                    .attr("stroke-opacity", 0.3)
                                    .attr("fill", "none")
                                    .attr("edgeInfo", function(d){
                                        return "(o" + d.source + ",d" + d.target + ",t" + d.t + ")";
                                    })
                                    .classed("link", true)
                    )
                        .attr('d', d3line);
                        
                }

                function click(event, _d) {
                    delete event.fx;
                    delete event.fy;
                    d3.select(this).classed("fixed", false);
                    //simulation.alpha(1).restart();


                    //select node in TAM (requested by a reviewer - VIS 2022) and select the corresponding node in the node-link diagram

                    $('#tam_svg_g').find('rect').css('opacity', '1');
                    $('#tam_svg_g').find('rect[nodeId != ' + event.id + ']').css('opacity', '0.1');

                    $('#svgNodeLink circle').css('opacity', '1');
                    $('#svgNodeLink').find('circle[nodeId != ' + event.id + ']').css('opacity', '0.1');
                    $('#svgNodeLink line').css('opacity', '0.1');

                    
                    
                    //update detail_div with selected node information

                    $("#name_detailDiv").text("Node detail");

                    $("#label_metric1").text("Node id");
                    $("#value_metric1").text(event.id);

                    $("#label_metric2").text("Node category");
                    var categoryNode = self.nodeMetadata.filter(function (a) {
                        return  a.nodeId == event.id;
                    });
                    $("#value_metric2").text(categoryNode == null || categoryNode == undefined ? '' : categoryNode[0].category);


                    $("#label_metric3").text("Norm. degree centrality");
                    var nodeDegreeCent = self.nodeInfo.normalizedDegreeCentrality[informationClickedCommunity_globalview.timeslice][event.id + ''];
                    $("#value_metric3").text(nodeDegreeCent == undefined ? '' : nodeDegreeCent);

                    $("#label_metric4").text("Approx. Norm. betweenness centrality");
                    var nodeBetCent = self.nodeInfo.nodeBetweennessNormalized[informationClickedCommunity_globalview.timeslice][event.id + ''];
                    $("#value_metric4").text(nodeBetCent == undefined ? '' : nodeBetCent);

                    $("#label_metric5").text("Closeness centrality");
                    var nodeClosCent = self.nodeInfo.nodeClosenessNormalized[informationClickedCommunity_globalview.timeslice][event.id + ''];
                    $("#value_metric5").text(nodeClosCent == undefined ? '' : nodeClosCent);
                }


                function dragstarted(d) {
                    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                    d3.select(this).classed("fixed", true);
                    d.fx = d.x;
                    d.fy = d.y;
                }

                function clamp(x, lo, hi) {
                    return x < lo ? lo : x > hi ? hi : x;
                  }

                function dragged(d) {
                    d.fx = clamp(d3.event.x, 0, widthNodeLink);
                    d.fy = clamp(d3.event.y, 0, heightNodeLink);
                    simulation.alpha(1).restart();
                }

                function dragended(d) {
                    if (!d3.event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                  }
        }


        if(nodePositioning == "circular") //http://bl.ocks.org/krosenberg/989204175f68f40dfe3b
        {
            // evenly spaces nodes along arc
            var circleCoord = function(_node, index, num_nodes){
                var circumference = circle.node().getTotalLength();
                var pointAtLength = function(l){return circle.node().getPointAtLength(l)};
                var sectionLength = (circumference)/num_nodes;
                var position = sectionLength*index+sectionLength/2;
                return pointAtLength(circumference-position)
            }

            // fades out lines that aren't connected to node d
            var is_connected = function(d, opacity) {
                link.transition().style("stroke-opacity", function(o) {
                    return o.source === d || o.target === d ? 1 : opacity;
                });
            }

            //const svg = d3.select("#" + divId ).append("svg").attr("viewBox", [0, 0,widthNodeLink, heightNodeLink])
            //.attr("preserveAspectRatio", "xMidYMid meet");


            // invisible circle for placing nodes
            // it's actually two arcs so we can use the getPointAtLength() and getTotalLength() methods
            var dim = heightNodeLink*0.9;
            var circle = svg.append("path")
                //.attr("d", "M 40, "+(dim/2+40)+" a "+dim/2+","+dim/2+" 0 1,0 "+dim+",0 a "+dim/2+","+dim/2+" 0 1,0 "+dim*-1+",0")
                .attr("d", "M 150, "+(dim/2+30)+" a "+dim/2+","+dim/2+" 0 1,0 "+dim+",0 a "+dim/2+","+dim/2+" 0 1,0 "+dim*-1+",0")
                .style("fill", "none")


            var force = d3.forceSimulation(graph.nodes)
                .force("link", d3.forceLink().id((d, _i) => d.id));

            force.force("link").links(graph.links);

            // set coordinates for container nodes
            graph.nodes.forEach(function(n, i) {
                var coord = circleCoord(n, i, graph.nodes.length)
                n.x = coord.x
                n.y = coord.y
            });

            // use this one for straight line links...
            link = svg.selectAll("line")
            .data(graph.links).enter().append("line")
                .attr("class", "link")
                .attr("stroke", "#ccc")
                .attr("stroke-width", 4)
                .attr("edgeInfo", function(d){
                    return "(o" + d.source + ",d" + d.target + ",t" + d.t + ")";
                })
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });



            gnodes = svg.selectAll('g.gnode')
                .data(graph.nodes).enter().append('g')
                .attr("transform", function(d) {
                    return "translate("+d.x+","+d.y+")"
                })
                .classed('gnode', true);

            node = gnodes.append("circle")
                .attr("r", 10)
                .attr("fill", function(d){
                    var categoryNode = self.nodeMetadata.filter(function (a) {
                        return  a.nodeId == d.id;
                    });

                    return categoryNode[0] !== undefined ? self.nodeColorScale(categoryNode[0].category) : "#055000";
                })
                .attr("nodeId", function(d){
                    return d.id;
                })
                .attr("class", "node")
                .on("mouseenter", function(d) {
                    is_connected(d, 0)
                //    node.transition().duration(100).attr("r", 25)
                //    d3.select(this).transition().duration(100).attr("r", 30)
                })
                .on("mouseleave", function(d) {
                //    node.transition().duration(100).attr("r", 25);
                    is_connected(d, 1);
                });
        }

        /*var heightLegend = self.nodeMetadataCategories.length * (10+25) -25; //10 is the first circle position and 25 is the distance between circles.

        var legendRect = svg.append("g")
              .append("rect") //element in order to draw the border of the barchart
              .attr("x", 0)
              .attr("y", $("#nodelink_diagram_div").height() - heightLegend)
              .attr("width", 100)
              .attr("height", heightLegend)
              .attr("fill", "white")
              .attr("stroke", "black");
              */

       /* // Appending a text to the button created bellow
        svg.append("text")
            .attr("x", $("#nodelink_diagram_div").width() - 37)
            .attr("y", $("#nodelink_diagram_div").height() - 9)
            .style("stroke", "black")
            .text("FIT")
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");
            
        // Creating a button into the nodelink_diagram to fit when user wants to
        svg.append("g")
            .append("rect")
            .attr("id", "fit_zoom_button")
            .attr("x", $("#nodelink_diagram_div").width() - 50)
            .attr("y", $("#nodelink_diagram_div").height() - 20)
            .attr("width", 50)
            .attr("height", 20)
            .attr("fill", "transparent")
            .attr("stroke", "black")
            .on("click", fitNodeLinkZoom);*/

        // Function that fits the zoom of a nodelink diagram
        function fitNodeLinkZoom(_d){
            var paddingPercent = 0.85
            var transitionDuration = 500

            var bounds = svg.node().getBBox();
            var containerWidth = $("#nodelink_diagram_div").width();
            var containerHeight = $("#nodelink_diagram_div").height();
            var width = bounds.width;
            var height = bounds.height;
            var midX = bounds.x + width / 2;
            var midY = bounds.y + height / 2;

            // Nothing to fit
            if (width == 0 || height == 0)
                return;

            if ($("#svgNodeLink g")[1].getBoundingClientRect().height < $("#svgNodeLink").height()
                && $("#svgNodeLink g")[1].getBoundingClientRect().width < $("#svgNodeLink").width())
                return; // Nothing to fit (i.e., the diagram already fits in the div)

            var scale = (paddingPercent || 0.75) / Math.max(width / containerWidth, height / containerHeight);
            var translate = [containerWidth / 2 - scale * midX, containerHeight / 2 - scale * midY];

            // Setting a new transform object to the fitting
            var zoomId = d3.zoomIdentity
                .translate(translate[0], translate[1])
                .scale(scale);

            // Fitting the zoom
            svg.transition()
                .duration(transitionDuration || 0)
                .call(zoom.transform, zoomId);
        }


        function handleZoom(_e) {
            links.attr("transform", d3.event.transform);
            node.attr("transform", d3.event.transform);


        }

        function restartXScale() {

            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }
        
        // This makes the nodelink_diagram be fitted when initiated
        setTimeout(() => { svg.call(fitNodeLinkZoom) }, 3000); //descomentar

        nodeLinkSvg = svg;

    }


    drawNodeLabels(informationClickedCommunity_globalview, divId, nodePositioning){

        let svg = null;

        if (divId == 'nodelink_diagram_div') {
        
            $("#node-link-labels svg").remove();

            //var data1 = self.nodeMetadataCategories.slice(0).reverse();
            svg = d3.select('#node-link-labels').append("svg").attr("viewBox", [0,-4,$('#labels-list').width(),20]);
        
        } else if (divId == '#colorbar_labels'){

            $("#colorbar_labels svg").remove();

            svg = d3.select("#colorbar_labels").append("svg").attr("viewBox", [0, -4, $('#toolbar-circuit').width(), 20]);

        }
       
        // Calculating the width of the text, given d = text of the label
        function getTextWidth(d) {
            var text = d
            return text.length * 8.5
        }

        // Creating a vector to know the sizes of each text before displaying
        var labels = svg.selectAll("mylabels").data(self.nodeMetadataCategories)._enter[0];
        var dots_array = new Array(labels.length).fill(0);
        var label_array = new Array(labels.length).fill(0);

        dots_array[0] = 15
        label_array[0] = 25

        for (var i = 0; i < labels.length; i++) {
            if (i != 0){
                dots_array[i] = label_array[i - 1] + getTextWidth(labels[i - 1].__data__) + 15
                label_array[i] = label_array[i - 1] + getTextWidth(labels[i - 1].__data__) + 25
            }
        }
        
        svg.selectAll("mydots")
            .data(self.nodeMetadataCategories)
            .enter()
            .append("circle")
              .attr("cx", function(_d,i){
                  return dots_array[i]})
                //return $("#nodeLabelMetadata_div").width() - 20 - i*40})
              .attr("cy", function(_d,_i){return 5})//(i < 6) ? 10 : 30})
              .attr("r", 7)
              .style("fill", function(d){ return self.nodeColorScale(d)})
              .style("stroke", "black")
              .on("click", mouseClick);

        // Add one dot in the legend for each name.
        svg.selectAll("mylabels")
            .data(self.nodeMetadataCategories)
            .enter()
            .append("text")
                .attr("class", "nodelink_subt")
                .attr("x", function(_d,i){
                    return label_array[i]})
                //.attr("x", function(_d,i){return $("#nodeLabelMetadata_div").width() - 10 - i*40})
                .attr("y", function(_d,_i){return 10})//(i < 6) ? 10 : 30})
                .style("stroke", function(d){ return self.nodeColorScale(d)})
                .style("font-size","15px")
                .text(function(d){ return d})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle");

        function mouseClick(d){
            var colorWell = document.querySelector("#new_color")
            colorWell.addEventListener("change", changeColor);
            colorWell.old_color = self.nodeColorScale(d);
            colorWell.click();
        }

        function changeColor(e){
            var new_color = e.target.value;

            // Finding the pos of the old_color so then it`s changed
            var pos = self.colors.indexOf(e.target.old_color);

            // Changing color without checking if alredy exists or not, because if the color was
            // choosen wrong the user can rechoose it
            self.colors[pos] = new_color

            // Updating the function that maps the colors
            self.nodeColorScale = d3.scaleOrdinal(self.colors).domain(self.nodeMetadataCategories);

            if (informationClickedCommunity_globalview != null) {
                
                // Before resetting the renderizations checking if the user is seeing supernode view
                const isNormalNode = document.getElementById("nextCommunitiesContainer").classList.length >= 2 && document.getElementById("previousCommunitiesContainer").classList.length == 1 ? true : false;
                
                // Re-clicking into the selected node to re-render the visualization
                self.drawNodeLinkFromGlobalView(informationClickedCommunity_globalview.id_community);
    
                // Supernode view not selected
                if (isNormalNode)
                    document.getElementById("nextCommunitiesContainer").click();
                
                self.drawTemporalActivityMapFromGlobalView();
            }
            
            self.drawNodeLabels(informationClickedCommunity_globalview, divId, nodePositioning);
            /* update donutColors as well */
            metro.render();

        }
    }

    drawEdgeLabels(informationClickedCommunity_globalview, divId, nodePositioning){

        let svg = null;
        let uniqueEdgeLabels;

        const utils = new Utils();
        
        // if (informationClickedCommunity_globalview) {
        //
        //     const edgeLabels = informationClickedCommunity_globalview.graph.links.map(link => link.label);
        //     uniqueEdgeLabels = Array.from(new Set(edgeLabels));
        //
        //
        // } else if (!informationClickedCommunity_globalview) {
            
            uniqueEdgeLabels = this.graphEdgeLabels;
            
        // }
        
        const colorScale = utils.colorScale(uniqueEdgeLabels);

        if (divId == 'nodelink_diagram_div') {
        
            $("#node-link-labels svg").remove();

            //var data1 = self.nodeMetadataCategories.slice(0).reverse();
            svg = d3.select('#node-link-labels').append("svg").attr("viewBox", [0,-8,$('#labels-list').width(),20]);
        
        } 
        else if (divId === '#colorbar_labels'){

            $("#colorbar_labels svg").remove();

            svg = d3.select("#colorbar_labels").append("svg").attr("viewBox", [0, -4, $('#toolbar-circuit').width(), 20]);

        }
       
        // Calculating the width of the text, given d = text of the label
        function getTextWidth(d) {
            var text = d
            return text.length * 8.5
        }

        // Creating a vector to know the sizes of each text before displaying
        var labels = svg.selectAll("mylabels").data(uniqueEdgeLabels)._enter[0];
        var dots_array = new Array(labels.length).fill(0);
        var label_array = new Array(labels.length).fill(0);

        dots_array[0] = 15
        label_array[0] = 25

        for (var i = 0; i < labels.length; i++){
            if (i !== 0){
                dots_array[i] = label_array[i - 1] + getTextWidth(labels[i - 1].__data__) + 15
                label_array[i] = label_array[i - 1] + getTextWidth(labels[i - 1].__data__) + 25
            }
        }
        
        svg.selectAll("mydots")
            .data(uniqueEdgeLabels)
            .enter()
            .append("circle")
              .attr("cx", function(_d,i){
                  return dots_array[i]})
                //return $("#nodeLabelMetadata_div").width() - 20 - i*40})
              .attr("cy", function(_d,_i){return 5})//(i < 6) ? 10 : 30})
              .attr("r", 7)
              .style("fill", function(d){ return colorScale(d)})
              .style("stroke", "black")
            //   .on("click", mouseClick);

        // Add one dot in the legend for each name.
        svg.selectAll("mylabels")
            .data(uniqueEdgeLabels)
            .enter()
            .append("text")
                .attr("class", "edgeLabel_subt")
                .attr("x", function(_d,i){
                    return label_array[i]})
                //.attr("x", function(_d,i){return $("#nodeLabelMetadata_div").width() - 10 - i*40})
                .attr("y", function(_d,_i){return 10})//(i < 6) ? 10 : 30})
                .style("stroke", function(d){ return colorScale(d)})
                .style("font-size","15px")
                .text(function(d){ return d})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle");

        // function mouseClick(d){
        //     var colorWell = document.querySelector("#new_color")
        //     colorWell.addEventListener("change", changeColor);
        //     colorWell.old_color = self.nodeColorScale(d);
        //     colorWell.click();
        // }

        // function changeColor(e){
        //     var new_color = e.target.value;

        //     // Finding the pos of the old_color so then it`s changed
        //     var pos = self.colors.indexOf(e.target.old_color);

        //     // Changing color without checking if alredy exists or not, because if the color was
        //     // choosen wrong the user can rechoose it
        //     self.colors[pos] = new_color

        //     // Updating the function that maps the colors
        //     self.nodeColorScale = d3.scaleOrdinal(self.colors).domain(self.nodeMetadataCategories);

        //     if (informationClickedCommunity_globalview != null) {
                
        //         // Beforing reseting the renderizations checking if the user is seeing supernode view
        //         const isNormalNode = document.getElementById("nextCommunitiesContainer").classList.length >= 2 && document.getElementById("previousCommunitiesContainer").classList.length == 1 ? true : false;
                
        //         // Reclicking into the selected node to re-render the visualization
        //         self.drawNodeLinkFromGlobalView(informationClickedCommunity_globalview.id_community);
    
        //         // Supernode view not selected
        //         if (isNormalNode)
        //             document.getElementById("nextCommunitiesContainer").click();
                
        //         self.drawTemporalActivityMapFromGlobalView();
        //     }
            
        //     self.drawNodeLabels(informationClickedCommunity_globalview, divId, nodePositioning);
        //     /* update donutColors as well */
        //     metro.render();

        // }
    }

    drawLineChart(_graph, numberEdgesPerTimestamp, svg, margin, width)
    {

     /*   // create a tooltip
        var tooltip = d3.select("#" + divId )
            .append("div")
            .attr("class", "tooltip-line-chart tooltip-inactive");*/


        var height = 50;
        numberEdgesPerTimestamp.sort((a,b)=> (parseInt(a.key) > parseInt(b.key) ? 1 : -1));
        // set the dimensions and margins of the graph
        //var margin = {top: 10, right: 10, bottom: 25, left: 25},
        //width = $("#" + svg ).width() - margin.left - margin.right,
        //height =  $("#" + svg ).height() - margin.top - margin.bottom;

        // append the svg object to the body of the page
        //var svg = d3.select("#" + divId )
        //.append("svg")
        //.attr("width", width + margin.left + margin.right)
        //.attr("height", height + margin.top + margin.bottom)
        svg = svg.append("g")
        .attr("id", "linechart_g")
        .attr("transform",
            "translate(" + margin.left + "," + ($("#tam_svg_g")[0].getBoundingClientRect().height + margin.bottom) + ")");
        //    .style("position","absolute");


        // Add X axis
        var x = d3.scaleLinear()
        .domain([numberEdgesPerTimestamp[0].key,numberEdgesPerTimestamp[numberEdgesPerTimestamp.length -1].key])
        .range([ 0, width ]);

        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

        // Add X label
        svg.append("text")
            .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 5) + ")")
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Time");

        var maxNumberEdgesInATimestamp = Math.max.apply(Math, numberEdgesPerTimestamp.map(function(o) { return o.value; }));

        // Add Y axis
        var y = d3.scaleLinear()
        .domain([0, maxNumberEdgesInATimestamp+1])
        .range([ height, 0 ]);
        svg.append("g")
        //.call(d3.axisLeft(y).tickValues(y.ticks().filter(tick => Number.isInteger(tick))).tickFormat(d3.format('d')));
        .call(d3.axisLeft(y).tickValues(y.ticks().filter(tick => tick == d3.max(y.ticks()) || tick == y.ticks()[Math.floor(y.ticks().length/2)])));

        // Add Y label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1.3em")
            .style("text-anchor", "middle")
            .style("font-size", "18px")
            .text("#Edges");    

        // This allows to find the closest X index of the mouse:
        var bisect = d3.bisector(function(d) { return d.key; }).left;

        // Create the circle that travels along the curve of chart
        var focus = svg
        .append('g')
        .append('circle')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr('r', 8.5)
        .style("opacity", 0)

        // Create the text that travels along the curve of chart
        var focusText = svg
        .append('g')
        .append('text')
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle")

        // Add the line
        svg
        .append("path")
        .datum(numberEdgesPerTimestamp)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
        .x(function(d) { return x(d.key) })
        .y(function(d) { return y(d.value) })
        )

        // Create a rect on top of the svg area: this rectangle recovers mouse position
        svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', margin.width)
        .attr('height', margin.height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout)
        //.on("click", mousemove);

        function mousemove(){
            // recover coordinate we need
            var x0 = x.invert(d3.mouse(this)[0]);
            var i = bisect(numberEdgesPerTimestamp, x0, 1);
            var selectedTimestamp = numberEdgesPerTimestamp[i];

            focus
            .attr("cx", x(selectedTimestamp.key))
            .attr("cy", y(selectedTimestamp.value))
            focusText
            .html("x:" + selectedTimestamp.key + "  -  " + "y:" + selectedTimestamp.value)
            .attr("x", x(selectedTimestamp.key)+15)
            .attr("y", y(selectedTimestamp.value));


            //show in the node-link diagram only those nodes and edges active at selected timestamp
            /*var nodeLinkDiagramEdges = $("#nodelink_diagram_div svg g")[0].childNodes;
            var nodeLinkDiagramNodes = $("#nodelink_diagram_div svg g")[1].childNodes;
            for(var j = 0; j < nodeLinkDiagramNodes.length; j++)
                nodeLinkDiagramNodes[j].setAttribute("style","opacity:0"); //hide all nodes by default


            var nodesActiveAtSelectedTimestamp = [];
            for(var j = 0; j < nodeLinkDiagramEdges.length; j++)
            {
                nodeLinkDiagramEdges[j].setAttribute("style","opacity:0"); //hide all edges by default


                //for each edge in the node link diagram, get edge timestamp
                var edgeComponents = nodeLinkDiagramEdges[j].getAttribute("edgeInfo").split(",");
                if(edgeComponents == null) continue;
                var node1 = parseInt(edgeComponents[0].replace("(","").replace("o",""), 10);
                var node2 = parseInt(edgeComponents[1].replace("d",""), 10);
                var timestamp = parseInt(edgeComponents[2].replace("t","").replace(")",""), 10);

                //hide edges and nodes from other timestamps
                if(timestamp == parseInt(selectedTimestamp.key,10))
                {
                    nodeLinkDiagramEdges[j].setAttribute("style","opacity:1");

                    for(var k = 0; k < nodeLinkDiagramNodes.length; k++)
                    {
                        var nodeId = parseInt(nodeLinkDiagramNodes[k].getAttribute("nodeId"),10);
                        if( nodeId == node1 || nodeId == node2)
                            nodeLinkDiagramNodes[k].setAttribute("style","opacity:1");

                    }
                }


            }*/
        }


        // What happens when the mouse move -> show the annotations at the right positions.
        function mouseover() {
            focus.style("opacity", 1);
            focusText.style("opacity",1);
            //tooltip.attr("class", "tooltip-line-chart tooltip-active")



        }

        function mouseout() {
            focus.style("opacity", 0)
            focusText.style("opacity", 0);

        /*    tooltip
                //.attr("class", "tooltip-line-chart tooltip-inactive")
                .style("opacity", 0)
                .style("left", `-100px`)
                .style("top", `-100px`);*/
        }

    }


    drawInitialMatrix(xDimension, yDimension) {

        matrixX = xDimension;
        matrixY = yDimension;

        this.resetTaxonomyMatrix();


        // Get node metadata and compute nodelink color scale
        var nodesIdPerMetadataCategory = d3.nest()
         
        .key(function (d) {
            return d.category;
        })
        .entries(this.nodeMetadata);

        this.nodeMetadataCategories = nodesIdPerMetadataCategory.map(a => a.key);

        // Calculating how many categories, -10 is because we`re gonna append more colors to the
        // schemeCategory10
        var missing = this.nodeMetadataCategories.length - 10

        var gray_scale = ['#e5e6e7', '#a6a9aB', '#808184', '#57585A', '#221f20']

        // console.log("1",this.colors, gray_scale);

        if (prod_price_bool){
            for (var i = 0; i < gray_scale.length; i++){
                this.colors[i] = gray_scale[i];
            }
        }

        // console.log("2",this.colors, gray_scale);

        if (missing > 0){
            // Adding black to the array of colors
            this.colors.push('#000000')
            missing--;

            // If we get to this point missing is certainly more than 1 so let`s add random colors
            for (var i = 0; i < missing; i++) {
                var newColor = '#' + Math.floor(Math.random()*16777215).toString(16)

                // If the newColor doesn`t exist in the array add it to the array
                if (!this.colors.includes(newColor))
                    this.colors.push(newColor)
            }
        }

        this.nodeColorScale = d3.scaleOrdinal(this.colors).domain(this.nodeMetadataCategories);

        this.resetAll();

        var graphsAccordingToCombinations = d3.nest()
        .key(function (d) {
            return d.structural_taxonomy + " " +  d.temporal_taxonomy1 + " " + d.temporal_taxonomy2 + " " + d.evolution_taxonomy;
        })
        .entries(this.data);

        this.graphsAccordingToCombinations = graphsAccordingToCombinations;

        self = this;


        // TODO Convert visualization to something like https://codepen.io/LS/pen/zGwpzL


        var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below

        var matrix_height = $("#matrix_taxonomies").height() - $(".toolbar_matrix_taxonomies").height();
        var maxPossibleColumnsOrRows = 7; //7 because it is the number of columns or rows generated by the Evolution Taxonomy (which is the one with more categories)
        var ypos = 1;


        var numberRows = 0;
        var numberColumns = 0;


        if(xDimension === 'ST')
            numberColumns = self.structuralPossibilities.length;
        else if (xDimension === 'TT')
            numberColumns = self.temporalPossibilities.length;
        else if (xDimension === 'ET')
            numberColumns = self.evolutionPossibilities.length;

        if(yDimension === 'TT')
            numberRows = self.temporalPossibilities.length;
        else if(yDimension === 'ST')
            numberRows = self.structuralPossibilities.length;
        else if (yDimension === 'ET')
            numberRows = self.evolutionPossibilities.length;

        // Calculating the size of the matrix cell after knowing the number of rows and columns
        var cellHeight = matrix_height / numberRows -1;
        var cellWidth = $("#matrix_taxonomies").width() / numberColumns -1;

        var gridData = new Array();


        for (var row = 0; row < numberRows; row++) {

            gridData.push( new Array() );
            for (var column = 0; column < numberColumns; column++) {

                var key1 = "";
                var key2 = "";
                var key3 = "";

                var graphsThatFitThisCombination = self.graphsAccordingToCombinations.filter(function (a) {

                    var key1_temp = "";
                    var key2_temp = "";
                    var key3_temp = "";

                /*    if(xDimension === 'ST' && yDimension === 'ST')
                        key1_temp = self.structuralPossibilities[column != 0 ? column : row];
                    else if(xDimension === 'ST')
                        key1_temp = self.structuralPossibilities[column];
                    else if (yDimension === 'ST')
                        key1_temp = self.structuralPossibilities[row];

                    if(xDimension === 'TT' && yDimension === 'TT')
                        key2_temp = self.structuralPossibilities[column != 0 ? column : row];
                    else if(xDimension === 'TT')
                        key2_temp = self.temporalPossibilities[column];
                    else if (yDimension === 'TT')
                        key2_temp = self.temporalPossibilities[row];

                    if(xDimension === 'ET' && yDimension === 'ET')
                        key3_temp = self.structuralPossibilities[column != 0 ? column : row];
                    else if(xDimension === 'ET')
                        key3_temp = self.evolutionPossibilities[column];
                    else if (yDimension === 'ET')
                        key3_temp = self.evolutionPossibilities[row];*/

                    
                    if (xDimension === 'ST')
                        key1_temp = self.structuralPossibilities[column];
                    if (yDimension === 'ST')
                        key1_temp = self.structuralPossibilities[row];
                    
                    if (xDimension === 'TT')
                        key2_temp = self.temporalPossibilities[column];
                    if (yDimension === 'TT')
                        key2_temp = self.temporalPossibilities[row];  
                        
                    if (xDimension === 'ET')
                        key3_temp = self.evolutionPossibilities[column];
                    if (yDimension === 'ET')
                        key3_temp = self.evolutionPossibilities[row];

                    key1 = key1_temp;
                    key2 = key2_temp;
                    key3 = key3_temp;

                    return  a.key.includes(key1_temp) && a.key.includes(key2_temp) && a.key.includes(key3_temp);
                });


                var sumGraphs = 0;

                for (var i = 0; i < graphsThatFitThisCombination.length; i++)
                    sumGraphs += graphsThatFitThisCombination[i].values.length;

                gridData[row].push({
                    rowNum: row+1,
                    columnNum: column+1,
                    x: xpos,
                    y: ypos,
                    width: cellWidth,
                    height: cellHeight,
                    chord: row == 0 || column == 0 || graphsThatFitThisCombination.length == 0 ? "" : sumGraphs,
                    category: key1 + ";" + key2 + ";" + key3,
                    graphsThatFitThisCombination: graphsThatFitThisCombination

                })
                // increment the x position. I.e. move it over by width variable
                xpos += cellWidth;
            }

        // reset the x position after a row is complete
        xpos = 1;
        // increment the y position for the next row. Move it down height variable
        ypos += cellHeight;
        }

            //http://placekitten.com/g/48/48
            var grid = retrieveFiguresMatrixIndices($("#matrix_taxonomies").width(), matrix_height);

            var communitiesToHighlight = []


            var row = grid.selectAll(".row") // select .row val from data
                .data(gridData)
                .enter().append("g")
                .attr("class", "row")
                .append("g")
                .attr("class", "column");

            var column = row.selectAll(".square")
                .data(function(d) {
                  return d;
                })
                .enter()
                .append("rect")
                .attr("class", "square")
                .attr("category", function(d) {
                    return d.category;
                  })
                .attr("x", function(d) {
                  return d.x;
                })
                .attr("y", function(d) {
                  return d.y;
                })
                .attr("width", function(d) {
                  return d.width;
                })
                .attr("height", function(d) {
                  return d.height;
                })
                .style("fill", function(d) {
                    //debugger;
                    if (d.rowNum == 1)
                        return self.decideHeader(xDimension, d.columnNum);
                    else if (d.columnNum == 1)
                        return self.decideHeader(yDimension, d.rowNum);

                    return "#fff";
                  })
                .style("stroke", "#222")
                .on("click", function (d, _i) {
                    communitiesToHighlight = onMatrixCellClicked(d.graphsThatFitThisCombination, this);
                    metro.highlightSelected(communitiesToHighlight);
                });

            // Possible function to choose the text size based on the matrix dimension
            //                  \/ change this value to test out different sizes
            // var textSize = 0.005 * cellHeight * cellWidth;

            var columnText = row.selectAll(".column") // select .column val from data
                .data(function(d) {
                  return d;
                })
                .enter()
                .append("text")
                .text(function(d) {
                    if (xDimension === yDimension && d.rowNum != d.columnNum)
                        return "";
                    return d.chord;
                })
                .attr("rowNum", function(d) {
                  return d.rowNum;
                })
                .attr("columnNum", function(d) {
                  return d.columnNum;
                })
                .attr("x", function(d) {
                  return d.x + d.width / 2;
                })
                .attr("y", function(d) {
                  return d.y + d.height / 2;
                })
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("fill", "black")
                .style("font-weight", "bold")
                .style("font-size", "20")
                .style("cursor", "default")
                .on("click", function (d, _i) {

                    var cellToHighlight = d3.selectAll(".square").nodes().filter(a => a.__data__.rowNum == d.rowNum && a.__data__.columnNum == d.columnNum)[0];
                    communitiesToHighlight = onMatrixCellClicked(d.graphsThatFitThisCombination, cellToHighlight);

                    metro.highlightSelected(communitiesToHighlight);
                });

                function onMatrixCellClicked(graphsThatFitThisCombination, cell)
                {


                    if (!d3.event.ctrlKey)
                    {
                        communitiesToHighlight = []
                        d3.selectAll(".communityClicked_TaxonomyMatrix").classed("communityClicked_TaxonomyMatrix", false);
                    }



                    if (!d3.select(cell).classed("communityClicked_TaxonomyMatrix")) //Select
                    {

                        for (var i = 0; i < graphsThatFitThisCombination.length; i++)
                            for (var j = 0; j < graphsThatFitThisCombination[i].values.length; j++)
                                communitiesToHighlight.push(graphsThatFitThisCombination[i].values[j].id_community);

                        if (cell.__data__.rowNum == 1 && cell.__data__.columnNum != 1) //User clicked on a matrix header, so select all this row's columns
                        {
                            var cellsToHighlight = d3.selectAll(".square").nodes().filter(a => a.__data__.columnNum == cell.__data__.columnNum);
                            for (let i = 1; i < cellsToHighlight.length; i++)
                                d3.select(cellsToHighlight[i]).classed("communityClicked_TaxonomyMatrix", true);

                        }
                        else if(cell.__data__.columnNum == 1 && cell.__data__.rowNum !== 1) //User clicked on a matrix header, so select all this row's columns
                        {
                            var cellsToHighlight = d3.selectAll(".square").nodes().filter(a => a.__data__.rowNum == cell.__data__.rowNum );
                            for (let i = 1; i < cellsToHighlight.length; i++)
                                d3.select(cellsToHighlight[i]).classed("communityClicked_TaxonomyMatrix", true);

                        }
                        else if (cell.__data__.columnNum == 1 && cell.__data__.rowNum == 1) //Select entire matrix
                        {
                            var cellsToHighlight = d3.selectAll(".square").nodes();
                            var denieds = new Set();

                            // Selecting column headers
                            for (var i = 0; i < numberColumns; i++)
                                denieds.add(i)

                            // Selecting rows headers
                            for (var i = numberColumns, j = 1; j < numberRows; j++)
                                denieds.add(i * j)

                            // "Clicking" only in the allowed positions, which not contain headers
                            for (var i = 0; i < cellsToHighlight.length; i++)
                                if (!denieds.has(i))
                                    d3.select(cellsToHighlight[i]).classed("communityClicked_TaxonomyMatrix", true);
                        }
                        else
                            d3.select(cell).classed("communityClicked_TaxonomyMatrix", true);
                    }
                    else //deselect
                    {
                        for (var i = 0; i < graphsThatFitThisCombination.length; i++)
                            for (var j = 0; j < graphsThatFitThisCombination[i].values.length; j++)
                                communitiesToHighlight = communitiesToHighlight.filter (a => a !== graphsThatFitThisCombination[i].values[j].id_community);

                        if (cell.__data__.rowNum == 1 && cell.__data__.columnNum != 1) //User clicked on a matrix header, so select all this row's columns
                        {
                            var cellsToHighlight = d3.selectAll(".square").nodes().filter(a => a.__data__.columnNum == cell.__data__.columnNum);
                            for (let i = 1; i < cellsToHighlight.length; i++)
                                d3.select(cellsToHighlight[i]).classed("communityClicked_TaxonomyMatrix", false);

                        }
                        else if (cell.__data__.columnNum == 1 && cell.__data__.rowNum != 1) //User clicked on a matrix header, so select all this row's columns
                        {
                            var cellsToHighlight = d3.selectAll(".square").nodes().filter(a => a.__data__.rowNum === cell.__data__.rowNum );
                            for (let i = 1; i < cellsToHighlight.length; i++)
                                d3.select(cellsToHighlight[i]).classed("communityClicked_TaxonomyMatrix", false);

                        }
                        else if (cell.__data__.columnNum == 1 && cell.__data__.rowNum == 1) //Deselect entire matrix
                        {
                            var cellsToHighlight = d3.selectAll(".square").nodes();
                            var denieds = new Set();

                            // Selecting column headers
                            for (var i = 0; i < numberColumns; i++)
                                denieds.add(i)

                            // Selecting rows headers
                            for (var i = numberColumns, j = 1; j < numberRows; j++)
                                denieds.add(i * j)

                            // "Clicking" only in the allowed positions, which not contain headers
                            for (var i = 0; i < cellsToHighlight.length; i++)
                                if (!denieds.has(i))
                                    d3.select(cellsToHighlight[i]).classed("communityClicked_TaxonomyMatrix", false);
                        }
                        else
                            d3.select(cell).classed("communityClicked_TaxonomyMatrix", false);
                    }

                    return communitiesToHighlight;
                }



        function retrieveFiguresMatrixIndices(width, height)
        {
            var grid = d3.select("#matrix_taxonomies")
            .append("svg")
            .attr("class", "matrix_taxonomies_svg")
            .attr("width",width)
            .attr("height",height);

            grid.append("svg:pattern").attr("id", "continuous_dispersed").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/continuous_dispersed.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "continuous_grouped").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/continuous_grouped.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "sporadic_dispersed").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/sporadic_dispersed.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "sporadic_grouped").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/sporadic_grouped.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            /*grid.append("svg:pattern").attr("id", "no_temporal").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/no_temporal.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);*/

            /* ------------ Structural --------------- */
            grid.append("svg:pattern").attr("id", "tree").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/tree.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "star").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/star.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "circular").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/circular.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "low_connectivity").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/low_2.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "complete").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/full.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);


            /* ------------ Evolution --------------- */
            grid.append("svg:pattern").attr("id", "birth").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/birth.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "grow").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/grow.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "contract").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/contract.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "death").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/death.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "merge").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/merge.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            grid.append("svg:pattern").attr("id", "split").attr("width", cellWidth).attr("height", cellHeight).attr("patternUnits", "userSpaceOnUse")
                .append("svg:image").attr("xlink:href", '/static/assets/images/split.svg')
                .attr("width", cellWidth).attr("height", cellHeight)
                .attr("x", 0).attr("y", 0);

            return grid;
        }
    }

    decideHeader(dimension, index){
        if(dimension === 'TT') {
            switch (index) {
                case 1:
                    return "#fff";
                case 2:
                    return "url(#sporadic_dispersed)";
                case 3:
                    return "url(#sporadic_grouped)";
                case 4:
                    return "url(#continuous_dispersed)";
                case 5:
                    return "url(#continuous_grouped)";
                //case 6: return "url(#no_temporal)";
            }
        }
        else if (dimension === 'ST') {
            switch (index) {
                case 1:
                    return "#fff";
                case 2:
                    return "url(#tree)";
                case 3:
                    return "url(#star)";
                case 4:
                    return "url(#circular)";
                case 5:
                    return "url(#low_connectivity)";
                case 6:
                    return "url(#complete)";
            }
        }
        else if (dimension === 'ET') {
            switch (index) {
                case 1:
                    return "#fff";
                case 2:
                    return "url(#birth)";
                case 3:
                    return "url(#death)";
                case 4:
                    return "url(#grow)";
                case 5:
                    return "url(#contract)";
                case 6:
                    return "url(#split)";
                case 7:
                    return "url(#merge)";
            }
        }
    }
}