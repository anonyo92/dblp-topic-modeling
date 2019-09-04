function draw_dashboard(data_filepath, labels_filepath) {
	/*****************************
	* Step0: Load data from file *
	******************************/

	// load data from a csv file
	d3.csv(data_filepath, function (data) {
		data.forEach(function(d) {
			d.year   = +d.Year;
			d.title   = d.Title;
			d.topic_id   = +d.Topic + 1;
			d.nAuthors = +d.nAuthors;
		});

		// load label-map data from file
		d3.csv(labels_filepath, function (label_names) {
			var topic_names = [];
			for (var i = 0; i < label_names.length; i++)
				topic_names[i] = label_names[i].Label;
			/******************************************************
			* Step1: Create the dc.js chart objects & link to div *
			******************************************************/
			var topicChart = dc.barChart("#dc-topic-chart");
			var authorsChart = dc.barChart("#dc-authors-chart");
			var timeChart = dc.lineChart("#dc-time-chart");
			var dataTable = dc.dataTable("#dc-table-graph");

			/****************************************
			* 	Run the data through crossfilter    *
			****************************************/
			var facts = crossfilter(data);  // Gets our 'facts' into crossfilter
			/******************************************************
			* Create the Dimensions                               *
			* A dimension is something to group or filter by.     *
			* Crossfilter can filter by exact value, or by range. *
			******************************************************/

			// for topic
			var topicValue = facts.dimension(function (d) {
				return d.topic_id;       // group or filter by topic
			});
			var topicValueGroupSum = topicValue.group()
											.reduceSum(function(d) { return d.topic_id; });	// sums the topics per topic
			var topicValueGroupCount = topicValue.group()
											.reduceCount(function(d) { return d.topic_id; }) // counts the number of the facts by topic

			// For datatable
			var timeDimension = facts.dimension(function (d) {
				return d.year;
			}); // group or filter by time

			// for nAuthors
			var authorsValue = facts.dimension(function (d) {
				return d.nAuthors;
			});
			var authorsValueGroup = authorsValue.group();

			// define a daily volume Dimension
			var volumeByDay = facts.dimension(function(d) {
				return d.year;
			});
			// map/reduce to group sum
			var volumeByDayGroup = volumeByDay.group().reduceCount(function(d) { return d.year; });

			/***************************************
			* 	Step4: Create the Visualizations   *
			***************************************/
			topicChart
				.width(540)
				.height(240)
				.margins({top: 10, right: 10, bottom: 20, left: 60})
				.dimension(topicValue)		// the values across the x axis
				.group(topicValueGroupSum)	// the values on the y axis
				.transitionDuration(500)
				.centerBar(true)
				.gap(20)					// bar width Keep increasing to get right then back off.
				.x(d3.scaleLinear().domain([0, topic_names.length + 1])) // adding +1 to show last bar with enough space to its right
				.elasticY(true)
				.xAxis().tickFormat(function(v) {if (v > 0 && v <= topic_names.length) //valid bars: [1:topic_names.length] (both incl)
													return topic_names[v-1]; // valid indices: [0: topic_names.length-1]
												else
													return "";
												});

			// nAuthors bar graph
			authorsChart
				.width(540)
				.height(240)
				.margins({top: 10, right: 10, bottom: 20, left: 60})
				.dimension(authorsValue)
				.group(authorsValueGroup)
				.transitionDuration(500)
				.centerBar(true)
				.gap(20)                    // bar width Keep increasing to get right then back off.
				.x(d3.scaleLinear().domain([0, 15]))
				/* Not using max here, as it is skewing the visualization - there are some with nAuthors like 75, 92, 112, 287
					d3.max(data, function(d) { return d.nAuthors; }) + 1 // adding +1 to show last bar with enough space to its right
				*/
				.elasticY(true)
				.xAxis().tickFormat(function(v) {return v;});

			// time graph
			timeChart
				.width(1080)
				.height(200)
				.margins({top: 10, right: 10, bottom: 20, left: 40})
				.dimension(volumeByDay)
				.group(volumeByDayGroup)
				.transitionDuration(500)
				.elasticY(true)
				.x(d3.scaleLinear().domain([1980, 2018])) // scale and domain of the graph
				.xAxis()
				.tickFormat(d3.format(""));

			// Table of articles data
			dataTable
				.width(1080)
				.height(800)
				.dimension(timeDimension)
				.group(function(d) { return "List of some articles corresponding to the filters"
				 })
				.size(10) // number of rows to return
				.columns([
				  function(d) { return d.year; },
				  function(d) { return d.title; },
				  function(d) { return topic_names[d.topic_id - 1]; },
				  function(d) { return d.nAuthors; }
				])
				.sortBy(function(d){ return d.year; })
				.order(d3.descending);

			/****************************
			* Step6: Render the Charts  *
			****************************/
			dc.renderAll();
		});
	});
}

(function( $ ) {
	$(document).ready(function () {
		draw_dashboard("./data/title_topics_authors.csv", "./data/topic_labels_unique.txt");
		$('#main-container').show();
	});
})( jQuery );