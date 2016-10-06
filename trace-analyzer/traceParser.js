// INCLUDE //
var fs = require('fs');
var path = require('path');
/////////////

// USER SETTING AREA //
var userSetting = (function() {
	var basePath = ".";
	var inputPaths = []; // basePath + "amazon.trace"];
	var outputPaths = [];
	{
		var files = fs.readdirSync(basePath);
		files.forEach(function(file) {
			if((file.indexOf("\.trace") > -1)
			 && (file.indexOf("_parsed") <= -1)) {
				inputPaths.push(path.resolve(basePath, file));
			}
		});
	}
	for(var i=0; i<inputPaths.length; i++) {
		var inputPath = inputPaths[i];
		var outputPath = inputPath.replace("\.trace", "_parsed\.trace");
		var _outputPath = outputPath;
		var j=1;
		while(fs.existsSync(_outputPath)) {
			_outputPath = outputPath.replace("parsed", "parsed_" + j++);
		}
		if(outputPath != _outputPath) {
			console.log("[INFO] Output file: " + path.basename(outputPath) + " -> " + path.basename(_outputPath));
		}
		outputPaths.push(_outputPath);
	}
	var mode = "v8"; // chromium or blink
//	var blinkWhiteList = ["disabled-by-default-devtools.timeline"];
//	var chromiumBlackList = ["ipc", "cc", "renderer_host", "toplevel", "trace_event_overhead", "disabled-by-default-devtools.timeline"];
	
	return {
		inputPaths: inputPaths,
		outputPaths: outputPaths,
		mode: mode,
//		blinkWhiteList: blinkWhiteList,
//		chromiumBlackList: chromiumBlackList
	};
}());
///////////////////////

var blinkCategories = {	
	"Task": "other",
	"Program": "other",
	"Animation": "rendering",
	"EventDispatch": "scripting",
	"RequestMainThreadFrame": "rendering",
	"BeginFrame": "rendering",
	"BeginMainThreadFrame": "rendering",
	"DrawFrame": "rendering",
	"ScheduleStyleRecalculation": "rendering",
	"RecalculateStyles": "rendering",
	"InvalidateLayout": "rendering",
	"Layout": "rendering",
	"PaintSetup": "painting",
	"PaintImage": "painting",
	"UpdateLayer": "painting",
	"UpdateLayerTree": "rendering",
	"Paint": "painting",
	"RasterTask": "painting",
	"ScrollLayer": "rendering",
	"CompositeLayers": "painting",
	"ParseHTML": "loading",
	"ParseAuthorStyleSheet": "loading",
	"TimerInstall": "scripting",
	"TimerRemove": "scripting",
	"TimerFire": "scripting",
	"XHRReadyStateChange": "scripting",
	"XHRLoad": "scripting",
	"EvaluateScript": "scripting",
	"MarkLoad": "scripting",
	"MarkDOMContent": "scripting",
	"MarkFirstPaint": "painting",
	"TimeStamp": "scripting",
	"ConsoleTime": "scripting",
	"ResourceSendRequest": "loading",
	"ResourceReceiveResponse": "loading",
	"ResourceFinish": "loading",
	"ResourceReceivedData": "loading",
	"FunctionCall": "scripting",
	"GCEvent": "scripting",
	"JSFrame": "scripting",
	"RequestAnimationFrame": "scripting",
	"CancelAnimationFrame": "scripting",
	"FireAnimationFrame": "scripting",
	"WebSocketCreate": "scripting",
	"WebSocketSendHandshakeRequest": "scripting",
	"WebSocketReceiveHandshakeResponse": "scripting",
	"WebSocketDestroy": "scripting",
	"EmbedderCallback": "scripting",
	"DecodeImage": "painting",
	"ResizeImage": "painting",
	"GPUTask": "gpu"
};

var v8Categories = {	
	"LookupForRead": "LookupForRead",
	"UpdateCaches": "UpdateCaches",
	"GetProperty": "GetProperty",
	"GetPropertyC": "GetPropertyC",
	"GetPropertyD": "GetPropertyD",
	"GetPropertyDBlink": "GetPropertyDBlink",
	"GetPropertyDJS": "GetPropertyDJS",
	"LoadIC": "LoadIC",
	"StoreIC": "StoreIC",
	"V8.IcMiss": "V8.IcMiss",
	"V8.Execute": "V8.Execute",
	"V8.CompileFullCode": "V8.CompileFullCode",
	"v8.External": "v8.External",
	"V8.RecompileSynchronous": "V8.RecompileSynchronous",
	"V8.RecompileConcurrent": "V8.RecompileConcurrent",
	"Application":"Application"
};


