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
        .center([0, 41.83])
        .rotate([87.65, 0, 0])
        .parallels([29, 45])
        .scale(80000.00)//extra zoom since this is a large scale map
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/chicago_crimes.csv")); //load attributes from csv
    promises.push(d3.json("data/chicago_areas.topojson")); //load background spatial data
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
        var chicagoNeighborhoods = topojson.feature(areas, areas.objects.Chicago_Neighborhoods).features;
        var stateRegions = topojson.feature(state, state.objects.states);

        console.log(chicagoNeighborhoods);
        console.log(stateRegions);

        //midwest variable brings in the Illinois and Indiana state boundarie
        var regions = map.append("path")
            //calls the stateRegions from above
            .datum(stateRegions)
            //states class used to change color in css
            .attr("class", "states")
            .attr("d", path);

        //.community is different as the map will select all from the chicagoNeighborhoods data and then brings it in.
        var chi = map.selectAll(".neighborhood")
            .data(chicagoNeighborhoods)
            .enter()
            .append("path")
            //draws the boundaries of each neighborhood
            .attr("class", function(d){
                return "neighborhood " + d.properties.Neighborho;
            })
            .attr("d", path);
        };

};
