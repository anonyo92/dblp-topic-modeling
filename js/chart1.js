
			var width = 960,
				height = 660;

			var color = d3.scale.category20();

			var fisheye = d3.fisheye.circular()
				.radius(100)
				.distortion(5);

			var force = d3.layout.force()
				.charge(-70)
				.linkDistance(19)
				.size([width, height]);

			var svg = d3.select("#chart1").append("svg")
				.attr("width", width)
				.attr("height", height);

			// magnifier as circle
			var lens = svg.append("circle")
				.attr("class","lens")
				.attr("r", fisheye.radius());;

			// magnifier as path
			var mag = svg.append("path")
				.attr("class", "mag");

			// specify angle where magnifier handle should "attach" to body
			var omega = 0.78;

			// magnifier handle as path
			var mag2 = svg.append("path")
				.attr("class", "mag2");

			/*
			svg.append("rect")
				.attr("class", "background")
				.attr("width", width)
				.attr("height", height);
			*/

			d3.json("mis1.json", function(data) {
				var n = data.nodes.length;

				force.nodes(data.nodes).links(data.links);

				// Initialize the positions deterministically, for better results.
				data.nodes.forEach(function(d, i) { d.x = d.y = width / n * i; });

				// Run the layout a fixed number of times.
				// The ideal number of times scales with graph complexity.
				// Of course, don't run too long—you'll hang the page!
				force.start();
				for (var i = n; i > 0; --i) force.tick();
				force.stop();

				// Center the nodes in the middle.
				var ox = 0, oy = 0;
				data.nodes.forEach(function(d) { ox += d.x, oy += d.y; });
				ox = ox / n - width / 2, oy = oy / n - height / 2;
				data.nodes.forEach(function(d) { d.x -= ox, d.y -= oy; });

				var link = svg.selectAll(".link")
					.data(data.links)
				  .enter().append("line")
					.attr("class", "link")
					.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; })
					.style("stroke-width", function(d) { return Math.sqrt(d.value); });

				var node = svg.selectAll(".node")
					.data(data.nodes)
				  .enter().append("g")
					.attr("class", "node");

				render("path");

				function render(shape) {
					node.selectAll(".link").remove();
					node.selectAll(".circle").remove();
					node.selectAll(".text").remove();

					lens.style("stroke-opacity", shape == "circle" ? 1 : 0);
					mag.style("stroke-opacity", shape == "path" ? 1 : 0);
					mag2.style("stroke-opacity", shape == "path" ? 1 : 0);

					var nodeEnter = node
					  .append("circle")
						.attr("class", "circle")
						.attr("cx", function(d) { return d.x; })
						.attr("cy", function(d) { return d.y; })
						.attr("r", 6)
						.style("fill", function(d) { return color(d.group); })
						.call(force.drag);

					var text = node.append("text")
						.attr("class", "text")
						.attr("dy", function(d) { return d.y; })
						.attr("dx", function(d) { return d.x; })
						.text(function(d) { return d.name; });

					node.append("title")
						.text(function(d) { return d.name; });

					svg.append("text").attr({
					   id: "t", 
						x: function() { return 50; },
						y: function() { return 70; }
					})
					.text(function() {
					  return "Year Range: 1981-1986";
					}).style("font-size", "16px");
				
					svg.on("mousemove", function() {
						fisheye.focus(d3.mouse(this));

						var mouseX = d3.mouse(this)[0];
						var mouseY = d3.mouse(this)[1];
						var r = fisheye.radius();

						if (shape == "circle") {
							// display magnifier as circle
							lens
								.attr("cx", mouseX)
								.attr("cy", mouseY);
						}
						else {
							// path for magnifier
							var magPath = "M " + mouseX + "," + mouseY + " m -" + r + ", 0 a " + r + "," + r + " 0 1,0 " + (r * 2) + ",0 a " + r + "," + r + " 0 1,0 -" + (r * 2) + ",0";

							// point in circumference to attach magnifier handle
							var x1 = mouseX + r * Math.sin(omega);
							var y1 = mouseY + r * Math.cos(omega);

							// path for magnifier's handle
							var mag2Path = "M " + (x1 + 2) + "," + (y1 + 2) + " L" + (mouseX + r * 1.7) + "," + (mouseY + r * 1.7);

							// display magnifier as path
							mag.attr("d", magPath);

							// display magnifier handle as path
							mag2.attr("d", mag2Path);
						};

						nodeEnter.each(function(d) { d.fisheye = fisheye(d); })
							.attr("cx", function(d) { return d.fisheye.x; })
							.attr("cy", function(d) { return d.fisheye.y; })
							.attr("r", function(d) { return d.fisheye.z * 4.5; });

						text.attr("dx", function(d) { return d.fisheye.x; })
							.attr("dy", function(d) { return d.fisheye.y; });

						link.attr("x1", function(d) { return d.source.fisheye.x; })
							.attr("y1", function(d) { return d.source.fisheye.y; })
							.attr("x2", function(d) { return d.target.fisheye.x; })
							.attr("y2", function(d) { return d.target.fisheye.y; });
					});
				}
				d3.select("#circle").on("click", function () { render("circle");});
				d3.select("#path").on("click", function () { render("path");});
			})
			
	// slider
		
	var y = d3.scale.linear()
            .domain([1979, 2021])
            .range([0, height/1.2])
            .clamp(true);

    var brush = d3.svg.brush()
            .y(y)
            .extent([0, 0])
            .on("brush", brushed);

    var g = svg.append("g")
            .attr("transform", "translate(" + 247 + "," + 60 + ")");

    var slider = g.append("g")
            .attr("transform", "translate(" + 600 + ", 0)");

    slider.append("g")
            .attr("class", "y axis")
            .call(d3.svg.axis()
                    .scale(y)
                    .orient("right")
                    .tickFormat(function(d) { return d + ""; })
                    .tickSize(0)
                    .tickPadding(13))
            .select(".domain")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
            .attr("class", "halo");

    var prevVal = 1981;
    var handle = slider.append("path")
            .attr("class", "handle")
            .attr("d", "M-7 -4 L-7 4 L-5 6 L5 6 L11 0 L5 -6 L-5 -6 Z")
            .attr("transform", "translate(0, " + y(prevVal) + ")");

    //d3.select("body")
            //.style("background-color", d3.hsl(y(prevVal), .8, .8));

    var ruler = slider.append("g")
            .attr("transform", "translate(-4, 0)")
            .attr("class", "ruler")
            .call(brush);

    ruler.selectAll(".extent,.resize")
            .remove();

    ruler.select(".background")
            .style("cursor", "ns-resize")
            .attr("width", 40);

    // initial animation
    ruler.call(brush.event)
            .transition()
            .duration(750)
            .ease("out-in")
            .call(brush.extent([120, 120]))
            .call(brush.event);

    function brushed() {
        var value = brush.extent()[1],
            t = d3;

        if (d3.event.sourceEvent) { // not a programmatic event
            value = y.invert(d3.mouse(this)[1]);
            brush.extent([value, value]);
            if (d3.event.sourceEvent.type === "mousemove") {
                // interrupt transition
                handle.interrupt();
                d3.select("body").interrupt();
            } else if (value != prevVal) {
                // animate when is't a click, not a drag
                t = d3.transition()
                        .duration(Math.abs(y(value) - y(prevVal)))
                        .ease("out-in");
					
				var string1 = '';
				var y1 = 0;
				var y2 = 0;
				if(value >=1979 && value < 1986){string1 = "lesmis1.json"; y1 = 1981; y2 = 1986;}
				else if(value >=1986 && value < 1991){string1 = "lesmis2.json"; y1 = 1986; y2 = 1991;}
				else if(value >=1991 && value < 1996){string1 = "lesmis3.json"; y1 = 1991; y2 = 1996;}
				else if(value >=1996 && value < 2001){string1 = "lesmis4.json"; y1 = 1996; y2 = 2001;}
				else if(value >=2001 && value < 2006){string1 = "lesmis5.json"; y1 = 2001; y2 = 2006;}
				else if(value >=2006 && value < 2011){string1 = "lesmis6.json"; y1 = 2006; y2 = 2011;}
				else if(value >=2011 && value < 2016){string1 = "lesmis7.json"; y1 = 2011; y2 = 2016;}
				else if(value >=2016 && value < 2021){string1 = "lesmis8.json"; y1 = 2016; y2 = 2019;}
				
				console.log(value)
				console.log(string1)
				
				d3.selectAll(".link").remove();
				d3.selectAll(".node").remove();
				d3.selectAll(".circle").remove();
				d3.selectAll(".text").remove();
				d3.select("#t").remove();
				
				d3.json(string1, function(data) {

				svg.append("text").attr({
				   id: "t", 
					x: function() { return 50; },
					y: function() { return 70; }
				})
				.text(function() {
				  return "Year Range: "+y1.toString()+"-"+y2.toString();
				}).style("font-size", "16px");
				
				var n = data.nodes.length;

				force.nodes(data.nodes).links(data.links);

				// Initialize the positions deterministically, for better results.
				data.nodes.forEach(function(d, i) { d.x = d.y = width / n * i; });

				force.start();
				for (var i = n; i > 0; --i) force.tick();
				force.stop();

				// Center the nodes in the middle.
				var ox = 0, oy = 0;
				data.nodes.forEach(function(d) { ox += d.x, oy += d.y; });
				ox = ox / n - width / 2, oy = oy / n - height / 2;
				data.nodes.forEach(function(d) { d.x -= ox, d.y -= oy; });

				var link = svg.selectAll(".link")
					.data(data.links)
				  .enter().append("line")
					.attr("class", "link")
					.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; })
					.style("stroke-width", function(d) { return Math.sqrt(d.value); });

				var node = svg.selectAll(".node")
					.data(data.nodes)
				  .enter().append("g")
					.attr("class", "node");

				render("path");

				function render(shape) {
					node.selectAll(".link").remove();
					node.selectAll(".circle").remove();
					node.selectAll(".text").remove();

					lens.style("stroke-opacity", shape == "circle" ? 1 : 0);
					mag.style("stroke-opacity", shape == "path" ? 1 : 0);
					mag2.style("stroke-opacity", shape == "path" ? 1 : 0);

					var nodeEnter = node
					  .append("circle")
						.attr("class", "circle")
						.attr("cx", function(d) { return d.x; })
						.attr("cy", function(d) { return d.y; })
						.attr("r", 6)
						.style("fill", function(d) { return color(d.group); })
						.call(force.drag);

					var text = node.append("text")
						.attr("class", "text")
						.attr("dy", function(d) { return d.y; })
						.attr("dx", function(d) { return d.x; })
						.text(function(d) { return d.name; });

					node.append("title")
						.text(function(d) { return d.name; });

					svg.on("mousemove", function() {
						fisheye.focus(d3.mouse(this));

						var mouseX = d3.mouse(this)[0];
						var mouseY = d3.mouse(this)[1];
						var r = fisheye.radius();

						if (shape == "circle") {
							// display magnifier as circle
							lens
								.attr("cx", mouseX)
								.attr("cy", mouseY);
						}
						else {
							// path for magnifier
							var magPath = "M " + mouseX + "," + mouseY + " m -" + r + ", 0 a " + r + "," + r + " 0 1,0 " + (r * 2) + ",0 a " + r + "," + r + " 0 1,0 -" + (r * 2) + ",0";

							// point in circumference to attach magnifier handle
							var x1 = mouseX + r * Math.sin(omega);
							var y1 = mouseY + r * Math.cos(omega);

							// path for magnifier's handle
							var mag2Path = "M " + (x1 + 2) + "," + (y1 + 2) + " L" + (mouseX + r * 1.7) + "," + (mouseY + r * 1.7);

							// display magnifier as path
							mag.attr("d", magPath);

							// display magnifier handle as path
							mag2.attr("d", mag2Path);
						};

						nodeEnter.each(function(d) { d.fisheye = fisheye(d); })
							.attr("cx", function(d) { return d.fisheye.x; })
							.attr("cy", function(d) { return d.fisheye.y; })
							.attr("r", function(d) { return d.fisheye.z * 4.5; });

						text.attr("dx", function(d) { return d.fisheye.x; })
							.attr("dy", function(d) { return d.fisheye.y; });

						link.attr("x1", function(d) { return d.source.fisheye.x; })
							.attr("y1", function(d) { return d.source.fisheye.y; })
							.attr("x2", function(d) { return d.target.fisheye.x; })
							.attr("y2", function(d) { return d.target.fisheye.y; });
					});
				}
				d3.select("#circle").on("click", function () { render("circle");});
				d3.select("#path").on("click", function () { render("path");});
			})
			
			
            }
        }

        t.select(".handle")
            .attr("transform", "translate(0, " + y(value) + ")");
        //t.select("body")
            //.style("background-color", d3.hsl(value, .8, .8));

        prevVal = parseInt(value)%5;
    }
