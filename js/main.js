//pseudo-global variables
var attrArray = ["$500 and under", "over $500",	"Public Peace Violation",	"Motor Vehicle Theft", "Financial Theft", "Domestic"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
  //map frame dimensions
    var width = 960,
        height = 1000;

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

        //.community is different as the map will select all from the chicagoNeighborhoods data and then brings it in.
        var chi = map.selectAll(".neighborhood")
            .data(chicagoCrimes)
            .enter()
            .append("path")
            //draws the boundaries of each neighborhood
            .attr("class", function(d){
                return "neighborhood " + d.properties.Neighborhood;
            })
            .attr("d", path);

        //create color scale
        var colorScale = makeColorScale(csvData);

        //set enumeration units function is called
        setEnumerationUnits(chicagoCrimes, map, path, colorScale);

        };
};

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

function setEnumerationUnits(chicagoCrimes, map, path, colorScale){

    var regions = map.selectAll(".community")
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
            	return colorScale(d.properties[expressed]);
            } else {
            	return "#ccc";
            }
    });
};