var processTrace = function(inputPath, outputPath) {
	// Read input file
	fs.readFile(
		inputPath,
		"utf8",
		function(err, data) {
			if(err) throw err;
			// var tuples = JSON.parse(data);
			var lines = data.toString().split("\n");	// [YJ]
//			filterTuples(tuples, outputPath); 
			filterTuples(lines, outputPath); 
		}
	);
};

// var filterTuples = function (tuples, outputPath) {
var filterTuples = function (lines, outputPath) {
	// blinkCategories by tid
	var thread_names = [];
	var tuplesInThreads = [];
	var is_start = false;
	var is_last = false;
	
	for (i in lines) {
		var line = lines[i];
		var index = 0;
		var tuple = {};
		
		// console.log(line);
/*		if (is_start == false) {
			if (line.indexOf("O\tApplication") == -1)
				continue;
			is_start = true;
		}
		else {
			if (line.indexOf("F\tApplication") > -1) {
				is_last = true;
			}
		}
	*/	
		if ((index = line.indexOf("pmu_read")) > -1) {
			var parsed = line.substring(index ,line.length).split("\t");
			
			tuple.ph = parsed[1];
			tuple.name = (parsed[2].replace(' ', ''));			
			tuple.pmuvalue = new Array(7);
			tuple.pmuvalue[0] = parseInt(parsed[3], 10);
			tuple.pmuvalue[1] = parseInt(parsed[4], 10);
			tuple.pmuvalue[2] = parseInt(parsed[5], 10);
			tuple.pmuvalue[3] = parseInt(parsed[6], 10);
			tuple.pmuvalue[4] = parseInt(parsed[7], 10);
			tuple.pmuvalue[5] = parseInt(parsed[8], 10);
			tuple.pmuvalue[6] = parseInt(parsed[9], 10);
			tuple.cpu = parseInt(parsed[10], 10);
				
			// ts
			var index_start = line.indexOf(" [00");
			var substr = line.substring(index_start+6, index);
			var index_end = substr.indexOf(":");
			
			tuple.ts = parseFloat(substr.substring(0, index_end));
			// tid
			substr = line.substring(index_start-7, index_start);
			var index_hyphen = substr.indexOf("-");
			tuple.tid = parseInt(substr.substring(index_hyphen+1, substr.length));
			
			ph = tuple.ph;
			name = tuple.name;
			tid = tuple.tid;
			
			// tname
			substr = line.substring(0, index_start-7+index_hyphen);
			
			var thread_name = substr.replace(' ','');
			if (thread_name[tid] === undefined) {
				thread_names[tid] = thread_name;
			}
			
			// Skip if not X or B or E
			if(ph != "X" && ph != "Y" && ph != "B" && ph != "E" && ph != "O" && ph != "F")
				continue;
			
			if(ph == "X")
				tuple.ph = "B";
			else if(ph == "Y")
				tuple.ph = "E";		
			else if(ph == "O")
				tuple.ph = "B";
			else if(ph == "F")
				tuple.ph = "E";
	
			// Transform from chromium category to blink category
			if(userSetting.mode == "blink") {
				var blinkCategory = blinkCategories[name];
				if(blinkCategory === undefined)
					tuple.cat = "other";
				else
					tuple.cat = blinkCategories[name];
			}
			else if(userSetting.mode == "v8") {
				var blinkCategory = v8Categories[name]
				if(blinkCategory === undefined)
					tuple.cat = "other";
				else
					tuple.cat = v8Categories[name];
			}
		}
		else if ((index = line.indexOf("pmu_scheduler")) > -1) {
			var parsed = line.substring(index ,line.length).split("\t");
			
			tuple.ph = parsed[1];
			tuple.name = "Schedule";
			tuple.pmuvalue = new Array(7);
			tuple.pmuvalue[0] = parseInt(parsed[2], 10);
			tuple.pmuvalue[1] = parseInt(parsed[3], 10);
			tuple.pmuvalue[2] = parseInt(parsed[4], 10);
			tuple.pmuvalue[3] = parseInt(parsed[5], 10);
			tuple.pmuvalue[4] = parseInt(parsed[6], 10);
			tuple.pmuvalue[5] = parseInt(parsed[7], 10);
			tuple.pmuvalue[6] = parseInt(parsed[8], 10);
			tuple.cpu = parseInt(parsed[9], 10);
			
			// ts
			var index_start = line.indexOf(" [00");
			var substr = line.substring(index_start+6, index);
			var index_end = substr.indexOf(":");
			
			tuple.ts = parseFloat(substr.substring(0, index_end));
			// tid
			substr = line.substring(index_start-7, index_start);
			var index_hyphen = substr.indexOf("-");
			tuple.tid = parseInt(substr.substring(index_hyphen+1, substr.length));
			
			ph = tuple.ph;
			name = tuple.name;
			tid = tuple.tid;
						
			// Skip if not X or B or E
			if(ph != "B" && ph != "E")
				continue;
			
			if(ph == "B")
				tuple.ph = "R";
			else
				tuple.ph = "W";				
		}
		else {
			continue;
		}
		// Insert to a tuple list of the tid
		if(tuplesInThreads[tid] === undefined) {
			tuplesInThreads[tid] = new Array();
			tuplesInThread = tuplesInThreads[tid];
		} else {
			tuplesInThread = tuplesInThreads[tid];
		}
		
		tuplesInThread.push(tuple);
	
		if (is_last == true)
			break;
		
	}
	
	// Sort by timestamp
	for(var tid in tuplesInThreads) {
		var tuplesInThread = tuplesInThreads[tid];
		tuplesInThread.sort(function(xTuple, yTuple) {
			return xTuple.ts - yTuple.ts;
		});
	}
	
	calculateSections(thread_names, tuplesInThreads, outputPath);
	
};

