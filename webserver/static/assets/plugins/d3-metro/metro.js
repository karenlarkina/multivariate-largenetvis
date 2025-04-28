(function(window, d3) {

  var config = {

    mapCommunitySizeIntoCircleSize: true,

    bgColor: '#12222c',
    normalColor: 'green',
    dangerColor: '#941532',
    exColor: 'blue',
    noRunningColor: '#666',
    WARNING_I: 'warning',
    WARNING_II: 'warning2',
    WARNING_III: 'warning3',
    NOP: 'nop',
    stationR: 3,
    stationRX: 6,
    tailDelay: 0.6,
    tailTime: 5,
    tailRandomTime: 4,
    launchDuration: 3
  };

  var LightenDarkenColor = function(col, amt) {
    var usePound = false;
    if (col[0] == "#") {
      col = col.slice(1);
      usePound = true;
    }
    var num = parseInt(col, 16);
    var r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
  };


  var Metro = function(info) {

    

    // 容器id
    this.containerId = info.id;

    this.distanceBetweenTimeslices = info.distanceBetweenTimeslices;
    this.distanceBetweenCommunities = info.distanceBetweenCommunities;

      // Number of timeslices in the circuit
      this.numberColumns = info.numberColumns;
      this.numberRows = info.numberRows;

    this.colorScale = info.colorScale;
    this.colorScaleDomain = info.colorScaleDomain;
    this.sizeScale = info.sizeScale;

    // drawColorbar(this.colorScaleDomain);
    
    var self = this;

    this.parentContainer = d3.select(info.divContainer) //Jean: div where containerId (which is an sgv element) belongs to.
    // 容器对象
    this.container = d3.select(info.id);

    this.container.on("contextmenu", function(d,i) //right click on mouse reset selection and zoom
    {
      
      self.resetStationsColor();
      d3.selectAll(".square").classed("communityClicked_TaxonomyMatrix", false);
      d3.event.preventDefault();

      /*self.container.transition()
                .duration(750)
                .call(self.zoom.transform, d3.zoomIdentity);*/
    });


    /********************* Draw grid **************************/

    this.paddingY = this.distanceBetweenCommunities;
    this.paddingX = this.distanceBetweenTimeslices;
    
    var i = 1;
    this.xPositions = [];
    while (i <= this.numberColumns)
    {
      this.xPositions.push(i * this.distanceBetweenTimeslices);
      i++;
    }

    i = 1;
    this.yPositions = [];
    while (i <= this.numberRows)
    {
      this.yPositions.push(i * this.distanceBetweenCommunities);
      i++;
    }

    
    var horizontalSize = ( this.numberColumns +1) * this.distanceBetweenTimeslices;
    var x = d3.scaleLinear()
            .range([0,horizontalSize]) //$("#svg_global_view g")[0].getBoundingClientRect().width]
            .domain([0,horizontalSize]);

    var verticalSize = (this.numberRows +1) * this.distanceBetweenCommunities;
    var y = d3.scaleLinear()
            .range([0,verticalSize]) //$("#svg_global_view g")[0].getBoundingClientRect().width]
            .domain([0,verticalSize]);


    var xAxis = d3.axisTop(x)
    .tickValues(this.xPositions)
    .tickSizeInner(-verticalSize)
    .tickFormat((d,i) => i+1); //.tickFormat((d,i) => "t " + i);


    // Add X label
    this.xlabel = this.container.append("text")
    // .attr("transform", "translate(" + (horizontalSize / 2) + " ," + 15 + ")")
    .attr("dy", "-2.5em")
    .attr("dx", (horizontalSize / 2) + "px")
    .style("text-anchor", "middle");


    var yAxis = d3.axisLeft(y)
    .tickValues(this.yPositions)
    .tickSizeInner(-horizontalSize)
    .tickFormat((d,i) => numToSSColumn(i+1)); //.tickFormat((d,i) => "t " + i);

    // Add Y label

    var currentAngle = 0;
    var currentZoom = '';
    function getTransform(p_angle, p_zoom) {
	
      return `${p_zoom} rotate(${p_angle})`;
      // return p_zoom + " rotate(" + p_angle + ")"; <-- Incorrect order
    }


    this.ylabel = this.container.append("text")
    //.attr("transform", "rotate(-90)")
    .attr("transform", getTransform(-90, ''))
    .attr("dy", "-1em")
    .attr("dx", "-10em")
    .style("text-anchor", "middle");


    this.gridXaxis = this.container.append("g")
    .attr("class", "grid")
    .attr("transform", "translate("+ this.paddingX +"," + (this.paddingY + 20) + ")")
    .call(xAxis);


    this.gridXaxis.selectAll("text")  
    //.style("text-anchor", "end")
    .attr("dx", "2em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

    this.gridYaxis = this.container.append("g")
    .attr("class", "grid")
    .attr("transform", "translate("+ this.paddingX + ',' + (this.paddingY +20) + ")")
    .call(yAxis);


    this.gridYaxis.selectAll("text")  
    .style("text-anchor", "end")
    .attr("dx", "1em");

    /*********************************************************************** */
    document.getElementById(`static-global-labels`).style.display = 'inherit';
    

    // 对象组 = object group
    this.group = this.container.append("g").attr("class","groupCommunities");
    self = this;

    // 特效对象组 = special effects object group
    this.effectGroup = this.group.append("g");
    // 原始底图参数 = original background map parameters
    this.origin = info.origin;
    // 地铁数据
    this.data = info.data;
    // 当前容器宽高 = current container width and height
    //this.containerWidth = this.container.node().getBoundingClientRect().width;
    //this.containerHeight = this.container.node().getBoundingClientRect().height;
    this.containerWidth = info.origin.width;
    this.containerHeight = info.origin.height;
    // 当前地图的缩放参数 = current map zoom parameters
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    // 所有动效的timer数组 = timer array for all animations
    this.timers = [];
    // 列车发动flag
    this.launchFlag = false;

    this.test = 0;


    // 径向渐变
    this.radialGradient = this.group
      .append('defs')
      .append("radialGradient")
      .attr('id', 'radial')
      .attr('fx', '50%')
      .attr('fy', '50%')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%')

    this.radialGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', config.dangerColor)
      .attr('stop-opacity', 0)

    this.radialGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', config.dangerColor)
      .attr('stop-opacity', 1)


    // 缩放事件

    //$(".groupCommunities").css('transform', 'translate(' + this.paddingX + 'px,' + 2*this.paddingY + 'px)');

    this.zoom = d3.zoom().scaleExtent([0.1, 100]).on("zoom", function() {


      self.xlabel.attr("transform", d3.event.transform);
      self.ylabel.attr("transform", getTransform(-90, d3.event.transform));

      self.gridXaxis.attr("transform", d3.event.transform);
      self.gridYaxis.attr("transform", d3.event.transform);
      self.group.attr("transform", d3.event.transform);
      self.scale = d3.event.transform.k;
      self.offsetX = d3.event.transform.x;
      self.offsetY = d3.event.transform.y;

      var potentialHeight = $("#svg_global_view .grid").get(0).getBBox().height * self.scale + 50;
      $("#svg_global_view").height(potentialHeight > $("#global_view").height() ? potentialHeight : $("#global_view").height());
    
      $("#svg_global_view").height($("#svg_global_view .grid").get(0).getBBox().height * self.scale + 50);
      var potentialWidth = $("#svg_global_view .grid").get(0).getBBox().width * self.scale + 50;
      $("#svg_global_view").width(potentialWidth > $("#global_view").width() ? potentialWidth : $("#global_view").width());
    


      });

    // 缩放事件对象
    this.groupEvent = this.container.call(this.zoom);

    

    // 渲染地铁
    this.render();

    // The render is done first so we can know the size of the circuit svg
    this.bounds = this.container.select('g').node().getBBox();



    this.fit();
  };

  // 自适应算法
  Metro.prototype.fit = function() {
    this.scale = 0.95 / (this.bounds.width / this.containerWidth);

    // Offset of the circuit
    // 30 in the space between each node with 10 nodes por column
    // Those quantities are inversely proportional so offset = 300 / numColumns
    //this.offsetX = (-300 / this.numberColumns);
    //this.offsetY =  (300 / this.numberColumns);

    // Setting a new transform object to the fitting
    var zoomId = d3.zoomIdentity
      //.translate(this.offsetX, this.offsetY)
      .translate(this.paddingX + 10, (this.paddingY + 40))
      .scale(this.scale);

    // Fitting the zoom
    this.groupEvent.transition()
      .duration(500)
      .call(this.zoom.transform, zoomId);
  };

  // 渲染函数
  Metro.prototype.render = function(attribute) {

    var self = this;

    // 清空所有动画事件
    for (var key in this.timers) {
      if (this.timers[key]) {
        this.timers[key].stop()
        this.timers[key] = null
      }
    }
    this.timers = []


    // 移除 所有地铁线路 | 曳尾效果
    this.group.selectAll('path').remove();
    // 移除所有站点的点击事件
    this.group.selectAll('g').selectAll('circle').on('click', null);
    // 移除所有站点
    this.group.selectAll('g').remove();
    // 移除所有移动的圆点
    this.group.selectAll('circle').remove();


    var stationLines = this.data.lines;
    var stations = this.data.stations;

    // 渲染前调整所有线路的z-index (active最后渲染)
    stationLines.sort(function(a, b) {
      if (!!a.active) {
        return 1
      } else {
        return -1
      }
    });

    //Jean: included tooltip 2021-10-27

    // create a tooltip
    var tooltip = this.parentContainer
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
      tooltip.style("opacity", 1)
    }

    var mouseleave = function(d) {
    tooltip
        .style("opacity", 0)
        .style("left", "-500px")
        .style("top", "-500px")        
    }

    stationLines.forEach(function(item) {

      var groupPath = self.group.append("path");

      //return "M" + d.source.x + "," + d.source.y + 
      //" L" + (d.target.x - radius) + "," + (d.target.y + radius) + 
      //" L" + (d.target.x + radius) + "," + (d.target.y - radius) + 
      //" L" + d.source.x + ", " + d.source.y;}


      // 根据关键点，绘制折线
      var path = d3.path()
      var points = item.points
      var radius = 10
      var event = item.event.toLowerCase()
      points.forEach(function(line) {
        line.forEach(function(p, index) {

          if(event.includes("grow") || event.includes("merge"))
          {
            if (index === 0) {
              path.moveTo(p.x, p.y)
            } else {
              path.lineTo(p.x, p.y - p.communitySize/2)
              path.lineTo(p.x, p.y + p.communitySize/2)
              path.lineTo(line[0].x, line[0].y)
            }
          }
          if(event.includes("contract") || event.includes("split"))
          {
            if (index === 0) {
              path.moveTo(p.x, p.y - p.communitySize/2)
            } else {
              path.lineTo(p.x, p.y)
              path.lineTo(line[0].x, line[0].y + line[0].communitySize/2)
            }
          }
          else
          {
            if (index === 0) {
              path.moveTo(p.x, p.y)
            } else {
              path.lineTo(p.x, p.y)
            }
            groupPath
              .attr('stroke-width', 2)
          }


          
        })
      });

      // 将折线路径写入group
      groupPath
        //.attr('stroke-width', event.includes("preserve") ? 2 : 1)
        //.attr('fill', 'transparent')
        .attr('stroke', item.color)
        .attr('fill', item.color)
        .attr("d", path.toString())
        .attr("fromCommunityId", item.fromCommunityId)
        .attr("toCommunityId", item.toCommunityId)
        //.attr("stroke-linecap", "round");



      // 如果线路激活
      if (!!item.active) {
        groupPath.transition().duration(400).attr('stroke-width', item.width * 2)
      }

      // 对于没有运行的线路，将其渲染成灰色
      if (!item.running) {
        groupPath.attr('stroke', config.noRunningColor)
      }

      groupPath.on('click', function(d) {
        console.log(item);
        //self.onStationClick(circle);
      });

      groupPath.on("mouseover", mouseover)
        .on("mousemove", function(d){
          tooltip
          //.html("Involved communities: " + item.name + "<br/>" + "Involved timeslices:" + item.involvedTimeslices + "<br/> What happened? " + item.event)
          .html(item.name + "<br/>" + item.involvedTimeslices + "<br/>"  + item.event)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY) + "px")
        })
        .on("mouseleave", mouseleave);

    });



    /********************* Draw communities ****************************/

    var groupCircle = this.group.append('g').classed("circles", true)
    var shape = null;
    stations.forEach(function(circle) {

      const numberNodes = circle.firstView.data[circle.id].graph.nodes.length;
      
      // 渲染不同站点类型 => Rendering different site types
      switch (circle.type) {
        case 1: // 非集中站 => Non-centralized station
          shape = groupCircle.append("circle")
            .attr("cx", circle.x)
            .attr("cy", circle.y)
            .attr("r", config.mapCommunitySizeIntoCircleSize ?  circle.size : config.stationR)
            .attr("communityId", circle.id) //jean
            .attr("originalColor", "#e5e6e7")
            //.style("stroke", circle.color)
            .attr("stroke", "black")
              .attr("stroke-width", 0)
            .style("fill", "#e5e6e7")
            .style("cursor", "pointer");

          drawDonut(circle,groupCircle,tooltip,attribute);

          if (circle.status === config.WARNING_I || circle.status === config.WARNING_II) {
            shape.style("stroke", config.dangerColor)
          }
          if (circle.status === config.WARNING_III) {
            shape.style("stroke", config.exColor)
          }
          if (circle.status === config.NOP) {
            shape.style("stroke", config.noRunningColor)
          }
          break;
        case 2: // 集中站 => Centralized Station
      /*    shape = groupCircle.append("g")
            .attr("transform", "translate(" + circle.x + "," + circle.y + ")")
            .style("cursor", "pointer");

          var c1 = shape.append("circle")
            .attr("r", config.stationRX * 2)
            .style("fill", config.bgColor)
            .style("stroke", config.normalColor);

          var c2 = shape.append("circle")
            .attr("r", config.stationRX)
            .style("fill", config.normalColor);

          if (circle.status === config.WARNING_I || circle.status === config.WARNING_II) {
            c1.style("stroke", config.dangerColor)
            c2.style("fill", config.dangerColor)
          }
          if (circle.status === config.WARNING_III) {
            c1.style("stroke", config.exColor);
            c2.style("fill", config.exColor);
          }
          if (circle.status === config.NOP) {
            c1.style("stroke", config.noRunningColor);
            c2.style("fill", config.noRunningColor);
          }*/
          break;
      }

      shape.on('click', function(d) {


        // remove highlight of the previous clicked element
        //d3.select(".communityClicked_globalView").style("filter", "");
        // d3.select(".communityClicked_globalView").style("stroke", "black");
        // d3.select(".communityClicked_globalView").style("stroke-width", 1);
        // d3.select(".communityClicked_globalView").style("fill", "#f08080");
        d3.select(".communityClicked_globalView").classed("communityClicked_globalView", false);

        // highlight clicked element
        d3.select(this).classed("communityClicked_globalView", true);
        // d3.select(this).style("filter", "url(#drop-shadow)");
        // d3.select(this).style("stroke", "black");
        // d3.select(this).style("stroke-width", 2);

        var maxRadius = 20;

        d3.select(d3.event.target)
          .raise()
          .transition()
          .duration(100)
          .attr("r", maxRadius)
          .transition()
          .duration(900)
          .attr("r", config.mapCommunitySizeIntoCircleSize ?  circle.size : config.stationR);


        circle.firstView.__proto__.drawNodeLinkFromGlobalView(circle.id);
        // circle.firstView.__proto__.highlightCorrespondingCellTaxonomyMatrix(); //highlights the cell of the matrix where this community belongs.
        circle.firstView.__proto__.drawTemporalActivityMapFromGlobalView();
        //circle.firstView.__proto__.drawCommunityDetail();
        circle.firstView.__proto__.highlightSelectedCommunityInGlobalView(circle.id);

      });

      shape.on("mouseover", mouseover)
        .on("mousemove", function(d){
          tooltip
          .html(
            circle.name + "<br/>" + "Timeslice "+ circle.timeslice +  "<br/>" + " Grid Pos: (" +  numToSSColumn(self.yPositions.indexOf(circle.y)+1) +", " + circle.timeslice + ")" + "<br/>" + numberNodes + " nodes" + "<br/>"  //+
            // "<img src=" + circle.temporal + " width=\"65\" height=\"50\" style=\"margin: 0 auto; display: block;\">" +
            // "<img src=" + circle.structural + (circle.structural.includes("full") ? " height=\"35\" " : " height=\"50\" ") + " width=\"50\">" + //workaround because the figure of clique (full) is bigger than the others.
            // "<img src=" + circle.evolution + " width=\"50\" height=\"50\" >"
          )
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY) + "px")
        })
        .on("mouseleave", mouseleave);


    });



    // 渲染列车曳尾效果 => Rendering the train tail effect

    // 特效group => Special Effects group
    self.effectGroup = self.group.append("g");

    if (!self.launchFlag) {

      stationLines.forEach(function(item) {
        var points = item.points;
        points.forEach(function(line, index) {

          var path = d3.path()
          line.forEach(function(p, idx) {
            if (idx === 0) {
              path.moveTo(p.x, p.y)
            } else {
              path.lineTo(p.x, p.y)
            }
          });

          var count = 0;

          var launch = function() {
            if (count % 100 === 0) {
              self.launch(item, path.toString());
            }
            count++;
            setTimeout(function() {
              launch();
            }, config.launchDuration * 10);
          };

          launch();

          self.launchFlag = true;

        });

      });

    }



  };


  // 更新站点状态 => Update site status
  Metro.prototype.updateStations = function(stations) {
    for (var key in stations) {
      this.data.stations.forEach(function(item) {
        if (item.id === stations[key].id) {
          item.status = stations[key].status
        }
      })
    }
    this.render();
  };

  // 发车 => Departure
  Metro.prototype.launch = function(item, path) {

    var self = this;
    var pathTmp = path.substr(1);
    var pathArray = pathTmp.split('L').map(function(item) {
      return item.split(',')
    });
    var cx = +pathArray[0][0];
    var cy = +pathArray[0][1];
    var cx2 = cx;
    var cy2 = cy;
    var pointer = 1;
    var pointer2 = 1;
    var id = item.id + Math.random();
    var defs = self.effectGroup.append('defs');
    var linear = defs.append('linearGradient').attr('id', id).attr('gradientUnits', 'userSpaceOnUse')
    linear.append('stop').attr('offset', '0%').style('stop-color', item.color).style('stop-opacity', 0);
    linear.append('stop').attr('offset', '100%').style('stop-color', LightenDarkenColor(item.color, 120)).style('stop-opacity', 1);

    var isPointIn = function(currentX, currentY, stepX, stepY, pointX, pointY) {
      var len = Math.pow((Math.pow(currentX - pointX, 2) + Math.pow(currentY - pointY, 2)), 0.5);
      var len2 = Math.pow((Math.pow(currentX + stepX - pointX, 2) + Math.pow(currentY + stepY - pointY, 2)), 0.5);
      return len <= len2;
    };

    //var tail = self.effectGroup.append('path');

    var t = d3.timer(function(elapsed) {
      var preX = pathArray[pointer - 1][0];
      var preY = pathArray[pointer - 1][1];
      var x = pathArray[pointer][0];
      var y = pathArray[pointer][1];
      var len = Math.pow((Math.pow(preX - x, 2) + Math.pow(preY - y, 2)), 0.5);
      var stepX = (x - preX) / len * 3;
      var stepY = (y - preY) / len * 3;
      if (isPointIn(cx + stepX, cy + stepY, stepX, stepY, x, y)) {
        if (pointer < pathArray.length - 1) {
          pointer++;
        } else {
          t.stop();
          t2.stop();
          //tail.remove();
          defs.remove();
          return;
        }
      }
      cx += stepX;
      cy += stepY;
    });

    var t2 = d3.timer(function(elapsed) {
      var preX = pathArray[pointer2 - 1][0];
      var preY = pathArray[pointer2 - 1][1];
      var x = pathArray[pointer2][0];
      var y = pathArray[pointer2][1];
      var len = Math.pow((Math.pow(preX - x, 2) + Math.pow(preY - y, 2)), 0.5);
      var stepX = (x - preX) / len * 3;
      var stepY = (y - preY) / len * 3;
      if (isPointIn(cx2 + stepX, cy2 + stepY, stepX, stepY, x, y)) {
        if (pointer2 < pathArray.length - 1) {
          pointer2++;
        } else {
          t2.stop();
          return;
        }
      }
      cx2 += stepX;
      cy2 += stepY;

    }, config.tailDelay * 1000);

  };


    /*---------------------------------- Jean 2021-11-22 ---------------------------------*/
    Metro.prototype.highlightSelected = function(idsCommunities){

      this.resetStationsColor();
      var communities = this.group.selectAll("g circle").nodes().filter(a => idsCommunities.includes(parseInt(a.attributes[3].nodeValue)))
      var remainingCommunities = this.group.selectAll("g circle").nodes().filter(a => !idsCommunities.includes(parseInt(a.attributes[3].nodeValue)))
      //var remainingPaths = this.group.selectAll("g path").nodes().filter(a => !idsCommunities.includes(parseInt(a.attributes['fromCommunityId'].nodeValue)) && !idsCommunities.includes(parseInt(a.attributes['toCommunityId'].nodeValue)))
      this.group.selectAll("g circle").nodes()

      communities.forEach(function(com) {
        com.style["fill"] = "rgb(240,128,128)";
        });

      remainingCommunities.forEach(function(com) {
          com.style["opacity"] = "0.5";
        });

        //remainingPaths.forEach(function(path) {
          this.group.selectAll("g path").nodes().forEach(function(path) {
          path.style["opacity"] = "0.6";
        });
    }

    Metro.prototype.resetStationsColor = function(){

      this.group.selectAll("g circle").nodes().forEach(function(com) {
        com.style["fill"] = com.attributes.originalColor.nodeValue;
        com.style["opacity"] = "1";
        });

        this.group.selectAll("g path").nodes().forEach(function(path) {
          path.style["opacity"] = "1";
        });
    }

    function numToSSColumn(num){
      var s = '', t;
    
      while (num > 0) {
        t = (num - 1) % 26;
        s = String.fromCharCode(65 + t) + s;
        num = (num - t)/26 | 0;
      }
      return s || undefined;
    }

    // function drawColorbar(colorScaleDomain)
    // {
      
    //   /*********************** Draw only colorbar *************************/


    //   /*var colorBar = new d3ColorBar();

    //   var heightColorBar = 15;
    //   var widthColorBar = 150;

    //   //Insert color bar
    //   var svgColorBar1 = d3.select("#colorbar_circuito");

    //   //var scale = d3.scaleSequential(colorScale).domain(colorScaleDomain);
    //   var cb = colorBar.colorbarH(colorScale, widthColorBar, heightColorBar);
    //   var svgCb = svgColorBar1.append("svg")
    //       .attr('class', 'colorbar')
    //   svgCb.append("g").call(cb);

    //   $('#colorbar_circuito').height($('svg g').get(0).getBBox().height);
    //   $('#colorbar_circuito svg').height($('svg g').get(0).getBBox().height);

    //   $("#colorbar_circuito svg g").first().css({'transform' : 'translate(15px,' + 0 + 'px)'}); //translate colorbar
    //   */

    //   /*******************************************************************/

    //   var minSizeScale = 10;
    //   var maxSizeScale = 50;
    //   var myColor = d3.scaleLinear()
    //     .range(["#DEEDCF", "#0A2F51"])
    //     .domain([minSizeScale,maxSizeScale])

    //     var mySize = d3.scaleLinear()
    //     .range([3,10])
    //     .domain([minSizeScale,maxSizeScale])

    //   var linearScale = d3.scaleLinear()
    //   .domain([minSizeScale,maxSizeScale])
    //   .range([0, 150]);

    //   var myData = [10,20,30,40,50];

    //   var svg = d3.select('#colorbar_circuito').append("svg")
    //   .attr('width', 250);
      
    //   svg.append('g')
    //     .selectAll('circle')
    //     .data(myData)
    //     .join('circle')
    //     .attr('r', function(d) {
    //       return mySize(d);
    //     })
    //    .attr('fill', function(d) {return myColor(d);})
    //     .attr('cx', function(d) {
    //       return linearScale(d);
    //     })
    //     .attr("stroke", "black")
    //     .attr("stroke-width", 1);

    //     $('#colorbar_circuito').height($('#colorbar_circuito svg g').get(0).getBBox().height + 10);
    //     $('#colorbar_circuito svg').height($('#colorbar_circuito svg g').get(0).getBBox().height + 10);

    //     $('#colorbar_circuito').width($('#colorbar_circuito svg g').get(0).getBBox().width + 20);
    //     $('#colorbar_circuito svg').width($('#colorbar_circuito svg g').get(0).getBBox().width + 20);

    //     $("#colorbar_circuito svg g").first().css({'transform' : 'translate(' + 10 + 'px,' + 10 + 'px)'}); //translate colorbar
      
    //     $('#minSizep').text(colorScaleDomain[0] + "");
    //     $('#maxSizep').text("   " + colorScaleDomain[1]);



    // }

    function calculateNodeLabelsPercentages(community) {
          const utils = new Utils();

          const nodeIds = utils.getCommunityNodeIds(community);

          const filteredNodes = utils.getCommunityNodesById(community,nodeIds);

          const labelsPercentage = utils.getLabelsPercentages(filteredNodes);

        return labelsPercentage;
    }

    function calculateEdgeLabelsPercentages(community) {

      const utils = new Utils();

      const edgeLabels = community.firstView.data[community.id].graph.links.map(edge => edge.label);

      const labelsPercentage = utils.calculateEdgeLabelsPercentagesInGlobalView(edgeLabels);

    return labelsPercentage;
}


    
    function drawDonut(circle,groupCircle,tooltip,attribute) {
      
      switch (attribute) {
        case "NL":
          var { labelsPercentages: donutSections } =  calculateNodeLabelsPercentages(circle);
          var { firstView : { nodeMetadataCategories } } = circle;
          var colors = colorScale(nodeMetadataCategories);
        break;

        case "EL":

          var { labelsPercentages: donutSections } =  calculateEdgeLabelsPercentages(circle);
          var { firstView : { graphEdgeLabels } } = circle;
          var colors = colorScale(graphEdgeLabels);
        break;
      
        default:

          var { labelsPercentages: donutSections } =  calculateNodeLabelsPercentages(circle);
          var { firstView : { nodeMetadataCategories } } = circle;
          var colors = colorScale(nodeMetadataCategories);
          break;
      }

      donutSections.forEach((item) => {
        item.color = colors(item.label)
        });

      const donutRadius = config.mapCommunitySizeIntoCircleSize ? (circle.size + 3) : (config.stationR + 3); // Adjust the donut radius as needed
      let startAngle = -Math.PI / 2; // Start angle for the first section
      var donutHoverScale = 1.15;

      donutSections.forEach(function(section) {

        const endAngle = startAngle + section.percentage * 2 * Math.PI;

        const arcGenerator = d3.arc()
          .innerRadius(config.mapCommunitySizeIntoCircleSize ?  circle.size : config.stationR) // Inner radius of the donut (adjust as needed)
          .outerRadius(donutRadius)
          .startAngle(startAngle)
          .endAngle(endAngle);

        donut = groupCircle.append("path")
          .attr("d", arcGenerator)
          .attr("fill", section.color)
          .attr("communityId",circle.id)
          .style("opacity", 1)
          .attr("transform", "translate(" + circle.x + "," + circle.y + ")")
          .style("cursor", "pointer")
          .on("mouseover", (d)=> {})
            .on("mousemove", function (d) {
              tooltip.style("opacity", 1)
              tooltip
              .html("Label: " + section.label + "<br/>" + 
                    "#Count: " + section.count + " (" + section.percentage * 100 + "%)")
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY) + "px")
              d3.select(this).attr("transform", "translate(" + circle.x + "," + circle.y + ") scale(" + donutHoverScale + ")");
             
          })
          .on("mouseleave", function (d) {
            tooltip.style("opacity", 0);
            d3.select(this).transition().attr("transform", "translate(" + circle.x + "," + circle.y + ")"); 
          
          });
        
        startAngle = endAngle; // Update start angle for the next donut section
        
        });
        
    }

    function colorScale(labels) {

      const colorScale = d3.scaleOrdinal()
        .domain(labels)
        .range(d3.schemeCategory10);

      return colorScale;
      
    }

  window.Metro = Metro;

})(window, d3)