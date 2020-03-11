//execute script when window is loaded
window.onload = function(){
  //SVG dimension variables
  var w = 900, h = 500;

  // container block
  var container = d3.select("body") //get the <body> element from the DOM
      .append("svg") //put a new svg in the body
      .attr("width", w) //assign the width
      .attr("height", h) //assign the height
      .attr("class", "container") //assign a class name
      .style("background-color", "rgba(0,0,0,0.2)"); //svg background color

  //innerRect block
  var innerRect = container.append("rect")
      .datum(400) //a single value is a DATUM
      .attr("width", function(d){ //rectangle width
          return d * 2; //400 * 2 = 800
      })
      .attr("height", function(d){ //rectangle height
          return d; //400
      })
      .attr("class", "innerRect") //class name
      .attr("x", 50) //position from left on the x (horizontal) axis
      .attr("y", 50) //position from top on the y (vertical) axis
      .style("fill", "#FFFFFF"); //fill color

      var cityPop = [
        {
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];

      //find the minimum value of the array
      var minPop = d3.min(cityPop, function(d){
          return d.population;
      });

      //find the maximum value of the array
      var maxPop = d3.max(cityPop, function(d){
          return d.population;
      });

      var x = d3.scaleLinear() //create the scale
        .range([90, 810]) //output min and max
        .domain([0, 3]); //input min and max

      //scale for circles center y coordinate
      var y = d3.scaleLinear()
          .range([440, 95])
          .domain([
              minPop,
              maxPop
          ]);

      // color scale generator
      var color = d3.scaleLinear()
          .range([
              "#FDBE85",
              "#D94701"
          ])
          .domain([
              minPop,
              maxPop
          ]);

      var circles = container.selectAll(".circles") //create an empty selection
          .data(cityPop) //here we feed in an array
          .enter() //one of the great mysteries of the universe
          .append("circle") //inspect the HTML--holy crap, there's some circles there
          .attr("class", "circles")
          .attr("id", function(d){
              return d.city;
          })
          .attr("r", function(d){
              //calculate the radius based on population value as circle area
              var area = d.population * 0.01;
              return Math.sqrt(area/Math.PI);
          })
          .attr("cx", function(d, i){
              //use the scale generator with the index to place each circle horizontally
              return x(i);
          })
          .attr("cy", function(d){
              return y(d.population);
          })
          .style("fill", function(d, i){ //add a fill based on the color scale generator
              return color(d.population);
          })
          .style("stroke", "#000"); //black circle stroke



};