var calculateSections = function(thread_names, tuplesInThreads, outputPath) {
	// Calculate execution time by name
	var sectionsInThreads = new Array();
	for(var tid in tuplesInThreads) {
		var tuplesInThread = tuplesInThreads[tid];
		
		var sectionsInThread = new Object();
		sectionsInThreads[tid] = sectionsInThread;
		
		var callStack = new Array();
		console.log("Thread " + tid + " (name:" + thread_names[tid] + ", #tuples: " + tuplesInThread.length + ")");
		
		
		for(var tupleNum=0; tupleNum<tuplesInThread.length; tupleNum++) {
			var thisTuple = tuplesInThread[tupleNum];

			// console.log(callStack.length+" "+thisTuple.ph);
			
			// Push or pop on the call stack
			if(thisTuple.ph == "B") {
				thisTuple.childduration = 0;
				thisTuple.childpmu = [ [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ] ];
				thisTuple.duration = 0.0;
				thisTuple.pmuarray = [ [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ] ];
												
				callStack.push(thisTuple);
				continue;
			}
			else if(thisTuple.ph == "R" || thisTuple.ph == "W") {
				if (callStack.length > 0) {
					thisTuple.childduration = 0;
					thisTuple.childpmu = [ [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ] ];
					thisTuple.duration = 0.0;
					thisTuple.pmuarray = [ [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ] ];
					callStack.push(thisTuple);
				}
				continue;
			}
			else if(thisTuple.ph == "E") {
				thisTuple.duration = 0.0;
				thisTuple.pmuarray = [ [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ] ];
				thisTuple.childduration = 0;
				thisTuple.childpmu = [ [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0 ] ];
				
				var overhead = {};
				overhead.time = 0.0000019;
				overhead.pmuvalue = [552, 16, 263, 1, 131, 7, 35];
				
				// Pop from the call stack	
				if (callStack.length == 0)
					continue;
								
				var recentTuple2 = thisTuple;
				var recentTuple1 = thisTuple;
				while (callStack.length > 0) {
					recentTuple1 = callStack.pop();
					var cpu = recentTuple1.cpu;
					
				//	console.log("["+recentTuple1.ph+","+recentTuple2.ph+"] "+recentTuple1.ts+" "+recentTuple1.tid+" "+recentTuple2.ts+" "+recentTuple1.tid);
					if (recentTuple1.ph == "E") {
						console.log("WARNING: call stack error(not b tuple)");
					}
					else if (recentTuple1.ph == "R") {
						if (recentTuple2.ph != "E" && recentTuple2.ph != "W") {
							console.log("WARNING: trace error");
							console.log("["+recentTuple1.ph+","+recentTuple2.ph+"] "+recentTuple1.ts+" "+recentTuple1.tid+" "+recentTuple2.ts+" "+recentTuple1.tid);
						}
						for (var k=0; k<7; k++) {
							var temp_pmuvalue = (recentTuple2.pmuvalue[k] - recentTuple1.pmuvalue[k]) - overhead.pmuvalue[k];
							if (temp_pmuvalue < 0)
								temp_pmuvalue = 0;
							thisTuple.pmuarray[cpu][k] += temp_pmuvalue;
						}
						var temp_duration = recentTuple2.ts - recentTuple1.ts - overhead.time;
						if (temp_duration < 0.0)
							temp_duration = 0.0;
						thisTuple.duration += temp_duration;
					}
					else if (recentTuple1.ph == "B") {
						if (recentTuple2.ph != "E" && recentTuple2.ph != "W") {
							console.log("WARNING: trace error");
							console.log("["+recentTuple1.ph+","+recentTuple2.ph+"] "+recentTuple1.ts+" "+recentTuple1.tid+" "+recentTuple2.ts+" "+recentTuple1.tid);
						}
						for (var k=0; k<7; k++) {
							var temp_pmuvalue = (recentTuple2.pmuvalue[k] - recentTuple1.pmuvalue[k]) - overhead.pmuvalue[k];
							if (temp_pmuvalue < 0)
								temp_pmuvalue = 0;
							thisTuple.pmuarray[cpu][k] += temp_pmuvalue;
						}
						var temp_duration =(recentTuple2.ts - recentTuple1.ts) - overhead.time;
						if (temp_duration < 0.0)
							temp_duration = 0.0;
						thisTuple.duration += temp_duration;
						break;
					}
					recentTuple2 = callStack.pop();
					if (recentTuple2 === undefined)
						console.log("WARNING: trace error");
				}
				//////////////////////////////
				
				var recentBTuple = recentTuple1;
				
				if(recentBTuple.name != thisTuple.name) {
					console.log("WARNING: name does not match (" + recentBTuple.name + "(" + recentBTuple.cat + "/" + recentBTuple.ts + ")" +
					 " != " + thisTuple.name + "(" + thisTuple.cat + "/" + thisTuple.ts + ")" + ")");
					 aa
					continue;
				}
								
				// Get duration of the recent section
				var section = sectionsInThread[thisTuple.name];
				if(section === undefined) {
					section = new Object();
					section.name = thisTuple.name;
					section.cat = thisTuple.cat;
					section.nestedduration = 0;
					section.pureduration = 0;
					section.nestedpmu = new Array(4);
					section.purepmu = new Array(4);
					for (var j=0; j<4; j++) {
						section.nestedpmu[j] = new Array(7);
						section.purepmu[j] = new Array(7);
						for (var k=0; k<7; k++) {
							section.nestedpmu[j][k] = 0;
							section.purepmu[j][k] = 0;
						}
					}
					sectionsInThread[thisTuple.name] = section;
				}
				
				var pureduration = thisTuple.duration
				var nestedduration = pureduration + recentBTuple.childduration
				section.nestedduration += nestedduration;
				section.pureduration += pureduration;

				nestedpmu = new Array(3);
				for (var cpu = 0; cpu < 4; cpu++) {
					nestedpmu[cpu] = new Array(7);
					for (var k=0; k<7; k++) {
						section.purepmu[cpu][k] += thisTuple.pmuarray[cpu][k];
						nestedpmu[cpu][k] = (thisTuple.pmuarray[cpu][k] + recentBTuple.childpmu[cpu][k]);
						section.nestedpmu[cpu][k] += nestedpmu[cpu][k];
					}
				}
				
				//console.log(nestedpmu);
				//console.log(thisTuple.pmuarray);
				
				// Update parent's child duration
				if (callStack.length > 0) {
					for (var j = callStack.length-1; j >=0 ; j--) {
						var parentTuple = callStack[j];
						if (parentTuple.ph != "B")
							continue;
					
						parentTuple.childduration += nestedduration;
						for (var cpu=0; cpu < 4; cpu++) {
							for (var k=0; k < 7; k++) {
								parentTuple.childpmu[cpu][k] += nestedpmu[cpu][k];
							}
						}
						break;
					}		
					recentBTuple.ph = "W";
					callStack.push(recentBTuple);
					thisTuple.ph = "R";
					callStack.push(thisTuple);
				}
			}
		}
	}
	writeResult(thread_names, sectionsInThreads, outputPath);
};

