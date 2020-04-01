//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //use Promise.all to parallelize asynchronous data loading
    var promises = [d3.csv("data/chicago_crimes.csv"),
                    d3.json("data/chicago_areas.topojson"),
                    d3.json("data/states.topojson")
                   ];
    Promise.all(promises).then(callback);

    function callback(data){
      	csvData = data[0];
      	areas = data[1];
        states = data[2];

        //translate europe TopoJSON
        var chicagoAreas = topojson.feature(areas, areas.objects.Chicago_Neighborhoods),
            stateRegions = topojson.feature(states, states.objects.states);

        //examine the results
        console.log(chicagoAreas);
        console.log(stateRegions);
    };
};
