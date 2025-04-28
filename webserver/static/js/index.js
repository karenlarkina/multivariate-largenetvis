
var firstView;
//var networkName = "primarySchool";
var networkName = "sexual";
var colorNodeMetadata = [];
var tooltipNodeMetada = [];
var graphEdgeLabels; 
var typeSampling;
var graphInfo;
var nodeInfo;

function createViewObject(graph_taxonomy)
{
    firstView = new FirstView({
        elementId: 'first_view',
        data: graph_taxonomy,
        nodeMetadata: colorNodeMetadata, //used for node color
        tooltipMetadata: tooltipNodeMetada, //used for node tooltip
        nodeInfo: nodeInfo,
        graphEdgeLabels: graphEdgeLabels,
        onClick: function(timeViewDatum, element){
            alert('[' + graph_taxonomy.structural_taxonomy + ", " + graph_taxonomy.temporal_taxonomy + ']');
        }
    });
}


$("form").on("submit", function (e) {

    
    var formData = new FormData($("#formUploadFiles").get(0));

    // usado para radio button redes => used for radio button networks
    formData.append('network_radio_button', $('input[name=network_radio]:checked', '#formUploadFiles').val())

    var uploadSuccess = false;

    var flashMessage = function(data){
        html = '';
        for (i=0; i<data.length; i++) {
            if(data[i]['type'] != 'success') //there is no need to create an alert for successful executions, only for errors.
                html += '<div class="alert alert-' + data[i]['type'] + '"><a href="#" class="close" data-dismiss="alert">&times;</a>' + data[i].message + '</div>';
            else
                uploadSuccess = true;
        }
        return html;
      };


    let dialog = DialogManager.info('loading...');
    dialog.show();
				
    $.ajax({
        url : '/upload',
        type : "POST",
        data : formData,
        async: true,
        // both 'contentType' and 'processData' parameters are
        // required so that all data are correctly transferred
        contentType : false,
        processData : false,
        success: function (result) { //success here refers to the correct execution (i.e., no exceptions throwed) of the /upload method. The upload itself may return an error inside that method.
            var returnedData = JSON.parse(result);
            $('#flash').html(flashMessage(returnedData));
            dialog.hide();
            if(uploadSuccess)
            {
                graphInfo = JSON.parse(returnedData[0]["graphInfo"]);

                $("#network_Info_menu").html(
                    "<span> #Nodes: <span id=\"numberNodesNetwork\">" + graphInfo.numberNodes + "</span></span>" + "<br/>" +
                    "<span> #Edges: <span id=\"numberEdgesNetwork\">" + graphInfo.numberEdges + "</span></span>" + "<br/>" +
                    "<span> #Timestamps: <span id=\"numberTimestampsNetwork\">" + graphInfo.numberTimes + "</span></span>" + "<br/>" +

                    "<div id=\"numberTimeslicesDiv\">" +
                    "<span id=\"numberTimeslicesLabel\">Number of timeslices (" + 10 + ")</span>" +
                    "<br />" +
                    "<input disabled id=\"numberTimeslicesSlider\" class=\"rs-range\" type=\"range\" value=" + 10 + " min=" + 10 + " max=" + 10 + " step = 1>" + 
                    '<input disabled id="numberTimeslicesNumber" type="number" value="10">' +
                    '<p style="margin-bottom: 0; margin-top: 20px;">Select node attributes: </p>' +
                    '<select disabled id="selectNodeAttribute">' +    
                    getOptionsForSelect(graphInfo.nodeAttributes) + 
                    '</select>' +  
                    '<p style="margin-bottom: 0;">Select edge attributes: </p>' +
                    '<select disabled id="selectEdgeAttribute">' +
                    getOptionsForSelect(graphInfo.edgeAttributes) +
                    '</select>' +
                    "</div>"
                    
                );

                var rangeSliderTimeslice=  document.getElementById("numberTimeslicesSlider");
                rangeSliderTimeslice.addEventListener("input", function()
                {
                    
                    document.getElementById("numberTimeslicesLabel").innerHTML = "Number of timeslices (" + rangeSliderTimeslice.value + ")";
                    document.getElementById("numberTimeslicesNumber").value = rangeSliderTimeslice.value;
                    //var bulletPosition = (rangeSliderFilteringCommunitySize.value /rangeSliderFilteringCommunitySize.max);
                    //document.getElementById("rs-bullet_communityFiltering").style.left = (bulletPosition * 578) + "px";
                    

                }, false);
                document.getElementById("numberTimeslicesNumber").addEventListener('input', (event) => {
                    document.getElementById("numberTimeslicesLabel").innerHTML = "Number of timeslices (" + event.target.value + ")";
                    rangeSliderTimeslice.value = event.target.value;
                });

                $( "#sampling_method_input" ).show();
                $( "#range-slider_communityFiltering" ).show();
                $( "#range-slider_minimumSizeForSuperNode" ).show();
                $( "#range-slider_sigma" ).show();
                $( "#submitSampling" ).show();

                //renderIndexHTML();
            }
            else{

            }
          },
        error: function() {
            $('#flash').html('<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert">&times;</a>' + "Unknown error."  + '</div>');
        }
    });
     
        e.preventDefault();
        

     
    });