var writeResult = function(thread_names, sectionsInThreads, outputPath) {
	// Write result to output file
	fs.appendFileSync(outputPath, 
		"thread_id" + "\t" + "thread_name" + "\t" + "category" + "\t" + "name" + "\t" + "pure_time" + "\t" + "nested_time" + "\t"); // [YJ]
		// "thread_id" + "\t" + "thread_name" + "\t" + "category" + "\t" + "name" + "\t" + "pure_time" + "\t" + "nested_time" + "\n"); // [YJ] delete
	// [YJ] start
	for (var i=0; i<4; i++) {
		for (var j=0; j<7; j++) {
			fs.appendFileSync(outputPath, "cpu"+ i +"-pmu" + j + "-pure\t");
		}
	}
	for (var i=0; i<4; i++) {
		for (var j=0; j<7; j++) {
			fs.appendFileSync(outputPath, "cpu"+ i +"-pmu" + j + "-nested\t");
		}
	}
	fs.appendFileSync(outputPath, "\n");
	// [YJ] end
	
	for(var tid in sectionsInThreads) {
		var sectionsInThread = sectionsInThreads[tid];
		for(var name in sectionsInThread) {
			var section = sectionsInThread[name];
			
			var printstr = tid + "\t" + thread_names[tid] + "\t" + section.cat + "\t" + section.name + "\t" + section.pureduration;
			// if(section.pureduration != section.nestedduration) // [YJ] delete
				printstr = printstr + "\t" + section.nestedduration + "";
				
			for (var cpu=0; cpu<4; cpu++) {
				for (var pmuindex=0; pmuindex<7; pmuindex++) {
					printstr = printstr + "\t" + section.purepmu[cpu][pmuindex] + "";
				}
			}
			for (var cpu=0; cpu<4; cpu++) {
				for (var pmuindex=0; pmuindex<7; pmuindex++) {
					printstr = printstr + "\t" + section.nestedpmu[cpu][pmuindex] + "";
				}
			}
			
			printstr = printstr + "\n";
			
			fs.appendFileSync(outputPath, printstr);
		}
	}
	
	fs.appendFileSync(outputPath, "\n\n\n\n\n");
	
	fs.appendFileSync(outputPath, 
		"thread_id" + "\t" + "category" + "\t" + "name" + "\t" + "pure_time" + "\t"); // [YJ]
		// "thread_id" + "\t" + "thread_name" + "\t" + "category" + "\t" + "name" + "\t" + "pure_time" + "\t" + "nested_time" + "\n"); // [YJ] delete
	// [YJ] start
	fs.appendFileSync(outputPath, "Cycle" + "\t" + "Imiss" + "\t" + "Iaccess" + "\t" + "Dmiss" + "\t" + "Daccess" + "\t" + "Bmiss" + "\t" + "Baccess" + "\n");
	
	for(var tid in sectionsInThreads) {
		var sectionsInThread = sectionsInThreads[tid];
		//console.log(tid);
		// loading
		for(var name in sectionsInThread) {
			var section = sectionsInThread[name];
			var printstr = tid + "\t" + section.cat + "\t" + section.name + "\t" + section.pureduration;		
			for (var pmuindex=0; pmuindex<7; pmuindex++) {
				var pmuSum = 0;
				for (var cpu=0; cpu<4; cpu++) {	
					pmuSum += section.purepmu[cpu][pmuindex]
				}
				printstr = printstr + "\t" + pmuSum + "" ;
			}
			printstr = printstr + "\n";
			fs.appendFileSync(outputPath, printstr);
		}
	}
	fs.appendFileSync(outputPath, "\n\n\n\n\n");
	
	fs.appendFileSync(outputPath, 
		"thread_id" + "\t" + "category" + "\t" + "name" + "\t" + "nested_time" + "\t"); // [YJ]
		// "thread_id" + "\t" + "thread_name" + "\t" + "category" + "\t" + "name" + "\t" + "pure_time" + "\t" + "nested_time" + "\n"); // [YJ] delete
	// [YJ] start
	fs.appendFileSync(outputPath, "Cycle" + "\t" + "Imiss" + "\t" + "Iaccess" + "\t" + "Dmiss" + "\t" + "Daccess" + "\t" + "Bmiss" + "\t" + "Baccess" + "\n");
	
	for(var tid in sectionsInThreads) {
		var sectionsInThread = sectionsInThreads[tid];
		//console.log(tid);
		// loading
		for(var name in sectionsInThread) {
			var section = sectionsInThread[name];
			var printstr = tid + "\t" + section.cat + "\t" + section.name + "\t" + section.nestedduration;		
			for (var pmuindex=0; pmuindex<7; pmuindex++) {
				var pmuSum = 0;
				for (var cpu=0; cpu<4; cpu++) {	
					pmuSum += section.nestedpmu[cpu][pmuindex]
				}
				printstr = printstr + "\t" + pmuSum + "" ;
			}
			printstr = printstr + "\n";
			fs.appendFileSync(outputPath, printstr);
		}
	}

	fs.appendFileSync(outputPath, "\n");
	
	
	console.log("Parsing completed: " + outputPath);
};

var main = function() {
	for(var i=0; i<userSetting.inputPaths.length; i++) {
		var inputPath = userSetting.inputPaths[i];
		var outputPath = userSetting.outputPaths[i];
		processTrace(inputPath, outputPath);
	}
};

main();