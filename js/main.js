// Lab 2: D3
(function(){
  //pseudo-global variables
  var attrArray = ["$500 and under", "over $500",	"Public Peace Violation",	"Motor Vehicle Theft", "Financial Identity Theft", "Domestic"]; //list of attributes
  var expressed = attrArray[0]; //initial attribute

  //chart frame dimensions
  var chartWidth = window.innerWidth * 0.425,
      chartHeight = 473,
      leftPadding = 25,
      rightPadding = 2,
      topBottomPadding = 5,
      chartInnerWidth = chartWidth - leftPadding - rightPadding,
      chartInnerHeight = chartHeight - topBottomPadding * 2,
      translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  //create a scale to size bars proportionally to frame and for axis
  var yScale = d3.scaleLinear()
      .range([463, 0])
      .domain([0, 110]);

  //begin script when window loads
  window.onload = setMap();

  //set up choropleth map
  function setMap(){
      //map frame dimensions
      var width = window.innerWidth * 0.425,
          height = 700;

      //create new svg container for the map
      var map = d3.select("body")
          .append("svg")
          .attr("class", "map")
          .attr("width", width)
          .attr("height", height);

      // projection to make map cartographically accurate
      var projection = d3.geoAlbers()
          .center([-0.01, 41.83])
          .rotate([87.65, 0, 0])
          .parallels([29, 45])
          .scale(97000.00)//extra zoom since this is a large scale map
          .translate([width / 2, height / 2]);

      var path = d3.geoPath()
          .projection(projection);

      //use Promise.all to parallelize asynchronous data loading
      var promises = [];
      promises.push(d3.csv("data/chicago_crimes.csv")); //load attributes from csv
      promises.push(d3.json("data/Chicago_Neighborhoods.topojson")); //load background spatial data
      promises.push(d3.json("data/states.topojson")); // load choropleth spatial data
      Promise.all(promises).then(callback);

      //callback brings in the data
      function callback(data){
          //these 4 variables list are from the promise list
          //this will be used for the topojson work.
          csvData = data[0];
          areas = data[1];
          state = data[2];

          //topojson is used to be brought into the datum when using d3
          //chicagoNeighborhoods has .features at the end so it can map out all the nieghborhood boundaries
          var chicagoCrimes = topojson.feature(areas, areas.objects.Chicago_Neighborhoods).features;
          var stateRegions = topojson.feature(state, state.objects.states);

          chicagoCrimes = joinData(chicagoCrimes, csvData);

          //midwest variable brings in the Illinois and Indiana state boundarie
          var regions = map.append("path")
              //calls the stateRegions from above
              .datum(stateRegions)
              //states class used to change color in css
              .attr("class", "states")
              .attr("d", path);

          //create color scale
          var colorScale = makeColorScale(csvData);

          //set enumeration units function is called
          setEnumerationUnits(chicagoCrimes, map, path, colorScale);
          // set chart values
          setChart(csvData, colorScale);
          // set parallel plot
          setParallelPlot(csvData);
          //create dropdown menu
          createDropdown(csvData);
          //cite data Source
          citation();
        };
  };

  //function to join toposjson and csv data
  function joinData(chicagoCrimes, csvData){
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Neighborhood; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<chicagoCrimes.length; a++){
            var geojsonProps = chicagoCrimes[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.Neighborhood; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    return chicagoCrimes;
  };

  //function to create color scale generator
  function makeColorScale(data){
      var colorClasses = [
          "#D4B9DA",
          "#C994C7",
          "#DF65B0",
          "#DD1C77",
          "#980043"
      ];

      //create color scale generator
      var colorScale = d3.scaleQuantile()
          .range(colorClasses);

      //build two-value array of minimum and maximum expressed attribute values
      var minmax = [
          d3.min(data, function(d) { return parseFloat(d[expressed]); }),
          d3.max(data, function(d) { return parseFloat(d[expressed]); })
      ];
      //assign two-value array as scale domain
      colorScale.domain(minmax);

      return colorScale;
  };

  //function to create coordinated bar chart
  function setChart(csvData, colorScale){

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 100]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.Neighborhood;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

    //add style descriptor to each rect
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Crime Type " + expressed);

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
  };

  // function for setting default enumeration units
  function setEnumerationUnits(chicagoCrimes, map, path, colorScale){
      var regions = map.selectAll(".neighborhood")
          .data(chicagoCrimes)
          .enter()
          .append("path")
          .attr("class", function(d){
              return "regions " + d.properties.Neighborhood;
          })
          .attr("d", path)
          .style("fill", function(d){
              var value = d.properties[expressed];
              if(value) {
              	return colorScale(value);
              } else {
              	return "#ccc";
              }
          })
          .on("mouseover", function(d){
              highlight(d.properties);
          })
          .on("mouseout", function(d){
              dehighlight(d.properties);
          })
          .on("mousemove", moveLabel);

    //add style descriptor to each path
    var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "1px"}');
  };

  //function to create a dropdown menu for attribute selection
  function createDropdown(){
      //add select element
      var dropdown = d3.select("body")
          .append("select")
          .attr("class", "dropdown")
          .on("change", function(){
              changeAttribute(this.value, csvData)
            });

      //add initial option
      var titleOption = dropdown.append("option")
          .attr("class", "titleOption")
          .attr("disabled", "true")
          .text("Select Crime Category");

      //add attribute name options
      var attrOptions = dropdown.selectAll("attrOptions")
          .data(attrArray)
          .enter()
          .append("option")
          .attr("value", function(d){ return d })
          .text(function(d){ return d });
  };

  //dropdown change listener handler
  function changeAttribute(attribute, csvData){
      //change the expressed attribute
      expressed = attribute;

      //recreate the color scale
      var colorScale = makeColorScale(csvData);

      //recolor enumeration units
      var regions = d3.selectAll(".regions")
          .transition()
          .duration(1000)
          .style("fill", function(d){
              var value = d.properties[expressed];
              if(value) {
              	return colorScale(value);
              } else {
              	return "#ccc";
              }
      });

      //re-sort, resize, and recolor bars
      var bars = d3.selectAll(".bar")
          //re-sort bars
          .sort(function(a, b){
              return b[expressed] - a[expressed];
          })
          .transition() //add animation
          .delay(function(d, i){
              return i * 20
          })
          .duration(500);

      updateChart(bars, csvData.length, colorScale);
  };

  //function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            var value = d[expressed];
            if(value) {
                return colorScale(value);
            } else {
                return "#ccc";
            }
          });

    //add text to chart title
     var chartTitle = d3.select(".chartTitle")
         .text("Chicago Crime Data Type: " + expressed + " (in thousands)");

  };

  //function to highlight enumeration units and bars
  function highlight(props){
      //change stroke
      var selected = d3.selectAll("." + props.Neighborhood)
          .style("stroke", "blue")
          .style("stroke-width", "2");

      // create label when highlighted
      setLabel(props);
  };

  //function to reset the element style on mouseout
  function dehighlight(props){
      var selected = d3.selectAll("." + props.Neighborhood)
          .style("stroke", function(){
              return getStyle(this, "stroke");
          })
          .style("stroke-width", function(){
              return getStyle(this, "stroke-width");
          });

      function getStyle(element, styleName){
          var styleText = d3.select(element)
              .select("desc")
              .text();

          var styleObject = JSON.parse(styleText);

          return styleObject[styleName];
      };
      // remove info label
      d3.select(".infolabel")
          .remove();
  };

  //function to create dynamic label
  function setLabel(props){
      //label content
      var labelAttribute = "<h1>" + props[expressed] + "k" +
          "</h1><b>" + expressed +"</b>" ;

      //create info label div
      var infolabel = d3.select("body")
          .append("div")
          .attr("class", "infolabel")
          .attr("id", props.Label + "_label")
          .html(labelAttribute);

      var regionName = infolabel.append("div")
          .attr("class", "labelname")
          .html(props.Label);
  };

  //function to move info label with mouse
  function moveLabel(){
      //get width of label
      var labelWidth = d3.select(".infolabel")
          .node()
          .getBoundingClientRect()
          .width;

      //use coordinates of mousemove event to set label coordinates
      var x1 = d3.event.clientX + 10,
          y1 = d3.event.clientY - 75,
          x2 = d3.event.clientX - labelWidth - 10,
          y2 = d3.event.clientY + 25;

      //horizontal label coordinate, testing for overflow
      var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
      //vertical label coordinate, testing for overflow
      var y = d3.event.clientY < 75 ? y2 : y1;

      d3.select(".infolabel")
          .style("left", x + "px")
          .style("top", y + "px");
  };

  // function for creating parallel plot
  function setParallelPlot(csvData){
      // plot margins
      var margin = {top: 35, right: 60, bottom: 20, left: 60};
      width = chartWidth - margin.left - margin.right;
      height = 350 - margin.top - margin.bottom;

      // create new svg container for the plot
      var plot = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", 350)
            .attr("class", "plot")
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

       //list of attributes
       var attr = ["$500 and under", "over $500",	"Public Peace Violation",	"Motor Vehicle Theft",
                        "Financial Identity Theft", "Domestic"];

        dimensions = d3.keys(csvData[0]).filter(function(csvData) {
          return attr.indexOf(csvData) >= 0 })

        var y = {}
        for (i in dimensions) {
          name = dimensions[i]
          y[name] = d3.scaleLinear()
            .domain( [0, 100] ) // axis range
            .range([300, 0])
        }
         // scale for x-axi
        x = d3.scalePoint()
              .range([0, width])
              .domain(dimensions);

        // construct line generator
        function path(csvData) {
            return d3.line()(dimensions.map(function(p) {
              return [x(p), y[p](csvData[p])];
            }));
        }

        // add plot
        plot.selectAll("body")
            .data(csvData)
            .enter()
            .append("path")
            .attr("d",  path)
            .attr("class", function(d){
                return "plot " + d.Neighborhood;
            })
            .style("opacity","0.5")
            .style("fill", "none")
            .style("stroke", "#3D3F3E");

        plot.selectAll("body")
          .data(dimensions).enter()
          .append("g")
          .attr("class", "plotAxis")
          // transform each x-axis location to correct position
          .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
          // builds axis with call function, add ticks for human readability
          .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(10).scale(y[d])); })
          .append("text")
          .attr("class","plotTitles")
          .style("text-anchor", "middle")
          .attr("y", -15) // format plot titles
          .text(function(d) { return d; })
          .style("fill", "Black");

  };

  // Data Source
  function citation(){
    var width = 200;
    var height = 500;

    // create element
    var dataSource = d3.select("body")
      .append("html")
      .attr("class","dataSource")
      .attr("width", width)
      .attr("height", height)
      .html("Data Source: <a href='https://data.cityofchicago.org/Public-Safety/Crimes-2001-to-present/ijzp-q8t2'>Chicago Crime Demographics: 2001 to Present</a>");
  };

})();