$( "#sampling_method_input" ).hide();
$( "#range-slider_communityFiltering" ).hide();
$( "#range-slider_minimumSizeForSuperNode" ).hide();
$( "#range-slider_sigma" ).hide();
$( "#submitSampling" ).hide();

$("#saveButton").hide();

$("#matrixToolbar").hide();
$("#statistics_table").hide();

// Running the model and building the views after entering parameters and pressing *Open* in sidenav
$('#submitSampling').click(function()
{
    document.getElementById(`static-global-labels`).style.display = 'none';
    $("#container-circuit").hide();
    $("#statistics_table").hide();
    $("#matrixToolbar").hide();

    $("#nodelink_diagram_div svg").remove();
    $("#nodeLabelMetadata_div svg").remove();
    $("#linechart_div svg").remove();
    $("#colorbar_circuito svg").remove();
    document.getElementById("svg_global_view").innerHTML = "";
    $("#matrix_taxonomies svg").remove();
    $("#temporal_activity_map_div svg").remove();

    
    let dialog = DialogManager.info('loading...');
    dialog.show();

    //close sidebar menu
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
    document.getElementById("menuButton").style.display = "flex";
    

    send_json_post(`/getTaxonomy?metadata_file=${document.getElementById('selectNodeAttribute').value}&edge_attribute=${document.getElementById('selectEdgeAttribute').value}`, {
        //'numberTimeslices': parseInt(document.getElementById("rs-rangeSampling-line_communityFiltering").value),
        'numberTimeslices': document.getElementById("numberTimeslicesSlider").value,
        'samplingMethod': document.getElementById("sampling_method_input").value,
        'percentageSampling': parseInt(document.getElementById("rs-rangeSampling-line").value),
        'ignoreCommunitiesLSmallerThan' : parseInt(document.getElementById("rs-rangeSampling-line_communityFiltering").value),
        'sigma': parseFloat(document.getElementById("rs-rangeSampling-line_sigma").value)
        //'ignoreCommunitiesLSmallerThan' : 5


    }, function (graph_taxonomy) {
       // dialog.hide();
        send_json_post(`/getNodeMetadata`, {}, function (graphNodeMetadata) {
            send_json_post('/getGraphEdgeLabels', {}, function (graphEdgeData){
                send_json_post('/getCommunitiesEvolution', {}, function (comunitiesEvolutionData) {
                    send_json_post('/getNodeInfo', {}, function (nodeQuantitativeInfo) {
                        
                        nodeInfo = nodeQuantitativeInfo;
                    
                        $("#matrixToolbar").show();
                        $("#container-circuit").show();
                        
                        colorNodeMetadata = graphNodeMetadata.metadataColor;
                        tooltipNodeMetada = graphNodeMetadata.metadataTooltip;
                        graphEdgeLabels = graphEdgeData
                        createViewObject(graph_taxonomy);
                        firstView.drawInitialMatrix('TT', 'ST');
                    // TODO add the value of handleSelectChange as parameter
                    firstView.drawOverview(comunitiesEvolutionData, "numberNodes");

                        send_json_post('/getGraphInfo', {}, function (graphFurtherInfo) { //graphFurtherInfo contains statistics that depend on backend execution (e.g., modularity)
                            $("#value_metric1").text(parseInt(graphInfo.numberNodes).toLocaleString('en-US', { minimumFractionDigits: 0 }));
                            $("#value_metric2").text(parseInt(graphInfo.numberEdges).toLocaleString('en-US', { minimumFractionDigits: 0 }));
                            $("#value_metric3").text(parseInt(graphInfo.numberTimes).toLocaleString('en-US', { minimumFractionDigits: 0 }));
                            //The number of comunities below does not consider minimumCommunitySize. It is dynamically fulfilled in firstview.js.
                            //$("#value_metric4").text(parseInt(graphFurtherInfo.total_numberCommunities).toLocaleString('en-US', { minimumFractionDigits: 0 })); //batata
                            $("#value_metric5").text(parseFloat(graphFurtherInfo.avg_modularity).toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 4 }));
    
                            $("#statistics_table").show();
    
                            $("#saveButton").show();
    
                            
                        });
                        
                    });
    
                    
                });
            });
            
        });

        /******* Fill statistics table ********/
        





        dialog.hide();
    });
    
    
});



$("#rs-rangeSampling-line").hide();


$('#sampling_method_input').on('change', function() {
    var defaultValue = 10; //Remove by default 10% of nodes or edges

    var rangeSliderSampling =  document.getElementById("rs-rangeSampling-line");
    var rangeBullet =  document.getElementById("rs-bullet");

    if(this.value == "noSampling")
    {
        rangeSliderSampling.value = 0;
        $("#rs-rangeSampling-line").hide();
        rangeBullet.innerHTML = "";
        typeSampling = "noSampling";

    }
    else
    {
        $("#rs-rangeSampling-line").show();

        var numberNodesNetwork = parseInt($("#numberNodesNetwork")[0].innerText);
        var numberEdgesNetwork = parseInt($("#numberEdgesNetwork")[0].innerText);
        
       
        typeSampling = this.value.toLowerCase().includes("node") ? "nodes" : "edges";
        if(typeSampling == "nodes")
            rangeBullet.innerHTML = "Discard " + defaultValue + "% of nodes (" + Math.round(defaultValue/100 * numberNodesNetwork) + ").";
        else
        rangeBullet.innerHTML = "Discard " + defaultValue + "% of edges (" + Math.round(defaultValue/100 * numberEdgesNetwork) + ").";
        rangeSliderSampling.value = defaultValue;

        rangeSliderSampling.addEventListener("input", function()
        {
            
            
            if(typeSampling == "nodes")
                rangeBullet.innerHTML = "Discard " + rangeSliderSampling.value + "% of nodes (" + Math.round(rangeSliderSampling.value/100 * numberNodesNetwork) + ").";
            else
                rangeBullet.innerHTML = "Discard " + rangeSliderSampling.value + "% of edges (" + Math.round(rangeSliderSampling.value/100 * numberEdgesNetwork) + ").";

            var bulletPosition = (rangeSliderSampling.value /rangeSliderSampling.max);
            rangeBullet.style.left = (bulletPosition * 578) + "px";
            

        }, false);
    }



});

var rangeSliderFilteringCommunitySize =  document.getElementById("rs-rangeSampling-line_communityFiltering");
rangeSliderFilteringCommunitySize.addEventListener("input", function()
{
    
    document.getElementById("rs-bullet_communityFiltering").innerHTML = "Discard communities with less than " + rangeSliderFilteringCommunitySize.value + " nodes."; 
    //document.getElementById("rs-bullet_communityFiltering").innerHTML = "Discard communities with less than " + 10 + " nodes.";
    
    var bulletPosition = (rangeSliderFilteringCommunitySize.value /rangeSliderFilteringCommunitySize.max);
    document.getElementById("rs-bullet_communityFiltering").style.left = (bulletPosition * 578) + "px";
    

}, false);

var rangeSliderminimumSizeForSuperNode =  document.getElementById("rs-rangeSampling-line_minimumSizeForSuperNode");
rangeSliderminimumSizeForSuperNode.addEventListener("input", function()
{
    
    document.getElementById("rs-bullet_minimumSizeForSuperNode").innerHTML = "Summarize communities with more than " + rangeSliderminimumSizeForSuperNode.value + " nodes.";
    
    var bulletPosition = (rangeSliderminimumSizeForSuperNode.value /rangeSliderminimumSizeForSuperNode.max);
    document.getElementById("rs-bullet_minimumSizeForSuperNode").style.left = (bulletPosition * 578) + "px";
    

}, false);

var rangeSliderSigma = document.getElementById("rs-rangeSampling-line_sigma");
rangeSliderSigma.addEventListener("input", function()
{

    
    document.getElementById("rs-bullet_sigma").innerHTML = "Use " + rangeSliderSigma.value + " as the jaccard threshold for community matching.";

    var bulletPosition = (rangeSliderSigma.value /rangeSliderSigma.max);
    document.getElementById("rs-bullet_sigma").style.left = (bulletPosition * 578) + "px";
    


}, false);

$('#changeButton').click(function()
{

    var e = document.getElementById("x");
    var valuex = e.value;

    var e = document.getElementById("y");
    var valuey = e.value;    
    firstView.drawInitialMatrix(valuex, valuey);
});

function handleSelectChange(event){
    
    const attributeType = event.target.value;

    firstView.changeGlobalViewAttribute(attributeType);

    firstView.resetNodeLinks();
}


// Set-up the export button
d3.select('#saveButton').on('click', function(){
    var svgStringTAM = getSVGString(tamSvg.node());
	svgString2Image( svgStringTAM, 3*$("#tamSVG").width(), 3*$("#tamSVG").height(), 'png', saveTAM ); // passes Blob and filesize String to the callback
    
	var svgStringNodeLink = getSVGString(nodeLinkSvg.node());
	svgString2Image( svgStringNodeLink, 3*$("#svgNodeLink").width(), 3*$("#svgNodeLink").height(), 'png', saveNL ); // passes Blob and filesize String to the callback

    //var svgStringGlobalView = getSVGString(globalViewSvg.node());
	//svgString2Image( svgStringGlobalView, 3*$("#svg_global_view").width(), 3*$("#svg_global_view").height(), 'png', saveGlobalView ); // passes Blob and filesize String to the callback
    

	function saveNL( dataBlob, filesize ){
		saveAs( dataBlob, 'node-link.png' ); // FileSaver.js function
	}

    function saveTAM( dataBlob, filesize ){
		saveAs( dataBlob, 'tam.png' ); // FileSaver.js function
    }

    //function saveGlobalView( dataBlob, filesize ){
	//	saveAs( dataBlob, 'global_view.png' ); // FileSaver.js function
    //}
});

// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString( svgNode ) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	var cssStyleText = getCSSStyles( svgNode );
	appendCSS( cssStyleText, svgNode );

	var serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles( parentElement ) {
		var selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push( '#'+parentElement.id );
		for (var c = 0; c < parentElement.classList.length; c++)
				if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
					selectorTextArr.push( '.'+parentElement.classList[c] );

		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if ( !contains('#'+id, selectorTextArr) )
				selectorTextArr.push( '#'+id );

			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if ( !contains('.'+classes[c], selectorTextArr) )
					selectorTextArr.push( '.'+classes[c] );
		}

		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			
			try {
			    if(!s.cssRules) continue;
			} catch( e ) {
		    		if(e.name !== 'SecurityError') throw e; // for Firefox
		    		continue;
		    	}

			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if ( contains( cssRules[r].selectorText, selectorTextArr ) )
					extractedCSSText += cssRules[r].cssText;
			}
		}
		

		return extractedCSSText;

		function contains(str,arr) {
			return arr.indexOf( str ) === -1 ? false : true;
		}

	}

	function appendCSS( cssText, element ) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type","text/css"); 
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore( styleElement, refNode );
	}
}


function svgString2Image( svgString, width, height, format, callback ) {
	var format = format ? format : 'png';

	var imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL

	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");

	canvas.width = width;
	canvas.height = height;

	var image = new Image();
	image.onload = function() {
		context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0, width, height);

		canvas.toBlob( function(blob) {
			var filesize = Math.round( blob.length/1024 ) + ' KB';
			if ( callback ) callback( blob, filesize );
		});

		
	};

	image.src = imgsrc;
}

// function toggleFullScreen(element) {    
//     if (!document.fullscreenElement) {
//         if (element.requestFullscreen) {
//             element.requestFullscreen();
//         } else if (element.webkitRequestFullscreen) { /* Safari */
//             element.webkitRequestFullscreen();
//         } else if (element.msRequestFullscreen) { /* IE11 */
//             element.msRequestFullscreen();
//         }
//     } else {
//         if (document.exitFullscreen) {
//             document.exitFullscreen();
//         } else if (document.webkitExitFullscreen) { /* Safari */
//             document.webkitExitFullscreen();
//         } else if (document.msExitFullscreen) { /* IE11 */
//             document.msExitFullscreen();
//         }
//     }
// }

function showFullscreenIcon(element) {

    console.log('[LOG] ~ showFullscreenIcon ~ element:', element)
    console.log('entrou show')

    switch (element) {
        case 'global_view':
            var icon = element.querySelector('.fullscreen-icon');
            icon.style.visibility = 'visible';    
            
            break;
    
        default:
            break;
    }
}

function hideFullscreenIcon(element) {

    switch (element) {
        case 'global_view':
            var icon = element.querySelector('.fullscreen-icon');
            icon.style.visibility = 'hidden';    
            
            break;
    
        default:
            break;
    }
}

function toggleFullScreen(element) {
    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}